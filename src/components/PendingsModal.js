import React, { useState } from 'react';
import { storage } from '@/lib/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/contexts/AuthContext';

const actionBtnStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.4rem 0.8rem',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    background: '#ffffff',
    color: '#475569',
    fontSize: '0.8rem',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
};

export function PendingsModal({ quotation, onClose, onSave }) {
    const { user } = useAuth();
    const [tasks, setTasks] = useState(quotation.operationsData?.tasks?.map(t => ({
        ...t,
        status: t.status || (t.completed ? 'completed' : 'pending')
    })) || []);
    const [materials, setMaterials] = useState(quotation.operationsData?.materials || []);

    const [newTask, setNewTask] = useState('');
    const [newMaterial, setNewMaterial] = useState('');
    const [uploadingState, setUploadingState] = useState({});
    
    // null | { type: 'task' | 'material', id: number/string }
    const [selectedItem, setSelectedItem] = useState(null);

    const handleFileUpload = async (itemId, type, file) => {
        if (!file) return;
        setUploadingState(prev => ({ ...prev, [itemId]: 'Subiendo...' }));
        try {
            const ext = file.name.split('.').pop();
            const filename = `pendings/${quotation.id}/${type}_${itemId}_${Date.now()}.${ext}`;
            const storageRef = ref(storage, filename);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            
            if (type === 'material') {
                let detectedCost = null;
                let scanData = null;
                setUploadingState(prev => ({ ...prev, [itemId]: 'Escaneando OCR...' }));
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
                            alert(`Documento escaneado pero no se detectó monto.\nIngresa el costo manualmente.`);
                        }
                    } else {
                        alert(`Error en OCR (${res.status}): ${data?.error || 'desconocido'}`);
                    }
                } catch(e) {
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
                        setMaterials(prev => prev.map(m =>
                            m.id === itemId ? { ...m, purchaseLedgerId: 'auto' } : m
                        ));
                    } catch (regErr) {
                        console.error('Auto-registro falló:', regErr);
                    }
                }

            } else if (type === 'material_image') {
                setMaterials(prev => prev.map(m => m.id === itemId ? { ...m, productImageUrl: url } : m));
            } else {
                setTasks(prev => prev.map(t => t.id === itemId ? { ...t, attachmentUrl: url } : t));
            }
        } catch (error) {
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
        if (!window.confirm("¿Estás seguro de eliminar este archivo?")) return;
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
        const newId = Date.now();
        setTasks([...tasks, { id: newId, title: newTask.trim(), completed: false, status: 'pending' }]);
        setNewTask('');
        setSelectedItem({ type: 'task', id: newId });
    };

    const handleAddMaterial = () => {
        if (!newMaterial.trim()) return;
        const newId = Date.now();
        setMaterials([...materials, { id: newId, title: newMaterial.trim(), purchased: false }]);
        setNewMaterial('');
        setSelectedItem({ type: 'material', id: newId });
    };

    const updateTaskField = (id, field, value) => {
        setTasks(tasks.map(t => {
            if (t.id === id) {
                const updated = { ...t, [field]: value };
                if (field === 'status') updated.completed = (value === 'completed');
                return updated;
            }
            return t;
        }));
    };

    const toggleMaterial = (id) => {
        setMaterials(materials.map(m => m.id === id ? { ...m, purchased: !m.purchased } : m));
    };

    const updateMaterialField = (id, field, value) => {
        setMaterials(materials.map(m => m.id === id ? { ...m, [field]: value } : m));
    };

    const removeTask = (id) => {
        setTasks(tasks.filter(t => t.id !== id));
        if (selectedItem?.id === id) setSelectedItem(null);
    };
    
    const removeMaterial = (id) => {
        setMaterials(materials.filter(m => m.id !== id));
        if (selectedItem?.id === id) setSelectedItem(null);
    };

    const handleRegisterAsPurchase = async (material) => {
        if (!material.ocrData) {
            alert('Sube primero un comprobante para usar el OCR.');
            return;
        }
        try {
            const companyProfileId = user?.empresaId;
            if (!companyProfileId) return;

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
            if (!res.ok) { alert(data.error || 'Error al registrar'); return; }

            if (data.alreadyExists) {
                alert(`Ya está registrada (${data.serie || ''}-${data.numero || ''}).`);
            } else {
                alert('Compra registrada en contabilidad exitosamente.');
            }
            setMaterials(prev => prev.map(m => m.id === material.id ? { ...m, purchaseLedgerId: data.id } : m));
        } catch (e) {
            alert('Error al registrar: ' + e.message);
        }
    };

    const handleSave = () => {
        onSave({ tasks, materials });
        onClose();
    };

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
        if (imported.length > 0) setMaterials([...materials, ...imported]);
    };

    // Rendering Helpers
    const renderTaskDetails = (t) => {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.2s ease-out' }}>
                <div>
                    <h3 style={{ fontSize: '1.1rem', color: '#0f172a', margin: '0 0 0.5rem 0', fontWeight: '600' }}>Detalles de la Tarea</h3>
                    <input 
                        type="text" 
                        className="input" 
                        value={t.title} 
                        onChange={e => updateTaskField(t.id, 'title', e.target.value)} 
                        style={{ fontSize: '1rem', fontWeight: '500', width: '100%' }} 
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', background: '#fff', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div>
                        <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginBottom: '0.4rem', display: 'block' }}>Estado</label>
                        <select className="input" value={t.status} onChange={e => updateTaskField(t.id, 'status', e.target.value)} style={{ padding: '0.5rem' }}>
                            <option value="pending">Pendiente</option>
                            <option value="progress">En Progreso</option>
                            <option value="completed">Completado</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginBottom: '0.4rem', display: 'block' }}>Fecha Inicio</label>
                        <input type="date" className="input" value={t.startDate || ''} onChange={e => updateTaskField(t.id, 'startDate', e.target.value)} style={{ padding: '0.5rem' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginBottom: '0.4rem', display: 'block' }}>Fecha Fin</label>
                        <input type="date" className="input" value={t.endDate || ''} onChange={e => updateTaskField(t.id, 'endDate', e.target.value)} style={{ padding: '0.5rem' }} />
                    </div>
                </div>

                <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cronograma</h4>
                    {t.startDate && t.endDate ? (
                        <div style={{ position: 'relative', height: '36px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                            <div style={{ 
                                position: 'absolute', top: 0, bottom: 0, left: '5%', right: '5%', 
                                background: t.status === 'completed' ? '#10b981' : t.status === 'progress' ? '#3b82f6' : '#94a3b8', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: '600', borderRadius: '6px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                                {t.startDate} al {t.endDate}
                            </div>
                        </div>
                    ) : (
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0, fontStyle: 'italic' }}>Define las fechas de inicio y fin para generar la línea de tiempo.</p>
                    )}
                </div>

                <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Evidencia</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        {uploadingState[t.id] ? (
                            <span style={{ fontSize: '0.8rem', color: '#ea580c', fontWeight: '600' }}>{uploadingState[t.id]}</span>
                        ) : (
                            <>
                                <label style={actionBtnStyle}>
                                    Archivo
                                    <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={(e) => handleFileUpload(t.id, 'task', e.target.files[0])} />
                                </label>
                                <label style={actionBtnStyle}>
                                    Cámara
                                    <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => handleFileUpload(t.id, 'task', e.target.files[0])} />
                                </label>
                            </>
                        )}
                        {t.attachmentUrl && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <a href={t.attachmentUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: '#3b82f6', textDecoration: 'underline' }}>Ver Evidencia</a>
                                <button onClick={() => handleFileDelete(t.id, 'task')} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>✕</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderMaterialDetails = (m) => {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.2s ease-out' }}>
                <div>
                    <h3 style={{ fontSize: '1.1rem', color: '#0f172a', margin: '0 0 0.5rem 0', fontWeight: '600' }}>Detalles de Compra</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input type="checkbox" checked={m.purchased} onChange={() => toggleMaterial(m.id)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                        <input type="text" className="input" value={m.title} onChange={e => updateMaterialField(m.id, 'title', e.target.value)} style={{ fontSize: '1rem', fontWeight: '500', flex: 1, textDecoration: m.purchased ? 'line-through' : 'none', color: m.purchased ? '#64748b' : '#0f172a' }} />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', background: '#fff', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div>
                        <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginBottom: '0.4rem', display: 'block' }}>Marca</label>
                        <input type="text" className="input" value={m.brand || ''} onChange={e => updateMaterialField(m.id, 'brand', e.target.value)} style={{ padding: '0.5rem' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginBottom: '0.4rem', display: 'block' }}>Modelo</label>
                        <input type="text" className="input" value={m.model || ''} onChange={e => updateMaterialField(m.id, 'model', e.target.value)} style={{ padding: '0.5rem' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginBottom: '0.4rem', display: 'block' }}>Costo Total (S/)</label>
                        <input type="number" className="input" value={m.cost || ''} onChange={e => updateMaterialField(m.id, 'cost', parseFloat(e.target.value))} style={{ padding: '0.5rem' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginBottom: '0.4rem', display: 'block' }}>Link de Compra</label>
                        <input type="url" className="input" value={m.buyLink || ''} onChange={e => updateMaterialField(m.id, 'buyLink', e.target.value)} style={{ padding: '0.5rem' }} />
                    </div>
                </div>

                <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Comprobante de Pago</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        {uploadingState[m.id] ? (
                            <span style={{ fontSize: '0.8rem', color: '#ea580c', fontWeight: '600' }}>{uploadingState[m.id]}</span>
                        ) : (
                            <>
                                <label style={actionBtnStyle}>
                                    Archivo / PDF
                                    <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={(e) => handleFileUpload(m.id, 'material', e.target.files[0])} />
                                </label>
                                <label style={actionBtnStyle}>
                                    Cámara
                                    <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => handleFileUpload(m.id, 'material', e.target.files[0])} />
                                </label>
                            </>
                        )}
                        {m.attachmentUrl && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <a href={m.attachmentUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: '#3b82f6', textDecoration: 'underline' }}>Ver Comprobante</a>
                                {m.ocrData?.amount && (
                                    <button onClick={() => handleRegisterAsPurchase(m)} style={{ border: 'none', background: m.purchaseLedgerId ? '#dcfce7' : '#f1f5f9', color: m.purchaseLedgerId ? '#16a34a' : '#0f172a', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}>
                                        {m.purchaseLedgerId ? 'Contabilizado' : 'Enviar a Contabilidad'}
                                    </button>
                                )}
                                <button onClick={() => handleFileDelete(m.id, 'material')} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>✕</button>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Foto del Producto</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <label style={actionBtnStyle}>
                            Subir Imagen
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(m.id, 'material_image', e.target.files[0])} />
                        </label>
                        {m.productImageUrl && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <a href={m.productImageUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: '#3b82f6', textDecoration: 'underline' }}>Ver Imagen</a>
                                <button onClick={() => handleFileDelete(m.id, 'material_image')} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>✕</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderDashboard = () => {
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const tasksPct = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;
        
        const completedMaterials = materials.filter(m => m.purchased).length;
        const materialsPct = materials.length ? Math.round((completedMaterials / materials.length) * 100) : 0;

        const totalSpent = materials.reduce((acc, m) => acc + (parseFloat(m.cost) || 0), 0);

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 0.2s ease-out' }}>
                <div>
                    <h3 style={{ fontSize: '1.25rem', color: '#0f172a', margin: '0 0 0.2rem 0', fontWeight: '700' }}>Panel de Control</h3>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Selecciona un elemento de la izquierda para ver y editar sus detalles.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569', textTransform: 'uppercase' }}>Avance Tareas</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>{tasksPct}%</span>
                        </div>
                        <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                            <div style={{ width: `${tasksPct}%`, height: '100%', background: tasksPct === 100 ? '#10b981' : '#3b82f6', transition: 'width 0.3s' }} />
                        </div>
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>{completedTasks} de {tasks.length} completadas</p>
                    </div>

                    <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569', textTransform: 'uppercase' }}>Avance Compras</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>{materialsPct}%</span>
                        </div>
                        <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                            <div style={{ width: `${materialsPct}%`, height: '100%', background: materialsPct === 100 ? '#10b981' : '#f59e0b', transition: 'width 0.3s' }} />
                        </div>
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>{completedMaterials} de {materials.length} adquiridas</p>
                    </div>

                    <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Total Gastado</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ea580c' }}>S/ {totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>

                {tasks.length > 0 && (
                    <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#0f172a', fontWeight: '600' }}>Cronograma General</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {tasks.map(t => (
                                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem' }} onClick={() => setSelectedItem({ type: 'task', id: t.id })}>
                                    <div style={{ width: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#334155', fontWeight: '500', cursor: 'pointer' }}>{t.title}</div>
                                    <div style={{ flex: 1, height: '24px', background: '#f1f5f9', borderRadius: '4px', position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
                                        {t.startDate && t.endDate ? (
                                            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, background: t.status === 'completed' ? '#10b981' : t.status === 'progress' ? '#3b82f6' : '#94a3b8', display: 'flex', alignItems: 'center', paddingLeft: '0.5rem', color: '#fff', fontSize: '0.7rem', fontWeight: '600' }}>
                                                {t.startDate.slice(5)} al {t.endDate.slice(5)}
                                            </div>
                                        ) : (
                                            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', paddingLeft: '0.5rem', color: '#94a3b8', fontSize: '0.7rem' }}>Sin programar</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '2rem' }}>
            <div style={{ background: '#ffffff', borderRadius: '12px', width: '95vw', maxWidth: '1200px', height: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: '700' }}>Control de Proyecto: {quotation.code}</h2>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', marginTop: '0.1rem' }}>{quotation.clientName}</p>
                    </div>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color='#0f172a'} onMouseLeave={e => e.target.style.color='#94a3b8'}>✕</button>
                </div>

                {/* Body 2-Columns */}
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    
                    {/* Left Column: Lists */}
                    <div style={{ width: '320px', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', background: '#f8fafc', overflowY: 'auto' }}>
                        
                        <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                                <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#334155', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tareas</h3>
                            </div>
                            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
                                <input type="text" className="input" value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddTask()} placeholder="Nueva tarea..." style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.85rem' }} />
                                <button className="btn btn-secondary" onClick={handleAddTask} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Añadir</button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                {tasks.map(t => {
                                    const isSelected = selectedItem?.type === 'task' && selectedItem?.id === t.id;
                                    return (
                                        <div 
                                            key={t.id} 
                                            onClick={() => setSelectedItem({ type: 'task', id: t.id })}
                                            style={{ 
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.8rem', 
                                                background: isSelected ? '#eff6ff' : '#fff', borderStyle: 'solid', borderWidth: '1px 1px 1px 3px',
                                                borderColor: `${isSelected ? '#bfdbfe' : '#e2e8f0'} ${isSelected ? '#bfdbfe' : '#e2e8f0'} ${isSelected ? '#bfdbfe' : '#e2e8f0'} ${t.status === 'completed' ? '#10b981' : t.status === 'progress' ? '#3b82f6' : '#cbd5e1'}`,
                                                borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s'
                                            }}
                                        >
                                            <span style={{ fontSize: '0.85rem', color: t.status === 'completed' ? '#64748b' : '#334155', textDecoration: t.status === 'completed' ? 'line-through' : 'none', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                                            <button onClick={(e) => { e.stopPropagation(); removeTask(t.id); }} style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0 0.2rem' }}>✕</button>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                                <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#334155', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Materiales</h3>
                                {materials.length === 0 && (
                                    <button onClick={handleImportFromSubItems} style={{ fontSize: '0.7rem', background: '#fff', border: '1px solid #cbd5e1', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer', color: '#475569' }}>Importar</button>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
                                <input type="text" className="input" value={newMaterial} onChange={e => setNewMaterial(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddMaterial()} placeholder="Nuevo material..." style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.85rem' }} />
                                <button className="btn btn-secondary" onClick={handleAddMaterial} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Añadir</button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                {materials.map(m => {
                                    const isSelected = selectedItem?.type === 'material' && selectedItem?.id === m.id;
                                    return (
                                        <div 
                                            key={m.id} 
                                            onClick={() => setSelectedItem({ type: 'material', id: m.id })}
                                            style={{ 
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.8rem', 
                                                background: isSelected ? '#eff6ff' : '#fff', borderStyle: 'solid', borderWidth: '1px 1px 1px 3px',
                                                borderColor: `${isSelected ? '#bfdbfe' : '#e2e8f0'} ${isSelected ? '#bfdbfe' : '#e2e8f0'} ${isSelected ? '#bfdbfe' : '#e2e8f0'} ${m.purchased ? '#10b981' : '#f59e0b'}`,
                                                borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s'
                                            }}
                                        >
                                            <span style={{ fontSize: '0.85rem', color: m.purchased ? '#64748b' : '#334155', textDecoration: m.purchased ? 'line-through' : 'none', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</span>
                                            <button onClick={(e) => { e.stopPropagation(); removeMaterial(m.id); }} style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0 0.2rem' }}>✕</button>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Details */}
                    <div style={{ flex: 1, background: '#f8fafc', padding: '2rem', overflowY: 'auto' }}>
                        {selectedItem ? (
                            selectedItem.type === 'task' 
                                ? renderTaskDetails(tasks.find(t => t.id === selectedItem.id))
                                : renderMaterialDetails(materials.find(m => m.id === selectedItem.id))
                        ) : (
                            renderDashboard()
                        )}
                    </div>

                </div>

                {/* Footer */}
                <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: '#fff' }}>
                    <button onClick={onClose} className="btn btn-secondary">Cerrar sin guardar</button>
                    <button onClick={handleSave} className="btn btn-primary" style={{ padding: '0.6rem 1.5rem' }}>Guardar Cambios</button>
                </div>
            </div>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
