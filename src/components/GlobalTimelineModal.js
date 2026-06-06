import React from 'react';

export function GlobalTimelineModal({ quotations, onClose }) {
    // 1. Filtrar los proyectos que no estén "completados" y que tengan tareas
    const activeQuotations = quotations.filter(q => q.quotationStatus !== 'completado');
    const projectsWithTasks = activeQuotations.filter(q => q.operationsData?.tasks?.length > 0);

    // 2. Extraer todas las tareas con fechas para hallar los límites del Gantt Maestro
    const allTasksWithDates = projectsWithTasks.flatMap(q => 
        (q.operationsData.tasks).filter(t => t.startDate && t.endDate)
    );

    let minTime = null;
    let maxTime = null;
    let totalMs = 0;

    if (allTasksWithDates.length > 0) {
        minTime = Math.min(...allTasksWithDates.map(t => new Date(`${t.startDate}T00:00:00`).getTime()));
        maxTime = Math.max(...allTasksWithDates.map(t => new Date(`${t.endDate}T23:59:59`).getTime()));
        totalMs = maxTime - minTime;
    }
    
    // Fallback: Si todas las tareas ocurren en el mismo día, damos un margen para que no se divida por cero
    if (totalMs === 0) totalMs = 86400000; // 1 día

    // Padding de 5% a cada lado para que las barras no choquen con los bordes
    const paddedTotalMs = totalMs * 1.1; 
    const paddedMinTime = minTime - (totalMs * 0.05);

    // Formateadores
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}`;
    };

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '2rem' }}>
            <div style={{ background: '#ffffff', borderRadius: '12px', width: '95vw', maxWidth: '1400px', height: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden', animation: 'fadeIn 0.2s ease-out' }}>
                
                {/* Cabecera */}
                <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a', fontWeight: '700' }}>Cronograma General de Proyectos</h2>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', marginTop: '0.2rem' }}>Vista unificada de todas las tareas activas para detección de solapamientos</p>
                    </div>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color='#0f172a'} onMouseLeave={e => e.target.style.color='#94a3b8'}>✕</button>
                </div>

                {/* Contenedor del Gantt */}
                <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {projectsWithTasks.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem', display: 'block', color: '#cbd5e1' }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            <h3 style={{ fontSize: '1.2rem', color: '#0f172a', margin: '0 0 0.5rem 0' }}>No hay proyectos activos</h3>
                            <p style={{ margin: 0 }}>No se han encontrado proyectos con tareas programadas.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            
                            {/* Eje de tiempo global (Opcional, si hay fechas) */}
                            {allTasksWithDates.length > 0 && (
                                <div style={{ display: 'flex', paddingLeft: '220px', paddingRight: '120px', marginBottom: '-1rem' }}>
                                    <div style={{ flex: 1, position: 'relative', height: '20px', borderBottom: '1px solid #cbd5e1' }}>
                                        <div style={{ position: 'absolute', left: '5%', bottom: '4px', fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold' }}>INICIO MÍNIMO</div>
                                        <div style={{ position: 'absolute', right: '5%', bottom: '4px', fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold' }}>FIN MÁXIMO</div>
                                    </div>
                                </div>
                            )}

                            {projectsWithTasks.map(q => {
                                const tasks = q.operationsData.tasks;
                                const completedTasks = tasks.filter(t => t.status === 'completed').length;
                                const pct = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

                                return (
                                    <div key={q.id} style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
                                        {/* Header del Proyecto */}
                                        <div style={{ padding: '1rem 1.5rem', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: '700' }}>{q.code} - {q.clientName}</h3>
                                                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>{tasks.length} tareas totales</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: pct === 100 ? '#10b981' : '#3b82f6' }}>{pct}% Avance</span>
                                            </div>
                                        </div>

                                        {/* Lista de Tareas del Proyecto */}
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            {tasks.map((t, idx) => {
                                                let leftPct = 0;
                                                let widthPct = 100;
                                                let hasDates = !!(t.startDate && t.endDate);

                                                if (hasDates && paddedTotalMs > 0) {
                                                    const startMs = new Date(`${t.startDate}T00:00:00`).getTime();
                                                    const endMs = new Date(`${t.endDate}T23:59:59`).getTime();
                                                    
                                                    leftPct = ((startMs - paddedMinTime) / paddedTotalMs) * 100;
                                                    widthPct = Math.max(1, ((endMs - startMs) / paddedTotalMs) * 100);
                                                }

                                                return (
                                                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1.5rem', borderBottom: idx < tasks.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                                        
                                                        {/* Nombre Tarea */}
                                                        <div style={{ width: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#334155', fontSize: '0.85rem', fontWeight: '500', flexShrink: 0 }} title={t.title}>
                                                            {t.title}
                                                        </div>

                                                        {/* Gantt Bar Area */}
                                                        <div style={{ flex: 1, height: '32px', background: 'transparent', position: 'relative', borderRadius: '4px' }}>
                                                            {/* Grid lines background (Optional visual enhancement) */}
                                                            <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'space-between' }}>
                                                                {[...Array(5)].map((_, i) => (
                                                                    <div key={i} style={{ width: '1px', background: '#f1f5f9', height: '100%' }} />
                                                                ))}
                                                            </div>

                                                            {hasDates ? (
                                                                <div style={{ 
                                                                    position: 'absolute', 
                                                                    top: '2px', bottom: '2px',
                                                                    left: `${Math.max(0, leftPct)}%`, 
                                                                    width: `${Math.min(100 - leftPct, widthPct)}%`,
                                                                    background: t.status === 'completed' ? '#10b981' : t.status === 'progress' ? '#3b82f6' : '#94a3b8', 
                                                                    borderRadius: '4px',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    color: '#fff', fontSize: '0.7rem', fontWeight: '700',
                                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                                                    minWidth: '40px',
                                                                    overflow: 'hidden',
                                                                    whiteSpace: 'nowrap'
                                                                }} title={`${formatDate(t.startDate)} - ${formatDate(t.endDate)}`}>
                                                                    {widthPct > 5 ? `${formatDate(t.startDate)} - ${formatDate(t.endDate)}` : ''}
                                                                </div>
                                                            ) : (
                                                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', color: '#cbd5e1', fontSize: '0.75rem', fontStyle: 'italic', paddingLeft: '0.5rem' }}>
                                                                    Sin programar
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Status Label */}
                                                        <div style={{ width: '100px', textAlign: 'right', fontSize: '0.75rem', fontWeight: '700', flexShrink: 0, color: t.status === 'completed' ? '#10b981' : t.status === 'progress' ? '#3b82f6' : '#94a3b8' }}>
                                                            {t.status === 'completed' ? 'COMPLETADO' : t.status === 'progress' ? 'EN PROGRESO' : 'PENDIENTE'}
                                                        </div>

                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
