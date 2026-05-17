'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AccountingShell from '@/components/AccountingShell';
import Icon from '@/components/icons/Icon';
import { useAccountingConfig } from '@/hooks/useAccountingConfig';
import { getCurrentDeclarationPeriod, formatPeriod, listAvailablePeriods } from '@/lib/accounting/taxCalendar';
import { VOUCHER_TYPES, DOC_ID_TYPES } from '@/lib/accounting/sunatRules';

export default function Page() {
    return <Suspense fallback={<AccountingShell><p style={{ color: '#94a3b8' }}>Cargando...</p></AccountingShell>}><RegistroVentas /></Suspense>;
}

function RegistroVentas() {
    const searchParams = useSearchParams();
    const urlPeriod = searchParams.get('period');
    const { companyProfileId } = useAccountingConfig();
    const [period, setPeriod] = useState(urlPeriod || getCurrentDeclarationPeriod());
    const [sales, setSales]   = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [autoSelected, setAutoSelected] = useState(!!urlPeriod);

    useEffect(() => {
        if (!companyProfileId || autoSelected) return;
        (async () => {
            const r = await fetch(`/api/accounting/periods-summary?companyProfileId=${companyProfileId}`);
            const data = await r.json();
            setSummary(data);
            if (data.latestWithData) {
                const has = data.periods.some(p => p.period === period && p.sales > 0);
                if (!has) setPeriod(data.latestWithData);
            }
            setAutoSelected(true);
        })();
    }, [companyProfileId, autoSelected, period]);

    useEffect(() => { if (companyProfileId) load(); }, [companyProfileId, period]);

    const reloadSummary = async () => {
        if (!companyProfileId) return;
        const r = await fetch(`/api/accounting/periods-summary?companyProfileId=${companyProfileId}`);
        setSummary(await r.json());
    };

    const load = async () => {
        setLoading(true);
        const r = await fetch(`/api/accounting/sales?companyProfileId=${companyProfileId}&period=${period}`);
        const data = await r.json();
        setSales(Array.isArray(data) ? data : []);
        setLoading(false);
    };

    const handleSave = async (entry) => {
        const method = entry.id ? 'PUT' : 'POST';
        const body   = entry.id ? entry : { ...entry, companyProfileId };
        const r = await fetch('/api/accounting/sales', {
            method, headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!r.ok) {
            const d = await r.json().catch(() => ({}));
            alert(d.error || 'Error al guardar');
            return;
        }
        setEditing(null); setShowForm(false);
        load();
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar esta venta?')) return;
        await fetch(`/api/accounting/sales?id=${id}`, { method: 'DELETE' });
        load();
    };

    const handleImport = async () => {
        if (!confirm('Importará todas las cotizaciones COMPLETADAS al registro de ventas. ¿Continuar?')) return;
        setSyncing(true);
        try {
            const r = await fetch('/api/accounting/ingest-quotations', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyProfileId }),
            });
            const d = await r.json();
            const periodsLine = d.byPeriod && Object.keys(d.byPeriod).length
                ? '\n\nVentas por mes:\n' + Object.entries(d.byPeriod).sort().map(([p, n]) => `  · ${formatPeriod(p)}: ${n}`).join('\n')
                : '';
            alert(`Ingresadas: ${d.ingested} · Ya existían: ${d.skipped}${periodsLine}\n\nLas marcadas como "Completar" requieren que ingreses serie/número de factura.`);
            await reloadSummary();
            if (d.latestWithData && d.latestWithData !== period) {
                setPeriod(d.latestWithData);
            } else {
                load();
            }
        } finally { setSyncing(false); }
    };

    const totals = sales.reduce((acc, s) => {
        const sign = s.tipoComprobante === '07' ? -1 : 1;
        acc.base  += (s.baseImponible || 0) * sign;
        acc.igv   += (s.igv || 0) * sign;
        acc.total += (s.total || 0) * sign;
        return acc;
    }, { base: 0, igv: 0, total: 0 });

    return (
        <AccountingShell>
            <div className="acc-page-head">
                <div>
                    <h1 className="acc-page-title">
                        <Icon name="doc-up" size={24} />
                        Registro de Ventas e Ingresos
                    </h1>
                    <p className="acc-page-subtitle">
                        Formato SIRE 14.1 · {formatPeriod(period)} · {sales.length} comprobantes
                    </p>
                </div>
                <div className="acc-page-actions">
                    <select className="acc-select" style={{ width: 230 }} value={period} onChange={e => setPeriod(e.target.value)}>
                        {listAvailablePeriods().map(p => {
                            const pi = summary?.periods?.find(x => x.period === p);
                            return <option key={p} value={p}>{formatPeriod(p)}{pi?.sales > 0 ? ` · ${pi.sales} ventas` : ''}</option>;
                        })}
                    </select>
                    <button className="btn btn-secondary" onClick={handleImport} disabled={syncing}>
                        <Icon name="refresh" size={15} className={syncing ? 'spin' : ''} />
                        <span style={{ marginLeft: '0.45rem' }}>Sincronizar</span>
                    </button>
                    <button className="btn btn-primary" onClick={() => { setEditing(emptySale(period)); setShowForm(true); }}>
                        <Icon name="plus" size={15} />
                        <span style={{ marginLeft: '0.45rem' }}>Nueva venta</span>
                    </button>
                </div>
            </div>

            {summary && sales.length === 0 && summary.latestWithData && summary.latestWithData !== period && (
                <div className="acc-alert acc-alert-info">
                    <Icon name="info" size={16} />
                    <span>No hay ventas en {formatPeriod(period)}. Tus ventas más recientes están en <strong>{formatPeriod(summary.latestWithData)}</strong>.</span>
                    <button className="btn btn-secondary" style={{ marginLeft: 'auto', padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                            onClick={() => setPeriod(summary.latestWithData)}>
                        Ver {formatPeriod(summary.latestWithData)}
                    </button>
                </div>
            )}

            <div className="acc-grid acc-grid-3" style={{ marginBottom: '1.25rem' }}>
                <KpiSmall label="Base Imponible" value={fmt(totals.base)} />
                <KpiSmall label="IGV" value={fmt(totals.igv)} />
                <KpiSmall label="Total" value={fmt(totals.total)} />
            </div>

            <div className="acc-table-wrap">
                {loading ? <p style={{ padding: '1.25rem', color: '#94a3b8' }}>Cargando...</p> : (
                    <table className="acc-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Tipo</th>
                                <th>Serie-Núm</th>
                                <th>Cliente</th>
                                <th>Doc.</th>
                                <th style={{ textAlign: 'right' }}>Base</th>
                                <th style={{ textAlign: 'right' }}>IGV</th>
                                <th style={{ textAlign: 'right' }}>Total</th>
                                <th>Estado</th>
                                <th style={{ width: 90 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.length === 0 && (
                                <tr><td colSpan={10} style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem 1rem' }}>
                                    Sin ventas en este periodo. Usa "Nueva venta" o "Sincronizar".
                                </td></tr>
                            )}
                            {sales.map(s => (
                                <tr key={s.id} style={{ opacity: s.anulado ? 0.5 : 1 }}>
                                    <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(s.fechaEmision)}</td>
                                    <td>{VOUCHER_TYPES[s.tipoComprobante]?.name || s.tipoComprobante}</td>
                                    <td style={{ whiteSpace: 'nowrap' }}><strong>{s.serie}</strong>-{s.numero || '???'}</td>
                                    <td>{s.clienteName}</td>
                                    <td>{s.numeroDocCliente}</td>
                                    <td style={{ textAlign: 'right' }}>{fmt(s.baseImponible)}</td>
                                    <td style={{ textAlign: 'right' }}>{fmt(s.igv)}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(s.total)}</td>
                                    <td>
                                        {s.anulado && <span className="acc-badge acc-badge-danger">Anulada</span>}
                                        {s.needsCompletion && <span className="acc-badge acc-badge-warning">Completar</span>}
                                        {!s.anulado && !s.needsCompletion && <span className="acc-badge acc-badge-success">OK</span>}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                                            <button className="acc-icon-btn" title="Editar" onClick={() => { setEditing(s); setShowForm(true); }}><Icon name="edit" size={14} /></button>
                                            <button className="acc-icon-btn danger" title="Eliminar" onClick={() => handleDelete(s.id)}><Icon name="trash" size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showForm && (
                <SaleFormModal sale={editing} onClose={() => { setShowForm(false); setEditing(null); }} onSave={handleSave} />
            )}
        </AccountingShell>
    );
}

function emptySale(period) {
    const [y, m] = period.split('-');
    return {
        fechaEmision: `${y}-${m}-01`,
        tipoComprobante: '01',
        serie: 'F001', numero: '',
        tipoDocCliente: '6', numeroDocCliente: '',
        clienteName: '',
        tipoOperacion: 'GRAVADA',
        baseImponible: 0, igv: 0, exoneradas: 0, inafectas: 0, exportaciones: 0, total: 0,
        moneda: 'PEN', tipoBien: 'SERVICIO', anulado: false,
    };
}

function SaleFormModal({ sale, onClose, onSave }) {
    const [f, setF] = useState(sale);
    const u = (k, v) => setF((s) => ({ ...s, [k]: v }));

    useEffect(() => {
        if (f.tipoOperacion === 'GRAVADA') {
            const base = parseFloat(f.baseImponible) || 0;
            const igv  = Math.round(base * 0.18 * 100) / 100;
            const total = Math.round((base + igv + (parseFloat(f.exoneradas) || 0) + (parseFloat(f.inafectas) || 0) + (parseFloat(f.exportaciones) || 0)) * 100) / 100;
            setF((s) => ({ ...s, igv, total }));
        }
    }, [f.baseImponible, f.tipoOperacion, f.exoneradas, f.inafectas, f.exportaciones]);

    return (
        <div className="acc-modal-overlay" onClick={onClose}>
            <div className="acc-modal" onClick={e => e.stopPropagation()}>
                <div className="acc-modal-head">
                    <h2 className="acc-section-title" style={{ margin: 0 }}>
                        <Icon name={f.id ? 'edit' : 'plus'} size={18} />
                        {f.id ? 'Editar venta' : 'Nueva venta'}
                    </h2>
                    <button className="acc-icon-btn" onClick={onClose}><Icon name="x" size={16} /></button>
                </div>
                {f.sourceQuotationCode && (
                    <div className="acc-alert acc-alert-info" style={{ marginBottom: '1rem' }}>
                        <Icon name="link" size={15} />
                        <span>Generada desde cotización <strong>{f.sourceQuotationCode}</strong></span>
                    </div>
                )}
                <div className="acc-modal-grid">
                    <Field label="Fecha emisión"><input type="date" className="acc-input" value={f.fechaEmision?.slice(0,10) || ''} onChange={e => u('fechaEmision', e.target.value)} /></Field>
                    <Field label="Tipo de comprobante">
                        <select className="acc-select" value={f.tipoComprobante} onChange={e => u('tipoComprobante', e.target.value)}>
                            {Object.entries(VOUCHER_TYPES).map(([k, v]) => <option key={k} value={k}>{k} - {v.name}</option>)}
                        </select>
                    </Field>
                    <Field label="Serie"><input className="acc-input" value={f.serie} onChange={e => u('serie', e.target.value.toUpperCase())} /></Field>
                    <Field label="Número"><input className="acc-input" value={f.numero} onChange={e => u('numero', e.target.value)} /></Field>
                    <Field label="Tipo doc cliente">
                        <select className="acc-select" value={f.tipoDocCliente} onChange={e => u('tipoDocCliente', e.target.value)}>
                            {Object.entries(DOC_ID_TYPES).map(([k, v]) => <option key={k} value={k}>{k} - {v}</option>)}
                        </select>
                    </Field>
                    <Field label="Núm. doc cliente"><input className="acc-input" value={f.numeroDocCliente} onChange={e => u('numeroDocCliente', e.target.value)} /></Field>
                    <Field label="Razón social cliente" full><input className="acc-input" value={f.clienteName} onChange={e => u('clienteName', e.target.value)} /></Field>
                    <Field label="Tipo operación">
                        <select className="acc-select" value={f.tipoOperacion} onChange={e => u('tipoOperacion', e.target.value)}>
                            <option value="GRAVADA">Gravada</option>
                            <option value="EXONERADA">Exonerada</option>
                            <option value="INAFECTA">Inafecta</option>
                            <option value="EXPORTACION">Exportación</option>
                        </select>
                    </Field>
                    <Field label="Tipo bien/servicio">
                        <select className="acc-select" value={f.tipoBien} onChange={e => u('tipoBien', e.target.value)}>
                            <option value="SERVICIO">Servicio</option>
                            <option value="MERCADERIA">Mercadería</option>
                        </select>
                    </Field>
                    <Field label="Base imponible"><input type="number" step="0.01" className="acc-input" value={f.baseImponible} onChange={e => u('baseImponible', e.target.value)} /></Field>
                    <Field label="IGV"><input type="number" step="0.01" className="acc-input" value={f.igv} onChange={e => u('igv', e.target.value)} /></Field>
                    <Field label="Total"><input type="number" step="0.01" className="acc-input" value={f.total} onChange={e => u('total', e.target.value)} /></Field>
                    <div style={{ gridColumn: 'span 3', display: 'flex', alignItems: 'center' }}>
                        <label className="acc-check-row">
                            <input type="checkbox" checked={!!f.anulado} onChange={e => u('anulado', e.target.checked)} /> Comprobante anulado
                        </label>
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
                    <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                    <button className="btn btn-primary" onClick={() => onSave({ ...f, needsCompletion: false })}>
                        <Icon name="check" size={15} /><span style={{ marginLeft: '0.4rem' }}>Guardar</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

function Field({ label, children, full }) {
    return (
        <div className={`acc-field ${full ? 'full' : ''}`}>
            <label className="acc-field-label">{label}</label>
            {children}
        </div>
    );
}

function KpiSmall({ label, value }) {
    return (
        <div className="acc-kpi">
            <span className="acc-kpi-label">{label}</span>
            <div className="acc-kpi-value" style={{ fontSize: '1.35rem' }}>{value}</div>
        </div>
    );
}

function fmt(n) { return new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0); }
function fmtDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}
