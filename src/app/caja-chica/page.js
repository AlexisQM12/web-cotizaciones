'use client'

import { useState, useEffect, useMemo } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { NavBar } from '@/components/NavBar';
import { useAuth } from '@/contexts/AuthContext';
import CajaChicaModal from '@/components/CajaChicaModal';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function CajaChicaPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [expenses, setExpenses] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expenseToEdit, setExpenseToEdit] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const filteredExpenses = useMemo(() => {
        return expenses.filter(e => {
            const dateToUse = e.fechaConsumo || e.createdAt || '';
            const expenseDate = dateToUse ? dateToUse.split('T')[0] : '';
            if (!expenseDate) return true;
            if (startDate && expenseDate < startDate) return false;
            if (endDate && expenseDate > endDate) return false;
            return true;
        });
    }, [expenses, startDate, endDate]);

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
            const dateToUse = e.fechaConsumo || e.createdAt || '';
            if (dateToUse.startsWith(currentMonth)) {
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

    const handleExportPDF = () => {
        const doc = new jsPDF();
        
        let title = 'Reporte de Caja Chica';
        if (startDate && endDate) title += ` (Del ${startDate} al ${endDate})`;
        else if (startDate) title += ` (Desde ${startDate})`;
        else if (endDate) title += ` (Hasta ${endDate})`;

        doc.setFontSize(16);
        doc.text(title, 14, 22);

        const tableColumn = ["Fecha", "Categoria", "Descripcion", "Declarado por", "Monto", "Estado"];
        const tableRows = [];

        filteredExpenses.forEach(e => {
            const expenseData = [
                (e.fechaConsumo || e.createdAt) ? new Date(e.fechaConsumo || e.createdAt).toLocaleDateString() : '-',
                e.category || '',
                e.description || '',
                e.declaredBy ? teamMembers.find(m => m.id === e.declaredBy)?.name || '-' : '-',
                `${e.currency === 'USD' ? '$' : 'S/'} ${Number(e.totalAmount || 0).toFixed(2)}`,
                e.pendienteFactura ? 'Pendiente' : 'Sustentado'
            ];
            tableRows.push(expenseData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 30,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [15, 23, 42] }
        });

        const totalSustentados = filteredExpenses.filter(e => !e.pendienteFactura).reduce((sum, e) => sum + Number(e.totalAmount || 0), 0);
        const totalNoSustentados = filteredExpenses.filter(e => e.pendienteFactura).reduce((sum, e) => sum + Number(e.totalAmount || 0), 0);
        
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(10);
        doc.text(`Total Sustentados: S/ ${totalSustentados.toFixed(2)}`, 14, finalY);
        doc.text(`Total No Sustentados: S/ ${totalNoSustentados.toFixed(2)}`, 14, finalY + 7);

        let fileName = 'Reporte_Caja_Chica.pdf';
        if (startDate && endDate) fileName = `Reporte_Caja_Chica_${startDate}_al_${endDate}.pdf`;
        else if (startDate) fileName = `Reporte_Caja_Chica_desde_${startDate}.pdf`;
        else if (endDate) fileName = `Reporte_Caja_Chica_hasta_${endDate}.pdf`;

        doc.save(fileName);
    };

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

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'flex-end', background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#475569' }}>Fecha Inicio (Reembolso)</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#475569' }}>Fecha Fin (Reembolso)</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }} />
                        </div>
                        <button 
                            onClick={() => { setStartDate(''); setEndDate(''); }}
                            style={{ padding: '0.5rem 1rem', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', height: '38px' }}
                        >
                            Limpiar Fechas
                        </button>
                        <button 
                            onClick={handleExportPDF}
                            style={{ padding: '0.5rem 1rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', height: '38px', display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}
                            title="Descargar listado filtrado en PDF"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path fillRule="evenodd" d="M4 0h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zm.165 11.668c.09-.196.139-.581.116-1.071-.057-.85-.308-2.435-.45-3.115-.092-.441-.186-.976-.233-1.428-.016-.145-.02-.275-.02-.387 0-.58.12-1.01.309-1.298.172-.265.438-.415.792-.415.344 0 .593.136.758.33.167.195.25.467.247.818-.003.35-.11.758-.291 1.258-.168.468-.383.92-.61 1.353-.418.8-.938 1.545-1.507 2.193a11.161 11.161 0 0 0-1.898 2.505c-.237.458-.406.877-.492 1.251-.08.351-.082.682-.016.992.062.293.18.535.346.726.168.191.385.312.646.36.262.049.566.026.91-.07.348-.096.758-.27 1.229-.519.467-.247.986-.566 1.554-.954.568-.386 1.18-.838 1.834-1.349.654-.51 1.346-1.077 2.072-1.696.724-.619 1.488-1.295 2.29-2.022a16.892 16.892 0 0 0 1.272-1.222c.264-.282.518-.58.756-.893.243-.321.467-.655.666-.995.197-.336.37-.677.514-1.015.137-.323.238-.637.304-.938.064-.294.093-.57.086-.827-.008-.261-.052-.51-.13-.75a1.868 1.868 0 0 0-.256-.563 1.314 1.314 0 0 0-.41-.422c-.172-.116-.367-.184-.579-.2a2.316 2.316 0 0 0-.792.052c-.274.067-.568.188-.875.361-.31.176-.643.398-.997.663-.352.263-.727.567-1.12.909-.391.34-.8.71-1.218 1.112-.419.4-.852.825-1.292 1.272a29.417 29.417 0 0 0-1.45 1.547c-.496.565-1.014 1.182-1.545 1.844-.528.658-1.07 1.353-1.616 2.073a38.412 38.412 0 0 0-1.218 1.677c-.395.576-.798 1.183-1.2 1.808-.4.621-.8 1.26-1.187 1.899z"/>
                            </svg>
                            Descargar PDF
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
                                            <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Cargando gastos...</td></tr>
                                        ) : filteredExpenses.filter(e => !e.pendienteFactura).length === 0 ? (
                                            <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No hay gastos sustentados en este periodo.</td></tr>
                                        ) : filteredExpenses.filter(e => !e.pendienteFactura).map(expense => (
                                            <tr key={expense.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#334155' }}>{new Date(expense.fechaConsumo || expense.createdAt).toLocaleDateString()}</td>
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
                                            <td style={{ padding: '1rem', textAlign: 'right', borderTop: '2px solid #e2e8f0', color: '#0f172a', fontSize: '1rem' }}>S/ {filteredExpenses.filter(e => !e.pendienteFactura).reduce((sum, e) => sum + Number(e.totalAmount || 0), 0).toFixed(2)}</td>
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
                                            <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Cargando gastos...</td></tr>
                                        ) : filteredExpenses.filter(e => e.pendienteFactura).length === 0 ? (
                                            <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No hay gastos pendientes de factura en este periodo.</td></tr>
                                        ) : filteredExpenses.filter(e => e.pendienteFactura).map(expense => (
                                            <tr key={expense.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#334155' }}>{new Date(expense.fechaConsumo || expense.createdAt).toLocaleDateString()}</td>
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
                                            <td style={{ padding: '1rem', textAlign: 'right', borderTop: '2px solid #e2e8f0', color: '#0f172a', fontSize: '1rem' }}>S/ {filteredExpenses.filter(e => e.pendienteFactura).reduce((sum, e) => sum + Number(e.totalAmount || 0), 0).toFixed(2)}</td>
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
