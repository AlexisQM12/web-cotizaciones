import React, { useRef, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function GlobalTimelineModal({ quotations, onClose }) {
    const scrollRef = useRef(null);
    const { user } = useAuth();
    const [teamMembers, setTeamMembers] = useState([]);

    useEffect(() => {
        fetch(`/api/team?empresaId=${user?.empresaId || ''}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setTeamMembers(data);
            })
            .catch(err => console.error('Error fetching team', err));
    }, [user]);

    const nowMs = Date.now();

    // 1. Filtrar proyectos activos con tareas
    const activeQuotations = quotations.filter(q => q.quotationStatus !== 'completado');
    const projectsWithTasks = activeQuotations.filter(q => q.operationsData?.tasks?.length > 0);

    let minTime = null;
    let maxTime = null;

    // Fechas explícitas de proyectos
    projectsWithTasks.forEach(q => {
        if (q.operationsData.projectStartDate) {
            const start = new Date(`${q.operationsData.projectStartDate}T00:00:00`).getTime();
            if (!minTime || start < minTime) minTime = start;
        }
        if (q.operationsData.projectEndDate) {
            const end = new Date(`${q.operationsData.projectEndDate}T23:59:59`).getTime();
            if (!maxTime || end > maxTime) maxTime = end;
        }
    });

    // Fechas de tareas
    const allTasksWithDates = projectsWithTasks.flatMap(q => 
        (q.operationsData.tasks || []).filter(t => t.startDate && t.endDate)
    );
    if (allTasksWithDates.length > 0) {
        const minTasks = Math.min(...allTasksWithDates.map(t => new Date(`${t.startDate}T00:00:00`).getTime()));
        const maxTasks = Math.max(...allTasksWithDates.map(t => new Date(`${t.endDate}T23:59:59`).getTime()));
        if (!minTime || minTasks < minTime) minTime = minTasks;
        if (!maxTime || maxTasks > maxTime) maxTime = maxTasks;
    }

    // Asegurar que "HOY" está dentro del gráfico para poder dibujar la línea y scrollear a ella
    if (!minTime || nowMs < minTime) minTime = nowMs;
    if (!maxTime || nowMs > maxTime) maxTime = nowMs;

    // Alinear minTime al Lunes
    const minDate = new Date(minTime);
    const minDay = minDate.getDay(); 
    const diffToMonday = minDay === 0 ? -6 : 1 - minDay;
    minDate.setDate(minDate.getDate() + diffToMonday);
    minDate.setHours(0,0,0,0);
    const gridStartMs = minDate.getTime();

    // Alinear maxTime al Domingo
    const maxDate = new Date(maxTime);
    const maxDay = maxDate.getDay();
    const diffToSunday = maxDay === 0 ? 0 : 7 - maxDay;
    maxDate.setDate(maxDate.getDate() + diffToSunday);
    maxDate.setHours(23,59,59,999);
    let gridEndMs = maxDate.getTime();

    // Asegurar que abarque mínimo un mes (30 días aprox = 4.2 semanas, redondeamos a 5 semanas)
    const MIN_SPAN_MS = 35 * 24 * 60 * 60 * 1000;
    if (gridEndMs - gridStartMs < MIN_SPAN_MS) {
        gridEndMs = gridStartMs + MIN_SPAN_MS;
    }

    const totalMs = gridEndMs - gridStartMs;
    const totalDays = Math.ceil(totalMs / (24 * 60 * 60 * 1000));
    const totalWeeks = Math.ceil(totalDays / 7);

    // 1 mes = 30 días = 100% del viewport
    const viewportDays = 30;
    const ganttWidthPct = Math.max(100, (totalDays / viewportDays) * 100);

    const nowLeftPct = ((nowMs - gridStartMs) / totalMs) * 100;

    useEffect(() => {
        // Auto scroll to current day when modal opens
        if (scrollRef.current) {
            // we want the red line to be roughly in the middle of the screen
            const containerWidth = scrollRef.current.clientWidth;
            const scrollWidth = scrollRef.current.scrollWidth;
            
            // Left sticky columns take 220px. Right takes 100px.
            // But we just use proportion over the scrollable area.
            const targetScroll = (scrollWidth * (nowLeftPct / 100)) - (containerWidth / 2);
            scrollRef.current.scrollLeft = Math.max(0, targetScroll);
        }
    }, [nowLeftPct]);

    // Generar semanas para la cabecera/fondo
    const weeks = [];
    for(let i = 0; i < totalWeeks; i++) {
        const wStart = new Date(gridStartMs + i * 7 * 24 * 60 * 60 * 1000);
        weeks.push({
            label: `${wStart.getDate().toString().padStart(2, '0')}/${(wStart.getMonth()+1).toString().padStart(2, '0')}`,
            leftPct: (i / totalWeeks) * 100,
            widthPct: (1 / totalWeeks) * 100
        });
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}`;
    };

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '2rem' }}>
            <div style={{ background: '#ffffff', borderRadius: '12px', width: '95vw', maxWidth: '1600px', height: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden', animation: 'fadeIn 0.2s ease-out' }}>
                
                {/* Cabecera */}
                <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a', fontWeight: '700' }}>Cronograma General de Proyectos</h2>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', marginTop: '0.2rem' }}>Vista unificada en tiempo real de todas las tareas activas</p>
                    </div>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color='#0f172a'} onMouseLeave={e => e.target.style.color='#94a3b8'}>✕</button>
                </div>

                {/* Contenedor Principal (Scrollable General) */}
                <div style={{ flex: 1, overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
                    
                    {projectsWithTasks.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem', display: 'block', color: '#cbd5e1' }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            <h3 style={{ fontSize: '1.2rem', color: '#0f172a', margin: '0 0 0.5rem 0' }}>No hay proyectos activos</h3>
                            <p style={{ margin: 0 }}>No se han encontrado proyectos con tareas programadas.</p>
                        </div>
                    ) : (
                        <div ref={scrollRef} style={{ flex: 1, overflowX: 'auto', display: 'flex', flexDirection: 'column' }}>
                            {/* Inner Wrapper que expande el Gantt */}
                            <div style={{ minWidth: `calc(320px + ${ganttWidthPct}%)`, flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                                
                                {/* Header de Semanas (Sticky Top) */}
                                <div style={{ display: 'flex', position: 'sticky', top: 0, zIndex: 30, background: '#fff', borderBottom: '1px solid #cbd5e1', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                    <div style={{ width: '220px', flexShrink: 0, position: 'sticky', left: 0, background: '#fff', zIndex: 40, borderRight: '1px solid #e2e8f0', padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', display: 'flex', alignItems: 'center' }}>
                                        TAREAS
                                    </div>
                                    <div style={{ flex: 1, position: 'relative', height: '36px' }}>
                                        {weeks.map((w, i) => (
                                            <div key={i} style={{ position: 'absolute', left: `${w.leftPct}%`, width: `${w.widthPct}%`, top: 0, bottom: 0, borderRight: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold', background: i % 2 === 0 ? '#f8fafc' : '#ffffff' }}>
                                                Sem {w.label}
                                            </div>
                                        ))}
                                        {/* Indicador HOY (Header) */}
                                        <div style={{ position: 'absolute', left: `${nowLeftPct}%`, top: 0, bottom: 0, width: '2px', background: '#ef4444', zIndex: 50 }}>
                                            <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', background: '#ef4444', color: '#fff', padding: '2px 6px', borderRadius: '0 0 4px 4px', fontSize: '0.6rem', fontWeight: 'bold' }}>HOY</div>
                                        </div>
                                    </div>
                                    <div style={{ width: '100px', flexShrink: 0, position: 'sticky', right: 0, background: '#fff', zIndex: 40, borderLeft: '1px solid #e2e8f0', padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                        ESTADO
                                    </div>
                                </div>

                                {/* Body del Gantt (Proyectos) */}
                                <div style={{ flex: 1, position: 'relative' }}>
                                    {/* Grid de Semanas (Fondo Completo) */}
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', pointerEvents: 'none' }}>
                                        <div style={{ width: '220px', flexShrink: 0 }}></div>
                                        <div style={{ flex: 1, position: 'relative' }}>
                                            {weeks.map((w, i) => (
                                                <div key={i} style={{ position: 'absolute', left: `${w.leftPct}%`, width: `${w.widthPct}%`, top: 0, bottom: 0, borderRight: '1px solid #e2e8f0', background: i % 2 === 0 ? 'rgba(241, 245, 249, 0.4)' : 'transparent' }} />
                                            ))}
                                            {/* Línea HOY */}
                                            <div style={{ position: 'absolute', left: `${nowLeftPct}%`, top: 0, bottom: 0, width: '2px', background: 'rgba(239, 68, 68, 0.5)', zIndex: 10 }} />
                                        </div>
                                        <div style={{ width: '100px', flexShrink: 0 }}></div>
                                    </div>

                                    {/* Proyectos y Tareas */}
                                    <div style={{ position: 'relative', zIndex: 5 }}>
                                        {projectsWithTasks.map(q => {
                                            const tasks = q.operationsData.tasks;
                                            const completedTasks = tasks.filter(t => t.status === 'completed').length;
                                            const pct = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

                                            return (
                                                <div key={q.id} style={{ marginBottom: '2rem' }}>
                                                    {/* Row del Header del Proyecto */}
                                                    <div style={{ display: 'flex', background: '#f1f5f9', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', position: 'sticky', left: 0, width: '100%', zIndex: 20 }}>
                                                        <div style={{ padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1, position: 'sticky', left: 0, maxWidth: 'calc(100vw - 4rem)' }}>
                                                            <div>
                                                                <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#0f172a', fontWeight: '700' }}>{q.code} - {q.clientName}</h3>
                                                                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>{tasks.length} tareas totales</span>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: pct === 100 ? '#10b981' : '#3b82f6' }}>{pct}% Avance</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Rows de las Tareas */}
                                                    {tasks.map((t, idx) => {
                                                        let leftPct = 0;
                                                        let widthPct = 0;
                                                        let hasDates = !!(t.startDate && t.endDate);

                                                        if (hasDates) {
                                                            const startMs = new Date(`${t.startDate}T00:00:00`).getTime();
                                                            const endMs = new Date(`${t.endDate}T23:59:59`).getTime();
                                                            
                                                            leftPct = ((startMs - gridStartMs) / totalMs) * 100;
                                                            widthPct = Math.max(0.5, ((endMs - startMs) / totalMs) * 100);
                                                        }

                                                        const tAssigneeIds = t.assigneeIds || (t.assigneeId ? [t.assigneeId] : []);
                                                        const taskAssignees = tAssigneeIds.map(id => teamMembers.find(a => a.id === id)).filter(Boolean);
                                                        const firstAssigneeColor = taskAssignees.length > 0 ? taskAssignees[0].color : null;
                                                        const isCompleted = t.status === 'completed';
                                                        const barColor = firstAssigneeColor || (isCompleted ? '#10b981' : t.status === 'progress' ? '#3b82f6' : '#94a3b8');

                                                        return (
                                                            <div key={t.id} style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', background: '#fff' }}>
                                                                
                                                                {/* Nombre Tarea (Sticky Izquierda) */}
                                                                <div style={{ width: '220px', flexShrink: 0, position: 'sticky', left: 0, background: '#fff', zIndex: 10, padding: '0.75rem 1rem', borderRight: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                                    <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                                                                        {taskAssignees.map(a => (
                                                                            <div key={a.id} style={{ width: '8px', height: '8px', borderRadius: '50%', background: a.color || '#ccc' }} title={a.name}></div>
                                                                        ))}
                                                                    </div>
                                                                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#334155', fontSize: '0.8rem', fontWeight: '500' }} title={t.title}>
                                                                        {t.title}
                                                                    </div>
                                                                </div>

                                                                {/* Área de Barra Gantt */}
                                                                <div style={{ flex: 1, position: 'relative', height: '40px', display: 'flex', alignItems: 'center' }}>
                                                                    {hasDates && (
                                                                        <div style={{ 
                                                                            position: 'absolute', 
                                                                            left: `${Math.max(0, leftPct)}%`, 
                                                                            width: `${Math.min(100 - leftPct, widthPct)}%`,
                                                                            height: '24px',
                                                                            background: barColor, 
                                                                            opacity: isCompleted ? 0.6 : 1,
                                                                            borderRadius: '4px',
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                            color: '#fff', fontSize: '0.65rem', fontWeight: '700',
                                                                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                                                            minWidth: '40px',
                                                                            overflow: 'hidden',
                                                                            whiteSpace: 'nowrap'
                                                                        }} title={`${formatDate(t.startDate)} - ${formatDate(t.endDate)}`}>
                                                                            {isCompleted && <span style={{ marginRight: '0.3rem' }}>✓</span>}
                                                                            {widthPct > 2 ? `${formatDate(t.startDate)} - ${formatDate(t.endDate)}` : ''}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Status (Sticky Derecha) */}
                                                                <div style={{ width: '100px', flexShrink: 0, position: 'sticky', right: 0, background: '#fff', zIndex: 10, borderLeft: '1px solid #e2e8f0', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: '0.7rem', fontWeight: '700', color: t.status === 'completed' ? '#10b981' : t.status === 'progress' ? '#3b82f6' : '#94a3b8' }}>
                                                                    {t.status === 'completed' ? 'COMPLETO' : t.status === 'progress' ? 'PROGRESO' : 'PENDIENTE'}
                                                                </div>

                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
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

