'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AccountingShell from '@/components/AccountingShell';
import Icon from '@/components/icons/Icon';
import { useAccountingConfig } from '@/hooks/useAccountingConfig';
import { getCurrentDeclarationPeriod, formatPeriod, listAvailablePeriods } from '@/lib/accounting/taxCalendar';
import { getRequiredBooks } from '@/lib/accounting/sunatRules';

export default function ContadorDashboard() {
    const router = useRouter();
    const { config, companyProfileId, loading: cfgLoading } = useAccountingConfig();
    const [period, setPeriod] = useState(getCurrentDeclarationPeriod());
    const [calc, setCalc]     = useState(null);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [autoSelected, setAutoSelected] = useState(false);

    const [exchangeRate, setExchangeRate] = useState(null);

    useEffect(() => {
        if (!companyProfileId || autoSelected) return;
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
    }, [companyProfileId, autoSelected, period]);

    useEffect(() => {
        if (!companyProfileId) return;
        (async () => {
            setLoading(true);
            const r = await fetch(`/api/accounting/tax-calc?companyProfileId=${companyProfileId}&period=${period}`);
            setCalc(await r.json());
            setLoading(false);
        })();
    }, [companyProfileId, period]);

    useEffect(() => {
        // Fetch Tipo de Cambio SUNAT via proxy interno para evitar CORS
        fetch('/api/sunat/tipo-cambio')
            .then(res => res.json())
            .then(data => setExchangeRate(data))
            .catch(() => setExchangeRate({ compra: 3.70, venta: 3.72, fecha: 'Simulado' }));
    }, []);

    if (cfgLoading || !config) return <AccountingShell><p style={{ color: '#94a3b8' }}>Cargando...</p></AccountingShell>;

    const books = getRequiredBooks(config.taxRegime, config.ingresosAnualesProyectados || 0);
    const igv   = calc?.calc?.igv   || {};
    const renta = calc?.calc?.renta || {};

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
                            <Icon name="calculator" size={26} />
                            Panel del Contador
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600, background: '#dcfce7', color: '#166534', padding: '0.2rem 0.6rem', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                                <Icon name="check" size={12} />
                                Conectado con SUNAT
                            </span>
                        </h1>
                        <p className="acc-page-subtitle" style={{ margin: 0, marginTop: '0.25rem' }}>
                            Régimen: <strong>{config.taxRegime}</strong> · RUC <strong>{config.ruc}</strong> · {config.razonSocial}
                        </p>
                    </div>
                </div>
                <div className="acc-page-actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <select className="acc-select" style={{ width: 230 }} value={period} onChange={e => setPeriod(e.target.value)}>
                        {listAvailablePeriods().map(p => {
                            const pi = summary?.periods?.find(x => x.period === p);
                            const count = (pi?.sales || 0) + (pi?.purchases || 0);
                            return <option key={p} value={p}>{formatPeriod(p)}{count > 0 ? ` · ${count} movs.` : ''}</option>;
                        })}
                    </select>
                    {exchangeRate && (
                        <div style={{ fontSize: '0.8rem', color: '#475569', background: '#f8fafc', padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', gap: '1rem' }}>
                            <span><strong>TC SUNAT</strong> ({exchangeRate.fecha || 'Hoy'}):</span>
                            <span>Compra: <strong>{exchangeRate.compra}</strong></span>
                            <span>Venta: <strong>{exchangeRate.venta}</strong></span>
                        </div>
                    )}
                </div>
            </div>

            {summary && (() => {
                const ci = summary.periods.find(p => p.period === period);
                const has = ci && (ci.sales > 0 || ci.purchases > 0);
                if (has || !summary.latestWithData) return null;
                return (
                    <div className="acc-alert acc-alert-info">
                        <Icon name="info" size={16} />
                        <span>No hay movimientos en {formatPeriod(period)}. Disponibles en <strong>{formatPeriod(summary.latestWithData)}</strong>.</span>
                        <button className="btn btn-secondary" style={{ marginLeft: 'auto', padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                                onClick={() => setPeriod(summary.latestWithData)}>
                            Ver {formatPeriod(summary.latestWithData)}
                        </button>
                    </div>
                );
            })()}

            {loading && <p style={{ color: '#94a3b8' }}>Calculando...</p>}

            <div className="acc-grid acc-grid-4" style={{ marginBottom: '1.5rem' }}>
                <Kpi icon="doc-up"   label="Base Imp. Gravada"  value={fmt(igv.baseImponibleGravada)} />
                <Kpi icon="trending-up"   label="IGV Débito Fiscal"   value={fmt(igv.igvDebitoFiscal)} />
                <Kpi icon="trending-down" label="IGV Crédito Fiscal"  value={fmt(igv.igvCreditoFiscal)} />
                <Kpi icon="coins" label="IGV a Pagar" value={fmt(igv.igvAPagar)}
                     accent={igv.igvAPagar > 0 ? 'danger' : 'success'} />
            </div>

            <div className="acc-grid acc-grid-2" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="acc-card">
                    <h2 className="acc-section-title"><Icon name="arrow-up-right" size={18} /> Acceso rápido</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <QuickLink href={`/contabilidad/contador/ventas?period=${period}`}    icon="doc-up"   label="Registro de Ventas" count={calc?.counts?.sales} />
                        <QuickLink href={`/contabilidad/contador/compras?period=${period}`}   icon="doc-down" label="Registro de Compras" count={calc?.counts?.purchases} />
                        <QuickLink href={`/contabilidad/contador/diario?period=${period}`}    icon="book"     label="Libro Diario / Mayor" />
                        <QuickLink href={`/contabilidad/contador/igv?period=${period}`}       icon="receipt"  label="Determinación IGV / Renta" />
                        <QuickLink href={`/contabilidad/contador/exportar?period=${period}`}  icon="package"  label="Exportar SIRE / PLE" />
                    </div>
                </div>
                <div className="acc-card">
                    <h2 className="acc-section-title"><Icon name="book" size={18} /> Libros obligatorios</h2>
                    <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                        Según régimen <strong>{config.taxRegime}</strong> e ingresos proyectados S/ {Number(config.ingresosAnualesProyectados || 0).toLocaleString()}:
                    </p>
                    {books.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Sin libros obligatorios (NRUS).</p>
                    ) : (
                        <ul style={{ paddingLeft: '1.25rem', color: '#475569', fontSize: '0.875rem', lineHeight: 1.7, margin: 0 }}>
                            {books.map(b => <li key={b}>{b.replace(/_/g, ' ')}</li>)}
                        </ul>
                    )}
                </div>
            </div>

            <div className="acc-card">
                <h2 className="acc-section-title"><Icon name="file-text" size={18} /> Resumen Formulario 621</h2>
                <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                    Valores listos para llenar en SUNAT Operaciones en Línea.
                </p>
                <div className="acc-grid acc-grid-3" style={{ gap: '0.75rem' }}>
                    <Form621Row casilla="100" label="Base Imp. Gravadas" value={fmt(igv.baseImponibleGravada)} />
                    <Form621Row casilla="101" label="IGV Ventas (18%)" value={fmt(igv.igvDebitoFiscal)} />
                    <Form621Row casilla="105" label="Exportaciones" value={fmt(igv.exportaciones)} />
                    <Form621Row casilla="106" label="Exoneradas" value={fmt(igv.exoneradas)} />
                    <Form621Row casilla="109" label="Inafectas" value={fmt(igv.inafectas)} />
                    <Form621Row casilla="107" label="Base Compras" value={fmt(igv.baseImponibleCompras)} />
                    <Form621Row casilla="108" label="IGV Compras" value={fmt(igv.igvCreditoFiscal)} />
                    <Form621Row casilla="140" label="IGV Neto a Pagar" value={fmt(igv.igvAPagar)} highlight />
                    <Form621Row casilla="301" label="Ingresos Netos Renta" value={fmt(igv.totalVentas)} />
                    <Form621Row casilla="312"
                        label={`Pago a cuenta Renta (${((renta.tasaAplicada || 0) * 100).toFixed(2)}%)`}
                        value={fmt(renta.pagoMensual)} highlight />
                </div>
            </div>
        </AccountingShell>
    );
}

function Kpi({ icon, label, value, accent }) {
    const colors = { success: '#047857', danger: '#b91c1c', info: '#1d4ed8' };
    const color = colors[accent] || 'var(--text-main)';
    return (
        <div className="acc-kpi">
            <div className="acc-kpi-head"><Icon name={icon} size={14} /><span className="acc-kpi-label">{label}</span></div>
            <div className="acc-kpi-value" style={{ color, fontSize: '1.35rem' }}>{value}</div>
        </div>
    );
}

function QuickLink({ href, icon, label, count }) {
    return (
        <a href={href} className="acc-quick-link">
            <Icon name={icon} size={17} />
            <span style={{ flex: 1 }}>{label}</span>
            {count !== undefined && <span className="acc-badge acc-badge-neutral">{count}</span>}
            <Icon name="arrow-right" size={14} />
            <style jsx>{`
                .acc-quick-link {
                    display: flex; align-items: center; gap: 0.7rem;
                    padding: 0.7rem 0.85rem;
                    background: #f8fafc;
                    border-radius: 10px;
                    color: #475569;
                    text-decoration: none;
                    font-size: 0.875rem; font-weight: 500;
                    transition: all 0.15s;
                }
                .acc-quick-link:hover {
                    background: var(--primary); color: #fff;
                }
            `}</style>
        </a>
    );
}

function Form621Row({ casilla, label, value, highlight }) {
    return (
        <div className="form621-row" style={{ background: highlight ? '#0f172a' : '#f8fafc', color: highlight ? '#fff' : 'var(--text-main)' }}>
            <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.65 }}>Casilla {casilla}</div>
                <div style={{ fontSize: '0.8rem', marginTop: 2 }}>{label}</div>
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{value}</div>
            <style jsx>{`
                .form621-row {
                    padding: 0.7rem 0.9rem;
                    border-radius: 12px;
                    display: flex; justify-content: space-between;
                    align-items: center; gap: 0.5rem;
                }
            `}</style>
        </div>
    );
}

function fmt(n) {
    return new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
}
