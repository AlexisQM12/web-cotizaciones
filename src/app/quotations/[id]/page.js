'use client';
import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { QuotationDocument } from '@/components/QuotationDocument';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { UserSidebar } from '@/components/UserSidebar';
import { useRealtimeQuotation } from '@/hooks/useRealtimeQuotation';
import { SubItemsModal } from '@/components/SubItemsModal';
import { storage } from '@/lib/firebaseConfig';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

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
    const [activeUsers, setActiveUsers] = useState([]);
    const [remoteFocus, setRemoteFocus] = useState({}); // { fieldName: userObject }
    const isRemoteUpdate = useRef(false);

    // Separate state for PDF - only updated manually via button
    const [pdfData, setPdfData] = useState(null);
    const pdfInitialized = useRef(false); // tracks if PDF was loaded at least once
    const [subItemsModalData, setSubItemsModalData] = useState(null);
    const [uploadingItem, setUploadingItem] = useState({}); // { [index]: true }

    const uploadItemImage = async (index, file) => {
        if (!file || !storage) return;
        setUploadingItem(prev => ({ ...prev, [index]: true }));
        try {
            const ext = file.name.split('.').pop();
            const storageRef = ref(storage, `quotation-images/${id}/item-${index}-${Date.now()}.${ext}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            handleItemChange(index, 'imageUrl', url);
        } catch (err) {
            console.error('Error subiendo imagen:', err);
            alert('Error al subir la imagen. Intenta de nuevo.');
        } finally {
            setUploadingItem(prev => ({ ...prev, [index]: false }));
        }
    };

    const removeItemImage = async (index, imageUrl) => {
        try {
            if (imageUrl) {
                const storageRef = ref(storage, imageUrl);
                await deleteObject(storageRef).catch(() => {});
            }
            handleItemChange(index, 'imageUrl', null);
        } catch (err) {
            console.error('Error eliminando imagen:', err);
        }
    };

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
            padding: '0.4rem 0.6rem',
            fontSize: '0.85rem',
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

    const handleChange = (field, value) => {
        const newData = { ...data, [field]: value };
        setData(newData);
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
    };

    const handleItemChange = async (index, field, value) => {
        const newItems = [...data.items];
        newItems[index][field] = value;
        const newData = { ...data, items: newItems };
        setData(newData);
    };

    const addItem = async () => {
        const newItems = [...data.items, { description: '', quantity: 1, price: 0 }];
        const newData = { ...data, items: newItems };
        setData(newData);
        if (updateQuotation) {
            await updateQuotation(newData);
        }
    };

    const removeItem = async (index) => {
        if (data.items.length <= 1) return; // keep at least one item
        const newItems = data.items.filter((_, i) => i !== index);
        const newData = { ...data, items: newItems };
        setData(newData);
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
    };

    const moveItemUp = async (index) => {
        if (index <= 0) return;
        const newItems = [...data.items];
        const temp = newItems[index];
        newItems[index] = newItems[index - 1];
        newItems[index - 1] = temp;
        setData({ ...data, items: newItems });
    };

    const moveItemDown = async (index) => {
        if (index >= data.items.length - 1) return;
        const newItems = [...data.items];
        const temp = newItems[index];
        newItems[index] = newItems[index + 1];
        newItems[index + 1] = temp;
        setData({ ...data, items: newItems });
    };

    const toggleItemExpanded = (index) => {
        const newItems = [...data.items];
        const current = newItems[index].isExpanded;
        newItems[index].isExpanded = current === undefined ? false : !current;
        setData({ ...data, items: newItems });
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

    const pdfDocument = useMemo(() => {
        if (!dataForPdf) return null;
        return <QuotationDocument data={dataForPdf} />;
    }, [dataForPdf]);

    const handleSaveSubItems = (newSubItems, totalCost) => {
        if (!subItemsModalData) return;
        const { index } = subItemsModalData;
        
        const newItems = [...data.items];
        const item = { ...newItems[index] };
        
        const oldSubItemsTotal = (item.subItems || []).reduce((acc, si) => acc + (parseFloat(si.quantity) || 0) * (parseFloat(si.basePrice) || 0), 0);
        const diff = totalCost - oldSubItemsTotal;
        
        item.subItems = newSubItems;
        item.basePrice = (parseFloat(item.basePrice) || 0) + diff;
        
        // Recalculate final price based on the new basePrice and percentages
        const profit = parseFloat(item.profitPercentage || 0);
        const others = parseFloat(item.otherCosts || 0);
        const bp = parseFloat(item.basePrice || 0);
        const finalPrice = bp * (1 + (profit + others) / 100);
        
        item.price = finalPrice.toFixed(2);
        newItems[index] = item;
        
        setData({ ...data, items: newItems });
        setSubItemsModalData(null);
    };

    return (
        <ProtectedRoute>
            <UserSidebar activeUsers={activeUsers} />
            <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', marginLeft: '80px' }}>
                {/* Left: Editor Form */}
                <div style={{ width: '50%', padding: '1.25rem', overflowY: 'auto', borderRight: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h1 style={{ color: '#1e293b', fontSize: '1.4rem' }}>Editor de Cotización</h1>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <button className="btn" style={{ background: '#64748b', color: 'white', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => router.push('/')}>
                                ← Menú Principal
                            </button>
                            <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={saveQuotation} disabled={saving}>
                                {saving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>

                    <div className="card-editor" style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ position: 'relative' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.2rem', color: '#1e293b' }}>Empresa Emisora</label>
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
                            <div style={{ position: 'relative' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.2rem', color: '#1e293b' }}>Perfil de Cliente</label>
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
                        </div>
                    </div>

                    <div className="card-editor" style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem' }}>
                            <div style={{ position: 'relative' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.2rem', color: '#1e293b' }}>Nombre de Cliente</label>
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
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.2rem', color: '#1e293b' }}>RUC</label>
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
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.2rem', color: '#1e293b' }}>Dirección</label>
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
                            <div style={{ gridColumn: 'span 3', marginTop: '0.6rem', position: 'relative' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.2rem', color: '#1e293b' }}>2. Descripción del Servicio o Producto</label>
                                {renderRemoteCursorLabel('serviceDescription')}
                                <textarea
                                    value={data.serviceDescription || ''}
                                    onChange={(e) => handleChange('serviceDescription', e.target.value)}
                                    onFocus={() => handleFocus('serviceDescription')}
                                    onBlur={() => handleBlur('serviceDescription')}
                                    style={getInputStyle('serviceDescription', { minHeight: '60px' })}
                                    placeholder="Describa brevemente el servicio o producto a cotizar..."
                                />
                            </div>
                        </div>
                    </div>

                    <h3 style={{ color: '#1e293b', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Configuración Global de Precios (Interno)</h3>
                    <div className="card-editor" style={{ marginBottom: '1rem', backgroundColor: '#fff', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem', alignItems: 'flex-end' }}>
                            <div style={{ position: 'relative' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.2rem', color: '#1e293b' }}>% Ganancia Global</label>
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
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.2rem', color: '#1e293b' }}>% Otros Global</label>
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
                                style={{ background: '#334155', color: 'white', padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
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

                    <h3 style={{ color: '#1e293b', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Ítems</h3>
                    {data.items && data.items.map((item, index) => (
                        <div key={index} className="card-editor" style={{ marginBottom: '0.5rem', padding: '0.8rem' }}>
                            {/* Item header with index and action buttons */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: item.isExpanded === false ? '0' : '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Ítem #{index + 1}
                                    </span>
                                    {item.isExpanded === false && (
                                        <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: '500', marginLeft: '0.5rem' }}>
                                            - {item.description || 'Sin título'} <strong style={{ color: '#22c55e' }}>(S/ {Number(item.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</strong>
                                        </span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    {/* Chevron Collapse/Expand */}
                                    <button
                                        onClick={() => toggleItemExpanded(index)}
                                        title={item.isExpanded !== false ? "Contraer" : "Expandir"}
                                        style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'}
                                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        {item.isExpanded !== false ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                        )}
                                    </button>
                                    {/* Move Up button */}
                                    <button
                                        onClick={() => moveItemUp(index)}
                                        title="Subir ítem"
                                        disabled={index === 0}
                                        style={{ background: index === 0 ? 'transparent' : '#f1f5f9', border: 'none', color: index === 0 ? '#cbd5e1' : '#475569', cursor: index === 0 ? 'not-allowed' : 'pointer', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        onMouseOver={(e) => { if (index !== 0) e.currentTarget.style.background = '#e2e8f0'; }}
                                        onMouseOut={(e) => { if (index !== 0) e.currentTarget.style.background = '#f1f5f9'; }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
                                    </button>
                                    {/* Move Down button */}
                                    <button
                                        onClick={() => moveItemDown(index)}
                                        title="Bajar ítem"
                                        disabled={index === data.items.length - 1}
                                        style={{ background: index === data.items.length - 1 ? 'transparent' : '#f1f5f9', border: 'none', color: index === data.items.length - 1 ? '#cbd5e1' : '#475569', cursor: index === data.items.length - 1 ? 'not-allowed' : 'pointer', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        onMouseOver={(e) => { if (index !== data.items.length - 1) e.currentTarget.style.background = '#e2e8f0'; }}
                                        onMouseOut={(e) => { if (index !== data.items.length - 1) e.currentTarget.style.background = '#f1f5f9'; }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
                                    </button>
                                    {/* Sub-items button */}
                                    <button
                                        onClick={() => setSubItemsModalData({ index, subItems: item.subItems || [] })}
                                        title="Sub-ítems (Cálculo interno)"
                                        style={{ background: '#fef3c7', border: 'none', color: '#d97706', cursor: 'pointer', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        onMouseOver={(e) => e.currentTarget.style.background = '#fde68a'}
                                        onMouseOut={(e) => e.currentTarget.style.background = '#fef3c7'}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                                    </button>
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
                            {item.isExpanded !== false && (
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem', marginTop: '1rem' }}>
                                <div style={{ gridColumn: 'span 5', position: 'relative' }}>
                                    {renderRemoteCursorLabel(`item_${index}_description`)}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <input
                                            placeholder="Título del ítem"
                                            style={getInputStyle(`item_${index}_description`, { width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc', fontWeight: 'bold' })}
                                            value={item.description}
                                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                            onFocus={() => handleFocus(`item_${index}_description`)}
                                            onBlur={() => handleBlur(`item_${index}_description`)}
                                        />
                                        <textarea
                                            placeholder="Descripción detallada (puedes usar: • para viñetas, **texto** para negrita, enters para nuevas líneas)"
                                            style={{ ...getInputStyle(`item_${index}_details`, { width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #94a3b8', minHeight: '50px' }), fontSize: '0.8rem', resize: 'vertical' }}
                                            value={item.details || ''}
                                            onChange={(e) => handleItemChange(index, 'details', e.target.value)}
                                            onFocus={() => handleFocus(`item_${index}_details`)}
                                            onBlur={() => handleBlur(`item_${index}_details`)}
                                        />
                                        <div style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', gap: '1rem' }}>
                                            <span>💡 Usa <b>•</b> para viñetas, <b>**texto**</b> para negrita, <b>Enter</b> para nuevas líneas</span>
                                        </div>

                                        {/* Image upload */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                                            {item.imageUrl ? (
                                                <>
                                                    <img
                                                        src={item.imageUrl}
                                                        alt="Imagen del ítem"
                                                        style={{ width: 72, height: 72, objectFit: 'contain', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc' }}
                                                    />
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                        <label style={{ fontSize: '0.72rem', color: '#475569', fontWeight: '600' }}>Imagen adjunta al ítem</label>
                                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                            <label style={{ cursor: 'pointer', fontSize: '0.72rem', color: '#0369a1', background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: 5, padding: '0.25rem 0.6rem', fontWeight: '600' }}>
                                                                Cambiar
                                                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => e.target.files[0] && uploadItemImage(index, e.target.files[0])} />
                                                            </label>
                                                            <button onClick={() => removeItemImage(index, item.imageUrl)} style={{ fontSize: '0.72rem', color: '#dc2626', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 5, padding: '0.25rem 0.6rem', cursor: 'pointer', fontWeight: '600' }}>
                                                                Quitar
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <label style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                    cursor: uploadingItem[index] ? 'wait' : 'pointer',
                                                    fontSize: '0.75rem', color: uploadingItem[index] ? '#94a3b8' : '#475569',
                                                    background: '#f8fafc', border: '1.5px dashed #cbd5e1',
                                                    borderRadius: 6, padding: '0.45rem 0.85rem', fontWeight: '600',
                                                    transition: 'border-color 0.15s',
                                                }}>
                                                    {uploadingItem[index]
                                                        ? <><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg> Subiendo...</>
                                                        : <><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> Añadir imagen</>
                                                    }
                                                    <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploadingItem[index]} onChange={(e) => e.target.files[0] && uploadItemImage(index, e.target.files[0])} />
                                                </label>
                                            )}
                                        </div>
                                    </div>
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
                            )}
                        </div>
                    ))}
                    <button onClick={addItem} className="btn" style={{ background: '#e5e7eb', color: '#374151', marginBottom: '1rem', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                        + Agregar Ítem
                    </button>

                    <h3 style={{ color: '#1e293b', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Notas / Condiciones</h3>
                    <div className="card-editor" style={{ position: 'relative' }}>
                        {renderRemoteCursorLabel('notes')}
                        <textarea
                            value={data.notes !== undefined ? data.notes : (data.generalConditions?.text || '')}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            onFocus={() => handleFocus('notes')}
                            onBlur={() => handleBlur('notes')}
                            rows={6}
                            style={getInputStyle('notes', { width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #ccc', fontFamily: 'inherit' })}
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
                            {dataForPdf && pdfDocument && (
                                <PDFDownloadLink
                                    document={pdfDocument}
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

            {subItemsModalData !== null && (
                <SubItemsModal
                    isOpen={true}
                    onClose={() => setSubItemsModalData(null)}
                    initialSubItems={subItemsModalData.subItems}
                    itemDescription={data.items[subItemsModalData.index]?.description}
                    onSave={handleSaveSubItems}
                />
            )}
        </ProtectedRoute>
    )
}
