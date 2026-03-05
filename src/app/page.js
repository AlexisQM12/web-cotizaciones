'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { NavBar } from '@/components/NavBar'

export default function Dashboard() {
    const [quotations, setQuotations] = useState([])
    const [activeTab, setActiveTab] = useState('published') // 'published' or 'drafts'
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

    const updateStatus = async (id, newStatus, e) => {
        e.stopPropagation();
        try {
            await fetch(`/api/quotations/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quotationStatus: newStatus })
            });
            setQuotations(quotations.map(q =>
                q.id === id ? { ...q, quotationStatus: newStatus } : q
            ));
        } catch (err) {
            console.error(err);
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

    // Filter quotations based on active tab
    const publishedQuotations = quotations.filter(q => q.isPublished === true);
    const draftQuotations = quotations.filter(q => q.isPublished === false || q.isPublished === undefined);
    const displayList = activeTab === 'published' ? publishedQuotations : draftQuotations;

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

                {/* Tabs */}
                <div style={{ marginBottom: '2rem', borderBottom: '2px solid #f1f5f9' }}>
                    <button
                        onClick={() => setActiveTab('published')}
                        style={{
                            padding: '1rem 2rem',
                            border: 'none',
                            background: 'none',
                            borderBottom: activeTab === 'published' ? '3px solid #3b82f6' : 'none',
                            fontWeight: activeTab === 'published' ? 'bold' : 'normal',
                            color: activeTab === 'published' ? '#3b82f6' : '#667085',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        Cotizaciones ({publishedQuotations.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('drafts')}
                        style={{
                            padding: '1rem 2rem',
                            border: 'none',
                            background: 'none',
                            borderBottom: activeTab === 'drafts' ? '3px solid #3b82f6' : 'none',
                            fontWeight: activeTab === 'drafts' ? 'bold' : 'normal',
                            color: activeTab === 'drafts' ? '#3b82f6' : '#667085',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        Borradores ({draftQuotations.length})
                    </button>
                </div>

                <div className="content-frame" style={{ padding: '3.5rem' }}>
                    {loading ? (
                        <div style={{ color: '#101828', textAlign: 'center', padding: '4rem', fontSize: '1.1rem' }}>Cargando cotizaciones...</div>
                    ) : displayList.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
                            <h3 style={{ fontSize: '1.5rem', color: '#101828' }}>
                                {activeTab === 'published' ? 'Aún no tienes cotizaciones publicadas' : 'No hay borradores'}
                            </h3>
                            <p style={{ color: '#667085', margin: '1.5rem 0', fontSize: '1rem' }}>
                                {activeTab === 'published'
                                    ? 'Crea y guarda tu primera cotización para verla aquí.'
                                    : 'Tus cotizaciones en borrador aparecerán aquí.'}
                            </p>
                            {activeTab === 'drafts' && (
                                <button className="btn btn-primary" style={{ padding: '0.875rem 2rem' }} onClick={createNewQuotation}>Crear borrador</button>
                            )}
                        </div>
                    ) : (
                        <div className="grid-list">
                            {displayList.map(q => (
                                <div key={q.id} className="card" style={{ cursor: 'pointer', padding: '2rem', border: '1px solid #f1f5f9' }} onClick={() => router.push(`/quotations/${q.id}`)}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                                        <span style={{ fontWeight: '700', color: '#101828', fontSize: '0.9rem', letterSpacing: '0.05em' }}>
                                            {q.code || 'BORRADOR'}
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                                                <select
                                                    value={q.quotationStatus || 'pendiente'}
                                                    onChange={(e) => updateStatus(q.id, e.target.value, e)}
                                                    style={{
                                                        backgroundColor: (q.quotationStatus || 'pendiente') === 'completado' ? '#dcfce7' : '#fef9c3',
                                                        color: (q.quotationStatus || 'pendiente') === 'completado' ? '#16a34a' : '#a16207',
                                                        border: `1px solid ${(q.quotationStatus || 'pendiente') === 'completado' ? '#bbf7d0' : '#fde68a'}`,
                                                        borderRadius: '20px',
                                                        padding: '0.2rem 0.75rem',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '600',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <option value="completado">✓ Completado</option>
                                                    <option value="pendiente">⏳ Pendiente</option>
                                                </select>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); router.push(`/quotations/${q.id}`); }}
                                                style={{ background: '#3b82f6', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1rem', width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                                                onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'}
                                                onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'}
                                                title="Abrir y descargar PDF"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                            </button>
                                            <button
                                                onClick={(e) => deleteQuotation(q.id, e)}
                                                style={{ background: '#dc2626', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1rem', width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                                                onMouseOver={(e) => e.currentTarget.style.background = '#b91c1c'}
                                                onMouseOut={(e) => e.currentTarget.style.background = '#dc2626'}
                                                title="Eliminar cotización"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#101828', fontWeight: '600' }}>
                                        {q.clientName || 'Sin Cliente'}
                                    </h3>
                                    {q.serviceDescription && (
                                        <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {q.serviceDescription}
                                        </p>
                                    )}
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
