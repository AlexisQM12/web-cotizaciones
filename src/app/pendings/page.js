'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { NavBar } from '@/components/NavBar'
import { PendingsModal } from '@/components/PendingsModal'

export default function PendingsDashboard() {
    const [allQuotations, setAllQuotations] = useState([])
    const [quotations, setQuotations] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedQuotation, setSelectedQuotation] = useState(null)
    const [showAddModal, setShowAddModal] = useState(false)
    const router = useRouter()

    useEffect(() => {
        fetch('/api/quotations')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setAllQuotations(data);
                    // Filter those with OC or pending OC
                    const filtered = data.filter(q => ['aprobada', 'completado', 'pendiente_oc'].includes(q.quotationStatus));
                    
                    const getPriorityVal = (p) => p === 'alta' ? 3 : p === 'baja' ? 1 : 2;

                    // Sort so 'completado' appears at the end, then by priority, then newest first
                    filtered.sort((a, b) => {
                        if (a.quotationStatus === 'completado' && b.quotationStatus !== 'completado') return 1;
                        if (a.quotationStatus !== 'completado' && b.quotationStatus === 'completado') return -1;
                        
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
        } catch (err) {
            console.error(err);
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
                    if (a.quotationStatus === 'completado' && b.quotationStatus !== 'completado') return 1;
                    if (a.quotationStatus !== 'completado' && b.quotationStatus === 'completado') return -1;
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
            
            const filtered = updatedAll.filter(q => ['aprobada', 'completado', 'pendiente_oc'].includes(q.quotationStatus));
            const getPriorityVal = (p) => p === 'alta' ? 3 : p === 'baja' ? 1 : 2;
            filtered.sort((a, b) => {
                if (a.quotationStatus === 'completado' && b.quotationStatus !== 'completado') return 1;
                if (a.quotationStatus !== 'completado' && b.quotationStatus === 'completado') return -1;
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

    return (
        <ProtectedRoute>
            <NavBar />
            <main className="container">
                <button onClick={() => router.push('/')} className="btn" style={{ marginBottom: '1.5rem', background: '#4b5563', color: 'white' }}>
                    ← Volver al Dashboard
                </button>
                <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div className="dashboard-title-area">
                        <h1>Mis Pendientes</h1>
                        <p>Órdenes de compra recibidas listas para ejecución operativa.</p>
                    </div>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        style={{ background: '#ea580c', color: 'white', border: 'none', padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 2px 4px rgba(234, 88, 12, 0.2)' }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Añadir Cotización sin OC
                    </button>
                </div>

                <div className="content-frame main-content-frame">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#101828' }}>Cargando pendientes...</div>
                    ) : quotations.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#64748b' }}>
                            <h3 style={{ fontSize: '1.5rem', color: '#101828', marginBottom: '1rem' }}>No hay pendientes</h3>
                            <p>No se encontraron órdenes de compra aprobadas en este momento.</p>
                        </div>
                    ) : (
                        <div className="grid-list">
                            {quotations.map(q => {
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
                                                <span style={{ padding: '0.2rem 0.6rem', background: q.quotationStatus === 'completado' ? '#f0fdf4' : q.quotationStatus === 'pendiente_oc' ? '#fff7ed' : '#eef2ff', color: q.quotationStatus === 'completado' ? '#16a34a' : q.quotationStatus === 'pendiente_oc' ? '#c2410c' : '#4338ca', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                    {q.quotationStatus === 'completado' ? 'Completada' : q.quotationStatus === 'pendiente_oc' ? 'Sin OC (En Op)' : 'OC Recibida'}
                                                </span>
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

                                        <button 
                                            className="btn btn-secondary" 
                                            style={{ marginTop: '1.25rem', width: '100%', justifyContent: 'center' }}
                                            onClick={() => setSelectedQuotation(q)}
                                        >
                                            {overallTotal === 0 ? '+ Iniciar Planificación' : 'Ver Materiales y Tareas'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
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
                            {allQuotations.filter(q => q.code && !['aprobada', 'completado', 'pendiente_oc'].includes(q.quotationStatus)).map(q => (
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
                            {allQuotations.filter(q => q.code && !['aprobada', 'completado', 'pendiente_oc'].includes(q.quotationStatus)).length === 0 && (
                                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No hay cotizaciones disponibles para añadir.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </ProtectedRoute>
    )
}
