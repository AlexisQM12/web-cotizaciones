'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AccountingShell from '@/components/AccountingShell';
import Icon from '@/components/icons/Icon';
import { useAccountingConfig } from '@/hooks/useAccountingConfig';
import { getCurrentDeclarationPeriod, formatPeriod, listAvailablePeriods, getDueDate } from '@/lib/accounting/taxCalendar';

export default function Page() {
    return <Suspense fallback={<AccountingShell><p style={{ color: '#94a3b8' }}>Cargando...</p></AccountingShell>}><DeterminacionIGV /></Suspense>;
}

function DeterminacionIGV() {
    const searchParams = useSearchParams();
    const { companyProfileId, config } = useAccountingConfig();
    const [period, setPeriod] = useState(searchParams.get('period') || getCurrentDeclarationPeriod());
    const [data, setData]     = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!companyProfileId) return;
        (async () => {
            setLoading(true);
            const r = await fetch(`/api/accounting/tax-calc?companyProfileId=${companyProfileId}&period=${period}`);
            setData(await r.json());
            setLoading(false);
        })();
    }, [companyProfileId, period]);

    const igv   = data?.calc?.igv   || {};
    const renta = data?.calc?.renta || {};
    const dueDate = config?.ruc ? getDueDate(period, config.ruc, !!config.esBuenContribuyente) : null;

    return (
        <AccountingShell>
            <div className="acc-page-head">
                <div>
                    <h1 className="acc-page-title">
                        <Icon name="receipt" size={24} />
                        Determinación IGV / Renta
                    </h1>
                    <p className="acc-page-subtitle">
                        {formatPeriod(period)}
                        {dueDate && <> · Vence: <strong>{dueDate.toLocaleDateString('es-PE')}</strong></>}
                    </p>
                </div>
                <div className="acc-page-actions">
                    <select className="acc-select" style={{ width: 200 }} value={period} onChange={e => setPeriod(e.target.value)}>
                        {listAvailablePeriods().map(p => <option key={p} value={p}>{formatPeriod(p)}</option>)}
                    </select>
                </div>
            </div>

            {loading && <p style={{ color: '#94a3b8' }}>Calculando...</p>}

            <div className="acc-grid acc-grid-2" style={{ gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div className="acc-card">
                    <h2 className="acc-section-title"><Icon name="doc-up" size={18} /> Débito Fiscal (Ventas)</h2>
                    <Row label="Base imponible operaciones gravadas" value={fmt(igv.baseImponibleGravada)} />
                    <Row label="IGV de ventas (18%)" value={fmt(igv.igvDebitoFiscal)} highlight />
                    <Row label="Operaciones exoneradas" value={fmt(igv.exoneradas)} muted />
                    <Row label="Operaciones inafectas" value={fmt(igv.inafectas)} muted />
                    <Row label="Exportaciones" value={fmt(igv.exportaciones)} muted />
                    <Row label="Total ventas del periodo" value={fmt(igv.totalVentas)} bold />
                </div>

                <div className="acc-card">
                    <h2 className="acc-section-title"><Icon name="doc-down" size={18} /> Crédito Fiscal (Compras)</h2>
                    <Row label="Base de compras con derecho a crédito" value={fmt(igv.baseImponibleCompras)} />
                    <Row label="IGV crédito fiscal" value={fmt(igv.igvCreditoFiscal)} highlight />
                    <Row label="Compras no gravadas" value={fmt(igv.comprasNoGravadas)} muted />
                    <Row label="Compras sin derecho a crédito" value={fmt(igv.comprasSinDerecho)} muted />
                    <Row label="Total compras del periodo" value={fmt(igv.totalCompras)} bold />
                </div>
            </div>

            <div className="acc-card" style={{ marginBottom: '1.25rem' }}>
                <h2 className="acc-section-title"><Icon name="coins" size={18} /> IGV del Periodo</h2>
                <div className="acc-grid acc-grid-3">
                    <Big label="IGV Débito Fiscal" value={fmt(igv.igvDebitoFiscal)} />
                    <Big label="IGV Crédito Fiscal" value={`(${fmt(igv.igvCreditoFiscal)})`} accent="success" />
                    <Big
                        label={igv.igvAPagar > 0 ? 'IGV a Pagar' : 'Saldo a favor'}
                        value={fmt(igv.igvAPagar > 0 ? igv.igvAPagar : igv.saldoAFavorIGV)}
                        accent={igv.igvAPagar > 0 ? 'danger' : 'success'}
                    />
                </div>
            </div>

            <div className="acc-card" style={{ marginBottom: '1.25rem' }}>
                <h2 className="acc-section-title"><Icon name="calculator" size={18} /> Impuesto a la Renta — {renta.regimen}</h2>
                {renta.nota && (
                    <div className="acc-alert acc-alert-info" style={{ marginBottom: '1rem' }}>
                        <Icon name="info" size={15} />
                        <span>{renta.nota}</span>
                    </div>
                )}
                <div className="acc-grid acc-grid-3">
                    <Big label="Ingresos netos del mes" value={fmt(renta.ingresosNetos)} />
                    <Big label="Tasa aplicada" value={renta.tasaAplicada ? `${(renta.tasaAplicada * 100).toFixed(2)}%` : (renta.categoria ? `Categoría ${renta.categoria}` : '—')} />
                    <Big label={renta.esDefinitivo ? 'Renta definitiva' : 'Pago a cuenta Renta'} value={fmt(renta.pagoMensual)} accent="info" />
                </div>
            </div>

            <div className="acc-card">
                <h2 className="acc-section-title"><Icon name="file-text" size={18} /> Resumen para Formulario Virtual 621</h2>
                <p style={{ color: '#64748b', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                    Estos son los valores que debes ingresar directamente en SUNAT Operaciones en Línea.
                </p>
                <div className="acc-grid acc-grid-2">
                    <Casilla n="100" label="Base Imponible Op. Gravadas" value={igv.baseImponibleGravada} />
                    <Casilla n="101" label="IGV (18%)" value={igv.igvDebitoFiscal} />
                    <Casilla n="105" label="Exportaciones" value={igv.exportaciones} />
                    <Casilla n="106" label="Exoneradas" value={igv.exoneradas} />
                    <Casilla n="109" label="Inafectas" value={igv.inafectas} />
                    <Casilla n="107" label="Compras destinadas operaciones gravadas" value={igv.baseImponibleCompras} />
                    <Casilla n="108" label="IGV Compras" value={igv.igvCreditoFiscal} />
                    <Casilla n="140" label="IGV NETO A PAGAR" value={igv.igvAPagar} highlight />
                    <Casilla n="301" label="Ingresos netos Renta" value={igv.totalVentas} />
                    <Casilla n="312" label="Pago a cuenta Renta" value={renta.pagoMensual} highlight />
                </div>
                <div style={{
                    marginTop: '1.5rem', padding: '1.25rem',
                    background: 'var(--primary)', color: '#fff',
                    borderRadius: 16, textAlign: 'center',
                }}>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                        Total a Pagar SUNAT este mes
                    </div>
                    <div style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{fmt(data?.calc?.totalAPagar)}</div>
                </div>
            </div>
        </AccountingShell>
    );
}

function Row({ label, value, highlight, muted, bold }) {
    return (
        <div style={{
            display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0',
            borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem',
            color: muted ? '#94a3b8' : 'var(--text-main)',
            fontWeight: bold || highlight ? 700 : 400,
        }}>
            <span>{label}</span><span>{value}</span>
        </div>
    );
}

function Big({ label, value, accent }) {
    const colors = { success: '#047857', danger: '#b91c1c', info: '#1d4ed8' };
    const color = colors[accent] || 'var(--text-main)';
    return (
        <div style={{ padding: '1.1rem', background: '#f8fafc', borderRadius: 14 }}>
            <div className="acc-kpi-label">{label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color, marginTop: 4 }}>{value}</div>
        </div>
    );
}

function Casilla({ n, label, value, highlight }) {
    return (
        <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0.75rem 1rem',
            background: highlight ? '#0f172a' : '#f8fafc',
            color: highlight ? '#fff' : 'var(--text-main)',
            borderRadius: 12, gap: '0.5rem',
        }}>
            <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.7 }}>Casilla {n}</div>
                <div style={{ fontSize: '0.85rem', marginTop: 2 }}>{label}</div>
            </div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{fmt(value)}</div>
        </div>
    );
}

function fmt(n) { return new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0); }
