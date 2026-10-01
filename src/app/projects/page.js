'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { NavBar } from '@/components/NavBar'
import { useAuth } from '@/contexts/AuthContext'

export default function Projects() {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!user?.empresaId) return;

        fetch(`/api/quotations?empresaId=${user.empresaId}`)
            .then(res => {
                if (res.status === 401) {
                    router.push('/login');
                    return [];
                }
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    // Filtrar solo las que son Proyectos (aprobadas o completadas)
                    const approvedProjects = data.filter(q => 
                        q.quotationStatus === 'aprobada' || q.quotationStatus === 'completado'
                    );
                    setProjects(approvedProjects);
                } else {
                    console.error('API Error:', data.error);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [router, user?.empresaId]);

    return (
        <ProtectedRoute allowedModule="projects">
            <NavBar />
            <main className="container">
                <div className="dashboard-header">
                    <div className="dashboard-title-area" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <button onClick={() => router.push('/')} className="btn-back-square" title="Volver al Dashboard">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                            </svg>
                        </button>
                        <div>
                            <h1 style={{ lineHeight: '1.2' }}>Documentación de Proyectos</h1>
                            <p>Gestiona los archivos y entregables de tus cotizaciones aprobadas.</p>
                        </div>
                    </div>
                </div>

                <div className="content-frame main-content-frame">
                    {loading ? (
                        <div style={{ color: '#101828', textAlign: 'center', padding: '4rem', fontSize: '1.1rem' }}>Cargando proyectos...</div>
                    ) : projects.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
                            <h3 style={{ fontSize: '1.5rem', color: '#101828' }}>No hay proyectos activos</h3>
                            <p style={{ color: '#667085', margin: '1.5rem 0', fontSize: '1rem' }}>
                                Las cotizaciones que marques como "OC Recibida" aparecerán aquí automáticamente.
                            </p>
                        </div>
                    ) : (
                        <div className="grid-list">
                            {projects.map(p => (
                                <div key={p.id} className="card" style={{ padding: '2rem', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'flex-start' }}>
                                        <span style={{ fontWeight: '700', color: '#101828', fontSize: '0.9rem', letterSpacing: '0.05em' }}>
                                            {p.code || 'SIN CÓDIGO'}
                                        </span>
                                        <span className="status-badge" style={{
                                            background: p.quotationStatus === 'completado' ? '#dcfce7' : '#e0e7ff',
                                            color: p.quotationStatus === 'completado' ? '#16a34a' : '#4338ca',
                                            border: `1px solid ${p.quotationStatus === 'completado' ? '#bbf7d0' : '#c7d2fe'}`
                                        }}>
                                            {p.quotationStatus === 'completado' ? 'Completado' : 'Aprobado'}
                                        </span>
                                    </div>
                                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#101828', fontWeight: '600' }}>
                                        {p.clientName || 'Sin Cliente'}
                                    </h3>
                                    {p.serviceDescription && (
                                        <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
                                            {p.serviceDescription}
                                        </p>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                                            {p.projectDocuments?.length || 0} Archivos
                                        </div>
                                        <button 
                                            className="btn btn-primary" 
                                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                            onClick={() => router.push(`/projects/${p.id}`)}
                                        >
                                            Gestionar Documentos
                                        </button>
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
