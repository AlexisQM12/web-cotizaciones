'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { NavBar } from '@/components/NavBar'

export default function Dashboard() {
    const [quotations, setQuotations] = useState([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    const deleteQuotation = async (id, e) => {
        e.stopPropagation(); // Prevent navigating to edit
        if (confirm('¿Estás seguro de que quieres eliminar esta cotización?')) {
            try {
                await fetch(`/api/quotations/${id}`, { method: 'DELETE' });
                setQuotations(quotations.filter(q => q.id !== id));
            } catch (err) {
                console.error(err);
            }
        }
    };

    useEffect(() => {
        fetch('/api/quotations')
            .then(res => {
                if (res.status === 401) {
                    router.push('/login')
                    return []
                }
                return res.json()
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setQuotations(data)
                } else {
                    console.error('API Error:', data.error);
                    setQuotations([]);
                }
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [router])

    const createNewQuotation = async () => {
        try {
            const res = await fetch('/api/quotations', {
                method: 'POST',
                body: JSON.stringify({ clientName: 'Sin Título' })
            })
            const quote = await res.json()
            router.push(`/quotations/${quote.id}`)
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <ProtectedRoute>
            <NavBar />
            <main className="container">
                <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', color: '#101828', letterSpacing: '-0.02em' }}>Mis Cotizaciones</h1>
                        <p style={{ color: '#667085', marginTop: '0.5rem', fontSize: '1.1rem' }}>Administra y crea nuevas propuestas profesionales.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn btn-secondary" onClick={() => router.push('/settings')}>
                            Configuración
                        </button>
                        <button className="btn btn-primary" onClick={createNewQuotation}>
                            Nueva Cotización
                        </button>
                    </div>
                </div>

                <div className="content-frame" style={{ padding: '3.5rem' }}>
                    {loading ? (
                        <div style={{ color: '#101828', textAlign: 'center', padding: '4rem', fontSize: '1.1rem' }}>Cargando cotizaciones...</div>
                    ) : quotations.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
                            <h3 style={{ fontSize: '1.5rem', color: '#101828' }}>Aún no tienes cotizaciones</h3>
                            <p style={{ color: '#667085', margin: '1.5rem 0', fontSize: '1rem' }}>Crea tu primera cotización para comenzar a trabajar.</p>
                            <button className="btn btn-primary" style={{ padding: '0.875rem 2rem' }} onClick={createNewQuotation}>Comenzar ahora</button>
                        </div>
                    ) : (
                        <div className="grid-list">
                            {quotations.map(q => (
                                <div key={q.id} className="card" style={{ cursor: 'pointer', padding: '2rem', border: '1px solid #f1f5f9' }} onClick={() => router.push(`/quotations/${q.id}`)}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                                        <span style={{ fontWeight: '700', color: '#101828', fontSize: '0.9rem', letterSpacing: '0.05em' }}>{q.code}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <span className={`status-badge status-${q.status}`} style={{ background: '#f8fafc', color: '#475569', border: '1px solid #f1f5f9' }}>{q.status}</span>
                                            <button
                                                onClick={(e) => deleteQuotation(q.id, e)}
                                                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem', transition: 'color 0.2s' }}
                                                onMouseOver={(e) => e.currentTarget.style.color = '#dc2626'}
                                                onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
                                                title="Eliminar"
                                            >
                                                Borrar
                                            </button>
                                        </div>
                                    </div>
                                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#101828', fontWeight: '600' }}>
                                        {q.clientName || 'Sin Cliente'}
                                    </h3>
                                    <p style={{ fontSize: '0.875rem', color: '#667085' }}>
                                        Última edición: {new Date(q.updatedAt).toLocaleDateString()}
                                    </p>
                                    <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>Total</span>
                                        <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#101828' }}>S/ {(q.total || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </ProtectedRoute>
    )
}
