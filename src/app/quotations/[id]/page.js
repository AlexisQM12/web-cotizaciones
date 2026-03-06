'use client';
import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { QuotationDocument } from '@/components/QuotationDocument';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { UserSidebar } from '@/components/UserSidebar';
import { useRealtimeQuotation } from '@/hooks/useRealtimeQuotation';

// Import PDFViewer dynamically to avoid SSR issues
const PDFViewer = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.PDFViewer),
    { ssr: false, loading: () => <p>Cargando previsualización...</p> }
);

const PDFDownloadLink = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
    { ssr: false }
);

// Memoized PDF component — only re-renders when dataForPdf reference changes
const PdfPreview = memo(function PdfPreview({ dataForPdf }) {
    if (!dataForPdf) {
        return (
            <div style={{ color: '#94a3b8', textAlign: 'center' }}>
                <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</p>
                <p>Cargando vista previa...</p>
            </div>
        );
    }
    return (
        <PDFViewer width="100%" height="100%" style={{ border: 'none' }} showToolbar={true}>
            <QuotationDocument data={dataForPdf} />
        </PDFViewer>
    );
});

export default function QuotationEditor() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;
    const { user } = useAuth();

    // Use Firestore realtime hook
    const { quotation, companyProfiles, clientProfiles, activeUsers: realtimeUsers, loading, error, updateQuotation } = useRealtimeQuotation(id);

    const [data, setData] = useState({
        clientName: '',
        clientRuc: '',
        clientAddress: '',
        code: '',
        items: [{ description: 'Servicio Ejemplo', quantity: 1, price: 100 }],
        globalProfitPercentage: '',
        globalOtherCosts: '',
        companyProfiles: [],
        clientProfiles: []
    });
    const [saving, setSaving] = useState(false);
    const [autoSaving, setAutoSaving] = useState(false);
    const [activeUsers, setActiveUsers] = useState([]);
    const [remoteFocus, setRemoteFocus] = useState({}); // { fieldName: userObject }
    const isRemoteUpdate = useRef(false);

    // Separate state for PDF - only updated manually via button
    const [pdfData, setPdfData] = useState(null);
    const pdfUpdateTimeout = useRef(null);
    const autoSaveTimeout = useRef(null);
    const pdfInitialized = useRef(false); // tracks if PDF was loaded at least once

    // Reset PDF state whenever we navigate to a different quotation
    useEffect(() => {
        pdfInitialized.current = false;
        setPdfData(null);
    }, [id]);

    // Update local data when Firestore quotation changes
    useEffect(() => {
        if (quotation && companyProfiles && clientProfiles) {
            isRemoteUpdate.current = true;

            // Auto-select default company profile if none is selected
            const selectedCompanyProfileId = quotation.companyProfileId ||
                companyProfiles.find(cp => cp.isDefault)?.id || null;

            // Auto-select default client profile if none is selected
            const selectedClientProfileId = quotation.clientProfileId ||
                clientProfiles.find(cp => cp.isDefault)?.id || null;

            const newData = (prevData) => ({
                ...quotation,
                companyProfiles,
                clientProfiles,
                companyProfileId: selectedCompanyProfileId,
                clientProfileId: selectedClientProfileId,
                clientName: quotation.clientName || prevData.clientName || '',
                clientRuc: quotation.clientRuc || prevData.clientRuc || '',
                clientAddress: quotation.clientAddress || prevData.clientAddress || '',
                items: quotation.items && quotation.items.length > 0 ? quotation.items : [{ description: '', quantity: 1, price: 0 }],
                globalProfitPercentage: quotation.globalProfitPercentage || '',
                globalOtherCosts: quotation.globalOtherCosts || ''
            });

            setData(newData);
            // Only initialize pdfData once companyProfiles has actual data loaded
            // companyProfiles starts as [] (truthy but empty), which caused company to be missing
            if (!pdfInitialized.current && companyProfiles.length > 0) {
                pdfInitialized.current = true;
                setPdfData(newData({ clientName: '', clientRuc: '', clientAddress: '' }));
            }
        }
    }, [quotation, companyProfiles, clientProfiles]);


    const handleFocus = (field) => {
        // Focus tracking removed - not needed with Firestore
    };

    const handleBlur = (field) => {
        // Blur tracking removed - not needed with Firestore
    };

    const getInputStyle = (field, baseStyle = {}) => {
        const focusUser = remoteFocus[field];
        if (focusUser) {
            return {
                ...baseStyle,
                borderColor: focusUser.color || '#3b82f6',
                boxShadow: `0 0 0 2px ${(focusUser.color || '#3b82f6')}20`, // 20 hex = 12% opacity
                transition: 'all 0.2s',
                position: 'relative'
            };
        }
        return {
            ...baseStyle,
            width: '100%',
            padding: '0.75rem',
            borderRadius: '6px',
            border: '1px solid #ccc'
        };
    };

    const renderRemoteCursorLabel = (field) => {
        const focusUser = remoteFocus[field];
        if (focusUser) {
            return (
                <div style={{
                    position: 'absolute',
                    top: '-18px',
                    right: '0',
                    background: focusUser.color || '#3b82f6',
                    color: 'white',
                    fontSize: '0.65rem',
                    padding: '2px 6px',
                    borderRadius: '4px 4px 0 0',
                    zIndex: 10
                }}>
                    {focusUser.firstName}
                </div>
            );
        }
        return null;
    };

    const handleChange = async (field, value) => {
        const newData = { ...data, [field]: value };
        setData(newData);

        // Clear existing timeout
        if (autoSaveTimeout.current) {
            clearTimeout(autoSaveTimeout.current);
        }

        // Set auto-saving indicator immediately
        setAutoSaving(true);

        // Debounce Firestore update - only save after user stops typing for 500ms
        autoSaveTimeout.current = setTimeout(async () => {
            if (id && updateQuotation) {
                try {
                    await updateQuotation({ [field]: value });
                    setAutoSaving(false);
                } catch (err) {
                    console.error('Error updating quotation:', err);
                    setAutoSaving(false);
                }
            }
        }, 500);

        // Debounce PDF update - auto-refresh 2s after user stops typing
        // Uses current data state, NOT triggered by Firestore (avoids flickering)
        if (pdfUpdateTimeout.current) {
            clearTimeout(pdfUpdateTimeout.current);
        }
        pdfUpdateTimeout.current = setTimeout(() => {
            setData(currentData => {
                setPdfData({ ...currentData, [field]: value });
                return currentData;
            });
        }, 2000);
    };

    const handleClientProfileChange = async (clientProfileId) => {
        console.log('🔍 Client Profile Change:', clientProfileId);
        console.log('Available profiles:', data.clientProfiles);

        // Don't use parseInt - IDs can be Firestore strings or numbers
        const selectedClient = data.clientProfiles?.find(p => String(p.id) === String(clientProfileId));
        console.log('Selected client:', selectedClient);

        const newData = {
            ...data,
            clientProfileId: clientProfileId,
            clientName: selectedClient ? selectedClient.name || '' : '',
            clientRuc: selectedClient ? selectedClient.ruc || '' : '',
            clientAddress: selectedClient ? selectedClient.address || '' : ''
        };

        console.log('New data:', {
            clientName: newData.clientName,
            clientRuc: newData.clientRuc,
            clientAddress: newData.clientAddress
        });

        setData(newData);

        // Update Firestore directly
        if (id && updateQuotation) {
            try {
                await updateQuotation({
                    clientProfileId: newData.clientProfileId,
                    clientName: newData.clientName,
                    clientRuc: newData.clientRuc,
                    clientAddress: newData.clientAddress
                });
            } catch (err) {
                console.error('Error updating client profile:', err);
            }
        }
    };

    const handleCompanyProfileChange = async (companyProfileId) => {
        console.log('🏢 Company Profile Change:', companyProfileId);
        console.log('Available company profiles:', data.companyProfiles);

        // Don't use parseInt - IDs can be Firestore strings or numbers
        const selectedCompany = data.companyProfiles?.find(p => String(p.id) === String(companyProfileId));
        console.log('Selected company:', selectedCompany);

        const newData = {
            ...data,
            companyProfileId: companyProfileId,
            // Copy company conditions to notes field
            notes: selectedCompany?.conditions || data.notes || ''
        };

        console.log('New notes:', newData.notes);

        setData(newData);

        // Update Firestore directly
        if (id && updateQuotation) {
            try {
                await updateQuotation({
                    companyProfileId: newData.companyProfileId,
                    notes: newData.notes
                });
            } catch (err) {
                console.error('Error updating company profile:', err);
            }
        }
    };

    const handleItemChange = async (index, field, value) => {
        const newItems = [...data.items];
        newItems[index][field] = value;
        const newData = { ...data, items: newItems };
        setData(newData);

        // Update Firestore directly with auto-save indicator
        if (id && updateQuotation) {
            try {
                setAutoSaving(true);
                await updateQuotation({ items: newItems });
                setAutoSaving(false);
            } catch (err) {
                console.error('Error updating items:', err);
                setAutoSaving(false);
            }
        }
    };

    const addItem = async () => {
        const newItems = [...data.items, { description: '', quantity: 1, price: 0 }];
        const newData = { ...data, items: newItems };
        setData(newData);

        // Update Firestore directly
        if (id && updateQuotation) {
            try {
                await updateQuotation({ items: newItems });
            } catch (err) {
                console.error('Error adding item:', err);
            }
        }
    };

    const removeItem = async (index) => {
        if (data.items.length <= 1) return; // keep at least one item
        const newItems = data.items.filter((_, i) => i !== index);
        const newData = { ...data, items: newItems };
        setData(newData);
        if (id && updateQuotation) {
            try { await updateQuotation({ items: newItems }); }
            catch (err) { console.error('Error removing item:', err); }
        }
    };

    const duplicateItem = async (index) => {
        const itemToCopy = { ...data.items[index] };
        const newItems = [
            ...data.items.slice(0, index + 1),
            itemToCopy,
            ...data.items.slice(index + 1)
        ];
        const newData = { ...data, items: newItems };
        setData(newData);
        if (id && updateQuotation) {
            try { await updateQuotation({ items: newItems }); }
            catch (err) { console.error('Error duplicating item:', err); }
        }
    };

    const saveQuotation = async () => {
        setSaving(true);
        try {
            // First update the quotation data
            if (updateQuotation) {
                await updateQuotation(data);
            }

            // If not published, publish it and assign code
            if (!data.isPublished && !quotation.isPublished) {
                const res = await fetch('/api/quotations/publish', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ quotationId: id })
                });
                const result = await res.json();

                if (result.success) {
                    // Refresh page to get the new code
                    window.location.reload();
                }
            }

            setSaving(false);
        } catch (e) {
            console.error(e);
            setSaving(false);
        }
    }

    const total = data.items ? data.items.reduce((acc, item) => acc + (item.quantity * item.price), 0) : 0;

    // Find the selected company profile data
    const selectedCompany = data.companyProfiles?.find(p => String(p.id) === String(data.companyProfileId)) ||
        data.companyProfiles?.find(p => p.isDefault) || {};

    // Find the selected client profile data
    const selectedClient = data.clientProfiles?.find(p => String(p.id) === String(data.clientProfileId)) ||
        data.clientProfiles?.find(p => p.isDefault) || {};

    // Memoize dataForPdf so it ONLY recomputes when pdfData changes (via button click)
    // This prevents PDFViewer from re-rendering on every keystroke
    const dataForPdf = useMemo(() => {
        const safePdfData = pdfData || {};
        const pdfTotal = safePdfData.items
            ? safePdfData.items.reduce((acc, item) => acc + (item.quantity * item.price), 0)
            : 0;
        const pdfSelectedCompany =
            safePdfData.companyProfiles?.find(p => String(p.id) === String(safePdfData.companyProfileId)) ||
            safePdfData.companyProfiles?.find(p => p.isDefault) || {};
        const pdfSelectedClient =
            safePdfData.clientProfiles?.find(p => String(p.id) === String(safePdfData.clientProfileId)) ||
            safePdfData.clientProfiles?.find(p => p.isDefault) || {};
        return {
            ...safePdfData,
            total: pdfTotal,
            company: pdfSelectedCompany,
            clientName: pdfSelectedClient.name || safePdfData.clientName || '',
            clientRuc: pdfSelectedClient.ruc || safePdfData.clientRuc || '',
            clientAddress: pdfSelectedClient.address || safePdfData.clientAddress || '',
            notes: safePdfData.notes !== undefined ? safePdfData.notes : (safePdfData.generalConditions?.text || '')
        };
    }, [pdfData]); // ONLY recomputes when user presses the refresh button


    return (
        <ProtectedRoute>
            <UserSidebar activeUsers={activeUsers} />
            <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', marginLeft: '80px' }}>
                {/* Left: Editor Form */}
                <div style={{ width: '50%', padding: '2rem', overflowY: 'auto', borderRight: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h1 style={{ color: '#1e293b' }}>Editor de Cotización</h1>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <button className="btn" style={{ background: '#64748b', color: 'white' }} onClick={() => router.push('/')}>
                                ← Menú Principal
                            </button>
                            <span style={{ fontSize: '0.8rem', color: autoSaving ? '#f59e0b' : '#22c55e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: autoSaving ? '#f59e0b' : '#22c55e' }}></span>
                                {autoSaving ? 'Guardando...' : 'Guardado'}
                            </span>
                            <button className="btn btn-primary" onClick={saveQuotation} disabled={saving}>
                                {saving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>

                    <div className="card-editor" style={{ marginBottom: '1.5rem', position: 'relative' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1e293b' }}>Empresa Emisora</label>
                        {renderRemoteCursorLabel('companyProfileId')}
                        <select
                            value={data.companyProfileId || ''}
                            onChange={(e) => handleCompanyProfileChange(e.target.value)}
                            onFocus={() => handleFocus('companyProfileId')}
                            onBlur={() => handleBlur('companyProfileId')}
                            style={getInputStyle('companyProfileId')}
                        >
                            <option value="">Seleccionar Empresa...</option>
                            {data.companyProfiles && data.companyProfiles.map(p => (
                                <option key={p.id} value={p.id}>{p.name} {p.isDefault ? '(Predeterminada)' : ''}</option>
                            ))}
                        </select>
                    </div>

                    <div className="card-editor" style={{ marginBottom: '1.5rem', position: 'relative' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1e293b' }}>Perfil de Cliente</label>
                        {renderRemoteCursorLabel('clientProfileId')}
                        <select
                            value={data.clientProfileId || ''}
                            onChange={(e) => handleClientProfileChange(e.target.value)}
                            onFocus={() => handleFocus('clientProfileId')}
                            onBlur={() => handleBlur('clientProfileId')}
                            style={getInputStyle('clientProfileId')}
                        >
                            <option value="">Seleccionar Cliente...</option>
                            {data.clientProfiles && data.clientProfiles.map(p => (
                                <option key={p.id} value={p.id}>{p.name} {p.isDefault ? '(Predeterminado)' : ''}</option>
                            ))}
                        </select>
                    </div>

                    <div className="card-editor" style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div style={{ position: 'relative' }}>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1e293b' }}>Nombre de Cliente</label>
                                {renderRemoteCursorLabel('clientName')}
                                <input
                                    type="text"
                                    value={data.clientName || ''}
                                    onChange={(e) => handleChange('clientName', e.target.value)}
                                    onFocus={() => handleFocus('clientName')}
                                    onBlur={() => handleBlur('clientName')}
                                    style={getInputStyle('clientName')}
                                    placeholder="Juan Pérez"
                                />
                            </div>
                            <div style={{ position: 'relative' }}>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1e293b' }}>RUC</label>
                                {renderRemoteCursorLabel('clientRuc')}
                                <input
                                    type="text"
                                    value={data.clientRuc || ''}
                                    onChange={(e) => handleChange('clientRuc', e.target.value)}
                                    onFocus={() => handleFocus('clientRuc')}
                                    onBlur={() => handleBlur('clientRuc')}
                                    style={getInputStyle('clientRuc')}
                                    placeholder="12345678901"
                                />
                            </div>
                            <div style={{ position: 'relative' }}>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1e293b' }}>Dirección</label>
                                {renderRemoteCursorLabel('clientAddress')}
                                <input
                                    type="text"
                                    value={data.clientAddress || ''}
                                    onChange={(e) => handleChange('clientAddress', e.target.value)}
                                    onFocus={() => handleFocus('clientAddress')}
                                    onBlur={() => handleBlur('clientAddress')}
                                    style={getInputStyle('clientAddress')}
                                    placeholder="Calle Falsa 123"
                                />
                            </div>
                            <div style={{ gridColumn: 'span 3', marginTop: '1rem', position: 'relative' }}>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1e293b' }}>2. Descripción del Servicio o Producto</label>
                                {renderRemoteCursorLabel('serviceDescription')}
                                <textarea
                                    value={data.serviceDescription || ''}
                                    onChange={(e) => handleChange('serviceDescription', e.target.value)}
                                    onFocus={() => handleFocus('serviceDescription')}
                                    onBlur={() => handleBlur('serviceDescription')}
                                    style={getInputStyle('serviceDescription', { minHeight: '80px' })}
                                    placeholder="Describa brevemente el servicio o producto a cotizar..."
                                />
                            </div>
                        </div>
                    </div>

                    <h3 style={{ color: '#1e293b' }}>Configuración Global de Precios (Interno)</h3>
                    <div className="card-editor" style={{ marginBottom: '2rem', backgroundColor: '#fff', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', alignItems: 'flex-end' }}>
                            <div style={{ position: 'relative' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1e293b' }}>% Ganancia Global</label>
                                {renderRemoteCursorLabel('globalProfitPercentage')}
                                <input
                                    type="number"
                                    value={data.globalProfitPercentage || ''}
                                    onChange={(e) => handleChange('globalProfitPercentage', e.target.value)}
                                    onFocus={() => handleFocus('globalProfitPercentage')}
                                    onBlur={() => handleBlur('globalProfitPercentage')}
                                    style={getInputStyle('globalProfitPercentage')}
                                    placeholder="0"
                                />
                            </div>
                            <div style={{ position: 'relative' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1e293b' }}>% Otros Global</label>
                                {renderRemoteCursorLabel('globalOtherCosts')}
                                <input
                                    type="number"
                                    value={data.globalOtherCosts || ''}
                                    onChange={(e) => handleChange('globalOtherCosts', e.target.value)}
                                    onFocus={() => handleFocus('globalOtherCosts')}
                                    onBlur={() => handleBlur('globalOtherCosts')}
                                    style={getInputStyle('globalOtherCosts')}
                                    placeholder="0"
                                />
                            </div>
                            <button
                                className="btn"
                                style={{ background: '#334155', color: 'white', padding: '0.75rem' }}
                                onClick={() => {
                                    const gp = parseFloat(data.globalProfitPercentage || 0);
                                    const go = parseFloat(data.globalOtherCosts || 0);
                                    const newItems = data.items.map(item => {
                                        const bp = parseFloat(item.basePrice || 0);
                                        const finalPrice = bp * (1 + (gp + go) / 100);
                                        return {
                                            ...item,
                                            profitPercentage: data.globalProfitPercentage,
                                            otherCosts: data.globalOtherCosts,
                                            price: finalPrice.toFixed(2)
                                        };
                                    });
                                    handleChange('items', newItems);
                                }}
                            >
                                Aplicar a todos los ítems
                            </button>
                        </div>
                        <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.75rem' }}>
                            * Esto actualizará los porcentajes y recalculará el Precio U. de cada ítem basado en su Costo Base.
                        </p>
                    </div>

                    <h3 style={{ color: '#1e293b' }}>Ítems</h3>
                    {data.items && data.items.map((item, index) => (
                        <div key={index} className="card-editor" style={{ marginBottom: '1rem', padding: '1.25rem' }}>
                            {/* Item header with index and action buttons */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ítem #{index + 1}</span>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    {/* Duplicate button */}
                                    <button
                                        onClick={() => duplicateItem(index)}
                                        title="Duplicar ítem"
                                        style={{ background: '#e0f2fe', border: 'none', color: '#0369a1', cursor: 'pointer', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        onMouseOver={(e) => e.currentTarget.style.background = '#bae6fd'}
                                        onMouseOut={(e) => e.currentTarget.style.background = '#e0f2fe'}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                                    </button>
                                    {/* Delete button */}
                                    <button
                                        onClick={() => removeItem(index)}
                                        title="Eliminar ítem"
                                        disabled={data.items.length <= 1}
                                        style={{ background: data.items.length <= 1 ? '#f1f5f9' : '#fee2e2', border: 'none', color: data.items.length <= 1 ? '#cbd5e1' : '#dc2626', cursor: data.items.length <= 1 ? 'not-allowed' : 'pointer', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        onMouseOver={(e) => { if (data.items.length > 1) e.currentTarget.style.background = '#fecaca'; }}
                                        onMouseOut={(e) => { if (data.items.length > 1) e.currentTarget.style.background = '#fee2e2'; }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                                    </button>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                <div style={{ gridColumn: 'span 5', position: 'relative' }}>
                                    {renderRemoteCursorLabel(`item_${index}_description`)}
                                    <input
                                        placeholder="Descripción del ítem"
                                        style={getInputStyle(`item_${index}_description`, { width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' })}
                                        value={item.description}
                                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                        onFocus={() => handleFocus(`item_${index}_description`)}
                                        onBlur={() => handleBlur(`item_${index}_description`)}
                                    />
                                </div>

                                <div style={{ position: 'relative' }}>
                                    <label style={{ fontSize: '0.7rem', color: '#334155', display: 'block', fontWeight: 'bold' }}>Cant.</label>
                                    {renderRemoteCursorLabel(`item_${index}_quantity`)}
                                    <input
                                        type="number"
                                        style={getInputStyle(`item_${index}_quantity`, { width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' })}
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                        onFocus={() => handleFocus(`item_${index}_quantity`)}
                                        onBlur={() => handleBlur(`item_${index}_quantity`)}
                                    />
                                </div>

                                <div style={{ position: 'relative' }}>
                                    <label style={{ fontSize: '0.7rem', color: '#334155', display: 'block', fontWeight: 'bold' }}>Costo Base</label>
                                    {renderRemoteCursorLabel(`item_${index}_basePrice`)}
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        style={getInputStyle(`item_${index}_basePrice`, { width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' })}
                                        value={item.basePrice || ''}
                                        onChange={(e) => {
                                            const bp = parseFloat(e.target.value) || 0;
                                            const profit = parseFloat(item.profitPercentage) || 0;
                                            const others = parseFloat(item.otherCosts) || 0;
                                            const finalPrice = bp * (1 + (profit + others) / 100);

                                            handleItemChange(index, 'basePrice', e.target.value);
                                            handleItemChange(index, 'price', finalPrice.toFixed(2));
                                        }}
                                        onFocus={() => handleFocus(`item_${index}_basePrice`)}
                                        onBlur={() => handleBlur(`item_${index}_basePrice`)}
                                    />
                                </div>

                                <div style={{ position: 'relative' }}>
                                    <label style={{ fontSize: '0.7rem', color: '#334155', display: 'block', fontWeight: 'bold' }}>% Gan.</label>
                                    {renderRemoteCursorLabel(`item_${index}_profitPercentage`)}
                                    <input
                                        type="number"
                                        placeholder="0"
                                        style={getInputStyle(`item_${index}_profitPercentage`, { width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' })}
                                        value={item.profitPercentage || ''}
                                        onChange={(e) => {
                                            const profit = parseFloat(e.target.value) || 0;
                                            const bp = parseFloat(item.basePrice || 0);
                                            const others = parseFloat(item.otherCosts || 0);
                                            const finalPrice = bp * (1 + (profit + others) / 100);

                                            handleItemChange(index, 'profitPercentage', e.target.value);
                                            handleItemChange(index, 'price', finalPrice.toFixed(2));
                                        }}
                                        onFocus={() => handleFocus(`item_${index}_profitPercentage`)}
                                        onBlur={() => handleBlur(`item_${index}_profitPercentage`)}
                                    />
                                </div>

                                <div style={{ position: 'relative' }}>
                                    <label style={{ fontSize: '0.7rem', color: '#334155', display: 'block', fontWeight: 'bold' }}>% Otros</label>
                                    {renderRemoteCursorLabel(`item_${index}_otherCosts`)}
                                    <input
                                        type="number"
                                        placeholder="0"
                                        style={getInputStyle(`item_${index}_otherCosts`, { width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' })}
                                        value={item.otherCosts || ''}
                                        onChange={(e) => {
                                            const profit = parseFloat(item.profitPercentage || 0);
                                            const bp = parseFloat(item.basePrice || 0);
                                            const others = parseFloat(e.target.value) || 0;
                                            const finalPrice = bp * (1 + (profit + others) / 100);

                                            handleItemChange(index, 'otherCosts', e.target.value);
                                            handleItemChange(index, 'price', finalPrice.toFixed(2));
                                        }}
                                        onFocus={() => handleFocus(`item_${index}_otherCosts`)}
                                        onBlur={() => handleBlur(`item_${index}_otherCosts`)}
                                    />
                                </div>

                                <div style={{ position: 'relative' }}>
                                    <label style={{ fontSize: '0.7rem', color: '#334155', display: 'block', fontWeight: 'bold' }}>Precio U.</label>
                                    {renderRemoteCursorLabel(`item_${index}_price`)}
                                    <input
                                        type="number"
                                        step="0.01"
                                        style={getInputStyle(`item_${index}_price`, { width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #22c55e', backgroundColor: '#f0fdf4' })}
                                        value={item.price}
                                        onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                                        onFocus={() => handleFocus(`item_${index}_price`)}
                                        onBlur={() => handleBlur(`item_${index}_price`)}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    <button onClick={addItem} className="btn" style={{ background: '#e5e7eb', color: '#374151', marginBottom: '2rem' }}>
                        + Agregar Ítem
                    </button>

                    <h3 style={{ color: '#1e293b' }}>Notas / Condiciones</h3>
                    <div className="card-editor" style={{ position: 'relative' }}>
                        {renderRemoteCursorLabel('notes')}
                        <textarea
                            value={data.notes !== undefined ? data.notes : (data.generalConditions?.text || '')}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            onFocus={() => handleFocus('notes')}
                            onBlur={() => handleBlur('notes')}
                            rows={6}
                            style={getInputStyle('notes', { width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc', fontFamily: 'inherit' })}
                            placeholder="Notas adicionales para esta cotización..."
                        />
                    </div>

                </div>

                {/* Right: PDF Preview */}
                <div style={{ width: '50%', backgroundColor: '#525659', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '0.75rem 1rem', backgroundColor: '#3a3c3e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: '500' }}>Vista Previa del PDF</span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => setPdfData({ ...data })}
                                style={{ background: '#475569', color: 'white', border: 'none', borderRadius: '6px', padding: '0.4rem 0.9rem', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                onMouseOver={(e) => e.currentTarget.style.background = '#334155'}
                                onMouseOut={(e) => e.currentTarget.style.background = '#475569'}
                            >
                                🔄 Actualizar
                            </button>
                            {dataForPdf && (
                                <PDFDownloadLink
                                    document={<QuotationDocument data={dataForPdf} />}
                                    fileName={`${dataForPdf.code || 'cotizacion'}.pdf`}
                                    style={{ textDecoration: 'none' }}
                                >
                                    {({ loading }) => (
                                        <button
                                            style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', padding: '0.4rem 0.9rem', fontSize: '0.8rem', fontWeight: '600', cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: loading ? 0.7 : 1 }}
                                            onMouseOver={(e) => { if (!loading) e.currentTarget.style.background = '#15803d'; }}
                                            onMouseOut={(e) => { if (!loading) e.currentTarget.style.background = '#16a34a'; }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                            {loading ? 'Generando...' : 'Descargar PDF'}
                                        </button>
                                    )}
                                </PDFDownloadLink>
                            )}
                        </div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <PdfPreview dataForPdf={dataForPdf} />
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    )
}
