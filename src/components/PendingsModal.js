import React, { useState, useRef, useEffect } from 'react';
import { storage } from '@/lib/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/contexts/AuthContext';
import DuplicateAmountAlert from './DuplicateAmountAlert';

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

const ASSIGNEE_COLORS = [
    '#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', 
    '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', 
    '#10b981', '#22c55e', '#84cc16', '#eab308', '#f59e0b', '#f97316'
];

export function PendingsModal({ quotation, onClose, onSave }) {
    const localScrollRef = useRef(null);
    const { user } = useAuth();
    const [tasks, setTasks] = useState(quotation.operationsData?.tasks?.map(t => {
        const assigneeIds = t.assigneeIds || (t.assigneeId ? [t.assigneeId] : []);
        return {
            ...t,
            assigneeIds,
            status: t.status || (t.completed ? 'completed' : 'pending')
        };
    }) || []);
    const [materials, setMaterials] = useState(quotation.operationsData?.materials?.map(m => {
        const assigneeIds = m.assigneeIds || (m.assigneeId ? [m.assigneeId] : []);
        return { ...m, assigneeIds };
    }) || []);

    const [projectStartDate, setProjectStartDate] = useState(quotation.operationsData?.projectStartDate || '');
    const [projectEndDate, setProjectEndDate] = useState(quotation.operationsData?.projectEndDate || '');
    const [projectAssignees, setProjectAssignees] = useState(quotation.operationsData?.projectAssignees || []);

    const [saveStatus, setSaveStatus] = useState(null);

    const [newTask, setNewTask] = useState('');
    const [newMaterial, setNewMaterial] = useState('');
    const [uploadingState, setUploadingState] = useState({});
    const [duplicateStatuses, setDuplicateStatuses] = useState({});
    
    const [teamMembers, setTeamMembers] = useState([]);
    const [loans, setLoans] = useState([]);
    
    useEffect(() => {
        if (!user?.empresaId) return;
        
        fetch(`/api/team?empresaId=${user.empresaId}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setTeamMembers(data);
            })
            .catch(err => console.error('Error fetching team', err));

        fetch(`/api/loans?empresaId=${user.empresaId}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setLoans(data.filter(l => l.status === 'ACTIVE'));
            })
            .catch(err => console.error('Error fetching loans', err));
    }, [user]);

    // null | { type: 'task' | 'material', id: number/string }
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        if (!selectedItem && localScrollRef.current) {
            const nowMs = Date.now();
            let minT = projectStartDate ? new Date(`${projectStartDate}T00:00:00`).getTime() : null;
            let maxT = projectEndDate ? new Date(`${projectEndDate}T23:59:59`).getTime() : null;
            const tasksWithDates = tasks.filter(t => t.startDate && t.endDate);
            if (tasksWithDates.length > 0) {
                const minTasks = Math.min(...tasksWithDates.map(t => new Date(`${t.startDate}T00:00:00`).getTime()));
                const maxTasks = Math.max(...tasksWithDates.map(t => new Date(`${t.endDate}T23:59:59`).getTime()));
                if (!minT || minTasks < minT) minT = minTasks;
                if (!maxT || maxTasks > maxT) maxT = maxTasks;
            }
            if (!minT || nowMs < minT) minT = nowMs;
            if (!maxT || nowMs > maxT) maxT = nowMs;
            
            const minDate = new Date(minT);
            minDate.setDate(minDate.getDate() + (minDate.getDay() === 0 ? -6 : 1 - minDate.getDay()));
            minDate.setHours(0,0,0,0);
            
            const maxDate = new Date(maxT);
            maxDate.setDate(maxDate.getDate() + (maxDate.getDay() === 0 ? 0 : 7 - maxDate.getDay()));
            maxDate.setHours(23,59,59,999);
            
            const gridStartMs = minDate.getTime();
            let gridEndMs = maxDate.getTime();
            if (gridEndMs - gridStartMs < 35 * 24 * 60 * 60 * 1000) {
                gridEndMs = gridStartMs + 35 * 24 * 60 * 60 * 1000;
            }
            const totalMs = gridEndMs - gridStartMs;
            const nowPct = ((nowMs - gridStartMs) / totalMs) * 100;
            
            const containerWidth = localScrollRef.current.clientWidth;
            const scrollWidth = localScrollRef.current.scrollWidth;
            const targetScroll = (scrollWidth * (nowPct / 100)) - (containerWidth / 2);
            localScrollRef.current.scrollLeft = Math.max(0, targetScroll);
        }
    }, [selectedItem, projectStartDate, projectEndDate, tasks]);

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

                const detectedCurrency = scanData?.currency || 'PEN';

                setMaterials(prev => prev.map(m => m.id === itemId ? {
                    ...m,
                    attachmentUrl: url,
                    purchased: detectedCost ? true : m.purchased,
                    cost: detectedCost !== null ? detectedCost : m.cost,
                    moneda: detectedCurrency || m.moneda || 'PEN',
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
                                fundingSourceId: currentMaterial.fundingSourceId || '',
                                moneda: detectedCurrency,
                                tipoCambio: currentMaterial.tipoCambio || null,
                                totalCost: detectedCost,
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

    const handleToggleTaskAssignee = (taskId, assigneeId) => {
        setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
                const current = t.assigneeIds || [];
                const next = current.includes(assigneeId) ? current.filter(id => id !== assigneeId) : [...current, assigneeId];
                return { ...t, assigneeIds: next };
            }
            return t;
        }));
    };

    const handleToggleProjectAssignee = (assigneeId) => {
        setProjectAssignees(prev => {
            if (prev.includes(assigneeId)) return prev.filter(id => id !== assigneeId);
            return [...prev, assigneeId];
        });
    };

    const handleToggleMaterialAssignee = (materialId, memberId) => {
        setMaterials(materials.map(m => {
            if (m.id === materialId) {
                const current = m.assigneeIds || [];
                const newAssigneeIds = current.includes(memberId) 
                    ? current.filter(id => id !== memberId) 
                    : [...current, memberId];
                return { ...m, assigneeIds: newAssigneeIds };
            }
            return m;
        }));
    };

    const removeTask = (id) => {
        setTasks(tasks.filter(t => t.id !== id));
        if (selectedItem?.id === id) setSelectedItem(null);
    };
    
    const removeMaterial = (id) => {
        setMaterials(materials.filter(m => m.id !== id));
        if (selectedItem?.id === id) setSelectedItem(null);
    };

    const handleRegisterAsPurchase = async (material, silent = false) => {
        if (!material.ocrData) {
            if (!silent) alert('Sube primero un comprobante para usar el OCR.');
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
                    fundingSourceId: material.fundingSourceId || '',
                    moneda: material.moneda || 'PEN',
                    tipoCambio: material.tipoCambio || null,
                    totalCost: material.cost,
                    pendienteFactura: material.pendienteFactura || false,
                }),
            });
            const data = await res.json();
            if (!res.ok) { 
                if (!silent) alert(data.error || 'Error al registrar'); 
                return; 
            }

            if (!silent) {
                if (data.alreadyExists) {
                    if (data.updated) {
                        alert('Compra actualizada en contabilidad exitosamente.');
                    } else {
                        alert(`Ya está registrada (${data.serie || ''}-${data.numero || ''}) y no hubo cambios.`);
                    }
                } else {
                    alert('Compra registrada en contabilidad exitosamente.');
                }
            }
            setMaterials(prev => prev.map(m => m.id === material.id ? { ...m, purchaseLedgerId: data.id } : m));
        } catch (e) {
            if (!silent) alert('Error al registrar: ' + e.message);
        }
    };

    const handleSave = async () => {
        setSaveStatus('saving');
        try {
            // Sincronizar automáticamente a contabilidad los materiales que ya hayan sido subidos
            await Promise.all(
                materials
                    .filter(m => m.ocrData && m.purchaseLedgerId)
                    .map(m => handleRegisterAsPurchase(m, true))
            );

            await onSave({ tasks, materials, projectStartDate, projectEndDate, projectAssignees });
            setSaveStatus('success');
            setTimeout(() => setSaveStatus(null), 2500);
        } catch (error) {
            console.error('Error saving:', error);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(null), 3000);
        }
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '-0.5rem' }}>
                    <button onClick={() => setSelectedItem(null)} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 'bold' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                        Volver al Panel
                    </button>
                </div>
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
                    <div>
                        <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginBottom: '0.4rem', display: 'block' }}>Encargados</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
                            {(t.assigneeIds || []).map(id => {
                                const m = teamMembers.find(x => x.id === id);
                                if(!m) return null;
                                return (
                                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#f8fafc', padding: '0.2rem 0.5rem', borderRadius: '99px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: m.color || '#ccc' }}></div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#334155' }}>{m.name}</span>
                                        <button onClick={() => handleToggleTaskAssignee(t.id, id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, fontSize: '0.8rem', display: 'flex', alignItems: 'center', marginLeft: '0.2rem' }}>✕</button>
                                    </div>
                                );
                            })}
                        </div>
                        <select className="input" value="" onChange={e => { if(e.target.value) handleToggleTaskAssignee(t.id, e.target.value); }} style={{ padding: '0.5rem' }}>
                            <option value="">+ Añadir encargado...</option>
                            {teamMembers.filter(m => !(t.assigneeIds || []).includes(m.id)).map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '-0.5rem' }}>
                    <button onClick={() => setSelectedItem(null)} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 'bold' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                        Volver al Panel
                    </button>
                </div>
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
                        <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginBottom: '0.4rem', display: 'block' }}>Costo Total</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <select className="input" value={m.moneda || 'PEN'} onChange={e => updateMaterialField(m.id, 'moneda', e.target.value)} style={{ padding: '0.5rem', width: '80px' }}>
                                <option value="PEN">S/</option>
                                <option value="USD">$</option>
                            </select>
                            <input type="number" className="input" value={m.cost || ''} onChange={e => updateMaterialField(m.id, 'cost', parseFloat(e.target.value))} style={{ padding: '0.5rem', flex: 1 }} />
                        </div>
                    </div>
                    {m.moneda === 'USD' && (
                        <div>
                            <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginBottom: '0.4rem', display: 'block' }}>Tipo de Cambio (S/)</label>
                            <input type="number" step="0.001" className="input" value={m.tipoCambio || ''} onChange={e => updateMaterialField(m.id, 'tipoCambio', parseFloat(e.target.value))} style={{ padding: '0.5rem', width: '100%' }} placeholder="Ej. 3.75" />
                        </div>
                    )}
                    
                    <DuplicateAmountAlert 
                        amount={m.cost} 
                        initialAmount={quotation?.operationsData?.materials?.find(mat => mat.id === m.id)?.cost}
                        empresaId={user?.empresaId} 
                        excludeSourceKey={`pendings:${quotation.id}:${m.id}`}
                        onDuplicateStatusChange={(status) => {
                            setDuplicateStatuses(prev => ({
                                ...prev,
                                [m.id]: status
                            }));
                        }} 
                    />

                    <div>
                        <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginBottom: '0.4rem', display: 'block' }}>Fondo de la Compra</label>
                        <select className="input" value={m.fundingSourceId || ''} onChange={e => updateMaterialField(m.id, 'fundingSourceId', e.target.value)} style={{ padding: '0.5rem', width: '100%' }}>
                            <option value="">Fondos de la Empresa</option>
                            {loans.map(l => (
                                <option key={l.id} value={l.id}>
                                    Préstamo: {l.entity} (Queda {new Intl.NumberFormat('es-PE', { style: 'currency', currency: l.currency || 'PEN' }).format(l.availableBalance)})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginBottom: '0.4rem', display: 'block' }}>Link de Compra</label>
                        <input type="url" className="input" value={m.buyLink || ''} onChange={e => updateMaterialField(m.id, 'buyLink', e.target.value)} style={{ padding: '0.5rem' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginBottom: '0.4rem', display: 'block' }}>Encargados</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
                            {(m.assigneeIds || []).map(id => {
                                const member = teamMembers.find(x => x.id === id);
                                if(!member) return null;
                                return (
                                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#f8fafc', padding: '0.2rem 0.5rem', borderRadius: '99px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: member.color || '#ccc' }}></div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#334155' }}>{member.name}</span>
                                        <button onClick={() => handleToggleMaterialAssignee(m.id, id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, fontSize: '0.8rem', display: 'flex', alignItems: 'center', marginLeft: '0.2rem' }}>✕</button>
                                    </div>
                                );
                            })}
                        </div>
                        <select className="input" value="" onChange={e => { if(e.target.value) handleToggleMaterialAssignee(m.id, e.target.value); }} style={{ padding: '0.5rem' }}>
                            <option value="">+ Añadir encargado...</option>
                            {teamMembers.filter(x => !(m.assigneeIds || []).includes(x.id)).map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <input type="checkbox" id={`pendienteFactura-${m.id}`} checked={m.pendienteFactura || false} onChange={e => updateMaterialField(m.id, 'pendienteFactura', e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                        <label htmlFor={`pendienteFactura-${m.id}`} style={{ fontSize: '0.8rem', color: '#475569', cursor: 'pointer', fontWeight: '500' }}>
                            Gasto sin comprobante fiscal (Pendiente de Factura)
                        </label>
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
                                {m.ocrData && (
                                    <button onClick={() => handleRegisterAsPurchase(m)} style={{ border: 'none', background: m.purchaseLedgerId ? '#dcfce7' : '#f1f5f9', color: m.purchaseLedgerId ? '#16a34a' : '#0f172a', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}>
                                        {m.purchaseLedgerId ? 'Actualizar Contab.' : 'Enviar a Contabilidad'}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.2s ease-out' }}>
                <div className="dashboard-panel-wrapper" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    
                    <div className="dashboard-panel-controls" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', color: '#0f172a', margin: '0 0 0.1rem 0', fontWeight: '700' }}>Panel de Control</h3>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem' }}>Selecciona un elemento para editar.</p>
                        </div>
                        
                        <div className="dashboard-panel-dates" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '1px solid #e2e8f0', paddingLeft: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1 }}>
                                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Inicio:</span>
                                <input type="date" className="input" value={projectStartDate} onChange={e => setProjectStartDate(e.target.value)} style={{ padding: '0.15rem 0.4rem', fontSize: '0.75rem', border: '1px solid #cbd5e1', background: '#f8fafc', borderRadius: '4px', cursor: 'pointer', width: '100%' }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1 }}>
                                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Fin:</span>
                                <input type="date" className="input" value={projectEndDate} onChange={e => setProjectEndDate(e.target.value)} style={{ padding: '0.15rem 0.4rem', fontSize: '0.75rem', border: '1px solid #cbd5e1', background: '#f8fafc', borderRadius: '4px', cursor: 'pointer', width: '100%' }} />
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-panel-stats" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                        <div className="stat-bar-container" style={{ display: 'flex', flexDirection: 'column', width: '120px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: '600', color: '#475569', textTransform: 'uppercase' }}>Tareas</span>
                                <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#0f172a' }}>{tasksPct}%</span>
                            </div>
                            <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                                <div style={{ width: `${tasksPct}%`, height: '100%', background: tasksPct === 100 ? '#10b981' : '#3b82f6', transition: 'width 0.3s' }} />
                            </div>
                        </div>

                        <div className="stat-bar-container" style={{ display: 'flex', flexDirection: 'column', width: '120px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: '600', color: '#475569', textTransform: 'uppercase' }}>Compras</span>
                                <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#0f172a' }}>{materialsPct}%</span>
                            </div>
                            <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                                <div style={{ width: `${materialsPct}%`, height: '100%', background: materialsPct === 100 ? '#10b981' : '#f59e0b', transition: 'width 0.3s' }} />
                            </div>
                        </div>

                        <div className="dashboard-panel-assignees" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderLeft: '1px solid #e2e8f0', paddingLeft: '1.5rem', minWidth: '180px' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: '600', color: '#475569', textTransform: 'uppercase' }}>Encargados del Proyecto</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                {projectAssignees.map(aId => {
                                    const member = teamMembers.find(tm => tm.id === aId);
                                    if (!member) return null;
                                    const color = ASSIGNEE_COLORS[member.name.length % ASSIGNEE_COLORS.length];
                                    return (
                                        <div key={aId} title={member.name} style={{ width: '28px', height: '28px', borderRadius: '50%', background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', border: '2px solid #fff', boxShadow: '0 0 0 1px #cbd5e1' }} onClick={() => handleToggleProjectAssignee(aId)}>
                                            {member.name.charAt(0).toUpperCase()}
                                        </div>
                                    );
                                })}
                                <select value="" onChange={e => { if(e.target.value) handleToggleProjectAssignee(e.target.value); }} style={{ appearance: 'none', width: '28px', height: '28px', borderRadius: '50%', background: '#f1f5f9', border: '1px dashed #cbd5e1', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', textAlign: 'center', padding: 0 }}>
                                    <option value="" disabled>+</option>
                                    {teamMembers.filter(tm => !projectAssignees.includes(tm.id)).map(tm => (
                                        <option key={tm.id} value={tm.id}>{tm.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="dashboard-panel-total" style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: '600', color: '#475569', textTransform: 'uppercase', marginBottom: '0.1rem' }}>Total Gastado</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ea580c' }}>S/ {totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>

                {tasks.length > 0 && (() => {
                    const tasksWithDates = tasks.filter(t => t.startDate && t.endDate);
                    
                    const nowMs = Date.now();
                    let minTime = projectStartDate ? new Date(`${projectStartDate}T00:00:00`).getTime() : null;
                    let maxTime = projectEndDate ? new Date(`${projectEndDate}T23:59:59`).getTime() : null;

                    if (tasksWithDates.length > 0) {
                        const minTasks = Math.min(...tasksWithDates.map(t => new Date(`${t.startDate}T00:00:00`).getTime()));
                        const maxTasks = Math.max(...tasksWithDates.map(t => new Date(`${t.endDate}T23:59:59`).getTime()));
                        if (!minTime || minTasks < minTime) minTime = minTasks;
                        if (!maxTime || maxTasks > maxTime) maxTime = maxTasks;
                    }

                    if (!minTime || nowMs < minTime) minTime = nowMs;
                    if (!maxTime || nowMs > maxTime) maxTime = nowMs;

                    const minDate = new Date(minTime);
                    const minDay = minDate.getDay(); 
                    const diffToMonday = minDay === 0 ? -6 : 1 - minDay;
                    minDate.setDate(minDate.getDate() + diffToMonday);
                    minDate.setHours(0,0,0,0);
                    const gridStartMs = minDate.getTime();

                    const maxDate = new Date(maxTime);
                    const maxDay = maxDate.getDay();
                    const diffToSunday = maxDay === 0 ? 0 : 7 - maxDay;
                    maxDate.setDate(maxDate.getDate() + diffToSunday);
                    maxDate.setHours(23,59,59,999);
                    let gridEndMs = maxDate.getTime();

                    const MIN_SPAN_MS = 35 * 24 * 60 * 60 * 1000;
                    if (gridEndMs - gridStartMs < MIN_SPAN_MS) {
                        gridEndMs = gridStartMs + MIN_SPAN_MS;
                    }

                    const totalMs = gridEndMs - gridStartMs;
                    const totalDays = Math.ceil(totalMs / (24 * 60 * 60 * 1000));
                    const totalWeeks = Math.ceil(totalDays / 7);

                    const viewportDays = 30;
                    const ganttWidthPct = Math.max(100, (totalDays / viewportDays) * 100);
                    const nowLeftPct = ((nowMs - gridStartMs) / totalMs) * 100;

                    const weeks = [];
                    for(let i = 0; i < totalWeeks; i++) {
                        const wStart = new Date(gridStartMs + i * 7 * 24 * 60 * 60 * 1000);
                        weeks.push({
                            label: `${wStart.getDate().toString().padStart(2, '0')}/${(wStart.getMonth()+1).toString().padStart(2, '0')}`,
                            leftPct: (i / totalWeeks) * 100,
                            widthPct: (1 / totalWeeks) * 100
                        });
                    }

                    return (
                        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#0f172a', fontWeight: '600' }}>Cronograma de Tareas</h4>
                            
                            {/* Scrolling Container */}
                            <div ref={localScrollRef} style={{ overflowX: 'auto', paddingBottom: '0.5rem', position: 'relative' }}>
                                {/* Gantt Area Wrapper */}
                                <div style={{ minWidth: `calc(150px + ${ganttWidthPct}%)`, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                                    
                                    {/* Cabecera Semanas */}
                                    <div style={{ display: 'flex', position: 'sticky', top: 0, zIndex: 10, background: '#fff', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.5rem' }}>
                                        <div style={{ width: '150px', flexShrink: 0, position: 'sticky', left: 0, background: '#fff', zIndex: 20 }}></div>
                                        <div style={{ flex: 1, position: 'relative', height: '20px' }}>
                                            {weeks.map((w, i) => (
                                                <div key={i} style={{ position: 'absolute', left: `${w.leftPct}%`, width: `${w.widthPct}%`, top: 0, bottom: 0, borderRight: '1px solid #e2e8f0', fontSize: '0.65rem', color: '#64748b', fontWeight: 'bold', display: 'flex', justifyContent: 'center', background: i % 2 === 0 ? '#f8fafc' : '#ffffff' }}>
                                                    Sem {w.label}
                                                </div>
                                            ))}
                                            {/* Indicador HOY (Header) */}
                                            <div style={{ position: 'absolute', left: `${nowLeftPct}%`, top: 0, bottom: 0, width: '2px', background: '#ef4444', zIndex: 30 }}>
                                                <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', background: '#ef4444', color: '#fff', padding: '1px 4px', borderRadius: '0 0 4px 4px', fontSize: '0.55rem', fontWeight: 'bold' }}>HOY</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Grid y Filas */}
                                    <div style={{ position: 'relative', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {/* Grid de fondo */}
                                        <div style={{ position: 'absolute', inset: 0, display: 'flex', pointerEvents: 'none' }}>
                                            <div style={{ width: '150px', flexShrink: 0 }}></div>
                                            <div style={{ flex: 1, position: 'relative' }}>
                                                {weeks.map((w, i) => (
                                                    <div key={i} style={{ position: 'absolute', left: `${w.leftPct}%`, width: `${w.widthPct}%`, top: 0, bottom: 0, borderRight: '1px solid #e2e8f0', background: i % 2 === 0 ? 'rgba(241, 245, 249, 0.4)' : 'transparent' }} />
                                                ))}
                                                <div style={{ position: 'absolute', left: `${nowLeftPct}%`, top: 0, bottom: 0, width: '2px', background: 'rgba(239, 68, 68, 0.4)', zIndex: 5 }} />
                                            </div>
                                        </div>

                                        {tasks.map((t, idx) => {
                                            let leftPct = 0, widthPct = 0, hasDates = !!(t.startDate && t.endDate);
                                            if (hasDates) {
                                                const startMs = new Date(`${t.startDate}T00:00:00`).getTime();
                                                const endMs = new Date(`${t.endDate}T23:59:59`).getTime();
                                                leftPct = ((startMs - gridStartMs) / totalMs) * 100;
                                                widthPct = Math.max(0.5, ((endMs - startMs) / totalMs) * 100);
                                            }
                                            const firstAssignee = (t.assigneeIds && t.assigneeIds.length > 0) ? teamMembers.find(m => m.id === t.assigneeIds[0]) : null;
                                            const assigneeColor = firstAssignee ? firstAssignee.color : null;
                                            const barColor = assigneeColor || (t.status === 'completed' ? '#10b981' : t.status === 'progress' ? '#3b82f6' : '#94a3b8');
                                            const isCompleted = t.status === 'completed';

                                            return (
                                                <div key={t.id} style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem', position: 'relative', zIndex: 10 }}>
                                                    {/* Nombre Tarea */}
                                                    <div style={{ width: '150px', flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#334155', fontWeight: '500', position: 'sticky', left: 0, background: '#fff', zIndex: 20, cursor: 'pointer', paddingRight: '1rem', borderRight: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => setSelectedItem({ type: 'task', id: t.id })} title={t.title}>
                                                        <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                                                            {(t.assigneeIds || []).map(id => {
                                                                const m = teamMembers.find(x => x.id === id);
                                                                return m ? <div key={m.id} style={{ width: '6px', height: '6px', borderRadius: '50%', background: m.color || '#ccc' }} title={m.name}></div> : null;
                                                            })}
                                                        </div>
                                                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>{t.title}</span>
                                                    </div>
                                                    {/* Barra Gantt */}
                                                    <div style={{ flex: 1, height: '24px', position: 'relative' }} onClick={() => setSelectedItem({ type: 'task', id: t.id })}>
                                                        {hasDates && (
                                                            <div style={{ 
                                                                position: 'absolute', 
                                                                left: `${Math.max(0, leftPct)}%`, 
                                                                width: `${Math.min(100 - leftPct, widthPct)}%`, 
                                                                top: '2px', bottom: '2px', 
                                                                background: barColor, 
                                                                opacity: isCompleted ? 0.6 : 1,
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                                                color: '#fff', fontSize: '0.65rem', fontWeight: '600', 
                                                                borderRadius: '4px', whiteSpace: 'nowrap', overflow: 'hidden', cursor: 'pointer',
                                                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                                            }}>
                                                                {isCompleted && <span style={{ marginRight: '0.3rem' }}>✓</span>}
                                                                {widthPct > 5 ? `${t.startDate.slice(5)} al ${t.endDate.slice(5)}` : ''}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </div>
        );
    };

    const projectAssigneeIds = new Set();
    tasks.forEach(t => (t.assigneeIds || []).forEach(id => projectAssigneeIds.add(id)));
    materials.forEach(m => (m.assigneeIds || []).forEach(id => projectAssigneeIds.add(id)));
    const projectTeam = Array.from(projectAssigneeIds).map(id => teamMembers.find(member => member.id === id)).filter(Boolean);

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '2rem' }}>
            <div style={{ background: '#ffffff', borderRadius: '12px', width: '95vw', maxWidth: '1200px', height: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: '700' }}>
                            {quotation.serviceDescription || 'Sin Descripción'}
                        </h2>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <span style={{ fontWeight: 'bold', color: '#475569' }}>{quotation.code}</span>
                            <span>•</span>
                            <span>{quotation.clientName}</span>
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        {projectTeam.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {projectTeam.map(m => (
                                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f1f5f9', padding: '0.2rem 0.6rem 0.2rem 0.2rem', borderRadius: '99px' }} title={m.role || 'Equipo'}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#fff', border: `2px solid ${m.color || '#0ea5e9'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${m.name}&backgroundColor=${(m.color || '#0ea5e9').replace('#','')}`} alt={m.name} style={{ width: '100%', height: '100%' }} />
                                        </div>
                                        <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155' }}>{m.name.split(' ')[0]}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8', transition: 'color 0.2s', padding: '0.5rem' }} onMouseEnter={e => e.target.style.color='#0f172a'} onMouseLeave={e => e.target.style.color='#94a3b8'}>✕</button>
                    </div>
                </div>

                {/* Body 2-Columns */}
                <div className="pendings-modal-body" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    
                    {/* Left Column: Lists */}
                    <div className="pendings-modal-left" style={{ width: '320px', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', background: '#f8fafc', overflowY: 'auto' }}>
                        
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
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1, overflow: 'hidden' }}>
                                                <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                                                    {(t.assigneeIds || []).map(id => {
                                                        const m = teamMembers.find(x => x.id === id);
                                                        return m ? <div key={m.id} style={{ width: '6px', height: '6px', borderRadius: '50%', background: m.color || '#ccc' }} title={m.name}></div> : null;
                                                    })}
                                                </div>
                                                <span style={{ fontSize: '0.85rem', color: t.status === 'completed' ? '#64748b' : '#334155', textDecoration: t.status === 'completed' ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                                            </div>
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
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1, overflow: 'hidden' }}>
                                                <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                                                    {(m.assigneeIds || []).map(id => {
                                                        const member = teamMembers.find(x => x.id === id);
                                                        return member ? <div key={member.id} style={{ width: '6px', height: '6px', borderRadius: '50%', background: member.color || '#ccc' }} title={member.name}></div> : null;
                                                    })}
                                                </div>
                                                <span style={{ fontSize: '0.85rem', color: m.purchased ? '#64748b' : '#334155', textDecoration: m.purchased ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</span>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); removeMaterial(m.id); }} style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0 0.2rem' }}>✕</button>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Detail View */}
                    <div className="pendings-modal-right" style={{ flex: 1, background: '#f8fafc', padding: '2rem', overflowY: 'auto' }}>
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
                <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: '#fff', alignItems: 'center' }}>
                    <button onClick={onClose} className="btn btn-secondary">Cerrar sin guardar</button>
                    <button 
                        onClick={handleSave} 
                        className="btn btn-primary" 
                        disabled={saveStatus === 'saving'}
                        style={{ 
                            padding: '0.6rem 1.5rem', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem',
                            background: saveStatus === 'saved' ? '#10b981' : saveStatus === 'error' ? '#ef4444' : undefined,
                            borderColor: saveStatus === 'saved' ? '#10b981' : saveStatus === 'error' ? '#ef4444' : undefined,
                            transition: 'all 0.3s ease',
                            cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {saveStatus === 'saving' && (
                            <svg className="animate-spin" style={{ width: '16px', height: '16px', color: '#fff' }} fill="none" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }}></circle>
                                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" style={{ opacity: 0.75 }}></path>
                            </svg>
                        )}
                        {saveStatus === 'saving' && 'Guardando...'}
                        {saveStatus === 'saved' && '¡Guardado con éxito!'}
                        {saveStatus === 'error' && 'Error al guardar'}
                        {saveStatus === null && 'Guardar Cambios'}
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
}
