'use client'

import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { NavBar } from '@/components/NavBar'

export default function Home() {
    const router = useRouter()

    return (
        <ProtectedRoute>
            <NavBar />
            <main className="container">
                <div className="dashboard-header">
                    <div className="dashboard-title-area">
                        <h1>CGO-Pymes</h1>
                        <p>Centro de Gestión Operativa para la Pequeña y Mediana Empresa</p>
                    </div>
                </div>

                <div className="content-frame main-content-frame">
                    <div className="grid-list" style={{ gap: '2rem' }}>
                        {/* Card 1: Mis Cotizaciones */}
                        <div 
                            className="card" 
                            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '3rem 2rem' }}
                            onClick={() => router.push('/quotations')}
                        >
                            <div style={{ background: '#eff6ff', borderRadius: '50%', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                  <polyline points="14 2 14 8 20 8" />
                                  <line x1="16" y1="13" x2="8" y2="13" />
                                  <line x1="16" y1="17" x2="8" y2="17" />
                                  <line x1="10" y1="9" x2="8" y2="9" />
                                </svg>
                            </div>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#101828' }}>Mis Cotizaciones</h2>
                            <p style={{ color: '#667085', fontSize: '0.95rem' }}>Gestiona tus cotizaciones, órdenes de compra y facturación.</p>
                        </div>

                        {/* Card 2: Mis Pendientes */}
                        <div 
                            className="card" 
                            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '3rem 2rem' }}
                            onClick={() => router.push('/pendings')}
                        >
                            <div style={{ background: '#fffbeb', borderRadius: '50%', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                                  <path d="M12 11h4" />
                                  <path d="M12 16h4" />
                                  <path d="M8 11h.01" />
                                  <path d="M8 16h.01" />
                                </svg>
                            </div>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#101828' }}>Mis Pendientes</h2>
                            <p style={{ color: '#667085', fontSize: '0.95rem' }}>Controla tus tareas, recordatorios y actividades operativas.</p>
                        </div>

                        {/* Card 3: Mi Contador y Administrador */}
                        <div 
                            className="card" 
                            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '3rem 2rem' }}
                            onClick={() => alert('Módulo "Mi Contador y Administrador" en desarrollo')}
                        >
                            <div style={{ background: '#ecfdf5', borderRadius: '50%', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" y1="20" x2="18" y2="10" />
                                  <line x1="12" y1="20" x2="12" y2="4" />
                                  <line x1="6" y1="20" x2="6" y2="14" />
                                  <line x1="2" y1="20" x2="22" y2="20" />
                                </svg>
                            </div>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#101828' }}>Mi Contador y Adm.</h2>
                            <p style={{ color: '#667085', fontSize: '0.95rem' }}>Reportes financieros, métricas e integraciones contables.</p>
                        </div>
                    </div>
                </div>
            </main>
        </ProtectedRoute>
    )
}
