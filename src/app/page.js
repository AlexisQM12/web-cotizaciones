'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSocket } from '@/lib/socket'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { NavBar } from '@/components/NavBar'
import { useAuth } from '@/contexts/AuthContext'

const DEFAULT_ORDER = ['quotations', 'pendings', 'projects', 'team', 'contabilidad', 'logistica', 'loans', 'suppliers', 'clients', 'inventory', 'caja-chica'];

export default function Home() {
    const router = useRouter()
    const { user } = useAuth()
    const [pendingLeads, setPendingLeads] = useState(0)
    const [cardOrder, setCardOrder] = useState(DEFAULT_ORDER)
    const [draggedItemIndex, setDraggedItemIndex] = useState(null)
    const [dragOverItemIndex, setDragOverItemIndex] = useState(null)

    // Los leads se piden en su propio efecto: dependen de empresaId, que llega
    // después del login. Mezclarlo con el montaje de sockets obligaría a
    // re-suscribirlos cada vez que cambia el usuario.
    useEffect(() => {
        if (!user?.empresaId) return;
        fetch(`/api/quote-leads?status=pending&empresaId=${encodeURIComponent(user.empresaId)}`)
            .then(r => r.json())
            .then(d => setPendingLeads(d.leads?.length || 0))
            .catch(() => {});
    }, [user?.empresaId])

    useEffect(() => {
        const socket = getSocket()
        socket.on('quote_lead_detected', () => setPendingLeads(n => n + 1))
        socket.on('quote_lead_dismissed', () => setPendingLeads(n => Math.max(0, n - 1)))

        const savedOrder = localStorage.getItem('dashboard_card_order');
        if (savedOrder) {
            try {
                const parsed = JSON.parse(savedOrder);
                // Ensure all default cards are present (in case a new one was added in an update)
                const merged = [...parsed];
                DEFAULT_ORDER.forEach(id => {
                    if (!merged.includes(id)) merged.push(id);
                });
                setCardOrder(merged);
            } catch (e) {
                console.error(e);
            }
        }

        return () => socket.disconnect()
    }, [])

    const handleDragStart = (e, index) => {
        setDraggedItemIndex(index);
        // Required for Firefox to start drag
        e.dataTransfer.setData('text/plain', index);
        e.dataTransfer.effectAllowed = 'move';
    }

    const handleDragEnter = (index) => {
        setDragOverItemIndex(index);
    }

    const handleDragEnd = () => {
        if (draggedItemIndex !== null && dragOverItemIndex !== null && draggedItemIndex !== dragOverItemIndex) {
            const newOrder = [...cardOrder];
            const item = newOrder.splice(draggedItemIndex, 1)[0];
            newOrder.splice(dragOverItemIndex, 0, item);
            setCardOrder(newOrder);
            localStorage.setItem('dashboard_card_order', JSON.stringify(newOrder));
        }
        setDraggedItemIndex(null);
        setDragOverItemIndex(null);
    }

    const cardsMap = {
        quotations: (
            <>
                {pendingLeads > 0 && (
                    <span style={{
                        position: 'absolute', top: '1rem', right: '1rem',
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        background: '#fee2e2', color: '#b91c1c',
                        borderRadius: 999, padding: '0.25rem 0.65rem',
                        fontSize: '0.72rem', fontWeight: 700,
                    }}>
                        <span style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: '#ef4444',
                            animation: 'pulse-dot 1.4s ease-in-out infinite',
                            display: 'inline-block',
                        }} />
                        {pendingLeads} solicitud{pendingLeads > 1 ? 'es' : ''}
                    </span>
                )}
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
                <style jsx>{`
                    @keyframes pulse-dot {
                        0%, 100% { opacity: 1; transform: scale(1); }
                        50%       { opacity: 0.5; transform: scale(1.35); }
                    }
                `}</style>
            </>
        ),
        pendings: (
            <>
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
            </>
        ),
        projects: (
            <>
                <div style={{ background: '#f0fdf4', borderRadius: '50%', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      <line x1="12" y1="11" x2="12" y2="17" />
                      <line x1="9" y1="14" x2="15" y2="14" />
                    </svg>
                </div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#101828' }}>Documentación de Proyectos</h2>
                <p style={{ color: '#667085', fontSize: '0.95rem' }}>Archivos, planos y adjuntos de cotizaciones aprobadas.</p>
            </>
        ),
        contabilidad: (
            <>
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
            </>
        ),
        logistica: (
            <>
                <div style={{ background: '#f5f3ff', borderRadius: '50%', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 17H5a2 2 0 0 0-2 2 2 2 0 0 0 2 2h4"></path>
                        <rect x="1" y="3" width="15" height="13" rx="1"></rect>
                        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                        <circle cx="5.5" cy="18.5" r="2.5"></circle>
                        <circle cx="18.5" cy="18.5" r="2.5"></circle>
                    </svg>
                </div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#101828' }}>Asistente Logístico</h2>
                <p style={{ color: '#667085', fontSize: '0.95rem' }}>Compara cotizaciones de proveedores contra tus requerimientos.</p>
            </>
        ),
        suppliers: (
            <>
                <div style={{ background: '#fdf4ff', borderRadius: '50%', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d946ef" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                </div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#101828' }}>Mis Proveedores</h2>
                <p style={{ color: '#667085', fontSize: '0.95rem' }}>Directorio de proveedores, rubros y contactos clave.</p>
            </>
        ),
        team: (
            <>
                <div style={{ background: '#f0f9ff', borderRadius: '50%', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                </div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#101828' }}>Mi Equipo</h2>
                <p style={{ color: '#667085', fontSize: '0.95rem' }}>Directorio de personal, encargados y roles de la empresa.</p>
            </>
        ),
        clients: (
            <>
                <div style={{ background: '#eff6ff', borderRadius: '50%', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="7" r="4"></circle><path d="M5 22v-2a7 7 0 0 1 14 0v2"></path>
                    </svg>
                </div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#101828' }}>Mis Clientes (CRM)</h2>
                <p style={{ color: '#667085', fontSize: '0.95rem' }}>Directorio de clientes, contactos y empresas.</p>
            </>
        ),
        loans: (
            <>
                <div style={{ background: '#f0f9ff', borderRadius: '50%', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                </div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#101828' }}>Préstamos</h2>
                <p style={{ color: '#667085', fontSize: '0.95rem' }}>Control de líneas de crédito y capital.</p>
            </>
        ),
        inventory: (
            <>
                <div style={{ background: '#fef2f2', borderRadius: '50%', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                        <line x1="12" y1="22.08" x2="12" y2="12"></line>
                    </svg>
                </div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#101828' }}>Mi Inventario</h2>
                <p style={{ color: '#667085', fontSize: '0.95rem' }}>Control de stock, ingresos, salidas y materiales.</p>
            </>
        ),
        "caja-chica": (
            <>
                <div style={{ background: '#fef3c7', borderRadius: '50%', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                </div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#101828' }}>Caja Chica</h2>
                <p style={{ color: '#667085', fontSize: '0.95rem' }}>Gestión de gastos operativos, consumibles y compras generales.</p>
            </>
        )
    };

    return (
        <ProtectedRoute>
            <NavBar />
            <main className="container" style={{ maxWidth: '1500px' }}>
                <div className="dashboard-header">
                    <div className="dashboard-title-area">
                        <h1>CGO-Pymes</h1>
                        <p>Centro de Gestión Operativa para la Pequeña y Mediana Empresa</p>
                    </div>
                </div>

                <div className="content-frame main-content-frame">
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem', textAlign: 'right' }}>
                        💡 Mantén presionado y arrastra para reordenar las tarjetas
                    </p>
                    <div className="grid-list" style={{ gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
                        {cardOrder.filter(cardId => {
                            if (!user) return false;
                            if (user.role === 'admin') return true;
                            const allowedModules = user.modules || [];
                            return allowedModules.includes(cardId);
                        }).map((cardId, index) => {
                            if (!cardsMap[cardId]) return null;
                            const isDragging = draggedItemIndex === index;
                            const isDragOver = dragOverItemIndex === index;

                            return (
                                <div
                                    key={cardId}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragEnter={() => handleDragEnter(index)}
                                    onDragEnd={handleDragEnd}
                                    onDragOver={(e) => e.preventDefault()}
                                    className={`card ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                                    style={{ 
                                        cursor: 'grab', 
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '3rem 2rem', position: 'relative',
                                        opacity: isDragging ? 0.4 : 1,
                                        transform: isDragOver ? 'scale(1.03)' : 'scale(1)',
                                        border: isDragOver ? '2px dashed #3b82f6' : '1px solid #e2e8f0',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                    onClick={() => router.push(`/${cardId}`)}
                                >
                                    {cardsMap[cardId]}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>
        </ProtectedRoute>
    )
}
