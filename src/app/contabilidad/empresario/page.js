'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AccountingShell from '@/components/AccountingShell';
import Icon from '@/components/icons/Icon';
import { useAccountingConfig } from '@/hooks/useAccountingConfig';
import { getCurrentDeclarationPeriod, formatPeriod, listAvailablePeriods } from '@/lib/accounting/taxCalendar';
import { authFetch } from '@/lib/authFetch';

export default function EmpresarioDashboard() {
    const router = useRouter();
    const { config, companyProfileId, loading: cfgLoading, exists } = useAccountingConfig();
    const [period, setPeriod]   = useState(getCurrentDeclarationPeriod());
    const [calc, setCalc]       = useState(null);
    const [calendar, setCalendar] = useState(null);
    const [summary, setSummary] = useState(null);
    const [daily, setDaily]     = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState(null);
    const [syncing, setSyncing] = useState(false);
    const [autoSelected, setAutoSelected] = useState(false);

    // Al cargar el dashboard por primera vez, si el periodo actual no tiene datos
    // pero hay otros que sí, saltamos al último periodo con datos.
    useEffect(() => {
        if (!exists || !companyProfileId || autoSelected) return;
        (async () => {
            const r = await authFetch(`/api/accounting/periods-summary?companyProfileId=${companyProfileId}`);
            const data = await r.json();
            setSummary(data);
            if (data.latestWithData) {
                const currentHasData = data.periods.some(p => p.period === period && (p.sales > 0 || p.purchases > 0));
                if (!currentHasData) setPeriod(data.latestWithData);
            }
            setAutoSelected(true);
        })();
    }, [exists, companyProfileId, autoSelected, period]);

    useEffect(() => {
        if (!exists || !companyProfileId) return;
        loadData();
    }, [exists, companyProfileId, period]);

    const reloadSummary = async () => {
        if (!companyProfileId) return;
        const r = await authFetch(`/api/accounting/periods-summary?companyProfileId=${companyProfileId}`);
        setSummary(await r.json());
    };

    const loadData = async () => {
        setLoading(true); setError(null);
        try {
            const [calcR, calR, dailyR] = await Promise.all([
                authFetch(`/api/accounting/tax-calc?companyProfileId=${companyProfileId}&period=${period}`),
                authFetch(`/api/accounting/calendar?companyProfileId=${companyProfileId}`),
                authFetch(`/api/accounting/daily-summary?companyProfileId=${companyProfileId}&period=${period}`),
            ]);
            const [calcData, calData, dailyData] = await Promise.all([calcR.json(), calR.json(), dailyR.json()]);
            if (!calcR.ok)  throw new Error(calcData.error  || 'Error calculando');
            if (!calR.ok)   throw new Error(calData.error   || 'Error calendario');
            if (!dailyR.ok) throw new Error(dailyData.error || 'Error tendencia diaria');
            setCalc(calcData);
            setCalendar(calData);
            setDaily(dailyData);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (!confirm('Esto ingresará todas las cotizaciones completadas al registro de ventas. ¿Continuar?')) return;
        setSyncing(true);
        try {
            const r = await authFetch('/api/accounting/ingest-quotations', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyProfileId }),
            });
            const data = await r.json();
            const periodsLine = data.byPeriod && Object.keys(data.byPeriod).length
                ? '\n\nVentas distribuidas por mes:\n' +
                  Object.entries(data.byPeriod).sort().map(([p, n]) => `  · ${formatPeriod(p)}: ${n}`).join('\n')
                : '';
            const jumpHint = data.latestWithData && data.latestWithData !== period
                ? `\n\nEl mes con datos más reciente es ${formatPeriod(data.latestWithData)}. Se cambiará la vista a ese mes.`
                : '';
            alert(`Ingresadas: ${data.ingested} · Ya existían: ${data.skipped}${periodsLine}${jumpHint}`);
            await reloadSummary();
            if (data.latestWithData && data.latestWithData !== period) {
                setPeriod(data.latestWithData);
            } else {
                loadData();
            }
        } finally { setSyncing(false); }
    };

    const [exchangeRate, setExchangeRate] = useState(null);

    useEffect(() => {
        // Fetch Tipo de Cambio SUNAT via proxy interno para evitar CORS
        fetch('/api/sunat/tipo-cambio')
            .then(res => res.json())
            .then(data => setExchangeRate(data))
            .catch(() => setExchangeRate({ compra: 3.70, venta: 3.72, fecha: 'Simulado' }));
    }, []);

    if (cfgLoading) return <AccountingShell><p style={{ color: '#94a3b8' }}>Cargando...</p></AccountingShell>;

    const ingresos = calc?.calc?.igv?.totalVentas ?? 0;
    const gastos   = calc?.calc?.igv?.totalCompras ?? 0;
    const utilidad = Math.round((ingresos - gastos) * 100) / 100;
    const igvPagar = calc?.calc?.igv?.igvAPagar ?? 0;
    const rentaPagar = calc?.calc?.renta?.pagoMensual ?? 0;
    const totalPagar = calc?.calc?.totalAPagar ?? 0;
    const upcoming = calendar?.upcoming || [];

    return (
        <AccountingShell>
            <div className="acc-page-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <button onClick={() => router.push('/')} className="btn-back-square" title="Volver al Dashboard">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="acc-page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Icon name="briefcase" size={26} />
                            Resumen del Negocio
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600, background: '#dcfce7', color: '#166534', padding: '0.2rem 0.6rem', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                                <Icon name="check" size={12} />
                                Conectado con SUNAT
                            </span>
                        </h1>
                        <p className="acc-page-subtitle" style={{ margin: 0, marginTop: '0.25rem' }}>
                            Cómo va tu empresa este mes — explicado simple.
                        </p>
                    </div>
                </div>
                <div className="acc-page-actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <select className="acc-select" style={{ width: 230 }} value={period} onChange={e => setPeriod(e.target.value)}>
                            {listAvailablePeriods().map(p => {
                                const periodInfo = summary?.periods?.find(x => x.period === p);
                                const count = (periodInfo?.sales || 0) + (periodInfo?.purchases || 0);
                                return (
                                    <option key={p} value={p}>
                                        {formatPeriod(p)}{count > 0 ? ` · ${count} movs.` : ''}
                                    </option>
                                );
                            })}
                        </select>
                        <button className="btn btn-secondary" onClick={handleImport} disabled={syncing}>
                            <Icon name="refresh" size={15} className={syncing ? 'spin' : ''} />
                            <span style={{ marginLeft: '0.45rem' }}>{syncing ? 'Sincronizar' : 'Sincronizar ventas'}</span>
                        </button>
                    </div>
                    {exchangeRate && (
                        <div style={{ fontSize: '0.8rem', color: '#475569', background: '#f8fafc', padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', gap: '1rem' }}>
                            <span><strong>TC SUNAT</strong> ({exchangeRate.fecha || 'Hoy'}):</span>
                            <span>Compra: <strong>{exchangeRate.compra}</strong></span>
                            <span>Venta: <strong>{exchangeRate.venta}</strong></span>
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className="acc-alert acc-alert-warn"><Icon name="alert" size={16} /><span>{error}</span></div>
            )}

            {summary && (() => {
                const currentInfo = summary.periods.find(p => p.period === period);
                const currentHasData = currentInfo && (currentInfo.sales > 0 || currentInfo.purchases > 0);
                if (currentHasData) return null;
                if (summary.totalSales === 0 && summary.totalPurchases === 0) {
                    return (
                        <div className="acc-alert acc-alert-info">
                            <Icon name="info" size={16} />
                            <span>Aún no hay ventas ni compras registradas. Usa <strong>Sincronizar ventas</strong> para importar tus facturas, o ve a Modo Contador para registrar compras.</span>
                        </div>
                    );
                }
                if (summary.latestWithData) {
                    return (
                        <div className="acc-alert acc-alert-info">
                            <Icon name="info" size={16} />
                            <span>
                                No hay movimientos en {formatPeriod(period)}. Tus movimientos más recientes están en <strong>{formatPeriod(summary.latestWithData)}</strong>.
                            </span>
                            <button className="btn btn-secondary" style={{ marginLeft: 'auto', padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                                    onClick={() => setPeriod(summary.latestWithData)}>
                                Ver {formatPeriod(summary.latestWithData)}
                            </button>
                        </div>
                    );
                }
                return null;
            })()}

            {loading && <p style={{ color: '#94a3b8' }}>Calculando...</p>}

            <div className="acc-grid acc-grid-4" style={{ marginBottom: '1.5rem' }}>
                <Kpi icon="trending-up" label="Vendiste"  value={fmtMoney(ingresos)} sub={`${calc?.counts?.sales || 0} facturas emitidas`} />
                <Kpi icon="trending-down" label="Gastaste" value={fmtMoney(gastos)} sub={`${calc?.counts?.purchases || 0} compras registradas`} />
                <Kpi icon="coins" label="Te queda" value={fmtMoney(utilidad)} sub={utilidad >= 0 ? 'Utilidad estimada' : 'Pérdida estimada'}
                     accent={utilidad >= 0 ? 'success' : 'danger'} />
                <Kpi icon="receipt" label="Debes a SUNAT" value={fmtMoney(totalPagar)}
                     sub={`IGV ${fmtMoney(igvPagar)} + Renta ${fmtMoney(rentaPagar)}`} accent="info" />
            </div>

            <TrendChart daily={daily} period={period} />

            <div className="acc-grid acc-grid-2" style={{ gap: '1.5rem' }}>
                <div className="acc-card">
                    <h2 className="acc-section-title"><Icon name="calendar" size={18} /> Lo que viene</h2>
                    <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem' }}>
                        Vencimientos según último dígito de tu RUC ({calendar?.ruc?.slice(-1) || '?'}).
                    </p>
                    {upcoming.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Sin vencimientos próximos.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {upcoming.slice(0, 5).map((o) => (
                                <div key={o.period} className="upcoming-row">
                                    <div className="upcoming-bullet" />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>{o.periodLabel}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{o.form}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600 }}>
                                            {formatShortDate(o.dueDateISO)}
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: o.daysRemaining <= 7 ? '#dc2626' : '#94a3b8' }}>
                                            en {o.daysRemaining} días
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="acc-card">
                    <h2 className="acc-section-title"><Icon name="bulb" size={18} /> ¿Qué significa esto?</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem', color: '#475569' }}>
                        <Tip text={`Vendiste ${fmtMoney(ingresos)} este mes. De ese dinero, ${fmtMoney(igvPagar)} le pertenece a SUNAT (IGV de tus clientes).`} />
                        <Tip text={`Gastaste ${fmtMoney(gastos)}. El IGV que pagaste en compras válidas se descuenta de lo que debes a SUNAT.`} />
                        <Tip text={`Tu utilidad estimada antes de impuestos es ${fmtMoney(utilidad)}.${utilidad < 0 ? ' Este mes gastaste más de lo que vendiste.' : ''}`} />
                        {calc?.calc?.renta && (
                            <Tip text={`Pago a cuenta del Impuesto a la Renta: ${fmtMoney(rentaPagar)} — ${calc.calc.renta.nota}`} />
                        )}
                        {calc?.calc?.saldoAFavorIGV > 0 && (
                            <Tip text={`Tienes saldo a favor de IGV de ${fmtMoney(calc.calc.saldoAFavorIGV)} que puedes usar el próximo mes.`} accent="success" />
                        )}
                    </div>
                </div>
            </div>

            <div className="acc-card" style={{ marginTop: '1.5rem' }}>
                <h2 className="acc-section-title"><Icon name="link" size={18} /> ¿Necesitas más detalle?</h2>
                <p style={{ color: '#64748b', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
                    Si eres contador o quieres ver los libros completos, registros formato SUNAT y exportar archivos SIRE:
                </p>
                <button className="btn btn-primary" onClick={() => {
                    localStorage.setItem('accountingMode', 'contador');
                    router.push('/contabilidad/contador');
                }}>
                    <Icon name="calculator" size={16} />
                    <span style={{ marginLeft: '0.5rem' }}>Cambiar a Modo Contador</span>
                </button>
            </div>

            <style jsx>{`
                .upcoming-row {
                    display: flex; align-items: center; gap: 0.85rem;
                    padding: 0.75rem 0.85rem; background: #f8fafc; border-radius: 12px;
                }
                .upcoming-bullet {
                    width: 8px; height: 8px; border-radius: 50%;
                    background: var(--primary); flex-shrink: 0;
                }
            `}</style>
        </AccountingShell>
    );
}

function Kpi({ icon, label, value, sub, accent }) {
    const colorMap = {
        success: '#047857',
        danger:  '#b91c1c',
        info:    '#1d4ed8',
        default: 'var(--text-main)',
    };
    const valueColor = colorMap[accent] || colorMap.default;
    return (
        <div className="acc-kpi">
            <div className="acc-kpi-head">
                <Icon name={icon} size={14} />
                <span className="acc-kpi-label">{label}</span>
            </div>
            <div className="acc-kpi-value" style={{ color: valueColor }}>{value}</div>
            <div className="acc-kpi-sub">{sub}</div>
        </div>
    );
}

function Tip({ text, accent }) {
    const iconName = accent === 'success' ? 'check-circle' : 'info';
    const color = accent === 'success' ? '#047857' : '#64748b';
    return (
        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
            <span style={{ color, flexShrink: 0, marginTop: 1 }}><Icon name={iconName} size={16} /></span>
            <span style={{ flex: 1, lineHeight: 1.5 }}>{text}</span>
        </div>
    );
}

function fmtMoney(n) {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(n || 0);
}

// Gráfico de línea SVG (sin dependencias) — tendencia DIARIA ventas vs compras.
// Muestra cada día del mes seleccionado, con tooltip al pasar el mouse.
function TrendChart({ daily, period }) {
    const [hover, setHover] = useState(null); // índice del día activo

    if (!daily || !daily.days || daily.days.length === 0) return null;

    const data = daily.days; // siempre tiene días 1..daysInMonth
    const hasAnyData = data.some(d => d.salesAmount > 0 || d.purchasesAmount > 0);

    const W = 800, H = 280;
    const PAD = { top: 24, right: 24, bottom: 48, left: 72 };
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;

    const maxVal = Math.max(
        ...data.map(p => Math.max(p.salesAmount || 0, p.purchasesAmount || 0)),
        1,
    );
    const niceMax = niceCeil(maxVal);

    const xStep = data.length > 1 ? innerW / (data.length - 1) : 0;
    const xAt = (i) => PAD.left + (data.length === 1 ? innerW / 2 : i * xStep);
    const yAt = (v) => PAD.top + innerH - (v / niceMax) * innerH;

    const buildPath = (key) =>
        data.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yAt(p[key] || 0).toFixed(1)}`).join(' ');
    const buildArea = (key) => {
        const top = data.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yAt(p[key] || 0).toFixed(1)}`).join(' ');
        const yBase = (PAD.top + innerH).toFixed(1);
        return `${top} L ${xAt(data.length - 1).toFixed(1)} ${yBase} L ${xAt(0).toFixed(1)} ${yBase} Z`;
    };

    const totalSales     = daily.totals?.salesAmount     ?? data.reduce((s, p) => s + (p.salesAmount || 0), 0);
    const totalPurchases = daily.totals?.purchasesAmount ?? data.reduce((s, p) => s + (p.purchasesAmount || 0), 0);
    const utilidad       = totalSales - totalPurchases;
    // Promedio sobre los días con actividad (no sobre el mes entero)
    const activeDays   = data.filter(d => d.salesAmount > 0 || d.purchasesAmount > 0).length || 1;
    const avgSales     = totalSales     / activeDays;
    const avgPurchases = totalPurchases / activeDays;

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => ({
        value: niceMax * t,
        y: PAD.top + innerH - innerH * t,
    }));

    // Mostrar etiquetas de X cada N días para no saturar (≤10 etiquetas)
    const labelStep = Math.max(1, Math.ceil(data.length / 10));

    const hovered = hover !== null ? data[hover] : null;

    return (
        <div className="acc-card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h2 className="acc-section-title" style={{ marginBottom: '0.25rem' }}>
                        <Icon name="trending-up" size={18} /> Tendencia diaria — {formatPeriod(period)}
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
                        {hasAnyData ? (
                            <>Promedio por día con actividad — Ventas <strong style={{ color: '#047857' }}>{fmtMoney(avgSales)}</strong> · Compras <strong style={{ color: '#b91c1c' }}>{fmtMoney(avgPurchases)}</strong> · Utilidad del mes <strong style={{ color: utilidad >= 0 ? '#047857' : '#b91c1c' }}>{fmtMoney(utilidad)}</strong></>
                        ) : (
                            <>Sin movimientos registrados en este mes.</>
                        )}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.85rem', fontSize: '0.78rem', color: '#64748b' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ width: 14, height: 3, background: '#10b981', borderRadius: 2 }} /> Ventas
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ width: 14, height: 3, background: '#ef4444', borderRadius: 2 }} /> Compras
                    </span>
                </div>
            </div>

            <div style={{ position: 'relative', width: '100%' }}>
                <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: 'auto', display: 'block' }}>
                    <defs>
                        <linearGradient id="grad-sales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor="#10b981" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="grad-purchases" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor="#ef4444" stopOpacity="0.18" />
                            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Cuadrícula Y y etiquetas */}
                    {yTicks.map((t, i) => (
                        <g key={i}>
                            <line x1={PAD.left} y1={t.y} x2={W - PAD.right} y2={t.y}
                                  stroke="#e2e8f0" strokeWidth="1" strokeDasharray={i === 0 ? '0' : '3 3'} />
                            <text x={PAD.left - 8} y={t.y + 4} textAnchor="end"
                                  fontSize="11" fill="#94a3b8" fontFamily="system-ui, sans-serif">
                                {compactMoney(t.value)}
                            </text>
                        </g>
                    ))}

                    {/* Etiquetas eje X (cada labelStep días + siempre el último) */}
                    {data.map((p, i) => {
                        const isLast = i === data.length - 1;
                        if (i % labelStep !== 0 && !isLast) return null;
                        return (
                            <text key={`xl-${p.day}`} x={xAt(i)} y={H - PAD.bottom + 20}
                                  textAnchor="middle" fontSize="11"
                                  fill="#64748b" fontFamily="system-ui, sans-serif">
                                {p.day}
                            </text>
                        );
                    })}
                    <text x={PAD.left + innerW / 2} y={H - 6} textAnchor="middle"
                          fontSize="10" fill="#94a3b8" fontFamily="system-ui, sans-serif">
                        Día del mes
                    </text>

                    {/* Línea vertical de hover */}
                    {hover !== null && (
                        <line x1={xAt(hover)} y1={PAD.top} x2={xAt(hover)} y2={PAD.top + innerH}
                              stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" />
                    )}

                    {/* Áreas + líneas */}
                    <path d={buildArea('purchasesAmount')} fill="url(#grad-purchases)" />
                    <path d={buildArea('salesAmount')}     fill="url(#grad-sales)" />
                    <path d={buildPath('purchasesAmount')} fill="none" stroke="#ef4444" strokeWidth="2.5"
                          strokeLinecap="round" strokeLinejoin="round" />
                    <path d={buildPath('salesAmount')}     fill="none" stroke="#10b981" strokeWidth="2.5"
                          strokeLinecap="round" strokeLinejoin="round" />

                    {/* Puntos sólo en días con actividad (para no saturar) */}
                    {data.map((p, i) => {
                        const hasSales     = (p.salesAmount     || 0) > 0;
                        const hasPurchases = (p.purchasesAmount || 0) > 0;
                        if (!hasSales && !hasPurchases && hover !== i) return null;
                        return (
                            <g key={`pts-${p.day}`}>
                                {(hasPurchases || hover === i) && (
                                    <circle cx={xAt(i)} cy={yAt(p.purchasesAmount || 0)} r={hover === i ? 5 : 3}
                                            fill="#fff" stroke="#ef4444" strokeWidth="2" />
                                )}
                                {(hasSales || hover === i) && (
                                    <circle cx={xAt(i)} cy={yAt(p.salesAmount || 0)} r={hover === i ? 5 : 3}
                                            fill="#fff" stroke="#10b981" strokeWidth="2" />
                                )}
                            </g>
                        );
                    })}

                    {/* Áreas invisibles para captura de hover */}
                    {data.map((p, i) => {
                        const half = data.length === 1 ? innerW / 2 : xStep / 2;
                        const x = xAt(i) - half;
                        return (
                            <rect key={`hit-${p.day}`}
                                  x={x} y={PAD.top} width={half * 2} height={innerH}
                                  fill="transparent"
                                  onMouseEnter={() => setHover(i)}
                                  onMouseLeave={() => setHover(null)} />
                        );
                    })}
                </svg>

                {/* Tooltip flotante */}
                {hovered && (
                    <div style={{
                        position: 'absolute',
                        left: `${(xAt(hover) / W) * 100}%`,
                        top: `${(PAD.top / H) * 100}%`,
                        transform: `translate(${hover > data.length / 2 ? '-110%' : '10%'}, -8%)`,
                        background: 'rgba(15, 23, 42, 0.95)',
                        color: '#fff',
                        padding: '0.6rem 0.8rem',
                        borderRadius: 8,
                        fontSize: '0.78rem',
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                        zIndex: 10,
                    }}>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>{formatDayLabel(period, hovered.day)}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 8, height: 8, background: '#10b981', borderRadius: 2 }} />
                            Ventas: <strong>{fmtMoney(hovered.salesAmount)}</strong>
                            <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>({hovered.salesCount})</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            <span style={{ width: 8, height: 8, background: '#ef4444', borderRadius: 2 }} />
                            Compras: <strong>{fmtMoney(hovered.purchasesAmount)}</strong>
                            <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>({hovered.purchasesCount})</span>
                        </div>
                        <div style={{ marginTop: 4, paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.15)', color: '#cbd5e1' }}>
                            Utilidad: <strong style={{ color: (hovered.salesAmount - hovered.purchasesAmount) >= 0 ? '#34d399' : '#fca5a5' }}>
                                {fmtMoney(hovered.salesAmount - hovered.purchasesAmount)}
                            </strong>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function formatDayLabel(period, day) {
    const [y, m] = period.split('-');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${day} ${months[parseInt(m) - 1]} ${y}`;
}

// Redondea hacia arriba a un número "lindo" (10, 25, 50, 100, 250, 500, 1k, etc.)
function niceCeil(n) {
    if (n <= 0) return 1;
    const exp = Math.floor(Math.log10(n));
    const base = Math.pow(10, exp);
    const norm = n / base;
    let nice;
    if (norm <= 1)      nice = 1;
    else if (norm <= 2) nice = 2;
    else if (norm <= 2.5) nice = 2.5;
    else if (norm <= 5) nice = 5;
    else                nice = 10;
    return nice * base;
}

function compactMoney(n) {
    if (n >= 1_000_000) return `S/ ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `S/ ${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`;
    return `S/ ${n.toFixed(0)}`;
}

function formatShortDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}
