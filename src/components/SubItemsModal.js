import React, { useState, useEffect } from 'react';

export function SubItemsModal({ isOpen, onClose, initialSubItems, itemDescription, onSave }) {
    const [subItems, setSubItems] = useState([]);

    useEffect(() => {
        if (isOpen) {
            setSubItems(initialSubItems || []);
        }
    }, [isOpen, initialSubItems]);

    if (!isOpen) return null;

    const handleAdd = () => {
        setSubItems([...subItems, { description: '', quantity: 1, basePrice: 0 }]);
    };

    const handleRemove = (index) => {
        setSubItems(subItems.filter((_, i) => i !== index));
    };

    const handleChange = (index, field, value) => {
        const newItems = [...subItems];
        newItems[index][field] = value;
        setSubItems(newItems);
    };

    const totalCost = subItems.reduce((acc, si) => acc + (parseFloat(si.quantity) || 0) * (parseFloat(si.basePrice) || 0), 0);

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', color: '#1e293b', margin: 0 }}>Sub-ítems para: <span style={{ color: '#0369a1' }}>{itemDescription || 'Ítem sin título'}</span></h2>
                    <button onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
                </div>
                
                <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem', minWidth: '600px' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#475569', fontSize: '0.85rem' }}>Descripción interna</th>
                            <th style={{ padding: '0.75rem', textAlign: 'center', color: '#475569', fontSize: '0.85rem', width: '80px' }}>Cant.</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right', color: '#475569', fontSize: '0.85rem', width: '120px' }}>Costo U.</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right', color: '#475569', fontSize: '0.85rem', width: '120px' }}>Subtotal</th>
                            <th style={{ padding: '0.75rem', textAlign: 'center', color: '#475569', fontSize: '0.85rem', width: '50px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {subItems.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                                    No hay sub-ítems. Haz clic en "+ Agregar Fila" para empezar.
                                </td>
                            </tr>
                        )}
                        {subItems.map((si, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '0.5rem' }}>
                                    <input 
                                        type="text" 
                                        value={si.description || ''} 
                                        onChange={(e) => handleChange(idx, 'description', e.target.value)}
                                        style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.85rem' }}
                                        placeholder="Tubería estructural..."
                                    />
                                </td>
                                <td style={{ padding: '0.5rem' }}>
                                    <input 
                                        type="number" 
                                        value={si.quantity !== undefined ? si.quantity : ''} 
                                        onChange={(e) => handleChange(idx, 'quantity', e.target.value)}
                                        style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.85rem', textAlign: 'center' }}
                                    />
                                </td>
                                <td style={{ padding: '0.5rem' }}>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        value={si.basePrice !== undefined ? si.basePrice : ''} 
                                        onChange={(e) => handleChange(idx, 'basePrice', e.target.value)}
                                        style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.85rem', textAlign: 'right' }}
                                    />
                                </td>
                                <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold', fontSize: '0.9rem', color: '#334155' }}>
                                    S/ {((parseFloat(si.quantity) || 0) * (parseFloat(si.basePrice) || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                    <button onClick={() => handleRemove(idx)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', padding: '0.3rem 0.5rem', cursor: 'pointer' }}>
                                        ✕
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
                    <button onClick={handleAdd} style={{ background: '#e0f2fe', color: '#0369a1', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }}>
                        + Agregar Fila
                    </button>
                    
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#0f172a' }}>
                        Costo Base Total: <span style={{ color: '#22c55e' }}>S/ {totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                </div>
                
                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button onClick={onClose} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}>
                        Cancelar
                    </button>
                    <button onClick={() => onSave(subItems, totalCost)} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}>
                        Aplicar Costo Base al Ítem
                    </button>
                </div>
            </div>
        </div>
    );
}
