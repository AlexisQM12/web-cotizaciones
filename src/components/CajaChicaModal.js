'use client'

import React, { useState, useEffect } from 'react';
import { storage } from '@/lib/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import DuplicateAmountAlert from './DuplicateAmountAlert';

export default function CajaChicaModal({ isOpen, onClose, onSave, empresaId, expenseToEdit = null }) {
    const [loans, setLoans] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [duplicateStatus, setDuplicateStatus] = useState({ hasDuplicate: false, isAcknowledged: false });
    const [formData, setFormData] = useState({
        category: '',
        description: '',
        totalAmount: '',
        currency: 'PEN',
        fundingSourceId: '',
        pendienteFactura: false,
        receiptUrl: '',
        ocrData: null,
        items: []
    });

    useEffect(() => {
        if (expenseToEdit && isOpen) {
            setFormData({
                category: expenseToEdit.category || '',
                description: expenseToEdit.description || '',
                totalAmount: expenseToEdit.totalAmount || '',
                currency: expenseToEdit.currency || 'PEN',
                fundingSourceId: expenseToEdit.fundingSourceId || '',
                pendienteFactura: expenseToEdit.pendienteFactura || false,
                receiptUrl: expenseToEdit.receiptUrl || '',
                ocrData: expenseToEdit.ocrData || null,
                items: expenseToEdit.items || []
            });
        } else if (isOpen) {
            // Reset if new
            setFormData({
                category: '',
                description: '',
                totalAmount: '',
                currency: 'PEN',
                fundingSourceId: '',
                pendienteFactura: false,
                receiptUrl: '',
                ocrData: null,
                items: []
            });
        }
    }, [expenseToEdit, isOpen]);

    const categories = ['Consumibles', 'Muebleria', 'Equipo de computo', 'Herramientas', 'Alquileres', 'Combustible', 'RH', 'Otros'];

    useEffect(() => {
        if (!empresaId || !isOpen) return;
        fetch(`/api/loans?empresaId=${empresaId}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setLoans(data.filter(l => l.status === 'ACTIVE'));
            })
            .catch(err => console.error('Error fetching loans', err));
    }, [empresaId, isOpen]);

    if (!isOpen) return null;

    const handleFileUpload = async (file) => {
        if (!file) return;
        setUploading(true);
        try {
            // Upload to storage
            const fileExt = file.name.split('.').pop();
            const fileName = `caja-chica/${empresaId}/${Date.now()}.${fileExt}`;
            const storageRef = ref(storage, fileName);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);

            // OCR
            const form = new FormData();
            form.append('file', file);
            const ocrRes = await fetch('/api/scan-invoice', { method: 'POST', body: form });
            const ocrData = await ocrRes.json();

            setFormData(prev => ({
                ...prev,
                receiptUrl: url,
                ocrData,
                totalAmount: ocrData.amount || prev.totalAmount,
                currency: ocrData.currency || prev.currency,
                items: ocrData.items || []
            }));
        } catch (err) {
            console.error('Error uploading/OCR:', err);
            alert('Hubo un error al procesar el comprobante.');
        }
        setUploading(false);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        setFormData({ ...formData, items: newItems });
    };

    const handleAddItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { quantity: 1, description: '', unitPrice: 0, total: 0 }]
        });
    };

    const handleRemoveItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (duplicateStatus.hasDuplicate && !duplicateStatus.isAcknowledged) {
            alert('Existe una alerta de posible duplicado. Por favor, marca la casilla de confirmación para continuar.');
            return;
        }
        if (!formData.category) return alert('Debes seleccionar una categoría.');
        if (!formData.totalAmount) return alert('Debes ingresar el monto total.');

        setIsSubmitting(true);
        await onSave(formData);
        setIsSubmitting(false);
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a' }}>
                        {expenseToEdit ? 'Editar Gasto de Caja Chica' : 'Registrar Gasto de Caja Chica'}
                    </h2>
                    <button type="button" onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Categoría *</label>
                            <select className="input" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                                <option value="">Selecciona una categoría...</option>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                                {['Consumibles', 'Muebleria', 'Equipo de computo', 'Herramientas'].includes(formData.category) && 'Los ítems ingresados se sumarán al inventario.'}
                                {['Alquileres', 'Combustible', 'RH', 'Otros'].includes(formData.category) && 'Esta categoría no suma ítems al inventario físico.'}
                            </p>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Descripción general</label>
                            <input type="text" className="input" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Ej. Compra de suministros" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                        </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Comprobante (Opcional)</label>
                        {uploading ? (
                            <p style={{ fontSize: '0.85rem', color: '#ea580c' }}>Escaneando documento con IA...</p>
                        ) : formData.receiptUrl ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <a href={formData.receiptUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontSize: '0.85rem' }}>Ver comprobante cargado</a>
                                <button type="button" onClick={() => setFormData({...formData, receiptUrl: '', ocrData: null, items: []})} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }}>Quitar</button>
                            </div>
                        ) : (
                            <input type="file" accept="image/*,application/pdf" onChange={e => handleFileUpload(e.target.files[0])} style={{ fontSize: '0.85rem' }} />
                        )}
                        {formData.ocrData?.ruc && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#16a34a', display: 'flex', gap: '1rem' }}>
                                <span><strong>RUC:</strong> {formData.ocrData.ruc}</span>
                                <span><strong>Serie/Núm:</strong> {formData.ocrData.serie}-{formData.ocrData.numero}</span>
                            </div>
                        )}
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569' }}>Detalle de Ítems</label>
                            <button type="button" onClick={handleAddItem} style={{ background: '#eff6ff', color: '#2563eb', border: 'none', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>+ Añadir Ítem</button>
                        </div>
                        {formData.items.length === 0 && <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No hay ítems registrados.</p>}
                        
                        {formData.items.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <input type="number" placeholder="Cant." value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', e.target.value)} style={{ width: '70px', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                                <input type="text" placeholder="Descripción" value={item.description} onChange={e => handleItemChange(idx, 'description', e.target.value)} style={{ flex: 1, padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                                <input type="number" step="0.01" placeholder="P.Unit" value={item.unitPrice} onChange={e => handleItemChange(idx, 'unitPrice', e.target.value)} style={{ width: '90px', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                                <button type="button" onClick={() => handleRemoveItem(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '1rem', cursor: 'pointer' }}>&times;</button>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Moneda</label>
                            <select className="input" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                                <option value="PEN">Soles (PEN)</option>
                                <option value="USD">Dólares (USD)</option>
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Costo Total *</label>
                            <input type="number" step="0.01" className="input" value={formData.totalAmount} onChange={e => setFormData({...formData, totalAmount: e.target.value})} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1.1rem', fontWeight: 'bold' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Fondo de la Compra</label>
                            <select className="input" value={formData.fundingSourceId} onChange={e => setFormData({...formData, fundingSourceId: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                                <option value="">Fondos de la Empresa</option>
                                {loans.map(l => (
                                    <option key={l.id} value={l.id}>
                                        Préstamo: {l.entity} (Queda {new Intl.NumberFormat('es-PE', { style: 'currency', currency: l.currency || 'PEN' }).format(l.availableBalance)})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <DuplicateAmountAlert 
                        amount={formData.totalAmount} 
                        initialAmount={expenseToEdit ? expenseToEdit.totalAmount : null}
                        empresaId={empresaId} 
                        excludeSourceKey={expenseToEdit ? `caja-chica:${expenseToEdit.id}` : null}
                        onDuplicateStatusChange={setDuplicateStatus} 
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input type="checkbox" id="pf-caja" checked={formData.pendienteFactura} onChange={e => setFormData({...formData, pendienteFactura: e.target.checked})} style={{ cursor: 'pointer' }} />
                        <label htmlFor="pf-caja" style={{ fontSize: '0.85rem', color: '#475569', cursor: 'pointer' }}>Gasto sin comprobante fiscal (Pendiente de Factura)</label>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} disabled={isSubmitting} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: '600', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.6 : 1 }}>Cancelar</button>
                        <button type="submit" disabled={isSubmitting || (duplicateStatus.hasDuplicate && !duplicateStatus.isAcknowledged)} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', background: '#0ea5e9', color: '#fff', fontWeight: '600', cursor: isSubmitting || (duplicateStatus.hasDuplicate && !duplicateStatus.isAcknowledged) ? 'not-allowed' : 'pointer', opacity: isSubmitting || (duplicateStatus.hasDuplicate && !duplicateStatus.isAcknowledged) ? 0.6 : 1 }}>
                            {isSubmitting ? 'Guardando...' : 'Guardar Gasto'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
