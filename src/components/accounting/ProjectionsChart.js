'use client';
import React, { useState, useMemo } from 'react';
import Icon from '@/components/icons/Icon';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList
} from 'recharts';

export default function ProjectionsChart({ data, loading, onToggleExclude }) {
    const [includeInvoiced, setIncludeInvoiced] = useState(true);
    const [includeNotInvoiced, setIncludeNotInvoiced] = useState(true);
    const [showUtility, setShowUtility] = useState(false);
    const [monthsAhead, setMonthsAhead] = useState(6);
    const [advances, setAdvances] = useState({}); // Local state for manual advances
    const [simulatedCosts, setSimulatedCosts] = useState({}); // Local state for simulated costs

    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        const now = new Date();
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() + Number(monthsAhead));

        // Generate empty bins for the next X months
        const bins = {};
        for (let i = 0; i < Number(monthsAhead); i++) {
            const d = new Date();
            d.setMonth(now.getMonth() + i);
            const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); // e.g. 2026-08
            const label = d.toLocaleString('es-PE', { month: 'short', year: 'numeric' }).toUpperCase();
            bins[key] = { key, label, Facturado: 0, Pendiente: 0 };
        }

        data.forEach(proj => {
            if (!proj.executionEndDate) return; // Ignore if no end date
            if (proj.isExcludedFromProjections) return; // Ignore if manually excluded
            
            if (proj.isOcInvoiced && !includeInvoiced) return;
            if (!proj.isOcInvoiced && !includeNotInvoiced) return;

            const endDate = new Date(proj.executionEndDate);
            if (endDate < new Date(now.getFullYear(), now.getMonth(), 1)) return; // Past
            if (endDate > cutoffDate) return; // Too far in future

            const key = endDate.getFullYear() + '-' + String(endDate.getMonth() + 1).padStart(2, '0');
            
            // Calculate value: Gross or Utility
            const simCost = parseFloat(simulatedCosts[proj.id]) || 0;
            const effectiveCost = (proj.totalCost || 0) + simCost;
            const val = showUtility ? (proj.total - effectiveCost) : proj.total;
            const advance = parseFloat(advances[proj.id]) || 0;

            if (bins[key]) {
                if (proj.isOcInvoiced) {
                    bins[key].Facturado += val;
                } else {
                    const facturadoPortion = Math.min(advance, val);
                    const pendientePortion = Math.max(0, val - facturadoPortion);
                    bins[key].Facturado += facturadoPortion;
                    bins[key].Pendiente += pendientePortion;
                }
            }
        });

        return Object.values(bins).sort((a, b) => a.key.localeCompare(b.key));
    }, [data, includeInvoiced, includeNotInvoiced, monthsAhead, showUtility, advances, simulatedCosts]);

    const totalProjected = chartData.reduce((acc, curr) => acc + curr.Facturado + curr.Pendiente, 0);
    const totalFacturado = chartData.reduce((acc, curr) => acc + curr.Facturado, 0);
    const totalPendiente = chartData.reduce((acc, curr) => acc + curr.Pendiente, 0);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ background: '#fff', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}>
                    <p style={{ margin: 0, fontWeight: 'bold', color: '#1e293b', marginBottom: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>{label}</p>
                    {payload.map(entry => (
                        <p key={entry.name} style={{ margin: '0.3rem 0', color: entry.color, fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', gap: '2rem' }}>
                            <span>{entry.name}:</span> 
                            <span style={{ fontWeight: '600' }}>S/ {entry.value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </p>
                    ))}
                    <p style={{ margin: '0.75rem 0 0 0', fontWeight: 'bold', color: '#0f172a', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Total:</span>
                        <span>S/ {(payload[0]?.value + (payload[1]?.value || 0)).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </p>
                </div>
            );
        }
        return null;
        return null;
    };

    function Kpi({ icon, label, value, accent }) {
        const colors = { success: '#047857', danger: '#b91c1c', info: '#1d4ed8', warning: '#b45309' };
        const color = colors[accent] || 'var(--text-main)';
        return (
            <div className="acc-kpi">
                <div className="acc-kpi-head">
                    <Icon name={icon} size={14} />
                    <span className="acc-kpi-label">{label}</span>
                </div>
                <div className="acc-kpi-value" style={{ color, fontSize: '1.5rem' }}>{value}</div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Filtros */}
            <div className="acc-card" style={{ display: 'flex', gap: '3rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: '1', minWidth: '300px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <label className="acc-field-label">Línea de Tiempo de Proyección</label>
                        <span className="acc-badge acc-badge-info">
                            {monthsAhead} meses
                        </span>
                    </div>
                    <input 
                        type="range" 
                        min="1" 
                        max="24" 
                        value={monthsAhead} 
                        onChange={e => setMonthsAhead(e.target.value)} 
                        style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer', height: '6px' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        <span>1 mes</span>
                        <span>1 año</span>
                        <span>2 años</span>
                    </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <label className="acc-field-label">Visualización</label>
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-main)', padding: '0.5rem 1rem', background: !showUtility ? '#eff6ff' : '#f8fafc', border: `1px solid ${!showUtility ? '#bfdbfe' : '#e2e8f0'}`, borderRadius: '8px', transition: 'all 0.2s', fontWeight: 500 }}>
                            <input 
                                type="radio" 
                                checked={!showUtility} 
                                onChange={() => setShowUtility(false)} 
                                style={{ width: '1.1rem', height: '1.1rem', accentColor: '#3b82f6' }}
                            />
                            Ingresos Brutos
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-main)', padding: '0.5rem 1rem', background: showUtility ? '#eff6ff' : '#f8fafc', border: `1px solid ${showUtility ? '#bfdbfe' : '#e2e8f0'}`, borderRadius: '8px', transition: 'all 0.2s', fontWeight: 500 }}>
                            <input 
                                type="radio" 
                                checked={showUtility} 
                                onChange={() => setShowUtility(true)} 
                                style={{ width: '1.1rem', height: '1.1rem', accentColor: '#3b82f6' }}
                            />
                            Ganancias Netas (Utilidad)
                        </label>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <label className="acc-field-label">Estados a incluir</label>
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-main)', padding: '0.5rem 1rem', background: includeInvoiced ? '#ecfdf5' : '#f8fafc', border: `1px solid ${includeInvoiced ? '#a7f3d0' : '#e2e8f0'}`, borderRadius: '8px', transition: 'all 0.2s', fontWeight: 500 }}>
                            <input 
                                type="checkbox" 
                                checked={includeInvoiced} 
                                onChange={e => setIncludeInvoiced(e.target.checked)} 
                                style={{ width: '1.1rem', height: '1.1rem', accentColor: '#10b981' }}
                            />
                            OC Facturadas
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-main)', padding: '0.5rem 1rem', background: includeNotInvoiced ? '#fffbeb' : '#f8fafc', border: `1px solid ${includeNotInvoiced ? '#fde68a' : '#e2e8f0'}`, borderRadius: '8px', transition: 'all 0.2s', fontWeight: 500 }}>
                            <input 
                                type="checkbox" 
                                checked={includeNotInvoiced} 
                                onChange={e => setIncludeNotInvoiced(e.target.checked)} 
                                style={{ width: '1.1rem', height: '1.1rem', accentColor: '#f59e0b' }}
                            />
                            OC Pendientes
                        </label>
                    </div>
                </div>
            </div>

            {/* KPIs */}
            <div className="acc-grid acc-grid-3">
                <Kpi 
                    icon="chart-bar" 
                    label={showUtility ? "Utilidad Total Proyectada" : "Ingreso Total Proyectado"} 
                    value={`S/ ${totalProjected.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                    accent="info"
                />
                <Kpi 
                    icon="check-circle" 
                    label={showUtility ? "Utilidad Ya Facturada" : "Ya Facturado"} 
                    value={`S/ ${totalFacturado.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                    accent="success"
                />
                <Kpi 
                    icon="clock" 
                    label={showUtility ? "Utilidad Pendiente" : "Pendiente por Facturar"} 
                    value={`S/ ${totalPendiente.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                    accent="warning"
                />
            </div>

            {/* Gráfico */}
            <div className="acc-card" style={{ height: '550px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '1.5rem', fontWeight: 700 }}>
                    {showUtility ? 'Flujo de Ganancias Netas Esperadas' : 'Flujo de Ingresos Brutos Esperados'}
                </h3>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%', color: '#64748b', fontSize: '1.1rem' }}>Cargando proyecciones...</div>
                ) : chartData.length === 0 ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%', color: '#64748b', fontSize: '1.1rem' }}>No hay datos para el rango seleccionado.</div>
                ) : (
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart
                            data={chartData}
                            margin={{ top: 30, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} dy={15} />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} 
                                tickFormatter={(value) => value >= 1000 ? `S/ ${(value / 1000).toFixed(0)}k` : `S/ ${value}`}
                                dx={-10}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                            <Legend wrapperStyle={{ paddingTop: '25px' }} iconType="circle" />
                            <Bar dataKey="Facturado" name="OC Facturadas" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40}>
                                <LabelList dataKey="Facturado" position="top" formatter={val => val > 0 ? `S/ ${(val/1000).toFixed(1)}k` : ''} style={{ fill: '#10b981', fontSize: '11px', fontWeight: 'bold' }} />
                            </Bar>
                            <Bar dataKey="Pendiente" name="OC Pendientes" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={40}>
                                <LabelList dataKey="Pendiente" position="top" formatter={val => val > 0 ? `S/ ${(val/1000).toFixed(1)}k` : ''} style={{ fill: '#f59e0b', fontSize: '11px', fontWeight: 'bold' }} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
            
            <div className="acc-alert acc-alert-info">
                <Icon name="info" size={16} />
                <span>Esta proyección agrupa los ingresos según la <strong>Fecha Final (Cobro esperado)</strong> definida en el cronograma de actividades de cada proyecto.</span>
            </div>

            {/* Tabla de Detalle */}
            <div className="acc-card" style={{ padding: 0 }}>
                <div style={{ padding: '1.5rem 1.75rem', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', margin: 0, fontWeight: 700 }}>Detalle de Proyectos (OC Recibidas)</h3>
                </div>
                
                <div className="acc-table-wrap" style={{ border: 'none', borderRadius: '0 0 20px 20px' }}>
                    <table className="acc-table">
                        <thead>
                            <tr>
                                <th>Proyecto / Cliente</th>
                                <th>Ingreso Total</th>
                                <th>Costos Restados</th>
                                <th>Gasto Simulado</th>
                                <th>Utilidad Neta</th>
                                <th style={{ width: '120px' }}>Adelanto (Simulado)</th>
                                <th>Fecha Inicio</th>
                                <th>Fecha Final (Cobro)</th>
                                <th>Estado Facturación</th>
                                <th>Incluido en Gráfico</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data && data.length > 0 ? (
                                data.map(proj => {
                                    const hasEndDate = !!proj.executionEndDate;
                                    const isIncludedByFilters = 
                                        (proj.isOcInvoiced && includeInvoiced) || (!proj.isOcInvoiced && includeNotInvoiced);
                                    const isExcluded = proj.isExcludedFromProjections;
                                    
                                    const simCostVal = simulatedCosts[proj.id] || '';
                                    const effectiveCost = (proj.totalCost || 0) + (parseFloat(simCostVal) || 0);
                                    const utilidad = proj.total - effectiveCost;
                                    const advanceVal = advances[proj.id] || '';

                                    let includedStatus = 'Sí';
                                    let badgeClass = 'acc-badge-success';

                                    if (isExcluded) {
                                        includedStatus = 'Excluido manualmente';
                                        badgeClass = 'acc-badge-neutral';
                                    } else if (!hasEndDate) {
                                        includedStatus = 'Falta Fecha Final';
                                        badgeClass = 'acc-badge-danger';
                                    } else if (!isIncludedByFilters) {
                                        includedStatus = 'Oculto por filtros';
                                        badgeClass = 'acc-badge-neutral';
                                    }

                                    return (
                                        <tr key={proj.id} style={{ opacity: isExcluded ? 0.6 : 1 }}>
                                            <td style={{ fontWeight: 600 }}>
                                                {proj.code || 'SIN CÓDIGO'}<br/>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{proj.projectName}</span>
                                            </td>
                                            <td style={{ fontWeight: 700 }}>
                                                S/ {(proj.total || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td style={{ color: '#b91c1c' }}>
                                                - S/ {(proj.totalCost || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td>
                                                <input 
                                                    type="number" 
                                                    className="acc-input" 
                                                    placeholder="0.00" 
                                                    value={simCostVal} 
                                                    onChange={e => setSimulatedCosts(prev => ({ ...prev, [proj.id]: e.target.value }))}
                                                    style={{ width: '100px', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                                                    title="Ingresa un gasto adicional simulado"
                                                />
                                            </td>
                                            <td style={{ fontWeight: 700, color: '#047857' }}>
                                                S/ {utilidad.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td>
                                                <input 
                                                    type="number" 
                                                    className="acc-input" 
                                                    placeholder="0.00" 
                                                    value={advanceVal} 
                                                    onChange={e => setAdvances(prev => ({ ...prev, [proj.id]: e.target.value }))}
                                                    style={{ width: '100px', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                                                    disabled={proj.isOcInvoiced}
                                                    title={proj.isOcInvoiced ? "Ya está facturado al 100%" : "Ingresa un monto adelantado"}
                                                />
                                            </td>
                                            <td>
                                                {proj.executionStartDate ? new Date(proj.executionStartDate).toLocaleDateString('es-PE') : '-'}
                                            </td>
                                            <td style={{ fontWeight: hasEndDate ? 600 : 400 }}>
                                                {proj.executionEndDate ? new Date(proj.executionEndDate).toLocaleDateString('es-PE') : 'No asignada'}
                                            </td>
                                            <td>
                                                <span className={`acc-badge ${proj.isOcInvoiced ? 'acc-badge-success' : 'acc-badge-warning'}`}>
                                                    {proj.isOcInvoiced ? 'Facturada' : 'Pendiente'}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span className={`acc-badge ${badgeClass}`}>
                                                        {includedStatus}
                                                    </span>
                                                    <button 
                                                        onClick={() => onToggleExclude(proj.id, isExcluded)}
                                                        className="btn btn-secondary"
                                                        style={{
                                                            padding: '0.3rem 0.6rem',
                                                            fontSize: '0.7rem',
                                                            background: isExcluded ? '#eff6ff' : '#fef2f2',
                                                            color: isExcluded ? '#1d4ed8' : '#b91c1c',
                                                            borderColor: isExcluded ? '#bfdbfe' : '#fecaca'
                                                        }}
                                                    >
                                                        {isExcluded ? 'Restaurar' : 'Excluir'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem' }}>
                                        {loading ? 'Cargando datos...' : 'No se encontraron proyectos con OC Recibida (Aprobadas/Completadas).'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
