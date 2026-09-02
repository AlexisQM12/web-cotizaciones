'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { NavBar } from '@/components/NavBar'
import { useAuth } from '@/contexts/AuthContext'
import { storage } from '@/lib/firebaseConfig'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'

export default function ClientsDashboard() {
    const { user } = useAuth()
    const [companies, setCompanies] = useState([])
    const [loading, setLoading] = useState(true)
    
    // Modals state
    const [showCompanyModal, setShowCompanyModal] = useState(false)
    const [showContactModal, setShowContactModal] = useState(false)
    
    const [editingCompany, setEditingCompany] = useState(null)
    const [editingContact, setEditingContact] = useState(null) // { contact, companyId }
    const [activeCompanyIdForContact, setActiveCompanyIdForContact] = useState(null)

    const router = useRouter()

    const [companyForm, setCompanyForm] = useState({
        companyName: '',
        razonSocial: '',
        ruc: '',
        address: '',
        logoUrl: '',
        departments: []
    })
    
    const [newDepartment, setNewDepartment] = useState('')

    const [uploadingLogo, setUploadingLogo] = useState(false)

    const [contactForm, setContactForm] = useState({
        name: '',
        department: '',
        area: '',
        whatsapp: '',
        email: ''
    })

    useEffect(() => {
        if (user?.empresaId) {
            fetchCompanies()
        }
    }, [user?.empresaId])

    const fetchCompanies = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/clients?empresaId=${user?.empresaId}`)
            const data = await res.json()
            if (Array.isArray(data)) {
                setCompanies(data)
            }
        } catch (error) {
            console.error('Error fetching companies:', error)
        }
        setLoading(false)
    }

    // --- COMPANY LOGIC ---
    const handleOpenCompanyModal = (company = null) => {
        if (company) {
            setEditingCompany(company)
            setCompanyForm({
                companyName: company.companyName || '',
                razonSocial: company.razonSocial || '',
                ruc: company.ruc || '',
                address: company.address || '',
                logoUrl: company.logoUrl || '',
                departments: company.departments || []
            })
            setNewDepartment('')
        } else {
            setEditingCompany(null)
            setCompanyForm({ companyName: '', razonSocial: '', ruc: '', address: '', logoUrl: '', departments: [] })
            setNewDepartment('')
        }
        setShowCompanyModal(true)
    }

    const [searchingCompanyRuc, setSearchingCompanyRuc] = useState(false);

    const searchCompanyRuc = async () => {
        const ruc = companyForm.ruc || '';
        if (!/^\d{8}$/.test(ruc) && !/^\d{11}$/.test(ruc)) {
            alert('Por favor, ingresa un RUC (11 dígitos) o DNI (8 dígitos) válido.');
            return;
        }
        setSearchingCompanyRuc(true);
        try {
            const isDni = ruc.length === 8;
            const endpoint = isDni ? `/api/sunat/dni?dni=${ruc}` : `/api/sunat/ruc?ruc=${ruc}`;
            const res = await fetch(endpoint);
            if (res.ok) {
                const data = await res.json();
                setCompanyForm(f => ({
                    ...f,
                    companyName: f.companyName || (isDni ? data.nombreCompleto : data.razonSocial),
                    razonSocial: isDni ? data.nombreCompleto : (data.razonSocial || f.razonSocial),
                    address: isDni ? f.address : (data.direccion || f.address),
                }));
            } else {
                alert(`No se pudo encontrar el ${isDni ? 'DNI' : 'RUC'}.`);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSearchingCompanyRuc(false);
        }
    };

    const uploadLogo = async (e) => {
        const file = e.target.files[0];
        if (!file || !storage || !user?.empresaId) return;
        setUploadingLogo(true);
        try {
            const ext = file.name.split('.').pop();
            const storageRef = ref(storage, `company-logos/${user.empresaId}/logo-${Date.now()}.${ext}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            setCompanyForm(prev => ({ ...prev, logoUrl: url }));
        } catch (err) {
            console.error('Error uploading logo:', err);
            alert('Error al subir el logo. Intenta de nuevo.');
        } finally {
            setUploadingLogo(false);
        }
    }

    const removeLogo = async () => {
        try {
            if (companyForm.logoUrl) {
                const storageRef = ref(storage, companyForm.logoUrl);
                await deleteObject(storageRef).catch(() => {});
            }
            setCompanyForm(prev => ({ ...prev, logoUrl: '' }));
        } catch (err) {
            console.error('Error removing logo:', err);
        }
    }

    const submitCompany = async (e) => {
        e.preventDefault()
        try {
            if (editingCompany) {
                await fetch(`/api/clients/${editingCompany.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(companyForm)
                })
            } else {
                await fetch('/api/clients', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...companyForm, empresaId: user?.empresaId })
                })
            }
            setShowCompanyModal(false)
            fetchCompanies()
        } catch (error) {
            console.error('Error saving company:', error)
            alert('Hubo un error al guardar la empresa.')
        }
    }

    const deleteCompany = async (id) => {
        if (!confirm('¿Estás seguro de eliminar esta empresa y todos sus contactos?')) return
        try {
            await fetch(`/api/clients/${id}`, { method: 'DELETE' })
            fetchCompanies()
        } catch (error) {
            console.error('Error deleting company:', error)
            alert('Hubo un error al eliminar la empresa.')
        }
    }

    // --- CONTACT LOGIC ---
    const handleOpenContactModal = (companyId, contact = null) => {
        setActiveCompanyIdForContact(companyId)
        if (contact) {
            setEditingContact(contact)
            setContactForm({
                name: contact.name || '',
                department: contact.department || '',
                area: contact.area || '',
                whatsapp: contact.whatsapp || '',
                email: contact.email || ''
            })
        } else {
            setEditingContact(null)
            setContactForm({ name: '', department: '', area: '', whatsapp: '', email: '' })
        }
        setShowContactModal(true)
    }

    const submitContact = async (e) => {
        e.preventDefault()
        try {
            const company = companies.find(c => c.id === activeCompanyIdForContact)
            if (!company) return

            let newContacts = [...(company.contacts || [])]
            
            if (editingContact) {
                newContacts = newContacts.map(c => c.id === editingContact.id ? { ...contactForm, id: c.id } : c)
            } else {
                newContacts.push({ ...contactForm, id: Date.now().toString() }) // Simple ID generation
            }

            await fetch(`/api/clients/${activeCompanyIdForContact}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contacts: newContacts })
            })

            setShowContactModal(false)
            fetchCompanies()
        } catch (error) {
            console.error('Error saving contact:', error)
            alert('Hubo un error al guardar el contacto.')
        }
    }

    const deleteContact = async (companyId, contactId) => {
        if (!confirm('¿Estás seguro de eliminar este contacto?')) return
        try {
            const company = companies.find(c => c.id === companyId)
            const newContacts = (company.contacts || []).filter(c => c.id !== contactId)
            
            await fetch(`/api/clients/${companyId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contacts: newContacts })
            })
            fetchCompanies()
        } catch (error) {
            console.error('Error deleting contact:', error)
        }
    }

    return (
        <ProtectedRoute allowedModule="clients">
            <NavBar />
            <main className="container">
                <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div className="dashboard-title-area" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <button onClick={() => router.push('/')} className="btn-back-square" title="Volver al Dashboard">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                            </svg>
                        </button>
                        <div>
                            <h1 style={{ lineHeight: '1.2' }}>Mis Clientes (CRM)</h1>
                            <p>Directorio de empresas y sus contactos para el envío de cotizaciones y facturación.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => handleOpenCompanyModal()}
                        style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)' }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4"></circle><path d="M5 22v-2a7 7 0 0 1 14 0v2"></path></svg>
                        Añadir Empresa
                    </button>
                </div>

                <div className="content-frame main-content-frame">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#101828' }}>Cargando directorio...</div>
                    ) : companies.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#64748b' }}>
                            <div style={{ background: '#eff6ff', borderRadius: '50%', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="7" r="4"></circle><path d="M5 22v-2a7 7 0 0 1 14 0v2"></path>
                                </svg>
                            </div>
                            <h3 style={{ fontSize: '1.5rem', color: '#101828', marginBottom: '1rem' }}>No hay empresas</h3>
                            <p>Aún no tienes empresas registradas en tu directorio.</p>
                        </div>
                    ) : (
                        <div className="grid-list">
                            {companies.map((company) => (
                                <div key={company.id} className="card" style={{ padding: '2rem', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' }}>
                                    
                                    {/* Company Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            {company.logoUrl ? (
                                                <img 
                                                    src={company.logoUrl} 
                                                    alt={`Logo ${company.companyName}`} 
                                                    style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #e2e8f0' }} 
                                                />
                                            ) : (
                                                <div style={{ width: '40px', height: '40px', background: '#f1f5f9', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                                    {company.companyName?.charAt(0)?.toUpperCase()}
                                                </div>
                                            )}
                                            <h3 style={{ fontSize: '1.25rem', color: '#101828', fontWeight: '600', margin: 0, paddingRight: '1rem' }}>
                                                {company.companyName}
                                            </h3>
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
                                        {company.ruc && <div><strong>RUC:</strong> {company.ruc}</div>}
                                        {company.razonSocial && <div><strong>Razón Social:</strong> {company.razonSocial}</div>}
                                        {company.address && <div><strong>Dirección:</strong> {company.address}</div>}
                                    </div>

                                    {/* Contacts List */}
                                    <div style={{ flex: 1, borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contactos</span>
                                            <button 
                                                onClick={() => handleOpenContactModal(company.id)}
                                                style={{ background: 'none', color: '#0284c7', border: 'none', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                                            >
                                                + Añadir
                                            </button>
                                        </div>

                                        {(!company.contacts || company.contacts.length === 0) ? (
                                            <div style={{ padding: '0.5rem 0', color: '#cbd5e1', fontSize: '0.85rem', fontStyle: 'italic' }}>
                                                Sin contactos.
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                {Object.entries((company.contacts || []).reduce((acc, c) => {
                                                    const dep = c.department ? c.department.trim() : 'Sin Departamento Asignado';
                                                    if (!acc[dep]) acc[dep] = [];
                                                    acc[dep].push(c);
                                                    return acc;
                                                }, {}))
                                                .sort(([a], [b]) => a === 'Sin Departamento Asignado' ? 1 : b === 'Sin Departamento Asignado' ? -1 : a.localeCompare(b))
                                                .map(([department, contacts]) => (
                                                    <div key={department} style={{ marginBottom: '0.5rem' }}>
                                                        <h4 style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.8rem', textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                                                            {department}
                                                            <span style={{ fontSize: '0.65rem', background: '#e2e8f0', color: '#475569', padding: '0.1rem 0.4rem', borderRadius: '10px' }}>{contacts.length}</span>
                                                        </h4>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingLeft: '0.5rem' }}>
                                                            {contacts.map((c, index) => (
                                                                <div key={c.id} style={{ paddingBottom: '1rem', borderBottom: index < contacts.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                                                        <div style={{ fontWeight: '600', fontSize: '0.95rem', color: '#334155' }}>
                                                                            {c.name || 'Sin Nombre'}
                                                                        </div>
                                                                        {c.area && (
                                                                            <span style={{ padding: '0.1rem 0.5rem', background: '#eff6ff', color: '#3b82f6', borderRadius: '12px', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase' }}>
                                                                                {c.area}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                                        {c.whatsapp && (
                                                                            <div style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                                                <strong>WhatsApp:</strong> <a href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ color: '#25D366', textDecoration: 'none' }}>{c.whatsapp}</a>
                                                                            </div>
                                                                        )}
                                                                        {c.email && (
                                                                            <div style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                                                <strong>Email:</strong> {c.email}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                                        <button onClick={() => handleOpenContactModal(company.id, c)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}>Editar</button>
                                                                        <button onClick={() => deleteContact(company.id, c.id)} style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}>Borrar</button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Company Actions */}
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
                                        <button 
                                            onClick={() => handleOpenCompanyModal(company)}
                                            style={{ flex: 1, background: '#f1f5f9', color: '#475569', border: 'none', padding: '0.5rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
                                        >
                                            Editar Empresa
                                        </button>
                                        <button 
                                            onClick={() => deleteCompany(company.id)}
                                            style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '0.5rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
                                        >
                                            Borrar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* COMPANY MODAL */}
            {showCompanyModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>{editingCompany ? 'Editar Empresa' : 'Añadir Empresa'}</h3>
                            <button onClick={() => setShowCompanyModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#64748b' }}>✕</button>
                        </div>
                        
                        <form onSubmit={submitCompany} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                {companyForm.logoUrl ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                        <img src={companyForm.logoUrl} alt="Logo" style={{ width: '60px', height: '60px', objectFit: 'contain', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white' }} />
                                        <button type="button" onClick={removeLogo} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}>Quitar</button>
                                    </div>
                                ) : (
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem', color: '#475569' }}>Logo de la Empresa (Opcional)</label>
                                        <label style={{ cursor: uploadingLogo ? 'wait' : 'pointer', display: 'inline-block', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600' }}>
                                            {uploadingLogo ? 'Subiendo...' : 'Seleccionar Imagen'}
                                            <input type="file" accept="image/*" disabled={uploadingLogo} onChange={uploadLogo} style={{ display: 'none' }} />
                                        </label>
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem', color: '#475569' }}>Nombre Comercial *</label>
                                <input required type="text" value={companyForm.companyName} onChange={e => setCompanyForm({...companyForm, companyName: e.target.value})} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }} placeholder="Ej: Constructora XYZ" />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem', color: '#475569' }}>RUC / DNI</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input type="text" value={companyForm.ruc} onChange={e => setCompanyForm({...companyForm, ruc: e.target.value})} style={{ flex: 1, padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }} placeholder="Ej: 20123456789" />
                                    <button 
                                        type="button"
                                        onClick={searchCompanyRuc}
                                        disabled={searchingCompanyRuc || !((companyForm.ruc || '').length === 8 || (companyForm.ruc || '').length === 11)}
                                        style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '0 1rem', borderRadius: '6px', fontSize: '0.9rem', cursor: 'pointer', fontWeight: '500' }}
                                    >
                                        {searchingCompanyRuc ? '...' : 'SUNAT'}
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem', color: '#475569' }}>Razón Social</label>
                                <input type="text" value={companyForm.razonSocial} onChange={e => setCompanyForm({...companyForm, razonSocial: e.target.value})} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }} placeholder="Ej: Constructora XYZ S.A.C." />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem', color: '#475569' }}>Dirección Fiscal</label>
                                <input type="text" value={companyForm.address} onChange={e => setCompanyForm({...companyForm, address: e.target.value})} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }} placeholder="Ej: Av. Principal 123" />
                            </div>

                            <div className="form-group" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '0.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem', color: '#475569' }}>Departamentos / Áreas (Opcional)</label>
                                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>Crea los departamentos disponibles para poder agrupar a los contactos de esta empresa.</p>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.8rem' }}>
                                    <input 
                                        type="text" 
                                        value={newDepartment} 
                                        onChange={e => setNewDepartment(e.target.value)} 
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const val = newDepartment.trim();
                                                if (val && !companyForm.departments.includes(val)) {
                                                    setCompanyForm(prev => ({ ...prev, departments: [...prev.departments, val] }));
                                                    setNewDepartment('');
                                                }
                                            }
                                        }}
                                        style={{ flex: 1, padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }} 
                                        placeholder="Ej: Ventas, Operaciones..." 
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            const val = newDepartment.trim();
                                            if (val && !companyForm.departments.includes(val)) {
                                                setCompanyForm(prev => ({ ...prev, departments: [...prev.departments, val] }));
                                                setNewDepartment('');
                                            }
                                        }}
                                        style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0 1rem', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '600' }}
                                    >
                                        Añadir
                                    </button>
                                </div>
                                {companyForm.departments.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {companyForm.departments.map((dep, i) => (
                                            <span key={i} style={{ background: '#f1f5f9', color: '#334155', padding: '0.3rem 0.6rem', borderRadius: '16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid #e2e8f0' }}>
                                                {dep}
                                                <button type="button" onClick={() => setCompanyForm(prev => ({ ...prev, departments: prev.departments.filter(d => d !== dep) }))} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0, fontSize: '0.9rem', lineHeight: 1 }}>&times;</button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setShowCompanyModal(false)} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>
                                    Cancelar
                                </button>
                                <button type="submit" style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>
                                    Guardar Empresa
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CONTACT MODAL */}
            {showContactModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>{editingContact ? 'Editar Contacto' : 'Añadir Contacto'}</h3>
                            <button onClick={() => setShowContactModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#64748b' }}>✕</button>
                        </div>
                        
                        <form onSubmit={submitContact} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem', color: '#475569' }}>Nombre del Contacto *</label>
                                <input required type="text" value={contactForm.name} onChange={e => setContactForm({...contactForm, name: e.target.value})} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }} placeholder="Ej: María López" />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem', color: '#475569' }}>Departamento / Ubicación (Opcional)</label>
                                <select 
                                    value={contactForm.department} 
                                    onChange={e => setContactForm({...contactForm, department: e.target.value})} 
                                    style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', background: 'white' }}
                                >
                                    <option value="">-- Seleccionar Departamento --</option>
                                    {(companies.find(c => c.id === activeCompanyIdForContact)?.departments || []).map(dep => (
                                        <option key={dep} value={dep}>{dep}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem', color: '#475569' }}>Área o Cargo</label>
                                <input type="text" value={contactForm.area} onChange={e => setContactForm({...contactForm, area: e.target.value})} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }} placeholder="Ej: Logística, Gerencia..." />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem', color: '#475569' }}>WhatsApp / Teléfono</label>
                                <input type="text" value={contactForm.whatsapp} onChange={e => setContactForm({...contactForm, whatsapp: e.target.value})} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }} placeholder="Ej: +51 987654321" />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem', color: '#475569' }}>Email del Cliente *</label>
                                <input required type="email" value={contactForm.email} onChange={e => setContactForm({...contactForm, email: e.target.value})} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }} placeholder="Ej: cliente@empresa.com" />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setShowContactModal(false)} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>
                                    Cancelar
                                </button>
                                <button type="submit" style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>
                                    Guardar Contacto
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </ProtectedRoute>
    )
}
