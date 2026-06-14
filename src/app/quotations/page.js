'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSocket } from '@/lib/socket'
import { query, where, onSnapshot } from 'firebase/firestore'
import { clientDb, getTenantCollectionClient } from '@/lib/firestoreClient'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { NavBar } from '@/components/NavBar'
import { QuotationDocument } from '@/components/QuotationDocument'
import { ScannerLogsModal } from '@/components/ScannerLogsModal'
import { SendEmailModal } from '@/components/SendEmailModal'
import { useAuth } from '@/contexts/AuthContext'

export default function Dashboard() {
    const { user } = useAuth();
    const [quotations, setQuotations] = useState([])
    const [activeTab, setActiveTab] = useState('published') // 'published' or 'drafts'
    const [loading, setLoading] = useState(true)
    const [downloadingId, setDownloadingId] = useState(null)
    const [socketInstance, setSocketInstance] = useState(null)
    const [isScannerModalOpen, setIsScannerModalOpen] = useState(false)
    const [stageFilter, setStageFilter] = useState('todas')
    const [leads, setLeads] = useState([])
    const [toasts, setToasts] = useState([]) // notificaciones flotantes transitorias
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
    const [selectedQuotationForEmail, setSelectedQuotationForEmail] = useState(null)
    const [leadsOpen, setLeadsOpen] = useState(false) // Panel Gmail Leads: abierto (desktop) o replegado en botón (móvil)
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
                notes: (fullData.notes !== undefined && fullData.notes !== null && fullData.notes !== '')
                    ? fullData.notes
                    : (company.conditions || fullData.generalConditions?.text || '')
            };

            // Dynamically import pdf() to avoid SSR
            const { pdf } = await import('@react-pdf/renderer');
            const blob = await pdf(<QuotationDocument data={dataForPdf} />).toBlob();
            
            // Upload to Firebase Storage
            const storagePath = `quotations/${user?.empresaId || '6'}/${q.id}.pdf`;
            const fileRef = ref(storage, storagePath);
            await uploadBytes(fileRef, blob, { contentType: 'application/pdf' });
            const downloadUrl = await getDownloadURL(fileRef);

            // Update in Firestore
            await fetch(`/api/quotations/${q.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pdfUrl: downloadUrl })
            });

            // Trigger browser download
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

    // ── Cotizaciones en tiempo real (Firestore onSnapshot) ──
    // El navegador lee directamente de zenlogic, el mismo proyecto donde el
    // escáner de Gmail (Cloud Function) escribe los cambios de estado. Así las
    // tarjetas se mueven solas sin depender de Socket.IO (inerte en producción).
    useEffect(() => {
        if (!user?.empresaId || !clientDb) return;
        setLoading(true);

        const quotationsQuery = query(
            getTenantCollectionClient(user.empresaId, 'quotations'),
            where('empresaId', '==', String(user.empresaId))
        );

        const unsubscribe = onSnapshot(
            quotationsQuery,
            (snapshot) => {
                const list = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return { id: doc.id, ...data, total: computeTotalConIGV(data) };
                });
                // Orden idéntico al de la API anterior: última edición primero
                list.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
                setQuotations(list);
                setLoading(false);
            },
            (err) => {
                console.error('Error escuchando cotizaciones:', err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user?.empresaId]);

    // ── Leads de Gmail en tiempo real (Firestore onSnapshot) ──
    // Reemplaza el fetch + eventos socket 'quote_lead_detected/dismissed'.
    useEffect(() => {
        if (!user?.empresaId || !clientDb) return;

        const leadsQuery = query(
            getTenantCollectionClient(user.empresaId, 'quote_leads'),
            where('status', '==', 'pending')
        );

        let isFirstSnapshot = true;
        const unsubscribe = onSnapshot(
            leadsQuery,
            (snapshot) => {
                const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                list.sort((a, b) => new Date(b.receivedAt || b.createdAt || 0) - new Date(a.receivedAt || a.createdAt || 0));
                setLeads(list);

                // No mostrar toasts para los leads ya existentes en la primera carga;
                // solo para los que lleguen nuevos después.
                if (!isFirstSnapshot) {
                    snapshot.docChanges().forEach(change => {
                        if (change.type === 'added') {
                            const lead = { id: change.doc.id, ...change.doc.data() };
                            const toastId = `${lead.id}-${Date.now()}`;
                            setToasts(prev => [...prev, { ...lead, toastId }]);
                            setTimeout(() => setToasts(prev => prev.filter(t => t.toastId !== toastId)), 8000);
                        } else if (change.type === 'removed') {
                            // El lead dejó de estar pendiente (respondido/convertido/descartado)
                            setToasts(prev => prev.filter(t => t.id !== change.doc.id));
                        }
                    });
                }
                isFirstSnapshot = false;
            },
            (err) => console.error('Error escuchando leads:', err)
        );

        return () => unsubscribe();
    }, [user?.empresaId]);

    // ── Socket.IO solo para el modal del escáner en desarrollo (localhost) ──
    // En producción getSocket() devuelve un stub inerte; el modal lee sus logs
    // y estado directamente de Firestore, así que esto no afecta a la lista.
    useEffect(() => {
        const newSocket = getSocket();
        setSocketInstance(newSocket);
        return () => newSocket.disconnect();
    }, []);

    // Panel Gmail Leads: abierto por defecto en escritorio, replegado (botón) en móvil.
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setLeadsOpen(window.matchMedia('(min-width: 769px)').matches);
        }
    }, []);

    const handleOpenEmailModal = (q) => {
        setSelectedQuotationForEmail(q);
        setIsEmailModalOpen(true);
    };

    const handleEmailSent = (quotationId) => {
        setQuotations(prev => prev.map(q => q.id === quotationId ? { ...q, isSent: true } : q));
    };

    const createNewQuotation = async () => {
        if (!user?.empresaId) {
            alert('Debes configurar tu empresa primero.');
            return;
        }
        try {
            const res = await fetch('/api/quotations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientName: 'Sin Título', empresaId: user.empresaId })
            })
            const quote = await res.json()
            router.push(`/quotations/${quote.id}`)
        } catch (err) {
            console.error(err)
        }
    }

    const createQuotationFromLead = async (lead) => {
        if (!user?.empresaId) return;
        // Extrae nombre del remitente del campo "Nombre <email>"
        const nameMatch = lead.from?.match(/^([^<]+)</) || [];
        const clientName = (nameMatch[1]?.trim() || lead.from || 'Cliente por correo').slice(0, 80);
        try {
            const res = await fetch('/api/quotations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientName, empresaId: user.empresaId }),
            });
            const quote = await res.json();
            await fetch(`/api/quote-leads/${lead.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'converted' }),
            });
            setLeads(prev => prev.filter(l => l.id !== lead.id));
            router.push(`/quotations/${quote.id}`);
        } catch (err) {
            console.error(err);
        }
    };

    const dismissLead = async (leadId) => {
        setLeads(prev => prev.filter(l => l.id !== leadId));
        await fetch(`/api/quote-leads/${leadId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'dismissed' }),
        }).catch(() => {});
    };

    // Filter quotations based on active tab
    const publishedQuotations = quotations.filter(q => q.isPublished === true);
    const draftQuotations = quotations.filter(q => q.isPublished === false || q.isPublished === undefined);

    const STAGES = [
        { key: 'todas',    label: 'Todas' },
        { key: 'emitida',  label: 'Sin enviar',    match: q => !q.isSent && !['aprobada', 'completado', 'pendiente_factura'].includes(q.quotationStatus) && !q.invoicePdfUrl },
        { key: 'enviada',  label: 'Enviada',        match: q => q.isSent && !['aprobada', 'completado', 'pendiente_factura'].includes(q.quotationStatus) && !q.invoicePdfUrl },
        { key: 'aprobada', label: 'OC Recibida',   match: q => ['aprobada', 'pendiente_factura'].includes(q.quotationStatus) && !q.invoicePdfUrl },
        { key: 'completado', label: 'Facturada',   match: q => ['completado'].includes(q.quotationStatus) || !!q.invoicePdfUrl },
    ];

    const stageFiltered = stageFilter === 'todas'
        ? publishedQuotations
        : publishedQuotations.filter(STAGES.find(s => s.key === stageFilter)?.match || (() => true));

    const displayList = activeTab === 'published' ? stageFiltered : draftQuotations;

    return (
        <ProtectedRoute allowedModule="quotations">
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
                            <h1 style={{ lineHeight: '1.2' }}>Mis Cotizaciones</h1>
                            <p>Administra y crea nuevas propuestas profesionales.</p>
                        </div>
                    </div>
                    <div className="dashboard-actions">
                        <button className="btn btn-secondary" onClick={() => setIsScannerModalOpen(true)} title="Lector O.C." aria-label="Lector O.C.">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.93 4.93a10 10 0 0 0 0 14.14M19.07 4.93a10 10 0 0 1 0 14.14M7.76 7.76a6 6 0 0 0 0 8.48M16.24 7.76a6 6 0 0 1 0 8.48"/><circle cx="12" cy="12" r="1.5"/></svg>
                            <span className="btn-label">Lector O.C.</span>
                        </button>
                        <button className="btn btn-secondary" onClick={() => router.push('/settings')} title="Configuración" aria-label="Configuración">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                            <span className="btn-label">Configuración</span>
                        </button>
                        <button className="btn btn-primary" onClick={createNewQuotation} title="Nueva Cotización" aria-label="Nueva Cotización">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                            <span className="btn-label">Nueva Cotización</span>
                        </button>
                    </div>
                </div>

                <ScannerLogsModal
                    isOpen={isScannerModalOpen}
                    onClose={() => setIsScannerModalOpen(false)}
                    socket={socketInstance}
                    quotations={quotations}
                />

                <SendEmailModal 
                    isOpen={isEmailModalOpen}
                    onClose={() => setIsEmailModalOpen(false)}
                    quotation={selectedQuotationForEmail}
                    onSent={handleEmailSent}
                />

                {/* ── Toasts flotantes para leads en tiempo real ── */}
                <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {toasts.map(toast => (
                        <div key={toast.toastId} style={{
                            background: '#1f2937', color: '#fff',
                            borderRadius: 12, padding: '1rem 1.25rem',
                            maxWidth: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                            animation: 'slide-in 0.3s ease',
                            borderLeft: '4px solid #f59e0b',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                                <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>📩</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 4 }}>
                                        Nueva solicitud de cotización
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#d1d5db', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {toast.subject}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{toast.from}</div>
                                </div>
                                <button
                                    onClick={() => setToasts(prev => prev.filter(t => t.toastId !== toast.toastId))}
                                    style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: 0 }}
                                >
                                    ✕
                                </button>
                            </div>
                            <button
                                className="btn btn-primary"
                                style={{ width: '100%', marginTop: '0.75rem', padding: '0.45rem', fontSize: '0.82rem' }}
                                onClick={() => { createQuotationFromLead(toast); setToasts(prev => prev.filter(t => t.toastId !== toast.toastId)); }}
                            >
                                ＋ Crear cotización ahora
                            </button>
                        </div>
                    ))}
                </div>

                <style jsx global>{`
                    @keyframes pulse-dot {
                        0%, 100% { opacity: 1; transform: scale(1); }
                        50%       { opacity: 0.5; transform: scale(1.4); }
                    }
                    @keyframes slide-in {
                        from { opacity: 0; transform: translateX(40px); }
                        to   { opacity: 1; transform: translateX(0); }
                    }
                    @keyframes gmail-pulse {
                        0%   { box-shadow: 0 0 0 0 rgba(229,57,53,0.55); }
                        70%  { box-shadow: 0 0 0 16px rgba(229,57,53,0); }
                        100% { box-shadow: 0 0 0 0 rgba(229,57,53,0); }
                    }
                    @media (max-width: 768px) {
                        .gadgets-sidebar {
                            width: calc(100vw - 2rem) !important;
                            right: 1rem !important;
                            top: 80px !important;
                            max-height: calc(100vh - 100px) !important;
                        }
                    }
                `}</style>

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
                                                {(() => {
                                                    const s = q.invoicePdfUrl ? 'completado' : (q.quotationStatus || 'pendiente');
                                                    let bg = '#fef9c3', color = '#a16207', border = '#fde68a';
                                                    if (s === 'completado') { bg = '#dcfce7'; color = '#16a34a'; border = '#bbf7d0'; }
                                                    else if (s === 'aprobada') { bg = '#e0e7ff'; color = '#4338ca'; border = '#c7d2fe'; }
                                                    else if (s === 'pendiente_factura') { bg = '#fef3c7'; color = '#d97706'; border = '#fcd34d'; }
                                                    else if (s === 'pendiente_oc') { bg = '#fff7ed'; color = '#c2410c'; border = '#ffedd5'; }
                                                    
                                                    return (
                                                        <select
                                                            value={s}
                                                            onChange={(e) => updateStatus(q.id, e.target.value, e)}
                                                            style={{
                                                                backgroundColor: bg, color, border: `1px solid ${border}`,
                                                                borderRadius: '20px', padding: '0.2rem 0.75rem', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer'
                                                            }}
                                                        >
                                                            <option value="pendiente">⏳ Pendiente</option>
                                                            <option value="aprobada">🚀 OC Recibida</option>
                                                            <option value="pendiente_oc">⚙️ Sin OC (En Op)</option>
                                                            <option value="pendiente_factura">🧾 Pendiente Factura</option>
                                                            <option value="completado">✓ Completado</option>
                                                        </select>
                                                    );
                                                })()}
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
                                                onClick={(e) => { e.stopPropagation(); handleOpenEmailModal(q); }}
                                                style={{ background: '#f59e0b', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem', width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                                                onMouseOver={(e) => e.currentTarget.style.background = '#d97706'}
                                                onMouseOut={(e) => e.currentTarget.style.background = '#f59e0b'}
                                                title="Enviar a Cliente por Correo"
                                            >
                                                ✉️
                                            </button>
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
                                        const ocDone = ['aprobada', 'completado', 'pendiente_factura'].includes(q.quotationStatus) || !!q.invoicePdfUrl;
                                        const steps = [
                                            { label: 'Emisión', done: !!q.code },
                                            { label: 'Envío', done: !!q.isSent || ocDone, clickable: true },
                                            { label: 'Recep. OC', done: ocDone },
                                            { label: 'Factura', done: q.quotationStatus === 'completado' || !!q.invoicePdfUrl },
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

            {/* ── GADGETS FLOTANTES (Fuera del contenedor principal) ── */}
            <aside className="gadgets-sidebar" style={{ 
                position: 'fixed', 
                top: '100px', 
                right: '2rem', 
                width: '340px', 
                zIndex: 90, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '1.5rem',
                maxHeight: 'calc(100vh - 120px)',
                overflowY: 'auto'
            }}>
                
                {/* Gadget de Gmail Leads (solo cuando está abierto; replegado vive en el botón flotante) */}
                {leads.length > 0 && leadsOpen && (
                    <div className="card" style={{ padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="28px" height="28px">
                                <path fill="#4caf50" d="M45,16.2l-5,2.75l-5,4.75V40h7.5C43.883,40,45,38.883,45,37.5V16.2z"/>
                                <path fill="#1e88e5" d="M3,16.2l3.614,1.71L13,23.7V40H5.5C4.118,40,3,38.883,3,37.5V16.2z"/>
                                <path fill="#e53935" d="M35,11.2l-11,8.25L13,11.2l-3,2.41L3,16.2l10.879,8.428L24,32.25l10.121-7.622L45,16.2l-7-5.01V11.2z"/>
                                <path fill="#c62828" d="M35,11.2l-11,8.25L13,11.2l-2.091-1.631L13,7.5l11,8.25L35,7.5l2.091,2.069L35,11.2z"/>
                                <path fill="#fbc02d" d="M45,16.2l-7-5.01L35,11.2v12.5l10-7.5V16.2z"/>
                                <path fill="#1565c0" d="M3,16.2l7-5.01L13,11.2v12.5l-10-7.5V16.2z"/>
                            </svg>
                            <h3 style={{ fontSize: '1rem', color: '#1e293b', margin: 0 }}>Gmail Leads</h3>
                            <span style={{ background: '#ef4444', color: 'white', borderRadius: '999px', padding: '0.1rem 0.5rem', fontSize: '0.75rem', fontWeight: 'bold', marginLeft: 'auto' }}>
                                {leads.length} Nuevo{leads.length > 1 ? 's' : ''}
                            </span>
                            <button
                                onClick={() => setLeadsOpen(false)}
                                title="Replegar"
                                aria-label="Replegar panel de Gmail Leads"
                                style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', flexShrink: 0 }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                            </button>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {leads.map(lead => (
                                <div key={lead.id} style={{
                                    background: '#f8fafc', borderRadius: '12px', padding: '1rem',
                                    border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '0.75rem'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {lead.subject}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                                            De: {lead.from}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            className="btn btn-primary"
                                            style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', borderRadius: '8px' }}
                                            onClick={() => createQuotationFromLead(lead)}
                                        >
                                            Cotizar
                                        </button>
                                        <button
                                            className="btn btn-secondary"
                                            style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', borderRadius: '8px' }}
                                            onClick={() => dismissLead(lead.id)}
                                        >
                                            Ignorar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </aside>

            {/* Botón flotante Gmail (replegado / móvil) — parpadea cuando hay pendientes */}
            {leads.length > 0 && !leadsOpen && (
                <button
                    onClick={() => setLeadsOpen(true)}
                    title={`${leads.length} solicitud${leads.length > 1 ? 'es' : ''} de cotización en Gmail`}
                    aria-label="Ver leads de Gmail"
                    style={{
                        position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 95,
                        width: 60, height: 60, borderRadius: '50%',
                        background: '#ffffff', border: '1px solid #e2e8f0',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', padding: 0,
                        animation: 'gmail-pulse 1.6s ease-out infinite',
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="30px" height="30px">
                        <path fill="#4caf50" d="M45,16.2l-5,2.75l-5,4.75V40h7.5C43.883,40,45,38.883,45,37.5V16.2z"/>
                        <path fill="#1e88e5" d="M3,16.2l3.614,1.71L13,23.7V40H5.5C4.118,40,3,38.883,3,37.5V16.2z"/>
                        <path fill="#e53935" d="M35,11.2l-11,8.25L13,11.2l-3,2.41L3,16.2l10.879,8.428L24,32.25l10.121-7.622L45,16.2l-7-5.01V11.2z"/>
                        <path fill="#c62828" d="M35,11.2l-11,8.25L13,11.2l-2.091-1.631L13,7.5l11,8.25L35,7.5l2.091,2.069L35,11.2z"/>
                        <path fill="#fbc02d" d="M45,16.2l-7-5.01L35,11.2v12.5l10-7.5V16.2z"/>
                        <path fill="#1565c0" d="M3,16.2l7-5.01L13,11.2v12.5l-10-7.5V16.2z"/>
                    </svg>
                    <span style={{
                        position: 'absolute', top: -4, right: -4,
                        background: '#ef4444', color: 'white', borderRadius: '999px',
                        minWidth: 22, height: 22, padding: '0 6px',
                        fontSize: '0.72rem', fontWeight: 'bold',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid white', lineHeight: 1,
                    }}>
                        {leads.length}
                    </span>
                </button>
            )}
        </ProtectedRoute>
    )
}

function formatLeadDate(iso) {
    if (!iso) return '';
    try { const d = new Date(iso); return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch { return iso; }
}

// Calcula el total con IGV (18%) a partir de los items, replicando exactamente
// lo que hacía la API /api/quotations para que las tarjetas muestren el mismo
// monto. Los documentos crudos de Firestore guardan `total` como subtotal sin IGV.
function computeTotalConIGV(data) {
    let total = data.total || 0;
    if (Array.isArray(data.items) && data.items.length > 0) {
        const subtotal = data.items.reduce((sum, item) =>
            sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0), 0);
        total = subtotal + subtotal * 0.18;
    }
    return total;
}
