'use client'

import { useState, useEffect, useMemo } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { NavBar } from '@/components/NavBar';
import { useAuth } from '@/contexts/AuthContext';
import CajaChicaModal from '@/components/CajaChicaModal';
import { useRouter } from 'next/navigation';

export default function CajaChicaPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [expenses, setExpenses] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expenseToEdit, setExpenseToEdit] = useState(null);

    useEffect(() => {
        if (user?.empresaId) {
            fetchExpenses();
            fetchTeamMembers();
        }
    }, [user]);

    const fetchTeamMembers = async () => {
        try {
            const res = await fetch(`/api/team?empresaId=${user.empresaId}`);
            if (res.ok) {
                const data = await res.json();
                setTeamMembers(data);
            }
        } catch (error) {
            console.error('Error fetching team members:', error);
        }
    };

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/caja-chica?empresaId=${user.empresaId}`);
            if (res.ok) {
                const data = await res.json();
                setExpenses(data);
            }
        } catch (error) {
            console.error('Error fetching expenses:', error);
        }
        setLoading(false);
    };

    const handleSaveExpense = async (formData) => {
        try {
            const isEdit = !!expenseToEdit;
            const method = isEdit ? 'PUT' : 'POST';
            const body = isEdit ? { ...formData, id: expenseToEdit.id, empresaId: user.empresaId } : { ...formData, empresaId: user.empresaId };

            const res = await fetch('/api/caja-chica', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                setIsModalOpen(false);
                setExpenseToEdit(null);
                fetchExpenses();
                alert(isEdit ? 'Gasto actualizado exitosamente.' : 'Gasto registrado exitosamente y sincronizado con Contabilidad e Inventario.');
            } else {
                const err = await res.json();
                alert('Error al guardar: ' + err.error);
            }
        } catch (error) {
            console.error('Error saving expense:', error);
            alert('Error al guardar el gasto.');
        }
    };

    const handleDeleteExpense = async (id) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este gasto de Caja Chica? También se eliminará de Contabilidad. (Si afectó al inventario físico, deberás ajustar el stock manualmente).')) return;
        
        try {
            const res = await fetch(`/api/caja-chica?empresaId=${user.empresaId}&id=${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchExpenses();
            } else {
                alert('Error al eliminar el gasto.');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    const stats = useMemo(() => {
        let totalMonth = 0;
        let countMonth = 0;
        
        expenses.forEach(e => {
            if (e.createdAt?.startsWith(currentMonth)) {
                totalMonth += Number(e.totalAmount || 0);
                countMonth++;
            }
        });
        return { totalMonth, countMonth };
    }, [expenses, currentMonth]);

    const uniqueCategories = useMemo(() => {
        const cats = new Set(['Alquileres', 'Combustible', 'Consumibles', 'Equipo de computo', 'Herramientas', 'Muebleria', 'Otros', 'RH']);
        expenses.forEach(e => {
            if (e.category) cats.add(e.category);
        });
        return Array.from(cats).sort();
    }, [expenses]);

    return (
        <ProtectedRoute>
            <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
                <NavBar />
                
                <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button onClick={() => router.push('/')} style={{ background: '#e2e8f0', border: 'none', padding: '0.6rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }} title="Volver al Dashboard">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                                </svg>
                            </button>
                            <div>
                                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#0f172a', margin: '0 0 0.5rem 0' }}>Caja Chica</h1>
                                <p style={{ color: '#64748b', margin: 0 }}>Gestión de gastos operativos, consumibles y caja chica general.</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => { setExpenseToEdit(null); setIsModalOpen(true); }}
                            style={{ padding: '0.75rem 1.5rem', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <span style={{ fontSize: '1.2rem' }}>+</span> Nuevo Gasto
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <p style={{ margin: '0 0 0.5rem 0', color: '#64748b', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gastos este Mes</p>
                            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#0f172a' }}>
                                S/ {stats.totalMonth.toFixed(2)}
                            </p>
                        </div>
                        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <p style={{ margin: '0 0 0.5rem 0', color: '#64748b', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Transacciones del Mes</p>
                            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#0f172a' }}>
                                {stats.countMonth}
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Tabla: Con Factura */}
                        <div>
                            <h2 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '1rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>Gastos Sustentados (Con Factura)</h2>
                            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: '#f1f5f9' }}>
                                        <tr>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Fecha</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Categoría</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Descripción</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Declarado por</th>
                                            <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Monto</th>
                                            <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Comprobante</th>
                                            <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Cargando gastos...</td></tr>
                                        ) : expenses.filter(e => !e.pendienteFactura).length === 0 ? (
                                            <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No hay gastos sustentados.</td></tr>
                                        ) : expenses.filter(e => !e.pendienteFactura).map(expense => (
                                            <tr key={expense.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#334155' }}>{new Date(expense.createdAt).toLocaleDateString()}</td>
                                                <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#334155' }}>
                                                    <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600' }}>
                                                        {expense.category}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#334155' }}>{expense.description || '-'}</td>
                                                <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#334155' }}>{expense.declaredBy ? teamMembers.find(m => m.id === expense.declaredBy)?.name || '-' : '-'}</td>
                                                <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#0f172a', fontWeight: 'bold', textAlign: 'right' }}>
                                                    {expense.currency === 'USD' ? '$' : 'S/'} {Number(expense.totalAmount).toFixed(2)}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    {expense.receiptUrl ? (
                                                        <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '0.875rem', fontWeight: '600' }}>Ver adjunto</a>
                                                    ) : (
                                                        <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>-</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                    <button 
                                                        onClick={() => { setExpenseToEdit(expense); setIsModalOpen(true); }}
                                                        style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                                                        title="Editar registro"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteExpense(expense.id)}
                                                        style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                                                        title="Eliminar registro"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                                        <tr>
                                            <td colSpan="4" style={{ padding: '1rem', textAlign: 'right', borderTop: '2px solid #e2e8f0', color: '#0f172a', fontSize: '0.875rem' }}>Total Sustentados:</td>
                                            <td style={{ padding: '1rem', textAlign: 'right', borderTop: '2px solid #e2e8f0', color: '#0f172a', fontSize: '1rem' }}>S/ {expenses.filter(e => !e.pendienteFactura).reduce((sum, e) => sum + Number(e.totalAmount || 0), 0).toFixed(2)}</td>
                                            <td colSpan="2" style={{ borderTop: '2px solid #e2e8f0' }}></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        {/* Tabla: Sin Factura */}
                        <div>
                            <h2 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '1rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>Gastos No Sustentados (Pendientes de Factura)</h2>
                            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: '#f1f5f9' }}>
                                        <tr>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Fecha</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Categoría</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Descripción</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Declarado por</th>
                                            <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Monto</th>
                                            <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Comprobante</th>
                                            <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Cargando gastos...</td></tr>
                                        ) : expenses.filter(e => e.pendienteFactura).length === 0 ? (
                                            <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No hay gastos pendientes de factura.</td></tr>
                                        ) : expenses.filter(e => e.pendienteFactura).map(expense => (
                                            <tr key={expense.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#334155' }}>{new Date(expense.createdAt).toLocaleDateString()}</td>
                                                <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#334155' }}>
                                                    <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600' }}>
                                                        {expense.category}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#334155' }}>{expense.description || '-'}</td>
                                                <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#334155' }}>{expense.declaredBy ? teamMembers.find(m => m.id === expense.declaredBy)?.name || '-' : '-'}</td>
                                                <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#0f172a', fontWeight: 'bold', textAlign: 'right' }}>
                                                    {expense.currency === 'USD' ? '$' : 'S/'} {Number(expense.totalAmount).toFixed(2)}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    {expense.receiptUrl ? (
                                                        <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '0.875rem', fontWeight: '600' }}>Ver adjunto</a>
                                                    ) : (
                                                        <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>-</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                    <button 
                                                        onClick={() => { setExpenseToEdit(expense); setIsModalOpen(true); }}
                                                        style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                                                        title="Editar registro"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteExpense(expense.id)}
                                                        style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                                                        title="Eliminar registro"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                                        <tr>
                                            <td colSpan="4" style={{ padding: '1rem', textAlign: 'right', borderTop: '2px solid #e2e8f0', color: '#0f172a', fontSize: '0.875rem' }}>Total No Sustentados:</td>
                                            <td style={{ padding: '1rem', textAlign: 'right', borderTop: '2px solid #e2e8f0', color: '#0f172a', fontSize: '1rem' }}>S/ {expenses.filter(e => e.pendienteFactura).reduce((sum, e) => sum + Number(e.totalAmount || 0), 0).toFixed(2)}</td>
                                            <td colSpan="2" style={{ borderTop: '2px solid #e2e8f0' }}></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                </main>
                
                <CajaChicaModal 
                    isOpen={isModalOpen} 
                    onClose={() => { setIsModalOpen(false); setExpenseToEdit(null); }} 
                    onSave={handleSaveExpense} 
                    empresaId={user?.empresaId}
                    expenseToEdit={expenseToEdit}
                    existingCategories={uniqueCategories}
                    teamMembers={teamMembers}
                />
            </div>
        </ProtectedRoute>
    );
}
