'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AccountingShell from '@/components/AccountingShell';
import Icon from '@/components/icons/Icon';
import { useAccountingConfig } from '@/hooks/useAccountingConfig';
import { getCurrentDeclarationPeriod, formatPeriod, listAvailablePeriods } from '@/lib/accounting/taxCalendar';

export default function EmpresarioDashboard() {
    const router = useRouter();
    const { config, companyProfileId, loading: cfgLoading, exists } = useAccountingConfig();
    const [period, setPeriod]   = useState(getCurrentDeclarationPeriod());
    const [calc, setCalc]       = useState(null);
    const [calendar, setCalendar] = useState(null);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState(null);
    const [syncing, setSyncing] = useState(false);
    const [autoSelected, setAutoSelected] = useState(false);

    // Al cargar el dashboard por primera vez, si el periodo actual no tiene datos
    // pero hay otros que sí, saltamos al último periodo con datos.
    useEffect(() => {
        if (!exists || !companyProfileId || autoSelected) return;
        (async () => {
            const r = await fetch(`/api/accounting/periods-summary?companyProfileId=${companyProfileId}`);
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
        const r = await fetch(`/api/accounting/periods-summary?companyProfileId=${companyProfileId}`);
        setSummary(await r.json());
    };

    const loadData = async () => {
        setLoading(true); setError(null);
        try {
            const [calcR, calR] = await Promise.all([
                fetch(`/api/accounting/tax-calc?companyProfileId=${companyProfileId}&period=${period}`),
                fetch(`/api/accounting/calendar?companyProfileId=${companyProfileId}`),
            ]);
            const [calcData, calData] = await Promise.all([calcR.json(), calR.json()]);
            if (!calcR.ok) throw new Error(calcData.error || 'Error calculando');
            if (!calR.ok)  throw new Error(calData.error  || 'Error calendario');
            setCalc(calcData);
            setCalendar(calData);
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
            const r = await fetch('/api/accounting/ingest-quotations', {
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
            <div style={{ marginBottom: '1.5rem' }}>
                <button onClick={() => router.push('/')} className="btn" style={{ background: '#4b5563', color: 'white' }}>
                    ← Volver al Dashboard
                </button>
            </div>
            <div className="acc-page-head">
                <div>
                    <h1 className="acc-page-title">
                        <Icon name="briefcase" size={26} />
                        Resumen del Negocio
                    </h1>
                    <p className="acc-page-subtitle">
                        Cómo va tu empresa este mes — explicado simple.
                    </p>
                </div>
                <div className="acc-page-actions">
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
                        <span style={{ marginLeft: '0.45rem' }}>{syncing ? 'Sincronizando...' : 'Sincronizar ventas'}</span>
                    </button>
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

function formatShortDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}
