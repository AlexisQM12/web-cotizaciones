'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { NavBar } from '@/components/NavBar'
import { useAuth } from '@/contexts/AuthContext'

export default function LoansDashboard() {
    const [loans, setLoans] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingLoan, setEditingLoan] = useState(null)
    const router = useRouter()
    const { user } = useAuth()

    const [formData, setFormData] = useState({
        entity: '',
        amount: '',
        interestRate: '',
        installments: '',
        startDate: '',
        monthlyPayment: '',
        status: 'ACTIVE'
    })

    useEffect(() => {
        if (user?.empresaId) {
            fetchLoans()
        }
    }, [user?.empresaId])

    const fetchLoans = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/loans?empresaId=${user?.empresaId || ''}`)
            const data = await res.json()
            if (Array.isArray(data)) {
                setLoans(data)
            } else {
                setLoans([])
            }
        } catch (error) {
            console.error('Error fetching loans:', error)
        }
        setLoading(false)
    }

    const handleOpenModal = (loan = null) => {
        if (loan) {
            setEditingLoan(loan)
            setFormData({
                entity: loan.entity || '',
                amount: loan.amount || '',
                interestRate: loan.interestRate || '',
                installments: loan.installments || '',
                startDate: loan.startDate || '',
                monthlyPayment: loan.monthlyPayment || '',
                status: loan.status || 'ACTIVE'
            })
        } else {
            setEditingLoan(null)
            setFormData({
                entity: '',
                amount: '',
                interestRate: '',
                installments: '',
                startDate: new Date().toISOString().split('T')[0],
                monthlyPayment: '',
                status: 'ACTIVE'
            })
        }
        setShowModal(true)
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setEditingLoan(null)
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const payload = { ...formData, empresaId: user?.empresaId || '' }
            if (editingLoan) {
                payload.id = editingLoan.id
                await fetch(`/api/loans`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
            } else {
                await fetch('/api/loans', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
            }
            handleCloseModal()
            fetchLoans()
        } catch (error) {
            console.error('Error saving loan:', error)
            alert('Hubo un error al guardar.')
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este préstamo? No podrás si ya tiene compras asociadas.')) return
        try {
            const res = await fetch(`/api/loans?id=${id}&empresaId=${user?.empresaId || ''}`, { method: 'DELETE' })
            const data = await res.json();
            if (!res.ok) {
                alert(data.error || 'Error al eliminar');
            } else {
                fetchLoans();
            }
        } catch (error) {
            console.error('Error deleting loan:', error)
            alert('Hubo un error al eliminar.')
        }
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount || 0);
    }

    return (
        <ProtectedRoute allowedModule="loans">
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
                            <h1 style={{ lineHeight: '1.2' }}>Préstamos y Financiamiento</h1>
                            <p>Gestiona tus líneas de crédito y vincula compras a tus préstamos.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => handleOpenModal()}
                        style={{ background: '#0ea5e9', color: 'white', border: 'none', padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 2px 4px rgba(14, 165, 233, 0.2)' }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Nuevo Préstamo
                    </button>
                </div>

                <div className="content-frame main-content-frame" style={{ marginTop: '1.5rem', background: 'transparent', border: 'none', padding: 0 }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#101828' }}>Cargando préstamos...</div>
                    ) : loans.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#64748b', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <div style={{ background: '#f0f9ff', borderRadius: '50%', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                </svg>
                            </div>
                            <h3 style={{ fontSize: '1.2rem', color: '#101828', marginBottom: '0.5rem' }}>No tienes préstamos registrados</h3>
                            <p style={{ maxWidth: '400px', margin: '0 auto' }}>Registra tus préstamos o líneas de crédito para poder seleccionar de dónde salieron los fondos al momento de registrar tus compras.</p>
                            <button onClick={() => handleOpenModal()} style={{ marginTop: '1.5rem', background: '#f8fafc', color: '#0ea5e9', border: '1px solid #bae6fd', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer' }}>
                                Crear Primer Préstamo
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                            {loans.map(loan => {
                                const percentSpent = loan.amount > 0 ? (loan.totalSpent / loan.amount) * 100 : 0;
                                return (
                                    <div key={loan.id} style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                    <span style={{ padding: '0.25rem 0.5rem', background: loan.status === 'ACTIVE' ? '#ecfdf5' : '#f1f5f9', color: loan.status === 'ACTIVE' ? '#059669' : '#64748b', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                                        {loan.status === 'ACTIVE' ? 'ACTIVO' : 'PAGADO'}
                                                    </span>
                                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Inicio: {loan.startDate}</span>
                                                </div>
                                                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>{loan.entity}</h3>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                <button onClick={() => handleOpenModal(loan)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem' }}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                                </button>
                                                <button onClick={() => handleDelete(loan.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0.25rem' }}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                </button>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem 0', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Capital Inicial:</span>
                                                <strong style={{ color: '#0f172a' }}>{formatCurrency(loan.amount)}</strong>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Total Ejecutado (Compras):</span>
                                                <strong style={{ color: '#0f172a' }}>{formatCurrency(loan.totalSpent)}</strong>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Saldo Disponible:</span>
                                                <strong style={{ color: '#059669' }}>{formatCurrency(loan.availableBalance)}</strong>
                                            </div>
                                            
                                            {/* Progress Bar */}
                                            <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden', marginTop: '0.5rem' }}>
                                                <div style={{ height: '100%', width: `${Math.min(100, percentSpent)}%`, background: percentSpent > 100 ? '#ef4444' : '#0ea5e9' }} />
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b' }}>
                                            <span>Cuota: {formatCurrency(loan.monthlyPayment)}</span>
                                            <span>Plazo: {loan.installments} meses</span>
                                            <span>TEA: {loan.interestRate}%</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {showModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                        <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>{editingLoan ? 'Editar Préstamo' : 'Nuevo Préstamo'}</h3>
                                <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#64748b' }}>✕</button>
                            </div>
                            
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem', color: '#475569' }}>Entidad Financiera *</label>
                                    <input required type="text" name="entity" value={formData.entity} onChange={handleChange} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }} placeholder="Ej: BCP, Interbank..." />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem', color: '#475569' }}>Monto Aprobado (S/) *</label>
                                        <input required type="number" step="0.01" name="amount" value={formData.amount} onChange={handleChange} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }} placeholder="Ej: 50000" />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem', color: '#475569' }}>Tasa de Interés (%)</label>
                                        <input type="number" step="0.01" name="interestRate" value={formData.interestRate} onChange={handleChange} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }} placeholder="Ej: 14.5" />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem', color: '#475569' }}>Plazo (Meses) *</label>
                                        <input required type="number" name="installments" value={formData.installments} onChange={handleChange} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }} placeholder="Ej: 24" />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem', color: '#475569' }}>Cuota Mensual (S/)</label>
                                        <input type="number" step="0.01" name="monthlyPayment" value={formData.monthlyPayment} onChange={handleChange} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }} placeholder="Ej: 2350.50" />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem', color: '#475569' }}>Fecha de Desembolso *</label>
                                        <input required type="date" name="startDate" value={formData.startDate} onChange={handleChange} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }} />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem', color: '#475569' }}>Estado</label>
                                        <select name="status" value={formData.status} onChange={handleChange} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', background: '#fff' }}>
                                            <option value="ACTIVE">Activo (En curso)</option>
                                            <option value="PAID">Pagado (Finalizado)</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                                    <button type="button" onClick={handleCloseModal} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>
                                        Cancelar
                                    </button>
                                    <button type="submit" style={{ background: '#0ea5e9', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>
                                        Guardar Préstamo
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </ProtectedRoute>
    )
}
