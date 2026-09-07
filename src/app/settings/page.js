'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/firebaseConfig';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export default function Settings() {
    const { user } = useAuth();
    const [companyProfiles, setCompanyProfiles] = useState([]);
    const [clientProfiles, setClientProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('empresa');
    const [companyFormData, setCompanyFormData] = useState({
        name: '',
        address: '',
        email: '',
        phone: '',
        ruc: '',
        website: '',
        accounts: [],
        conditions: '',
        isDefault: false
    });

    // Bank list
    const BANKS = [
        'BCP',
        'BBVA',
        'Interbank',
        'Scotiabank',
        'Banco de la Nación',
        'BanBif',
        'Pichincha',
        'Caja Arequipa',
        'Caja Piura',
        'Otros'
    ];
    const [clientFormData, setClientFormData] = useState({
        name: '',
        ruc: '',
        address: '',
        isDefault: false
    });
    const [generalConditions, setGeneralConditions] = useState('');
    const [logoFile, setLogoFile] = useState(null);
    const [editingCompanyId, setEditingCompanyId] = useState(null);
    const [editingClientId, setEditingClientId] = useState(null);
    const router = useRouter();

    useEffect(() => {
        if (!user?.empresaId) return;
        fetchCompanyProfiles();
        fetchClientProfiles();
    }, [user?.empresaId]);

    const fetchCompanyProfiles = async () => {
        try {
            const res = await fetch(`/api/company-profiles?empresaId=${user?.empresaId}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setCompanyProfiles(data);
            } else {
                console.error('API Error (Company Profiles):', data.error);
                setCompanyProfiles([]);
            }
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const fetchClientProfiles = async () => {
        try {
            const res = await fetch(`/api/client-profiles?empresaId=${user?.empresaId}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setClientProfiles(data);
            } else {
                console.error('API Error (Client Profiles):', data.error);
                setClientProfiles([]);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const [searchingCompanyRuc, setSearchingCompanyRuc] = useState(false);

    const searchCompanyRuc = async () => {
        if (!/^\d{11}$/.test(companyFormData.ruc)) {
            alert('Por favor, ingresa un RUC válido de 11 dígitos.');
            return;
        }
        setSearchingCompanyRuc(true);
        try {
            const res = await fetch(`/api/sunat/ruc?ruc=${companyFormData.ruc}`);
            if (res.ok) {
                const data = await res.json();
                setCompanyFormData(f => ({
                    ...f,
                    name: data.razonSocial || f.name,
                    address: data.direccion || f.address,
                }));
            } else {
                alert('No se pudo encontrar el RUC en SUNAT.');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSearchingCompanyRuc(false);
        }
    };

    const handleCompanySubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingCompanyId ? `/api/company-profiles/${editingCompanyId}` : '/api/company-profiles';
            const method = editingCompanyId ? 'PUT' : 'POST';
            const data = new FormData();
            data.append('name', companyFormData.name);
            data.append('address', companyFormData.address);
            data.append('email', companyFormData.email);
            data.append('phone', companyFormData.phone);
            data.append('phone', companyFormData.phone);
            data.append('ruc', companyFormData.ruc);
            data.append('website', companyFormData.website);
            data.append('accounts', JSON.stringify(companyFormData.accounts));
            data.append('conditions', companyFormData.conditions);
            data.append('isDefault', companyFormData.isDefault.toString());
            if (logoFile) {
                data.append('logo', logoFile);
            }
            if (editingCompanyId) {
                data.append('existingLogoUrl', companyFormData.logoUrl || '');
            }
            const res = await fetch(url, {
                method,
                body: data
            });
            if (res.ok) {
                setCompanyFormData({ name: '', address: '', email: '', phone: '', ruc: '', website: '', accounts: [], conditions: '', isDefault: false });
                setLogoFile(null);
                setEditingCompanyId(null);
                fetchCompanyProfiles();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddAccount = () => {
        setCompanyFormData({
            ...companyFormData,
            accounts: [...companyFormData.accounts, { bankName: '', accountNumber: '', cci: '' }]
        });
    };

    const handleRemoveAccount = (index) => {
        const newAccounts = [...companyFormData.accounts];
        newAccounts.splice(index, 1);
        setCompanyFormData({
            ...companyFormData,
            accounts: newAccounts
        });
    };

    const handleAccountChange = (index, field, value) => {
        const newAccounts = [...companyFormData.accounts];
        newAccounts[index][field] = value;
        setCompanyFormData({
            ...companyFormData,
            accounts: newAccounts
        });
    };
    const [searchingClientRuc, setSearchingClientRuc] = useState(false);

    const searchClientRuc = async () => {
        const ruc = clientFormData.ruc || '';
        if (!/^\d{8}$/.test(ruc) && !/^\d{11}$/.test(ruc)) {
            alert('Por favor, ingresa un RUC (11 dígitos) o DNI (8 dígitos) válido.');
            return;
        }
        setSearchingClientRuc(true);
        try {
            const isDni = ruc.length === 8;
            const endpoint = isDni ? `/api/sunat/dni?dni=${ruc}` : `/api/sunat/ruc?ruc=${ruc}`;
            const res = await fetch(endpoint);
            if (res.ok) {
                const data = await res.json();
                setClientFormData(f => ({
                    ...f,
                    name: isDni ? data.nombreCompleto : (data.razonSocial || f.name),
                    address: isDni ? f.address : (data.direccion || f.address),
                }));
            } else {
                alert(`No se pudo encontrar el ${isDni ? 'DNI' : 'RUC'}.`);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSearchingClientRuc(false);
        }
    };

    const handleClientSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingClientId ? `/api/client-profiles/${editingClientId}?empresaId=${encodeURIComponent(user.empresaId)}` : '/api/client-profiles';
            const method = editingClientId ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...clientFormData, empresaId: user?.empresaId })
            });
            if (res.ok) {
                setClientFormData({ name: '', ruc: '', address: '', isDefault: false });
                setEditingClientId(null);
                fetchClientProfiles();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleCompanyEdit = (profile) => {
        setCompanyFormData({
            name: profile.name,
            address: profile.address,
            email: profile.email,
            phone: profile.phone,
            ruc: profile.ruc || '',
            website: profile.website || '',
            accounts: profile.accounts || [],
            conditions: profile.conditions || '',
            logoUrl: profile.logoUrl,
            isDefault: profile.isDefault === 1
        });
        setLogoFile(null); // Reset file input
        setEditingCompanyId(profile.id);
    };

    const handleClientEdit = (profile) => {
        setClientFormData({
            name: profile.name,
            ruc: profile.ruc,
            address: profile.address,
            isDefault: profile.isDefault === 1
        });
        setEditingClientId(profile.id);
    };

    const handleCompanyDelete = async (id) => {
        if (confirm('¿Estás seguro de que quieres eliminar este perfil de empresa?')) {
            try {
                await fetch(`/api/company-profiles/${id}`, { method: 'DELETE' });
                fetchCompanyProfiles();
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleClientDelete = async (id) => {
        if (confirm('¿Estás seguro de que quieres eliminar este perfil de cliente?')) {
            try {
                await fetch(`/api/client-profiles/${id}?empresaId=${encodeURIComponent(user.empresaId)}`, { method: 'DELETE' });
                fetchClientProfiles();
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleCompanyCancel = () => {
        setCompanyFormData({ name: '', address: '', email: '', phone: '', ruc: '', website: '', accounts: [], conditions: '', isDefault: false });
        setLogoFile(null);
        setEditingCompanyId(null);
    };

    return (
        <main className="container">
            <div style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <button onClick={() => router.push('/')} className="btn-back-square" title="Volver al Dashboard">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                </button>
                <div>
                    <h1 style={{ color: '#111827', lineHeight: '1.2' }}>Configuración de Empresa</h1>
                    <p style={{ color: '#475569' }}>Administra los datos de tu empresa para las cotizaciones.</p>
                </div>
            </div>

            <style jsx>{`
                .sidebar-nav-btn {
                    display: flex; align-items: center; gap: 0.7rem;
                    padding: 0.7rem 0.85rem;
                    border-radius: 10px; border: none; cursor: pointer; text-align: left;
                    font-size: 0.875rem; font-weight: 500; transition: all 0.15s; width: 100%;
                }
                .sidebar-nav-btn:hover:not(.active) {
                    background: #f1f5f9;
                }
                .sidebar-nav-btn.active {
                    background: var(--primary, #3b82f6);
                    color: white !important;
                }
            `}</style>

            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2rem', alignItems: 'start' }}>
                {/* Sidebar Navigation */}
                <div className="card" style={{ padding: '1.25rem 1rem', position: 'sticky', top: '2rem' }}>
                    <h2 style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', paddingLeft: '0.85rem' }}>Configuración</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <button 
                            className={`sidebar-nav-btn ${activeTab === 'empresa' ? 'active' : ''}`}
                            onClick={() => setActiveTab('empresa')}
                            style={{ color: activeTab === 'empresa' ? '#fff' : '#475569' }}
                        >
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 21h18"></path><path d="M9 8h1"></path><path d="M9 12h1"></path><path d="M9 16h1"></path><path d="M14 8h1"></path><path d="M14 12h1"></path><path d="M14 16h1"></path><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"></path></svg>
                            <span style={{ flex: 1 }}>Mi Empresa</span>
                            {activeTab === 'empresa' && <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>}
                        </button>

                        <button 
                            className={`sidebar-nav-btn ${activeTab === 'clientes' ? 'active' : ''}`}
                            onClick={() => setActiveTab('clientes')}
                            style={{ color: activeTab === 'clientes' ? '#fff' : '#475569' }}
                        >
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            <span style={{ flex: 1 }}>Mis Clientes</span>
                            {activeTab === 'clientes' && <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>}
                        </button>

                        <button 
                            className={`sidebar-nav-btn ${activeTab === 'correos' ? 'active' : ''}`}
                            onClick={() => setActiveTab('correos')}
                            style={{ color: activeTab === 'correos' ? '#fff' : '#475569' }}
                        >
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                            <span style={{ flex: 1 }}>Correos</span>
                            {activeTab === 'correos' && <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>}
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="content-frame" style={{ margin: 0, minHeight: '600px' }}>
                    
                    {activeTab === 'empresa' && (
                        <div>
                            <h2 style={{ color: '#101828', marginBottom: '1.5rem', fontSize: '1.5rem' }}>Perfiles de Empresa</h2>
                        <div className="grid-2-col" style={{ gap: '2.5rem' }}>
                            <div className="card">
                                <h3>{editingCompanyId ? 'Editar Perfil de Empresa' : 'Añadir Nuevo Perfil de Empresa'}</h3>
                                <form onSubmit={handleCompanySubmit} style={{ marginTop: '2rem' }}>
                                    <div className="input-group">
                                        <label className="label">Nombre de Empresa</label>
                                        <input
                                            className="input"
                                            type="text"
                                            required
                                            value={companyFormData.name || ''}
                                            onChange={(e) => setCompanyFormData({ ...companyFormData, name: e.target.value })}
                                            placeholder="Ej: Mi Empresa S.A."
                                        />
                                    </div>
                                    <div className="grid-2-col" style={{ gap: '1.5rem' }}>
                                        <div className="input-group">
                                            <label className="label">RUC</label>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <input
                                                    className="input"
                                                    type="text"
                                                    style={{ flex: 1 }}
                                                    value={companyFormData.ruc || ''}
                                                    onChange={(e) => setCompanyFormData({ ...companyFormData, ruc: e.target.value })}
                                                    placeholder="20123456789"
                                                />
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary"
                                                    onClick={searchCompanyRuc}
                                                    disabled={searchingCompanyRuc || (companyFormData.ruc || '').length !== 11}
                                                >
                                                    {searchingCompanyRuc ? '...' : 'SUNAT'}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="input-group">
                                            <label className="label">Sitio Web</label>
                                            <input
                                                className="input"
                                                type="text"
                                                value={companyFormData.website || ''}
                                                onChange={(e) => setCompanyFormData({ ...companyFormData, website: e.target.value })}
                                                placeholder="www.miempresa.com"
                                            />
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label className="label">Cuentas Bancarias</label>
                                        {companyFormData.accounts.map((acc, index) => (
                                            <div key={index} style={{ marginBottom: '1.25rem', padding: '1.75rem', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '20px' }}>
                                                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                                    <select
                                                        className="input"
                                                        value={acc.bankName || ''}
                                                        onChange={(e) => handleAccountChange(index, 'bankName', e.target.value)}
                                                        style={{ flex: 1 }}
                                                    >
                                                        <option value="">Seleccionar Banco</option>
                                                        {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                                                    </select>
                                                    <button type="button" className="btn btn-danger" style={{ padding: '0 14px' }} onClick={() => handleRemoveAccount(index)}>
                                                        ✕
                                                    </button>
                                                </div>
                                                <div className="grid-2-col" style={{ gap: '0.75rem' }}>
                                                    <input
                                                        className="input"
                                                        type="text"
                                                        value={acc.accountNumber || ''}
                                                        onChange={(e) => handleAccountChange(index, 'accountNumber', e.target.value)}
                                                        placeholder="Nº de Cuenta"
                                                    />
                                                    <input
                                                        className="input"
                                                        type="text"
                                                        value={acc.cci || ''}
                                                        onChange={(e) => handleAccountChange(index, 'cci', e.target.value)}
                                                        placeholder="CCI (Opcional)"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        <button type="button" className="btn btn-secondary" style={{ width: '100%', fontSize: '0.9rem' }} onClick={handleAddAccount}>
                                            + Agregar Cuenta Bancaria
                                        </button>
                                    </div>
                                    <div className="input-group">
                                        <label className="label">Dirección</label>
                                        <input
                                            className="input"
                                            type="text"
                                            value={companyFormData.address || ''}
                                            onChange={(e) => setCompanyFormData({ ...companyFormData, address: e.target.value })}
                                            placeholder="Calle Falsa 123"
                                        />
                                    </div>
                                    <div className="grid-2-col" style={{ gap: '1.5rem' }}>
                                        <div className="input-group">
                                            <label className="label">Email</label>
                                            <input
                                                className="input"
                                                type="email"
                                                value={companyFormData.email || ''}
                                                onChange={(e) => setCompanyFormData({ ...companyFormData, email: e.target.value })}
                                                placeholder="contacto@empresa.com"
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label className="label">Teléfono</label>
                                            <input
                                                className="input"
                                                type="text"
                                                value={companyFormData.phone || ''}
                                                onChange={(e) => setCompanyFormData({ ...companyFormData, phone: e.target.value })}
                                                placeholder="+51 987 654 321"
                                            />
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label className="label">Logo de Empresa</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                            <input
                                                id="company-logo-upload"
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setLogoFile(e.target.files[0])}
                                                style={{ display: 'none' }}
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={() => document.getElementById('company-logo-upload').click()}
                                            >
                                                {logoFile ? logoFile.name : 'Seleccionar Archivo'}
                                            </button>
                                            {editingCompanyId && companyFormData.logoUrl && (
                                                <img src={companyFormData.logoUrl} alt="Logo" style={{ width: '64px', height: '64px', objectFit: 'contain', borderRadius: '14px', border: '1px solid #f1f5f9' }} />
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <input
                                            type="checkbox"
                                            id="companyIsDefault"
                                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                            checked={companyFormData.isDefault}
                                            onChange={(e) => setCompanyFormData({ ...companyFormData, isDefault: e.target.checked })}
                                        />
                                        <label htmlFor="companyIsDefault" style={{ cursor: 'pointer', fontWeight: '500', color: '#64748b' }}>Establecer como predeterminado</label>
                                    </div>
                                    <div className="input-group">
                                        <label className="label">Condiciones Generales</label>
                                        <textarea
                                            className="input"
                                            rows={5}
                                            value={companyFormData.conditions}
                                            onChange={(e) => setCompanyFormData({ ...companyFormData, conditions: e.target.value })}
                                            placeholder="Ingrese los términos y condiciones..."
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '1.25rem' }}>
                                        <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                                            {editingCompanyId ? 'Actualizar Perfil' : 'Guardar Perfil'}
                                        </button>
                                        {editingCompanyId && (
                                            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={handleCompanyCancel}>
                                                Cancelar
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>

                            <div>
                                <h3 style={{ marginBottom: '1.5rem' }}>Perfiles Registrados</h3>
                                {loading ? (
                                    <p>Cargando...</p>
                                ) : companyProfiles.length === 0 ? (
                                    <p style={{ color: '#64748b' }}>No hay perfiles configurados.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                        {companyProfiles.map((p) => (
                                            <div key={p.id} className="card" style={{ padding: '1.75rem', border: p.isDefault ? '1px solid #1e293b' : '1px solid #f1f5f9' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                                        {p.logoUrl && (
                                                            <img src={p.logoUrl} alt="Logo" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
                                                        )}
                                                        <div>
                                                            <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{p.name || 'Sin Nombre'}</h4>
                                                            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>{p.ruc || 'Sin RUC'}</p>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end', gap: '1rem' }}>
                                                        {p.isDefault && (
                                                            <span className="status-badge" style={{ background: '#1e293b', color: 'white' }}>
                                                                Default
                                                            </span>
                                                        )}
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 10px' }} onClick={() => handleCompanyEdit(p)}>
                                                                Editar
                                                            </button>
                                                            <button className="btn btn-danger" style={{ fontSize: '0.8rem', padding: '6px 10px' }} onClick={() => handleCompanyDelete(p.id)}>
                                                                Borrar
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        </div>
                    )}

                    {activeTab === 'clientes' && (
                        <div>
                            <h2 style={{ color: '#101828', marginBottom: '1.5rem', fontSize: '1.5rem' }}>Perfiles de Cliente</h2>
                            <div className="grid-2-col" style={{ gap: '2.5rem' }}>
                                <div className="card">
                                <h3>{editingClientId ? 'Editar Perfil de Cliente' : 'Añadir Nuevo Cliente'}</h3>
                                <form onSubmit={handleClientSubmit} style={{ marginTop: '2rem' }}>
                                    <div className="input-group">
                                        <label className="label">Nombre de Cliente</label>
                                        <input
                                            className="input"
                                            type="text"
                                            required
                                            value={clientFormData.name || ''}
                                            onChange={(e) => setClientFormData({ ...clientFormData, name: e.target.value })}
                                            placeholder="Ej: Juan Pérez"
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="label">RUC / DNI</label>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <input
                                                className="input"
                                                type="text"
                                                style={{ flex: 1 }}
                                                value={clientFormData.ruc || ''}
                                                onChange={(e) => setClientFormData({ ...clientFormData, ruc: e.target.value })}
                                                placeholder="12345678901"
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={searchClientRuc}
                                                disabled={searchingClientRuc || !((clientFormData.ruc || '').length === 8 || (clientFormData.ruc || '').length === 11)}
                                            >
                                                {searchingClientRuc ? '...' : 'SUNAT / RENIEC'}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label className="label">Dirección</label>
                                        <input
                                            className="input"
                                            type="text"
                                            value={clientFormData.address || ''}
                                            onChange={(e) => setClientFormData({ ...clientFormData, address: e.target.value })}
                                            placeholder="Calle Falsa 123"
                                        />
                                    </div>
                                    <div style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <input
                                            type="checkbox"
                                            id="clientIsDefault"
                                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                            checked={clientFormData.isDefault}
                                            onChange={(e) => setClientFormData({ ...clientFormData, isDefault: e.target.checked })}
                                        />
                                        <label htmlFor="clientIsDefault" style={{ cursor: 'pointer', fontWeight: '500', color: '#64748b' }}>Establecer como predeterminado</label>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1.25rem' }}>
                                        <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                                            {editingClientId ? 'Actualizar Perfil' : 'Guardar Perfil'}
                                        </button>
                                        {editingClientId && (
                                            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditingClientId(null)}>
                                                Cancelar
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>

                            <div>
                                <h3 style={{ marginBottom: '1.5rem' }}>Clientes Registrados</h3>
                                {clientProfiles.length === 0 ? (
                                    <p style={{ color: '#64748b' }}>No hay perfiles configurados.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                        {clientProfiles.map((p) => (
                                            <div key={p.id} className="card" style={{ padding: '1.75rem', border: p.isDefault ? '1px solid #1e293b' : '1px solid #f1f5f9' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                    <div>
                                                        <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{p.name || 'Sin Nombre'}</h4>
                                                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>{p.address || 'Sin Dirección'}</p>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end', gap: '1rem' }}>
                                                        {p.isDefault && (
                                                            <span className="status-badge" style={{ background: '#1e293b', color: 'white' }}>
                                                                Default
                                                            </span>
                                                        )}
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 10px' }} onClick={() => handleClientEdit(p)}>
                                                                Editar
                                                            </button>
                                                            <button className="btn btn-danger" style={{ fontSize: '0.8rem', padding: '6px 10px' }} onClick={() => handleClientDelete(p.id)}>
                                                                Borrar
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        </div>
                    )}
                    
                    {/* ─── CONFIGURACIÓN DE CORREO ─── */}
                    {activeTab === 'correos' && (
                        <div>
                            <h2 style={{ color: '#101828', marginBottom: '1.5rem', fontSize: '1.5rem' }}>Configuración de Envío de Correos</h2>
                            <EmailSettingsManager empresaId={user?.empresaId} />
                        </div>
                    )}
                </div>
            </div>

        </main>
    );
}

// ─── Componente: Configuración de Correos ────────────────────────

function EmailSettingsManager({ empresaId }) {
    const [formData, setFormData] = useState({
        smtpUser: '',
        smtpPassword: '',
        senderName: '',
        emailSignature: '',
        sigName: '',
        sigRole: '',
        sigPhone: '',
        sigWebsite: '',
        sigEmail: '',
        sigLogoUrl: '',
        senderAliases: [],
        defaultTemplate: ''
    });
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [newAlias, setNewAlias] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        if (!empresaId) return;
        const fetchSettings = async () => {
            try {
                const res = await fetch(`/api/settings/email?empresaId=${empresaId}`);
                if (res.ok) {
                    const data = await res.json();
                    setFormData(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [empresaId]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch(`/api/settings/email`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ empresaId, ...formData })
            });
            if (res.ok) {
                setMessage({ type: 'success', text: 'Configuración guardada correctamente.' });
            } else {
                setMessage({ type: 'error', text: 'Error al guardar la configuración.' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Error de red.' });
        } finally {
            setSaving(false);
        }
    };

    const handleAddAlias = () => {
        if (!newAlias.trim() || !newAlias.includes('@')) return;
        setFormData({
            ...formData,
            senderAliases: [...formData.senderAliases, newAlias.trim()]
        });
        setNewAlias('');
    };

    const handleRemoveAlias = (index) => {
        const newAliases = [...formData.senderAliases];
        newAliases.splice(index, 1);
        setFormData({ ...formData, senderAliases: newAliases });
    };

    const uploadSigLogo = async (e) => {
        const file = e.target.files[0];
        if (!file || !storage || !empresaId) return;
        setUploadingLogo(true);
        try {
            const ext = file.name.split('.').pop();
            const storageRef = ref(storage, `signature-logos/${empresaId}/logo-${Date.now()}.${ext}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            updateSignature('sigLogoUrl', url);
        } catch (err) {
            console.error('Error uploading signature logo:', err);
            alert('Error al subir el logo de la firma.');
        } finally {
            setUploadingLogo(false);
        }
    };

    const removeSigLogo = async () => {
        try {
            if (formData.sigLogoUrl) {
                const storageRef = ref(storage, formData.sigLogoUrl);
                await deleteObject(storageRef).catch(() => {});
            }
            updateSignature('sigLogoUrl', '');
        } catch (err) {
            console.error('Error removing signature logo:', err);
        }
    };

    const updateSignature = (field, value) => {
        const newForm = { ...formData, [field]: value };
        
        // Auto-generate HTML signature
        const { sigName, sigRole, sigPhone, sigWebsite, sigEmail, sigLogoUrl } = newForm;
        
        let html = '<div style="font-family: Arial, sans-serif; font-size: 13px; color: #333; margin-top: 20px; display: flex; align-items: center; gap: 15px;">';
        
        if (sigLogoUrl) {
            html += `<img src="${sigLogoUrl}" alt="Logo" style="width: 80px; height: auto; object-fit: contain; border-right: 2px solid #e2e8f0; padding-right: 15px;" />`;
        }
        
        html += '<div style="line-height: 1.5;">';
        if (sigName) html += `<strong style="font-size: 15px; color: #000;">${sigName}</strong><br>`;
        if (sigRole) html += `<span style="color: #64748b;">${sigRole}</span><br>`;
        
        const details = [];
        if (sigPhone) details.push(sigPhone);
        if (sigWebsite) details.push(`<a href="https://${sigWebsite.replace('https://', '').replace('http://', '')}" style="color: #2563eb; text-decoration: none;">${sigWebsite}</a>`);
        if (sigEmail) details.push(`<a href="mailto:${sigEmail}" style="color: #2563eb; text-decoration: none;">${sigEmail}</a>`);
        
        if (details.length > 0) {
            html += `<div style="margin-top: 5px; font-size: 12px; color: #475569;">${details.join(' &nbsp;|&nbsp; ')}</div>`;
        }
        
        html += '</div></div>';
        
        newForm.emailSignature = html;
        setFormData(newForm);
    };

    if (loading) return <p>Cargando configuración de correos...</p>;

    return (
        <div className="card">
            <form onSubmit={handleSave} style={{ marginTop: '1rem' }}>
                <div className="grid-2-col" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div className="input-group">
                        <label className="label">Correo Principal (Cuenta de Gmail)</label>
                        <input
                            className="input"
                            type="email"
                            value={formData.smtpUser}
                            onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
                            placeholder="ej: info@miempresa.com"
                        />
                    </div>
                    <div className="input-group">
                        <label className="label">Clave de Aplicación (App Password)</label>
                        <input
                            className="input"
                            type="password"
                            value={formData.smtpPassword}
                            onChange={(e) => setFormData({ ...formData, smtpPassword: e.target.value })}
                            placeholder="16 caracteres sin espacios"
                        />
                        <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                            Generada desde la seguridad de tu cuenta de Google.
                        </p>
                    </div>
                </div>
                <div className="grid-2-col" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div className="input-group">
                        <label className="label">Nombre del Remitente</label>
                        <input
                            className="input"
                            type="text"
                            value={formData.senderName}
                            onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                            placeholder="Ej: Equipo de Ventas AyaTech"
                        />
                        <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                            Aparecerá junto al correo, ej: "Ventas AyaTech &lt;ventas@...&gt;"
                        </p>
                    </div>
                </div>

                <div style={{ borderTop: '1px solid #e2e8f0', margin: '2rem 0', paddingTop: '1.5rem' }}>
                    <h3 style={{ marginBottom: '0.5rem' }}>Generador de Firma Automática</h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
                        Completa estos datos y generaremos una firma HTML profesional automáticamente.
                    </p>

                    <div className="grid-2-col" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div className="input-group">
                            <label className="label">Nombre y Apellido</label>
                            <input className="input" type="text" value={formData.sigName} onChange={(e) => updateSignature('sigName', e.target.value)} placeholder="Ej: Ken Alexis Quispe Mamani" />
                        </div>
                        <div className="input-group">
                            <label className="label">Cargo y Empresa</label>
                            <input className="input" type="text" value={formData.sigRole} onChange={(e) => updateSignature('sigRole', e.target.value)} placeholder="Ej: Departamento de ventas, AYA Technologies" />
                        </div>
                        <div className="input-group">
                            <label className="label">Teléfono</label>
                            <input className="input" type="text" value={formData.sigPhone} onChange={(e) => updateSignature('sigPhone', e.target.value)} placeholder="Ej: +51 952487700" />
                        </div>
                        <div className="input-group">
                            <label className="label">Sitio Web</label>
                            <input className="input" type="text" value={formData.sigWebsite} onChange={(e) => updateSignature('sigWebsite', e.target.value)} placeholder="Ej: www.ayatech.com.pe" />
                        </div>
                        <div className="input-group">
                            <label className="label">Correo de contacto</label>
                            <input className="input" type="email" value={formData.sigEmail} onChange={(e) => updateSignature('sigEmail', e.target.value)} placeholder="Ej: ken.qm@ayatech.com.pe" />
                        </div>
                        <div className="input-group">
                            <label className="label">Logo de la Empresa</label>
                            {formData.sigLogoUrl ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <img src={formData.sigLogoUrl} alt="Logo" style={{ width: '60px', height: '60px', objectFit: 'contain', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white' }} />
                                    <button type="button" onClick={removeSigLogo} className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Quitar</button>
                                </div>
                            ) : (
                                <label style={{ cursor: uploadingLogo ? 'wait' : 'pointer', display: 'inline-block', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600' }}>
                                    {uploadingLogo ? 'Subiendo...' : 'Subir Imagen'}
                                    <input type="file" accept="image/*" disabled={uploadingLogo} onChange={uploadSigLogo} style={{ display: 'none' }} />
                                </label>
                            )}
                        </div>
                    </div>
                </div>

                <div className="input-group" style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <label className="label">Vista Previa / Código HTML de la Firma</label>
                    <textarea
                        className="input"
                        rows={6}
                        value={formData.emailSignature}
                        onChange={(e) => setFormData({ ...formData, emailSignature: e.target.value })}
                        placeholder="El código HTML se generará aquí..."
                    />
                    <div style={{ marginTop: '1rem', padding: '1rem', background: 'white', borderRadius: '6px', border: '1px dashed #cbd5e1' }} dangerouslySetInnerHTML={{ __html: formData.emailSignature || '<span style="color: #94a3b8">La vista previa aparecerá aquí...</span>' }} />
                </div>

                <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="label">Alias Autorizados (Remitentes)</label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <input
                            className="input"
                            type="email"
                            value={newAlias}
                            onChange={(e) => setNewAlias(e.target.value)}
                            placeholder="ej: ventas@miempresa.com"
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddAlias(); } }}
                        />
                        <button type="button" className="btn btn-secondary" onClick={handleAddAlias}>Agregar</button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {formData.senderAliases.map((alias, idx) => (
                            <div key={idx} style={{ background: '#f1f5f9', padding: '0.25rem 0.75rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                {alias}
                                <button type="button" onClick={() => handleRemoveAlias(idx)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                            </div>
                        ))}
                        {formData.senderAliases.length === 0 && <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No hay alias configurados.</span>}
                    </div>
                </div>

                <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="label">Plantilla Predeterminada de Cotización</label>
                    <textarea
                        className="input"
                        rows={6}
                        value={formData.defaultTemplate}
                        onChange={(e) => setFormData({ ...formData, defaultTemplate: e.target.value })}
                        placeholder="Escribe el texto que acompañará al PDF por defecto..."
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Guardando...' : 'Guardar Configuración'}
                    </button>
                    {message && (
                        <span style={{ color: message.type === 'success' ? '#10b981' : '#ef4444', fontWeight: 500 }}>
                            {message.type === 'success' ? '✓ ' : '✕ '}{message.text}
                        </span>
                    )}
                </div>
            </form>
        </div>
    );
}
