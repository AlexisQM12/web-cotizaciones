import React, { useState, useEffect } from 'react';
import { authFetch } from '@/lib/authFetch';

export default function DuplicateAmountAlert({ amount, initialAmount, empresaId, excludeSourceKey, onDuplicateStatusChange }) {
    const [duplicates, setDuplicates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [acknowledged, setAcknowledged] = useState(false);

    useEffect(() => {
        // Reset state when amount changes
        setDuplicates([]);
        setAcknowledged(false);
        
        // Notify parent that there is no active block initially
        if (onDuplicateStatusChange) {
            onDuplicateStatusChange({ hasDuplicate: false, isAcknowledged: false });
        }

        if (!amount || amount <= 0 || !empresaId) return;

        // Si estamos editando y el monto no ha cambiado respecto al original, saltamos la validación
        if (initialAmount !== undefined && initialAmount !== null && Number(amount) === Number(initialAmount)) {
            return;
        }

        const checkDuplicate = async () => {
            setLoading(true);
            try {
                let url = `/api/accounting/check-duplicate?empresaId=${empresaId}&amount=${amount}`;
                if (excludeSourceKey) {
                    url += `&excludeSourceKey=${encodeURIComponent(excludeSourceKey)}`;
                }
                const res = await authFetch(url);
                const data = await res.json();
                if (data && data.length > 0) {
                    setDuplicates(data);
                    if (onDuplicateStatusChange) {
                        onDuplicateStatusChange({ hasDuplicate: true, isAcknowledged: false });
                    }
                } else {
                    if (onDuplicateStatusChange) {
                        onDuplicateStatusChange({ hasDuplicate: false, isAcknowledged: true });
                    }
                }
            } catch (error) {
                console.error('Error checking duplicate:', error);
                // On error, we assume no duplicate to prevent blocking the user indefinitely
                if (onDuplicateStatusChange) {
                    onDuplicateStatusChange({ hasDuplicate: false, isAcknowledged: true });
                }
            } finally {
                setLoading(false);
            }
        };

        const timerId = setTimeout(checkDuplicate, 600); // 600ms debounce
        return () => clearTimeout(timerId);
    }, [amount, empresaId]);

    const handleAcknowledge = (e) => {
        const checked = e.target.checked;
        setAcknowledged(checked);
        if (onDuplicateStatusChange) {
            onDuplicateStatusChange({ hasDuplicate: duplicates.length > 0, isAcknowledged: checked });
        }
    };

    if (loading) {
        return <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>Verificando historial de montos...</div>;
    }

    if (duplicates.length === 0) {
        return null;
    }

    if (acknowledged) {
        return (
            <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span style={{ fontSize: '0.85rem', color: '#065f46', flex: 1, fontWeight: '500' }}>Confirmado como gasto nuevo y distinto.</span>
                <button type="button" onClick={() => handleAcknowledge({ target: { checked: false } })} style={{ background: 'none', border: 'none', color: '#059669', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold' }}>Deshacer</button>
            </div>
        );
    }

    return (
        <div style={{ marginTop: '0.75rem', padding: '1rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#92400e', fontWeight: 'bold' }}>
                        ¡Posible Duplicado Encontrado!
                    </p>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#b45309' }}>
                        En los últimos 2 meses se han registrado gastos con el monto exacto de <strong>{amount}</strong>.
                    </p>
                    
                    <div style={{ background: '#fef3c7', padding: '0.5rem', borderRadius: '6px', marginBottom: '0.75rem' }}>
                        {duplicates.slice(0, 2).map((dup, idx) => (
                            <div key={dup.id} style={{ fontSize: '0.8rem', color: '#92400e', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: idx === 0 && duplicates.length > 1 ? '1px solid #fde68a' : 'none', paddingBottom: idx === 0 && duplicates.length > 1 ? '0.25rem' : '0', marginBottom: idx === 0 && duplicates.length > 1 ? '0.25rem' : '0' }}>
                                <span>{new Date(dup.date).toLocaleDateString()} - {dup.description}</span>
                                {dup.receiptUrl && (
                                    <a href={dup.receiptUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#d97706', textDecoration: 'underline', fontWeight: 'bold' }}>Ver Comprobante</a>
                                )}
                            </div>
                        ))}
                        {duplicates.length > 2 && (
                            <div style={{ fontSize: '0.75rem', color: '#92400e', marginTop: '0.25rem' }}>+ {duplicates.length - 2} coincidencia(s) más.</div>
                        )}
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: '#92400e' }}>
                        <input type="checkbox" checked={acknowledged} onChange={handleAcknowledge} style={{ cursor: 'pointer' }} />
                        <strong>Confirmo que este es un gasto nuevo y distinto.</strong>
                    </label>
                </div>
            </div>
        </div>
    );
}
