import React, { useState } from 'react';
import { storage } from '@/lib/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/contexts/AuthContext';

const actionBtnStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.5rem 0.8rem',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    background: '#ffffff',
    color: '#475569',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
};

export function PendingsModal({ quotation, onClose, onSave }) {
    const { user } = useAuth();
    const [tasks, setTasks] = useState(quotation.operationsData?.tasks || []);
    const [materials, setMaterials] = useState(quotation.operationsData?.materials || []);

    const [newTask, setNewTask] = useState('');
    const [newMaterial, setNewMaterial] = useState('');
    const [uploadingState, setUploadingState] = useState({});

    const handleFileUpload = async (itemId, type, file) => {
        if (!file) return;
        setUploadingState(prev => ({ ...prev, [itemId]: 'Subiendo archivo a la nube...' }));
        try {
            const ext = file.name.split('.').pop();
            const filename = `pendings/${quotation.id}/${type}_${itemId}_${Date.now()}.${ext}`;
            const storageRef = ref(storage, filename);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            
            if (type === 'material') {
                let detectedCost = null;
                let scanData = null;
                setUploadingState(prev => ({ ...prev, [itemId]: 'Escaneando con OCR (puede tardar 5-15s)...' }));
                try {
                    const formData = new FormData();
                    formData.append('file', file);
                    const res = await fetch('/api/scan-invoice', { method: 'POST', body: formData });
                    const data = await res.json().catch(() => ({}));
                    if (res.ok) {
                        scanData = data;
                        if (data.amount) {
                            detectedCost = data.amount;
                            const partes = [`Monto: S/ ${detectedCost}`];
                            if (data.ruc)    partes.push(`RUC: ${data.ruc}`);
                            if (data.serie && data.numero) partes.push(`Comprobante: ${data.serie}-${data.numero}`);
                            if (data.fecha)  partes.push(`Fecha: ${data.fecha}`);
                            alert(`OCR detectó:\n\n${partes.join('\n')}`);
                        } else {
                            const etapas = (data.stages || []).map(s => `  · ${s.name}: ${s.error ? 'error → ' + s.error : s.chars + ' chars'}`).join('\n');
                            alert(`Documento escaneado pero no se detectó monto.\n\nEtapas:\n${etapas}\n\nIngresa el costo manualmente.`);
                            console.log('OCR debug:', data);
                        }
                    } else {
                        console.error('API /scan-invoice falló:', res.status, data);
                        alert(`Error en OCR (${res.status}): ${data?.error || 'desconocido'}\n\nVerifica que el archivo sea una imagen o PDF legible.`);
                    }
                } catch(e) {
                    console.error('Excepción al contactar OCR:', e);
                    alert('No se pudo contactar al OCR: ' + e.message);
                }

                setMaterials(prev => prev.map(m => m.id === itemId ? {
                    ...m,
                    attachmentUrl: url,
                    purchased: detectedCost ? true : m.purchased,
                    cost: detectedCost !== null ? detectedCost : m.cost,
                    ocrData: scanData ? {
                        ruc: scanData.ruc || null,
                        serie: scanData.serie || null,
                        numero: scanData.numero || null,
                        fecha: scanData.fecha || null,
                        razonSocial: scanData.razonSocial || null,
                        amount: scanData.amount || null,
                    } : (m.ocrData || null),
                } : m));

                // Auto-registrar en contabilidad si el OCR detectó monto
                if (scanData?.amount && user?.empresaId) {
                    setUploadingState(prev => ({ ...prev, [itemId]: 'Registrando en contabilidad...' }));
                    try {
                        const currentMaterial = materials.find(m => m.id === itemId) || {};
                        await fetch('/api/accounting/purchases/from-pending', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                companyProfileId: user.empresaId,
                                quotationId:      quotation.id,
                                materialId:       itemId,
                                materialTitle:    currentMaterial.title || '',
                                ocrData:          {
                                    ruc:        scanData.ruc        || null,
                                    serie:      scanData.serie      || null,
                                    numero:     scanData.numero     || null,
                                    fecha:      scanData.fecha      || null,
                                    razonSocial: scanData.razonSocial || null,
                                    amount:     scanData.amount,
                                },
                                attachmentUrl: url,
                            }),
                        });
                        // Marcar como registrado
                        setMaterials(prev => prev.map(m =>
                            m.id === itemId ? { ...m, purchaseLedgerId: 'auto' } : m
                        ));
                    } catch (regErr) {
                        console.error('Auto-registro contabilidad falló:', regErr);
                    }
                }

            } else if (type === 'material_image') {
                setMaterials(prev => prev.map(m => m.id === itemId ? { ...m, productImageUrl: url } : m));
            } else {
                setTasks(prev => prev.map(t => t.id === itemId ? { ...t, attachmentUrl: url } : t));
            }
        } catch (error) {
            console.error("Error al subir archivo:", error);
            alert("Error al subir el archivo.");
        } finally {
            setUploadingState(prev => {
                const newState = { ...prev };
                delete newState[itemId];
                return newState;
            });
        }
    };

    const handleFileDelete = (itemId, type) => {
        if (!window.confirm("¿Estás seguro de que deseas eliminar este archivo?")) return;
        
        if (type === 'material') {
            setMaterials(prev => prev.map(m => m.id === itemId ? { ...m, attachmentUrl: null, cost: '' } : m));
        } else if (type === 'material_image') {
            setMaterials(prev => prev.map(m => m.id === itemId ? { ...m, productImageUrl: null } : m));
        } else {
            setTasks(prev => prev.map(t => t.id === itemId ? { ...t, attachmentUrl: null } : t));
        }
    };

    const handleAddTask = () => {
        if (!newTask.trim()) return;
        setTasks([...tasks, { id: Date.now(), title: newTask.trim(), completed: false }]);
        setNewTask('');
    };

    const handleAddMaterial = () => {
        if (!newMaterial.trim()) return;
        setMaterials([...materials, { id: Date.now(), title: newMaterial.trim(), purchased: false }]);
        setNewMaterial('');
    };

    const toggleTask = (id) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const toggleMaterial = (id) => {
        setMaterials(materials.map(m => m.id === id ? { ...m, purchased: !m.purchased } : m));
    };

    const updateMaterialField = (id, field, value) => {
        setMaterials(materials.map(m => m.id === id ? { ...m, [field]: value } : m));
    };

    const toggleExpandMaterial = (id) => {
        setMaterials(materials.map(m => m.id === id ? { ...m, isExpanded: !m.isExpanded } : m));
    };

    const removeTask = (id) => setTasks(tasks.filter(t => t.id !== id));
    const removeMaterial = (id) => setMaterials(materials.filter(m => m.id !== id));

    // Envía un material escaneado al registro de compras del módulo contable
    const handleRegisterAsPurchase = async (material) => {
        if (!material.ocrData) {
            alert('Este material no tiene datos OCR. Sube primero un comprobante con "Archivo" o "Cámara".');
            return;
        }
        try {
            // Usar directamente el empresaId del usuario autenticado
            const companyProfileId = user?.empresaId;
            if (!companyProfileId) {
                alert('No hay perfil de empresa configurado. Verifica tu sesión.');
                return;
            }

            const res = await fetch('/api/accounting/purchases/from-pending', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyProfileId,
                    quotationId:  quotation.id,
                    materialId:   material.id,
                    materialTitle: material.title,
                    ocrData:      material.ocrData,
                    attachmentUrl: material.attachmentUrl,
                }),
            });
            const data = await res.json();
            if (!res.ok) { alert(data.error || 'Error al registrar compra'); return; }

            if (data.alreadyExists) {
                alert(`Esta compra ya está registrada en contabilidad (${data.serie || ''}-${data.numero || ''}).`);
            } else {
                const detail = [`Periodo: ${data.period}`, `Total: S/ ${data.total}`,
                    data.serie && `Comprobante: ${data.serie}-${data.numero}`,
                    data.numeroDocProveedor && `RUC: ${data.numeroDocProveedor}`,
                    data.needsReview && '⚠ Datos incompletos — revísala en el Registro de Compras'].filter(Boolean).join('\n');
                alert(`Compra registrada en contabilidad:\n\n${detail}`);
            }
            // Marcar el material para no volver a registrarlo
            setMaterials(prev => prev.map(m => m.id === material.id ? { ...m, purchaseLedgerId: data.id } : m));
        } catch (e) {
            alert('Error al registrar: ' + e.message);
        }
    };

    const handleSave = () => {
        onSave({ tasks, materials });
        onClose();
    };

    // Initialize materials from subItems if materials array is empty
    const handleImportFromSubItems = () => {
        if (!quotation.items) return;
        const imported = [];
        quotation.items.forEach(item => {
            if (item.subItems) {
                item.subItems.forEach(sub => {
                    if (sub.description) {
                        imported.push({
                            id: Date.now() + Math.random(),
                            title: `${sub.quantity || 1}x ${sub.description}`,
                            purchased: false
                        });
                    }
                });
            }
        });
        if (imported.length > 0) {
            setMaterials([...materials, ...imported]);
        } else {
            alert('No se encontraron sub-ítems en la cotización.');
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
            <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>Operaciones: {quotation.code}</h2>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>{quotation.clientName}</p>
                    </div>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
                </div>

                <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Materiales Section */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                🛒 Materiales a Comprar
                            </h3>
                            {materials.length === 0 && (
                                <button onClick={handleImportFromSubItems} style={{ fontSize: '0.75rem', background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.3rem 0.6rem', borderRadius: '6px', cursor: 'pointer', color: '#475569', fontWeight: '600' }}>
                                    Importar de Sub-ítems
                                </button>
                            )}
                        </div>
                        
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                            <input 
                                type="text" 
                                className="input" 
                                value={newMaterial} 
                                onChange={(e) => setNewMaterial(e.target.value)} 
                                onKeyDown={(e) => e.key === 'Enter' && handleAddMaterial()}
                                placeholder="Ej: 5m de Cable Eléctrico N°12..." 
                                style={{ flex: 1 }} 
                            />
                            <button className="btn btn-secondary" onClick={handleAddMaterial}>Añadir</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {materials.map(m => (
                                <div key={m.id} style={{ display: 'flex', flexDirection: 'column', padding: '1rem', background: m.purchased ? '#f0fdf4' : '#f8fafc', border: `1px solid ${m.purchased ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: '8px', gap: '0.75rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, paddingRight: '1rem' }}>
                                            <input type="checkbox" checked={m.purchased} onChange={() => toggleMaterial(m.id)} style={{ width: '22px', height: '22px', cursor: 'pointer', flexShrink: 0 }} />
                                            <span style={{ fontSize: '1rem', color: m.purchased ? '#16a34a' : '#334155', textDecoration: m.purchased ? 'line-through' : 'none', wordBreak: 'break-word', fontWeight: '500' }}>
                                                {m.title}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                            <button onClick={() => toggleExpandMaterial(m.id)} style={{ border: '1px solid #cbd5e1', background: '#fff', color: '#64748b', borderRadius: '6px', cursor: 'pointer', padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: '600' }}>
                                                {m.isExpanded ? 'Ocultar info' : 'Añadir info'}
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: m.isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9" /></svg>
                                            </button>
                                            <button onClick={() => removeMaterial(m.id)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.3rem', display: 'flex', alignItems: 'center' }}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                            </button>
                                        </div>
                                    </div>

                                    {m.isExpanded && (
                                        <div style={{ padding: '0.75rem', background: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
                                                <input type="text" className="input" placeholder="Marca" value={m.brand || ''} onChange={(e) => updateMaterialField(m.id, 'brand', e.target.value)} style={{ fontSize: '0.8rem', padding: '0.4rem' }} />
                                                <input type="text" className="input" placeholder="Modelo" value={m.model || ''} onChange={(e) => updateMaterialField(m.id, 'model', e.target.value)} style={{ fontSize: '0.8rem', padding: '0.4rem' }} />
                                                <input type="text" className="input" placeholder="Código" value={m.code || ''} onChange={(e) => updateMaterialField(m.id, 'code', e.target.value)} style={{ fontSize: '0.8rem', padding: '0.4rem' }} />
                                                <input type="number" className="input" placeholder="Costo (S/)" value={m.cost || ''} onChange={(e) => updateMaterialField(m.id, 'cost', parseFloat(e.target.value))} style={{ fontSize: '0.8rem', padding: '0.4rem' }} />
                                                <input type="url" className="input" placeholder="Link de compra" value={m.buyLink || ''} onChange={(e) => updateMaterialField(m.id, 'buyLink', e.target.value)} style={{ fontSize: '0.8rem', padding: '0.4rem' }} />
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.2rem' }}>
                                                <label style={{...actionBtnStyle, padding: '0.3rem 0.6rem'}}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                                                    <span style={{ fontSize: '0.75rem' }}>Imagen del Producto</span>
                                                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(m.id, 'material_image', e.target.files[0])} />
                                                </label>
                                                {m.productImageUrl && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <a href={m.productImageUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: '#3b82f6', textDecoration: 'underline', fontWeight: '600' }}>Ver Imagen</a>
                                                        <button onClick={() => handleFileDelete(m.id, 'material_image')} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>✕</button>
                                                    </div>
                                                )}
                                                {uploadingState[m.id] && <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Subiendo...</span>}
                                            </div>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${m.purchased ? '#bbf7d0' : '#e2e8f0'}`, paddingTop: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {uploadingState[m.id] ? (
                                                <span style={{ fontSize: '0.85rem', color: '#ea580c', padding: '0.5rem 0', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="spin"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
                                                    {uploadingState[m.id]}
                                                </span>
                                            ) : (
                                                <>
                                                    <label style={actionBtnStyle}>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                                                        <span>Archivo</span>
                                                        <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={(e) => handleFileUpload(m.id, 'material', e.target.files[0])} />
                                                    </label>
                                                    <label style={actionBtnStyle}>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                                                        <span>Cámara</span>
                                                        <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => handleFileUpload(m.id, 'material', e.target.files[0])} />
                                                    </label>
                                                </>
                                            )}
                                        </div>
                                        {m.attachmentUrl && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                <a href={m.attachmentUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#3b82f6', fontSize: '0.85rem', fontWeight: '600', textDecoration: 'none', background: '#eff6ff', padding: '0.4rem 0.8rem', borderRadius: '6px' }}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M10 14L21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
                                                    Ver Factura
                                                </a>
                                                {m.ocrData?.amount && (
                                                    <button
                                                        onClick={() => handleRegisterAsPurchase(m)}
                                                        title={m.purchaseLedgerId ? 'Ya registrada en contabilidad' : 'Crear entrada en el registro de compras del módulo contable'}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '0.3rem',
                                                            color: m.purchaseLedgerId ? '#16a34a' : '#1e293b',
                                                            background: m.purchaseLedgerId ? '#dcfce7' : '#f1f5f9',
                                                            border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px',
                                                            fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer'
                                                        }}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="12" y2="18"/></svg>
                                                        {m.purchaseLedgerId ? 'En contabilidad' : 'Registrar en contabilidad'}
                                                    </button>
                                                )}
                                                <button onClick={() => handleFileDelete(m.id, 'material')} style={{ border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer', padding: '0.4rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                    ✕
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {materials.length === 0 && <p style={{ fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center', margin: '1rem 0' }}>No hay materiales registrados.</p>}
                        </div>
                    </div>

                    {/* Tareas Section */}
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            🛠️ Tareas de Ejecución
                        </h3>
                        
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                            <input 
                                type="text" 
                                className="input" 
                                value={newTask} 
                                onChange={(e) => setNewTask(e.target.value)} 
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                                placeholder="Ej: Instalación de tableros..." 
                                style={{ flex: 1 }} 
                            />
                            <button className="btn btn-secondary" onClick={handleAddTask}>Añadir</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {tasks.map(t => (
                                <div key={t.id} style={{ display: 'flex', flexDirection: 'column', padding: '1rem', background: t.completed ? '#f0fdf4' : '#f8fafc', border: `1px solid ${t.completed ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: '8px', gap: '0.75rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, paddingRight: '1rem' }}>
                                            <input type="checkbox" checked={t.completed} onChange={() => toggleTask(t.id)} style={{ width: '22px', height: '22px', cursor: 'pointer', flexShrink: 0 }} />
                                            <span style={{ fontSize: '1rem', color: t.completed ? '#16a34a' : '#334155', textDecoration: t.completed ? 'line-through' : 'none', wordBreak: 'break-word', fontWeight: '500' }}>
                                                {t.title}
                                            </span>
                                        </div>
                                        <button onClick={() => removeTask(t.id)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center' }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${t.completed ? '#bbf7d0' : '#e2e8f0'}`, paddingTop: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {uploadingState[t.id] ? (
                                                <span style={{ fontSize: '0.85rem', color: '#ea580c', padding: '0.5rem 0', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="spin"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
                                                    {uploadingState[t.id]}
                                                </span>
                                            ) : (
                                                <>
                                                    <label style={actionBtnStyle}>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                                                        <span>Archivo</span>
                                                        <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={(e) => handleFileUpload(t.id, 'task', e.target.files[0])} />
                                                    </label>
                                                    <label style={actionBtnStyle}>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                                                        <span>Cámara</span>
                                                        <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => handleFileUpload(t.id, 'task', e.target.files[0])} />
                                                    </label>
                                                </>
                                            )}
                                        </div>
                                        {t.attachmentUrl && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <a href={t.attachmentUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#3b82f6', fontSize: '0.85rem', fontWeight: '600', textDecoration: 'none', background: '#eff6ff', padding: '0.4rem 0.8rem', borderRadius: '6px' }}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M10 14L21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
                                                    Ver Evidencia
                                                </a>
                                                <button onClick={() => handleFileDelete(t.id, 'task')} style={{ border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer', padding: '0.4rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                    ✕
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {tasks.length === 0 && <p style={{ fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center', margin: '1rem 0' }}>No hay tareas registradas.</p>}
                        </div>
                    </div>
                </div>

                <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: '#f8fafc', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
                    <button onClick={onClose} className="btn btn-secondary">Cancelar</button>
                    <button onClick={handleSave} className="btn btn-primary">Guardar Cambios</button>
                </div>
            </div>
        </div>
    );
}
