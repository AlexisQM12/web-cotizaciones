'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { NavBar } from '@/components/NavBar'
import { useAuth } from '@/contexts/AuthContext'

const TEAM_COLORS = [
    '#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', 
    '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', 
    '#10b981', '#22c55e', '#84cc16', '#eab308', '#f59e0b', '#f97316'
];

export default function TeamDashboard() {
    const [team, setTeam] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingMember, setEditingMember] = useState(null)
    const router = useRouter()
    const { user } = useAuth()

    const [formData, setFormData] = useState({
        name: '',
        role: '',
        whatsapp: '',
        address: '',
        color: TEAM_COLORS[0]
    })

    useEffect(() => {
        if (user) {
            fetchTeam()
        }
    }, [user])

    const fetchTeam = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/team?empresaId=${user?.empresaId || ''}`)
            const data = await res.json()
            if (Array.isArray(data)) {
                setTeam(data)
            }
        } catch (error) {
            console.error('Error fetching team:', error)
        }
        setLoading(false)
    }

    const handleOpenModal = (member = null) => {
        if (member) {
            setEditingMember(member)
            setFormData({
                name: member.name || '',
                role: member.role || '',
                whatsapp: member.whatsapp || '',
                address: member.address || '',
                color: member.color || TEAM_COLORS[0]
            })
        } else {
            setEditingMember(null)
            setFormData({
                name: '',
                role: '',
                whatsapp: '',
                address: '',
                color: TEAM_COLORS[team.length % TEAM_COLORS.length]
            })
        }
        setShowModal(true)
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setEditingMember(null)
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const payload = { ...formData, empresaId: user?.empresaId || '' };
            if (editingMember) {
                await fetch(`/api/team/${editingMember.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
            } else {
                await fetch('/api/team', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
            }
            handleCloseModal()
            fetchTeam()
        } catch (error) {
            console.error('Error saving team member:', error)
            alert('Hubo un error al guardar.')
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar a este miembro del equipo? Las tareas asignadas a él perderán su referencia de color.')) return
        try {
            await fetch(`/api/team/${id}?empresaId=${user?.empresaId || ''}`, { method: 'DELETE' })
            fetchTeam()
        } catch (error) {
            console.error('Error deleting team member:', error)
            alert('Hubo un error al eliminar.')
        }
    }

    return (
        <ProtectedRoute allowedModule="team">
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
                            <h1 style={{ lineHeight: '1.2' }}>Mi Equipo</h1>
                            <p>Directorio de personal y miembros de la empresa.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => handleOpenModal()}
                        style={{ background: '#0ea5e9', color: 'white', border: 'none', padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 2px 4px rgba(14, 165, 233, 0.2)' }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Añadir Miembro
                    </button>
                </div>

                <div className="content-frame main-content-frame" style={{ marginTop: '1.5rem' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#101828' }}>Cargando equipo...</div>
                    ) : team.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#64748b' }}>
                            <div style={{ background: '#f0f9ff', borderRadius: '50%', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                  <circle cx="9" cy="7" r="4"></circle>
                                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                            </div>
                            <h3 style={{ fontSize: '1.5rem', color: '#101828', marginBottom: '1rem' }}>No hay equipo registrado</h3>
                            <p>Añade miembros para poder asignarlos a tareas y compras.</p>
                        </div>
                    ) : (
                        <div className="grid-list">
                            {team.map(m => (
                                <div key={m.id} className="card" style={{ padding: '2rem', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingRight: '1rem', flex: 1, minWidth: 0 }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#f8fafc', border: `2px solid ${m.color || '#0ea5e9'}` }}>
                                                <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${m.name}&backgroundColor=${(m.color || '#0ea5e9').replace('#','')}`} alt={m.name} style={{ width: '100%', height: '100%' }} />
                                            </div>
                                            <h3 style={{ fontSize: '1.25rem', color: '#101828', fontWeight: '600', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={m.name}>
                                                {m.name}
                                            </h3>
                                        </div>
                                        <span style={{ padding: '0.2rem 0.6rem', background: '#f0f9ff', color: '#0ea5e9', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0, maxWidth: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }} title={m.role || 'Sin cargo'}>
                                            {m.role || 'Sin cargo'}
                                        </span>
                                    </div>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                                        {m.whatsapp && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#475569' }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: '#64748b', flexShrink: 0}}>
                                                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line>
                                                </svg>
                                                <strong>WhatsApp:</strong> <a href={`https://wa.me/${m.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ color: '#25D366', textDecoration: 'none' }}>{m.whatsapp}</a>
                                            </div>
                                        )}
                                        {m.address && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#475569' }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: '#64748b', flexShrink: 0}}>
                                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>
                                                </svg>
                                                <strong>Dirección/DNI:</strong> {m.address}
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                                        <button 
                                            onClick={() => handleOpenModal(m)}
                                            style={{ flex: 1, background: '#f1f5f9', color: '#475569', border: 'none', padding: '0.5rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
                                        >
                                            Editar
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(m.id)}
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
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: '700' }}>{editingMember ? 'Editar Miembro' : 'Añadir Miembro'}</h3>
                            <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#64748b' }}>✕</button>
                        </div>
                        
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#f8fafc', border: `2px solid ${formData.color}` }}>
                                    <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${formData.name || 'User'}&backgroundColor=${formData.color.replace('#','')}`} alt="Preview" style={{ width: '100%', height: '100%' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.3rem', color: '#64748b', textTransform: 'uppercase' }}>Color Asignado</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                        {TEAM_COLORS.map(c => (
                                            <div 
                                                key={c} 
                                                onClick={() => setFormData({...formData, color: c})}
                                                style={{ 
                                                    width: '20px', height: '20px', borderRadius: '50%', background: c, cursor: 'pointer',
                                                    border: formData.color === c ? '2px solid #0f172a' : '2px solid transparent',
                                                    boxShadow: formData.color === c ? '0 0 0 2px #fff inset' : 'none'
                                                }} 
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem', color: '#475569' }}>Nombre Completo *</label>
                                <input required type="text" name="name" value={formData.name} onChange={handleChange} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }} placeholder="Ej: Juan Pérez" />
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem', color: '#475569' }}>Cargo / Especialidad</label>
                                <input type="text" name="role" value={formData.role} onChange={handleChange} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }} placeholder="Ej: Soldador, Ingeniero Civil, Comprador" />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem', color: '#475569' }}>WhatsApp / Celular</label>
                                    <input type="text" name="whatsapp" value={formData.whatsapp} onChange={handleChange} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }} placeholder="Ej: 987654321" />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem', color: '#475569' }}>Dirección / DNI (Opcional)</label>
                                    <input type="text" name="address" value={formData.address} onChange={handleChange} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }} placeholder="Información extra" />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                                <button type="button" onClick={handleCloseModal} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>
                                    Cancelar
                                </button>
                                <button type="submit" style={{ background: '#0ea5e9', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </ProtectedRoute>
    )
}
