'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { NavBar } from '@/components/NavBar'
import { useAuth } from '@/contexts/AuthContext'

export default function SuppliersDashboard() {
    const { user } = useAuth()
    const [suppliers, setSuppliers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingSupplier, setEditingSupplier] = useState(null)
    const [activeTab, setActiveTab] = useState('productos')
    const router = useRouter()

    const [formData, setFormData] = useState({
        name: '',
        category: '',
        whatsapp: '',
        city: '',
        email: '',
        notes: '',
        supplierType: 'productos'
    })

    useEffect(() => {
        if (user?.empresaId) {
            fetchSuppliers()
        }
    }, [user?.empresaId])

    const fetchSuppliers = async () => {
        if (!user?.empresaId) return;
        setLoading(true)
        try {
            const res = await fetch(`/api/suppliers?empresaId=${encodeURIComponent(user.empresaId)}`)
            const data = await res.json()
            if (Array.isArray(data)) {
                setSuppliers(data)
            }
        } catch (error) {
            console.error('Error fetching suppliers:', error)
        }
        setLoading(false)
    }

    const handleOpenModal = (supplier = null) => {
        if (supplier) {
            setEditingSupplier(supplier)
            setFormData({
                name: supplier.name || '',
                category: supplier.category || '',
                whatsapp: supplier.whatsapp || '',
                city: supplier.city || '',
                email: supplier.email || '',
                notes: supplier.notes || '',
                supplierType: supplier.supplierType || 'productos'
            })
        } else {
            setEditingSupplier(null)
            setFormData({
                name: '',
                category: '',
                whatsapp: '',
                city: '',
                email: '',
                notes: '',
                supplierType: activeTab // default to current tab
            })
        }
        setShowModal(true)
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setEditingSupplier(null)
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!user?.empresaId) {
            alert('No tienes una empresa asignada. Por favor, contacta a soporte.');
            return;
        }
        try {
            const payload = { ...formData, empresaId: user.empresaId };
            if (editingSupplier) {
                await fetch(`/api/suppliers/${editingSupplier.id}?empresaId=${encodeURIComponent(user.empresaId)}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
            } else {
                await fetch(`/api/suppliers?empresaId=${encodeURIComponent(user.empresaId)}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
            }
            handleCloseModal()
            fetchSuppliers()
        } catch (error) {
            console.error('Error saving supplier:', error)
            alert('Hubo un error al guardar el proveedor.')
        }
    }

    const handleDelete = async (id) => {
        if (!user?.empresaId) return;
        if (!confirm('¿Estás seguro de eliminar este proveedor?')) return
        try {
            await fetch(`/api/suppliers/${id}?empresaId=${encodeURIComponent(user.empresaId)}`, { method: 'DELETE' })
            fetchSuppliers()
        } catch (error) {
            console.error('Error deleting supplier:', error)
            alert('Hubo un error al eliminar el proveedor.')
        }
    }

    const filteredSuppliers = suppliers.filter(s => (s.supplierType || 'productos') === activeTab)

    return (
        <ProtectedRoute allowedModule="suppliers">
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
                            <h1 style={{ lineHeight: '1.2' }}>Mis Proveedores</h1>
                            <p>Directorio de proveedores, rubros y contactos clave.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => handleOpenModal()}
                        style={{ background: '#d946ef', color: 'white', border: 'none', padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 2px 4px rgba(217, 70, 239, 0.2)' }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Añadir Proveedor
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                    <button
                        onClick={() => setActiveTab('productos')}
                        style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '1rem', fontWeight: activeTab === 'productos' ? 'bold' : 'normal', color: activeTab === 'productos' ? '#d946ef' : '#64748b', borderBottom: activeTab === 'productos' ? '3px solid #d946ef' : '3px solid transparent', cursor: 'pointer' }}
                    >
                        Proveedores de Productos
                    </button>
                    <button
                        onClick={() => setActiveTab('servicios')}
                        style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '1rem', fontWeight: activeTab === 'servicios' ? 'bold' : 'normal', color: activeTab === 'servicios' ? '#d946ef' : '#64748b', borderBottom: activeTab === 'servicios' ? '3px solid #d946ef' : '3px solid transparent', cursor: 'pointer' }}
                    >
                        Proveedores de Servicios
                    </button>
                </div>

                <div className="content-frame main-content-frame">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#101828' }}>Cargando proveedores...</div>
                    ) : filteredSuppliers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#64748b' }}>
                            <div style={{ background: '#fdf4ff', borderRadius: '50%', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d946ef" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                  <circle cx="9" cy="7" r="4"></circle>
                                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                            </div>
                            <h3 style={{ fontSize: '1.5rem', color: '#101828', marginBottom: '1rem' }}>No hay proveedores</h3>
                            <p>Aún no tienes proveedores registrados en tu directorio.</p>
                        </div>
                    ) : (
                        <div className="grid-list">
                            {filteredSuppliers.map(s => (
                                <div key={s.id} className="card" style={{ padding: '2rem', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'flex-start', gap: '0.5rem' }}>
                                        <h3 style={{ fontSize: '1.25rem', color: '#101828', fontWeight: '600', margin: 0, paddingRight: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }} title={s.name}>
                                            {s.name}
                                        </h3>
                                        <span style={{ padding: '0.2rem 0.6rem', background: '#fdf4ff', color: '#d946ef', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0, maxWidth: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }} title={s.category || 'Sin rubro'}>
                                            {s.category || 'Sin rubro'}
                                        </span>
                                    </div>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                                        {s.whatsapp && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#475569' }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: '#64748b', flexShrink: 0}}>
                                                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line>
                                                </svg>
                                                <strong>WhatsApp:</strong> <a href={`https://wa.me/${s.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ color: '#25D366', textDecoration: 'none' }}>{s.whatsapp}</a>
                                            </div>
                                        )}
                                        {s.city && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#475569' }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: '#64748b', flexShrink: 0}}>
                                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>
                                                </svg>
                                                <strong>Ciudad:</strong> {s.city}
                                            </div>
                                        )}
                                        {s.email && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#475569' }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: '#64748b', flexShrink: 0}}>
                                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline>
                                                </svg>
                                                <strong>Email:</strong> {s.email}
                                            </div>
                                        )}
                                        {s.notes && (
                                            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#64748b', background: '#f8fafc', padding: '0.5rem', borderRadius: '6px' }}>
                                                {s.notes}
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                                        <button 
                                            onClick={() => handleOpenModal(s)}
                                            style={{ flex: 1, background: '#f1f5f9', color: '#475569', border: 'none', padding: '0.5rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
                                        >
                                            Editar
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(s.id)}
                                            style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '0.5rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>{editingSupplier ? 'Editar Proveedor' : 'Añadir Proveedor'}</h3>
                            <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#64748b' }}>✕</button>
                        </div>
                        
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem', color: '#475569' }}>Tipo de Proveedor *</label>
                                <select required name="supplierType" value={formData.supplierType} onChange={handleChange} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', backgroundColor: '#f8fafc' }}>
                                    <option value="productos">Proveedores de Productos</option>
                                    <option value="servicios">Proveedores de Servicios</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem', color: '#475569' }}>Nombre de la Empresa / Proveedor *</label>
                                <input required type="text" name="name" value={formData.name} onChange={handleChange} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }} placeholder="Ej: Aceros Arequipa" />
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem', color: '#475569' }}>Rubro (Categoría)</label>
                                <input type="text" name="category" value={formData.category} onChange={handleChange} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }} placeholder="Ej: Materiales de Construcción" />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem', color: '#475569' }}>WhatsApp / Teléfono</label>
                                    <input type="text" name="whatsapp" value={formData.whatsapp} onChange={handleChange} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }} placeholder="Ej: +51 987654321" />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem', color: '#475569' }}>Ciudad</label>
                                    <input type="text" name="city" value={formData.city} onChange={handleChange} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }} placeholder="Ej: Lima, Perú" />
                                </div>
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem', color: '#475569' }}>Email</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }} placeholder="Ej: ventas@empresa.com" />
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem', color: '#475569' }}>Notas Adicionales</label>
                                <textarea name="notes" value={formData.notes} onChange={handleChange} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', minHeight: '80px', fontFamily: 'inherit' }} placeholder="Días de entrega, condiciones especiales..."></textarea>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                                <button type="button" onClick={handleCloseModal} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>
                                    Cancelar
                                </button>
                                <button type="submit" style={{ background: '#d946ef', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>
                                    Guardar Proveedor
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </ProtectedRoute>
    )
}
