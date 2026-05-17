'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { io } from 'socket.io-client'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { NavBar } from '@/components/NavBar'
import { QuotationDocument } from '@/components/QuotationDocument'
import { ScannerLogsModal } from '@/components/ScannerLogsModal'

export default function Dashboard() {
    const [quotations, setQuotations] = useState([])
    const [activeTab, setActiveTab] = useState('published') // 'published' or 'drafts'
    const [loading, setLoading] = useState(true)
    const [downloadingId, setDownloadingId] = useState(null)
    const [socketInstance, setSocketInstance] = useState(null)
    const [isScannerModalOpen, setIsScannerModalOpen] = useState(false)
    const [stageFilter, setStageFilter] = useState('todas')
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

    const toggleSent = async (id, current, e) => {
        e.stopPropagation();
        const isSent = !current;
        try {
            await fetch(`/api/quotations/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isSent })
            });
            setQuotations(prev => prev.map(q => q.id === id ? { ...q, isSent } : q));
        } catch (err) {
            console.error(err);
        }
    };

    const downloadPdf = async (q, e) => {
        e.stopPropagation();
        if (downloadingId) return;
        setDownloadingId(q.id);
        try {
            // Fetch full quotation data (includes company/client profiles)
            const res = await fetch(`/api/quotations/${q.id}`);
            const fullData = await res.json();

            // Build dataForPdf same as the editor does
            const company = fullData.companyProfiles?.find(p => String(p.id) === String(fullData.companyProfileId))
                || fullData.companyProfiles?.find(p => p.isDefault) || {};
            const client = fullData.clientProfiles?.find(p => String(p.id) === String(fullData.clientProfileId))
                || fullData.clientProfiles?.find(p => p.isDefault) || {};
            const items = fullData.items || [];
            const total = items.reduce((acc, item) => acc + (parseFloat(item.quantity || 0) * parseFloat(item.price || 0)), 0);

            const dataForPdf = {
                ...fullData,
                total,
                company,
                clientName: client.name || fullData.clientName || '',
                clientRuc: client.ruc || fullData.clientRuc || '',
                clientAddress: client.address || fullData.clientAddress || '',
                notes: fullData.notes !== undefined ? fullData.notes : (fullData.generalConditions?.text || '')
            };

            // Dynamically import pdf() to avoid SSR
            const { pdf } = await import('@react-pdf/renderer');
            const blob = await pdf(<QuotationDocument data={dataForPdf} />).toBlob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fullData.code || 'cotizacion'}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error downloading PDF:', err);
        } finally {
            setDownloadingId(null);
        }
    };

    useEffect(() => {
        fetch('/api/quotations')
            .then(res => {
                if (res.status === 401) {
                    router.push('/login');
                    return [];
                }
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setQuotations(data);
                } else {
                    console.error('API Error:', data.error);
                    setQuotations([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
            
        // Socket.io for Real-time Updates
        const newSocket = io();
        setSocketInstance(newSocket);
        
        newSocket.on('quotation_updated', (changes) => {
            if (changes.quotationStatus === 'aprobada' && changes.ocPdfUrl) {
                console.log(`📡 OC detectada automáticamente para cotización ${changes.id}`);
            }
            setQuotations(prev => prev.map(q =>
                String(q.id) === String(changes.id) ? { ...q, ...changes } : q
            ));
        });

        return () => newSocket.disconnect();
    }, [router]);

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

    const STAGES = [
        { key: 'todas',    label: 'Todas' },
        { key: 'emitida',  label: 'Sin enviar',    match: q => !q.isSent && q.quotationStatus !== 'aprobada' && q.quotationStatus !== 'completado' },
        { key: 'enviada',  label: 'Enviada',        match: q => q.isSent && q.quotationStatus !== 'aprobada' && q.quotationStatus !== 'completado' },
        { key: 'aprobada', label: 'OC Recibida',   match: q => q.quotationStatus === 'aprobada' },
        { key: 'completado', label: 'Facturada',   match: q => q.quotationStatus === 'completado' },
    ];

    const stageFiltered = stageFilter === 'todas'
        ? publishedQuotations
        : publishedQuotations.filter(STAGES.find(s => s.key === stageFilter)?.match || (() => true));

    const displayList = activeTab === 'published' ? stageFiltered : draftQuotations;

    return (
        <ProtectedRoute>
            <NavBar />
            <main className="container">
                <button onClick={() => router.push('/')} className="btn" style={{ marginBottom: '1.5rem', background: '#4b5563', color: 'white' }}>
                    ← Volver al Dashboard
                </button>
                <div className="dashboard-header">
                    <div className="dashboard-title-area">
                        <h1>Mis Cotizaciones</h1>
                        <p>Administra y crea nuevas propuestas profesionales.</p>
                    </div>
                    <div className="dashboard-actions">
                        <button className="btn btn-secondary" onClick={() => setIsScannerModalOpen(true)}>
                            📡 Lector O.C.
                        </button>
                        <button className="btn btn-secondary" onClick={() => router.push('/settings')}>
                            Configuración
                        </button>
                        <button className="btn btn-primary" onClick={createNewQuotation}>
                            Nueva Cotización
                        </button>
                    </div>
                </div>

                <ScannerLogsModal 
                    isOpen={isScannerModalOpen} 
                    onClose={() => setIsScannerModalOpen(false)} 
                    socket={socketInstance} 
                    quotations={quotations}
                />

                {/* Tabs */}
                <div className="dashboard-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'published' ? 'active' : ''}`}
                        onClick={() => setActiveTab('published')}
                    >
                        Cotizaciones ({publishedQuotations.length})
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'drafts' ? 'active' : ''}`}
                        onClick={() => setActiveTab('drafts')}
                    >
                        Borradores ({draftQuotations.length})
                    </button>
                </div>

                {/* Stage filter chips — solo para cotizaciones publicadas */}
                {activeTab === 'published' && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                        {STAGES.map(stage => {
                            const count = stage.key === 'todas'
                                ? publishedQuotations.length
                                : publishedQuotations.filter(stage.match).length;
                            const isActive = stageFilter === stage.key;
                            const colors = {
                                todas:      { active: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
                                emitida:    { active: '#64748b', bg: '#f8fafc', border: '#cbd5e1' },
                                enviada:    { active: '#0369a1', bg: '#e0f2fe', border: '#bae6fd' },
                                aprobada:   { active: '#4338ca', bg: '#eef2ff', border: '#c7d2fe' },
                                completado: { active: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
                            }[stage.key] || { active: '#64748b', bg: '#f8fafc', border: '#cbd5e1' };
                            return (
                                <button
                                    key={stage.key}
                                    onClick={() => setStageFilter(stage.key)}
                                    style={{
                                        padding: '0.4rem 1rem',
                                        borderRadius: '999px',
                                        border: `1.5px solid ${isActive ? colors.active : colors.border}`,
                                        background: isActive ? colors.active : colors.bg,
                                        color: isActive ? 'white' : colors.active,
                                        fontWeight: '600',
                                        fontSize: '0.8rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                    }}
                                >
                                    {stage.label}
                                    <span style={{
                                        background: isActive ? 'rgba(255,255,255,0.25)' : colors.active,
                                        color: isActive ? 'white' : 'white',
                                        borderRadius: '999px',
                                        padding: '0.05rem 0.45rem',
                                        fontSize: '0.7rem',
                                        fontWeight: '700',
                                        minWidth: 20,
                                        textAlign: 'center',
                                    }}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}

                <div className="content-frame main-content-frame">
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
                                                        backgroundColor: (q.quotationStatus || 'pendiente') === 'completado' ? '#dcfce7' : (q.quotationStatus || 'pendiente') === 'aprobada' ? '#e0e7ff' : '#fef9c3',
                                                        color: (q.quotationStatus || 'pendiente') === 'completado' ? '#16a34a' : (q.quotationStatus || 'pendiente') === 'aprobada' ? '#4338ca' : '#a16207',
                                                        border: `1px solid ${(q.quotationStatus || 'pendiente') === 'completado' ? '#bbf7d0' : (q.quotationStatus || 'pendiente') === 'aprobada' ? '#c7d2fe' : '#fde68a'}`,
                                                        borderRadius: '20px',
                                                        padding: '0.2rem 0.75rem',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '600',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <option value="aprobada">🚀 OC Recibida</option>
                                                    <option value="completado">✓ Completado</option>
                                                    <option value="pendiente">⏳ Pendiente</option>
                                                </select>
                                            </div>
                                            {q.ocPdfUrl && (
                                                <a
                                                    href={q.ocPdfUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    title="Descargar Orden de Compra recibida"
                                                    style={{ background: '#7c3aed', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1rem', width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }}
                                                    onMouseOver={(e) => e.currentTarget.style.background = '#6d28d9'}
                                                    onMouseOut={(e) => e.currentTarget.style.background = '#7c3aed'}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                                                </a>
                                            )}
                                            {q.invoicePdfUrl && (
                                                <a
                                                    href={q.invoicePdfUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    title="Descargar Factura"
                                                    style={{ background: '#059669', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1rem', width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }}
                                                    onMouseOver={(e) => e.currentTarget.style.background = '#047857'}
                                                    onMouseOut={(e) => e.currentTarget.style.background = '#059669'}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><line x1="6" y1="8" x2="18" y2="8"/><line x1="6" y1="12" x2="14" y2="12"/></svg>
                                                </a>
                                            )}
                                            <button
                                                onClick={(e) => downloadPdf(q, e)}
                                                disabled={downloadingId === q.id}
                                                style={{ background: downloadingId === q.id ? '#93c5fd' : '#3b82f6', border: 'none', color: 'white', cursor: downloadingId === q.id ? 'wait' : 'pointer', fontSize: '1rem', width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                                                onMouseOver={(e) => { if (downloadingId !== q.id) e.currentTarget.style.background = '#2563eb'; }}
                                                onMouseOut={(e) => { if (downloadingId !== q.id) e.currentTarget.style.background = '#3b82f6'; }}
                                                title="Descargar cotización PDF"
                                            >
                                                {downloadingId === q.id
                                                    ? <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                                                    : <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                                }
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

                                    {/* Progress steps */}
                                    {(() => {
                                        const ocDone = q.quotationStatus === 'aprobada' || q.quotationStatus === 'completado';
                                        const steps = [
                                            { label: 'Emisión', done: !!q.code },
                                            { label: 'Envío', done: !!q.isSent || ocDone, clickable: true },
                                            { label: 'Recep. OC', done: ocDone },
                                            { label: 'Factura', done: q.quotationStatus === 'completado' },
                                        ];
                                        return (
                                            <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: 0 }}>
                                                {steps.map((step, i) => (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
                                                        <div
                                                            onClick={step.clickable && !ocDone ? (e) => toggleSent(q.id, q.isSent, e) : undefined}
                                                            title={step.clickable && !ocDone ? (step.done ? 'Marcar como no enviada' : 'Marcar como enviada') : step.label}
                                                            style={{
                                                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem',
                                                                cursor: step.clickable && !ocDone ? 'pointer' : 'default',
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            <div style={{
                                                                width: 22, height: 22, borderRadius: '50%',
                                                                background: step.done ? '#22c55e' : '#f1f5f9',
                                                                border: `2px solid ${step.done ? '#22c55e' : '#cbd5e1'}`,
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                transition: 'all 0.2s',
                                                            }}>
                                                                {step.done
                                                                    ? <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                                    : <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#cbd5e1' }} />
                                                                }
                                                            </div>
                                                            <span style={{ fontSize: '0.6rem', fontWeight: '600', color: step.done ? '#16a34a' : '#94a3b8', whiteSpace: 'nowrap', letterSpacing: '0.02em' }}>
                                                                {step.label}
                                                            </span>
                                                        </div>
                                                        {i < steps.length - 1 && (
                                                            <div style={{ flex: 1, height: 2, background: steps[i + 1].done ? '#22c55e' : '#e2e8f0', margin: '0 4px', marginBottom: '1rem', transition: 'background 0.2s' }} />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}

                                    <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>Total</span>
                                        <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#101828' }}>S/ {Number(q.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
