'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { NavBar } from '@/components/NavBar'
import { PendingsModal } from '@/components/PendingsModal'
import { GlobalTimelineModal } from '@/components/GlobalTimelineModal'

export default function PendingsDashboard() {
    const [allQuotations, setAllQuotations] = useState([])
    const [quotations, setQuotations] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedQuotation, setSelectedQuotation] = useState(null)
    const [showAddModal, setShowAddModal] = useState(false)
    const [showGlobalTimeline, setShowGlobalTimeline] = useState(false)
    const [activeTab, setActiveTab] = useState('en_proceso')
    const router = useRouter()

    useEffect(() => {
        fetch('/api/quotations')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setAllQuotations(data);
                    // Filter those with OC or pending OC
                    const filtered = data.filter(q => ['aprobada', 'completado', 'pendiente_oc', 'pendiente_factura'].includes(q.quotationStatus));
                    
                    const getPriorityVal = (p) => p === 'alta' ? 3 : p === 'baja' ? 1 : 2;

                    // Sort so 'completado' appears at the end, then by priority, then newest first
                    filtered.sort((a, b) => {
                        if ((a.quotationStatus === 'completado' || a.quotationStatus === 'pendiente_factura') && (b.quotationStatus !== 'completado' && b.quotationStatus !== 'pendiente_factura')) return 1;
                        if ((a.quotationStatus !== 'completado' && a.quotationStatus !== 'pendiente_factura') && (b.quotationStatus === 'completado' || b.quotationStatus === 'pendiente_factura')) return -1;
                        
                        const pA = getPriorityVal(a.priority);
                        const pB = getPriorityVal(b.priority);
                        if (pA !== pB) return pB - pA;

                        return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
                    });

                    setQuotations(filtered);
                }
                setLoading(false);
            })
            .catch(console.error);
    }, []);

    const handleSaveOperations = async (id, operationsData) => {
        try {
            await fetch(`/api/quotations/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ operationsData })
            });
            setQuotations(prev => prev.map(q => q.id === id ? { ...q, operationsData } : q));
            setSelectedQuotation(prev => prev && prev.id === id ? { ...prev, operationsData } : prev);
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const handleUpdatePriority = async (id, newPriority) => {
        try {
            await fetch(`/api/quotations/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priority: newPriority })
            });
            setQuotations(prev => {
                const updated = prev.map(q => q.id === id ? { ...q, priority: newPriority } : q);
                const getPriorityVal = (p) => p === 'alta' ? 3 : p === 'baja' ? 1 : 2;
                updated.sort((a, b) => {
                    if ((a.quotationStatus === 'completado' || a.quotationStatus === 'pendiente_factura') && (b.quotationStatus !== 'completado' && b.quotationStatus !== 'pendiente_factura')) return 1;
                    if ((a.quotationStatus !== 'completado' && a.quotationStatus !== 'pendiente_factura') && (b.quotationStatus === 'completado' || b.quotationStatus === 'pendiente_factura')) return -1;
                    const pA = getPriorityVal(a.priority);
                    const pB = getPriorityVal(b.priority);
                    if (pA !== pB) return pB - pA;
                    return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
                });
                return updated;
            });
        } catch (err) {
            console.error(err);
        }
    };

    const handleSendToPendings = async (id) => {
        try {
            await fetch(`/api/quotations/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quotationStatus: 'pendiente_oc' })
            });
            const updatedAll = allQuotations.map(q => q.id === id ? { ...q, quotationStatus: 'pendiente_oc' } : q);
            setAllQuotations(updatedAll);
            
            const filtered = updatedAll.filter(q => ['aprobada', 'completado', 'pendiente_oc', 'pendiente_factura'].includes(q.quotationStatus));
            const getPriorityVal = (p) => p === 'alta' ? 3 : p === 'baja' ? 1 : 2;
            filtered.sort((a, b) => {
                if ((a.quotationStatus === 'completado' || a.quotationStatus === 'pendiente_factura') && (b.quotationStatus !== 'completado' && b.quotationStatus !== 'pendiente_factura')) return 1;
                if ((a.quotationStatus !== 'completado' && a.quotationStatus !== 'pendiente_factura') && (b.quotationStatus === 'completado' || b.quotationStatus === 'pendiente_factura')) return -1;
                const pA = getPriorityVal(a.priority);
                const pB = getPriorityVal(b.priority);
                if (pA !== pB) return pB - pA;
                return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
            });
            setQuotations(filtered);
            setShowAddModal(false);
        } catch (err) {
            console.error(err);
        }
    };

    const handleMarkAsCompletedManual = async (id) => {
        if (!window.confirm("¿Estás seguro de que deseas completar este proyecto de forma manual? Se marcará como 'Pendiente Factura'.")) {
            return;
        }
        
        try {
            await fetch(`/api/quotations/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quotationStatus: 'pendiente_factura' })
            });
            
            const updatedAll = allQuotations.map(q => q.id === id ? { ...q, quotationStatus: 'pendiente_factura' } : q);
            setAllQuotations(updatedAll);
            
            const filtered = updatedAll.filter(q => ['aprobada', 'completado', 'pendiente_oc', 'pendiente_factura'].includes(q.quotationStatus));
            const getPriorityVal = (p) => p === 'alta' ? 3 : p === 'baja' ? 1 : 2;
            filtered.sort((a, b) => {
                if ((a.quotationStatus === 'completado' || a.quotationStatus === 'pendiente_factura') && (b.quotationStatus !== 'completado' && b.quotationStatus !== 'pendiente_factura')) return 1;
                if ((a.quotationStatus !== 'completado' && a.quotationStatus !== 'pendiente_factura') && (b.quotationStatus === 'completado' || b.quotationStatus === 'pendiente_factura')) return -1;
                const pA = getPriorityVal(a.priority);
                const pB = getPriorityVal(b.priority);
                if (pA !== pB) return pB - pA;
                return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
            });
            setQuotations(filtered);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <ProtectedRoute allowedModule="pendings">
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
                            <h1 style={{ lineHeight: '1.2' }}>Mis Pendientes</h1>
                            <p>Órdenes de compra recibidas listas para ejecución operativa.</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button 
                            onClick={() => setShowGlobalTimeline(true)}
                            style={{ background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            Ver Cronograma General
                        </button>
                        <button 
                            onClick={() => setShowAddModal(true)}
                            style={{ background: '#ea580c', color: 'white', border: 'none', padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 2px 4px rgba(234, 88, 12, 0.2)' }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            Añadir Cotización sin OC
                        </button>
                    </div>
                </div>

                <div style={{ marginTop: '1rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                    <div className="container" style={{ display: 'flex', gap: '2rem' }}>
                        <button 
                            onClick={() => setActiveTab('en_proceso')}
                            style={{ background: 'none', border: 'none', borderBottom: activeTab === 'en_proceso' ? '2px solid #ea580c' : '2px solid transparent', color: activeTab === 'en_proceso' ? '#ea580c' : '#64748b', padding: '0.8rem 0', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                            En proceso
                        </button>
                        <button 
                            onClick={() => setActiveTab('completadas')}
                            style={{ background: 'none', border: 'none', borderBottom: activeTab === 'completadas' ? '2px solid #10b981' : '2px solid transparent', color: activeTab === 'completadas' ? '#10b981' : '#64748b', padding: '0.8rem 0', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                            Completadas
                        </button>
                    </div>
                </div>

                <div className="content-frame main-content-frame">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#101828' }}>Cargando pendientes...</div>
                    ) : (() => {
                        const isCompletedStatus = (s) => s === 'completado' || s === 'pendiente_factura';
                        const filteredQuotations = quotations.filter(q => activeTab === 'completadas' ? isCompletedStatus(q.quotationStatus) : !isCompletedStatus(q.quotationStatus));

                        if (filteredQuotations.length === 0) {
                            return (
                                <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#64748b' }}>
                                    <h3 style={{ fontSize: '1.5rem', color: '#101828', marginBottom: '1rem' }}>No hay pendientes</h3>
                                    <p>No se encontraron cotizaciones en esta pestaña.</p>
                                </div>
                            );
                        }

                        return (
                            <div className="grid-list">
                                {filteredQuotations.map(q => {
                                    const ops = q.operationsData || { tasks: [], materials: [] };
                                
                                const totalMaterials = ops.materials.length;
                                const completedMaterials = ops.materials.filter(m => m.purchased).length;
                                const materialsPct = totalMaterials === 0 ? 0 : Math.round((completedMaterials / totalMaterials) * 100);

                                const totalTasks = ops.tasks.length;
                                const completedTasks = ops.tasks.filter(t => t.completed).length;
                                const tasksPct = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

                                const overallTotal = totalMaterials + totalTasks;
                                const overallCompleted = completedMaterials + completedTasks;
                                const overallPct = overallTotal === 0 ? 0 : Math.round((overallCompleted / overallTotal) * 100);

                                const totalSpent = ops.materials.reduce((sum, m) => sum + (parseFloat(m.cost) || 0), 0);

                                return (
                                    <div key={q.id} className="card" style={{ padding: '2rem', border: '1px solid #f1f5f9' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                                            <span style={{ fontWeight: '700', color: '#101828', fontSize: '0.9rem', letterSpacing: '0.05em' }}>
                                                {q.code || 'SIN CÓDIGO'}
                                            </span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <select 
                                                    value={q.priority || 'media'} 
                                                    onChange={(e) => handleUpdatePriority(q.id, e.target.value)}
                                                    style={{ border: '1px solid #e2e8f0', borderRadius: '6px', background: '#f8fafc', padding: '0.2rem', fontSize: '0.7rem', fontWeight: '600', color: '#475569', cursor: 'pointer', outline: 'none' }}
                                                >
                                                    <option value="alta">🔴 Alta</option>
                                                    <option value="media">🟡 Media</option>
                                                    <option value="baja">🟢 Baja</option>
                                                </select>
                                                {(() => {
                                                    const statusColors = {
                                                        'completado': { bg: '#f0fdf4', text: '#16a34a', label: 'Completada' },
                                                        'pendiente_factura': { bg: '#fef3c7', text: '#d97706', label: 'Pendiente Factura' },
                                                        'pendiente_oc': { bg: '#fff7ed', text: '#c2410c', label: 'Sin OC (En Op)' }
                                                    };
                                                    const qStatus = statusColors[q.quotationStatus] || { bg: '#eef2ff', text: '#4338ca', label: 'OC Recibida' };
                                                    return (
                                                        <span style={{ padding: '0.2rem 0.6rem', background: qStatus.bg, color: qStatus.text, borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                            {qStatus.label}
                                                        </span>
                                                    );
                                                })()}
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
                                            Recepción OC: {new Date(q.updatedAt).toLocaleDateString()}
                                        </p>

                                        <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                            {/* Barra de Materiales */}
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.3rem', color: '#64748b', fontWeight: '600' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>🛒 Compras de Materiales</span>
                                                    <span>{completedMaterials} de {totalMaterials} ({materialsPct}%)</span>
                                                </div>
                                                <div style={{ width: '100%', background: '#e2e8f0', borderRadius: '99px', height: '6px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${materialsPct}%`, background: materialsPct === 100 ? '#22c55e' : '#f59e0b', height: '100%', transition: 'width 0.3s' }} />
                                                </div>
                                            </div>
                                            
                                            {/* Barra de Tareas */}
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.3rem', color: '#64748b', fontWeight: '600' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>🛠️ Tareas y Servicios</span>
                                                    <span>{completedTasks} de {totalTasks} ({tasksPct}%)</span>
                                                </div>
                                                <div style={{ width: '100%', background: '#e2e8f0', borderRadius: '99px', height: '6px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${tasksPct}%`, background: tasksPct === 100 ? '#22c55e' : '#3b82f6', height: '100%', transition: 'width 0.3s' }} />
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>Total Cotizado</span>
                                                <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#101828' }}>S/ {Number(q.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>Total Gastado</span>
                                                <span style={{ fontSize: '1.2rem', fontWeight: '700', color: '#ea580c' }}>S/ {totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
                                            <button 
                                                className="btn btn-secondary" 
                                                style={{ flex: 1, justifyContent: 'center' }}
                                                onClick={() => setSelectedQuotation(q)}
                                            >
                                                {overallTotal === 0 ? '+ Iniciar Planificación' : 'Ver Materiales y Tareas'}
                                            </button>
                                            {q.quotationStatus !== 'completado' && q.quotationStatus !== 'pendiente_factura' && (
                                                <button 
                                                    onClick={() => handleMarkAsCompletedManual(q.id)}
                                                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', padding: '0 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', transition: 'all 0.2s' }}
                                                    title="Marcar como completado (Falta Factura)"
                                                >
                                                    ✓ Completar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        );
                    })()}
                </div>
            </main>

            {selectedQuotation && (
                <PendingsModal 
                    quotation={selectedQuotation} 
                    onClose={() => setSelectedQuotation(null)} 
                    onSave={(data) => handleSaveOperations(selectedQuotation.id, data)}
                />
            )}

            {showAddModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Añadir a Pendientes (Sin OC)</h3>
                            <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#64748b' }}>✕</button>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>Selecciona una cotización en curso para iniciar operaciones antes de recibir la Orden de Compra.</p>
                        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.5rem' }}>
                            {allQuotations.filter(q => q.code && !['aprobada', 'completado', 'pendiente_oc', 'pendiente_factura'].includes(q.quotationStatus)).map(q => (
                                <div key={q.id} style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                                    <div style={{ flex: 1, paddingRight: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#1e293b' }}>{q.code}</span>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#16a34a' }}>S/ {Number(q.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.2rem', fontWeight: '600' }}>{q.clientName || 'Sin cliente'}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {q.serviceDescription || 'Sin descripción del servicio'}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.3rem' }}>
                                            Generada: {new Date(q.createdAt || q.updatedAt || Date.now()).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleSendToPendings(q.id)}
                                        style={{ background: '#ea580c', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                        Iniciar
                                    </button>
                                </div>
                            ))}
                            {allQuotations.filter(q => q.code && !['aprobada', 'completado', 'pendiente_oc', 'pendiente_factura'].includes(q.quotationStatus)).length === 0 && (
                                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No hay cotizaciones disponibles para añadir.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showGlobalTimeline && (
                <GlobalTimelineModal 
                    quotations={quotations} 
                    onClose={() => setShowGlobalTimeline(false)} 
                />
            )}
        </ProtectedRoute>
    )
}
