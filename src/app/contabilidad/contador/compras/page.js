'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AccountingShell from '@/components/AccountingShell';
import Icon from '@/components/icons/Icon';
import { useAccountingConfig } from '@/hooks/useAccountingConfig';
import { getCurrentDeclarationPeriod, formatPeriod, listAvailablePeriods } from '@/lib/accounting/taxCalendar';
import { VOUCHER_TYPES, DOC_ID_TYPES } from '@/lib/accounting/sunatRules';

export default function Page() {
    return <Suspense fallback={<AccountingShell><p style={{ color: '#94a3b8' }}>Cargando...</p></AccountingShell>}><RegistroCompras /></Suspense>;
}

function RegistroCompras() {
    const searchParams = useSearchParams();
    const { companyProfileId } = useAccountingConfig();
    const [period, setPeriod] = useState(searchParams.get('period') || getCurrentDeclarationPeriod());
    const [items, setItems]   = useState([]);
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [scanLoading, setScanLoading] = useState(false);
    const [loans, setLoans] = useState([]);

    useEffect(() => { 
        if (companyProfileId) {
            load();
            loadLoans();
        } 
    }, [companyProfileId, period]);

    const loadLoans = async () => {
        try {
            const r = await fetch(`/api/loans?empresaId=${companyProfileId}`);
            if (r.ok) {
                const data = await r.json();
                setLoans(data.filter(l => l.status === 'ACTIVE'));
            }
        } catch (e) {
            console.error('[compras] fetch loans error:', e);
        }
    };

    const load = async () => {
        if (!companyProfileId) return;
        setLoading(true);
        try {
            const r = await fetch(`/api/accounting/purchases?companyProfileId=${companyProfileId}&period=${period}`);
            const data = await r.json();
            if (!r.ok) {
                console.error('[compras] API error:', data.error);
                setItems([]);
            } else {
                setItems(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error('[compras] fetch error:', e);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (entry) => {
        const method = entry.id ? 'PUT' : 'POST';
        const body   = entry.id ? entry : { ...entry, companyProfileId };
        const r = await fetch('/api/accounting/purchases', {
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
        loadLoans(); // Refresh loans balance after editing a purchase
    };

    const handleDelete = async (id) => {
        if (!confirm('⚠️ ¿Estás seguro de eliminar esta compra?\n\nEsta acción quitará la compra del registro y restituirá el dinero al saldo del fondo/préstamo de forma permanente.')) return;
        const r = await fetch(`/api/accounting/purchases?id=${id}&companyProfileId=${companyProfileId}`, { method: 'DELETE' });
        if (!r.ok) {
            const d = await r.json().catch(() => ({}));
            alert(d.error || 'Error al eliminar');
            return;
        }
        load();
        loadLoans(); // Refresh loans balance after deleting a purchase
    };

    const handleScan = async (file) => {
        if (!file) return;
        setScanLoading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const r = await fetch('/api/scan-invoice', { method: 'POST', body: fd });
            const d = await r.json();
            if (!r.ok) { alert(d.error || 'Error escaneando'); return; }

            const total = parseFloat(d.amount) || 0;
            const base = Math.round((total / 1.18) * 100) / 100;
            const igv  = Math.round((total - base) * 100) / 100;

            const text = (d.text || '').toUpperCase();
            const rucMatch    = text.match(/R\.?U\.?C\.?[:\s]*(\d{11})/);
            const serieMatch  = text.match(/\b([EF]\d{3})\b[-\s]?(\d+)/);
            const fechaMatch  = text.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);

            setEditing({
                ...emptyPurchase(period),
                total, baseImponible: base, igv,
                numeroDocProveedor: rucMatch?.[1] || '',
                serie: serieMatch?.[1] || '',
                numero: serieMatch?.[2] || '',
                fechaEmision: fechaMatch ? `${fechaMatch[3]}-${fechaMatch[2]}-${fechaMatch[1]}` : `${period}-01`,
                _scannedText: d.text?.slice(0, 500),
            });
            setShowForm(true);
        } finally { setScanLoading(false); }
    };

    const totals = items.reduce((acc, s) => {
        const sign = s.tipoComprobante === '07' ? -1 : 1;
        const tc = s.moneda === 'USD' ? (parseFloat(s.tipoCambio) || 1) : 1;
        const base = (s.baseImponible || 0) * sign * tc;
        const igv = (s.igv || 0) * sign * tc;
        const total = (s.total || 0) * sign * tc;

        acc.base  += s.aceptaCreditoFiscal ? base : 0;
        acc.igv   += s.aceptaCreditoFiscal ? igv : 0;
        acc.total += total;
        return acc;
    }, { base: 0, igv: 0, total: 0 });

    return (
        <AccountingShell>
            <div className="acc-page-head">
                <div>
                    <h1 className="acc-page-title">
                        <Icon name="doc-down" size={24} />
                        Registro de Compras
                    </h1>
                    <p className="acc-page-subtitle">
                        Formato SIRE 8.1 · {formatPeriod(period)} · {items.length} comprobantes
                    </p>
                </div>
                <div className="acc-page-actions">
                    <select className="acc-select" style={{ width: 200 }} value={period} onChange={e => setPeriod(e.target.value)}>
                        {listAvailablePeriods().map(p => <option key={p} value={p}>{formatPeriod(p)}</option>)}
                    </select>
                    <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                        <Icon name="camera" size={15} className={scanLoading ? 'spin' : ''} />
                        <span style={{ marginLeft: '0.45rem' }}>{scanLoading ? 'Escaneando...' : 'Escanear factura'}</span>
                        <input type="file" accept="application/pdf,image/*" style={{ display: 'none' }}
                               onChange={(e) => handleScan(e.target.files?.[0])} />
                    </label>
                    <button className="btn btn-primary" onClick={() => { setEditing(emptyPurchase(period)); setShowForm(true); }}>
                        <Icon name="plus" size={15} />
                        <span style={{ marginLeft: '0.45rem' }}>Nueva compra</span>
                    </button>
                </div>
            </div>

            <div className="acc-grid acc-grid-3" style={{ marginBottom: '1.25rem' }}>
                <KpiSmall label="Base con Crédito (S/ eq)" value={fmt(totals.base, 'PEN')} />
                <KpiSmall label="IGV Crédito Fiscal (S/ eq)" value={fmt(totals.igv, 'PEN')} accent="success" />
                <KpiSmall label="Total Comprobantes (S/ eq)" value={fmt(totals.total, 'PEN')} />
            </div>

            <div className="acc-table-wrap">
                {loading ? <p style={{ padding: '1.25rem', color: '#94a3b8' }}>Cargando...</p> : (
                    <table className="acc-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Tipo</th>
                                <th>Serie-Núm</th>
                                <th>Proveedor</th>
                                <th>RUC</th>
                                <th style={{ textAlign: 'right' }}>Base</th>
                                <th style={{ textAlign: 'right' }}>IGV</th>
                                <th style={{ textAlign: 'right' }}>Total</th>
                                <th>Crédito</th>
                                <th style={{ width: 90 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 && (
                                <tr><td colSpan={10} style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem 1rem' }}>
                                    Sin compras en este periodo. Usa "Escanear factura" o "Nueva compra".
                                </td></tr>
                            )}
                            {items.map(s => (
                                <tr key={s.id} style={{ opacity: s.anulado ? 0.5 : 1 }}>
                                    <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(s.fechaEmision)}</td>
                                    <td>{VOUCHER_TYPES[s.tipoComprobante]?.name || s.tipoComprobante}</td>
                                    <td style={{ whiteSpace: 'nowrap' }}><strong>{s.serie}</strong>-{s.numero}</td>
                                    <td>{s.proveedorName}</td>
                                    <td>{s.numeroDocProveedor}</td>
                                    <td style={{ textAlign: 'right' }}>{fmt(s.baseImponible, s.moneda)}</td>
                                    <td style={{ textAlign: 'right' }}>{fmt(s.igv, s.moneda)}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(s.total, s.moneda)}</td>
                                    <td>
                                        {s.aceptaCreditoFiscal
                                            ? <span className="acc-badge acc-badge-success">Sí</span>
                                            : <span className="acc-badge acc-badge-warning">No</span>}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                                            {s.pdfUrl && (
                                                <a
                                                    href={s.pdfUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="acc-icon-btn"
                                                    title="Ver / Descargar factura"
                                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                                                >
                                                    <Icon name="doc-down" size={14} />
                                                </a>
                                            )}
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
                <PurchaseFormModal 
                    purchase={editing} 
                    loans={loans}
                    onClose={() => { setShowForm(false); setEditing(null); }} 
                    onSave={handleSave} 
                />
            )}
        </AccountingShell>
    );
}

function emptyPurchase(period) {
    const [y, m] = period.split('-');
    return {
        fechaEmision: `${y}-${m}-01`,
        tipoComprobante: '01',
        serie: '', numero: '',
        tipoDocProveedor: '6', numeroDocProveedor: '',
        proveedorName: '',
        baseImponible: 0, igv: 0, noGravadas: 0, isc: 0, otrosTributos: 0, total: 0,
        moneda: 'PEN', tipoCambio: '', tipoGasto: 'SERVICIO',
        aceptaCreditoFiscal: true, anulado: false, fundingSourceId: ''
    };
}

function PurchaseFormModal({ purchase, loans, onClose, onSave }) {
    const [f, setF] = useState(purchase);
    const u = (k, v) => setF((s) => ({ ...s, [k]: v }));

    useEffect(() => {
        const base = parseFloat(f.baseImponible) || 0;
        if (!f.igv && base > 0 && f.aceptaCreditoFiscal) {
            const newIgv = Math.round(base * 0.18 * 100) / 100;
            setF(s => ({ ...s, igv: newIgv, total: Math.round((base + newIgv) * 100) / 100 }));
        }
    }, [f.baseImponible]);

    return (
        <div className="acc-modal-overlay" onClick={onClose}>
            <div className="acc-modal" onClick={e => e.stopPropagation()}>
                <div className="acc-modal-head">
                    <h2 className="acc-section-title" style={{ margin: 0 }}>
                        <Icon name={f.id ? 'edit' : 'plus'} size={18} />
                        {f.id ? 'Editar compra' : 'Nueva compra'}
                    </h2>
                    <button className="acc-icon-btn" onClick={onClose}><Icon name="x" size={16} /></button>
                </div>
                {f._scannedText && (
                    <details className="acc-card-sm" style={{ marginBottom: '1rem', padding: '0.75rem 1rem' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Icon name="camera" size={14} /> Texto detectado por OCR
                        </summary>
                        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.7rem', marginTop: '0.5rem', maxHeight: 150, overflow: 'auto', color: '#475569' }}>{f._scannedText}</pre>
                    </details>
                )}
                <div className="acc-modal-grid">
                    <Field label="Fecha emisión"><input type="date" className="acc-input" value={f.fechaEmision?.slice(0,10) || ''} onChange={e => u('fechaEmision', e.target.value)} /></Field>
                    <Field label="Tipo">
                        <select className="acc-select" value={f.tipoComprobante} onChange={e => u('tipoComprobante', e.target.value)}>
                            {Object.entries(VOUCHER_TYPES).map(([k, v]) => <option key={k} value={k}>{k} - {v.name}</option>)}
                        </select>
                    </Field>
                    <Field label="Serie"><input className="acc-input" value={f.serie} onChange={e => u('serie', e.target.value.toUpperCase())} /></Field>
                    <Field label="Número"><input className="acc-input" value={f.numero} onChange={e => u('numero', e.target.value)} /></Field>
                    <Field label="Tipo doc proveedor">
                        <select className="acc-select" value={f.tipoDocProveedor} onChange={e => u('tipoDocProveedor', e.target.value)}>
                            {Object.entries(DOC_ID_TYPES).map(([k, v]) => <option key={k} value={k}>{k} - {v}</option>)}
                        </select>
                    </Field>
                    <Field label="RUC / Doc proveedor"><input className="acc-input" value={f.numeroDocProveedor} onChange={e => u('numeroDocProveedor', e.target.value)} /></Field>
                    <Field label="Razón social proveedor" full><input className="acc-input" value={f.proveedorName} onChange={e => u('proveedorName', e.target.value)} /></Field>
                    <Field label="Tipo gasto">
                        <select className="acc-select" value={f.tipoGasto} onChange={e => u('tipoGasto', e.target.value)}>
                            <option value="SERVICIO">Servicio (63)</option>
                            <option value="MERCADERIA">Mercadería (60)</option>
                            <option value="OTRO">Otros gastos (65)</option>
                        </select>
                    </Field>
                    
                    <Field label="Moneda">
                        <select className="acc-select" value={f.moneda || 'PEN'} onChange={e => u('moneda', e.target.value)}>
                            <option value="PEN">Soles (S/)</option>
                            <option value="USD">Dólares ($)</option>
                        </select>
                    </Field>

                    {f.moneda === 'USD' && (
                        <Field label="Tipo de Cambio (S/)">
                            <input type="number" step="0.001" className="acc-input" value={f.tipoCambio || ''} onChange={e => u('tipoCambio', e.target.value)} placeholder="Ej: 3.80" required />
                        </Field>
                    )}

                    <Field label="Base imponible"><input type="number" step="0.01" className="acc-input" value={f.baseImponible} onChange={e => u('baseImponible', e.target.value)} /></Field>
                    <Field label="IGV"><input type="number" step="0.01" className="acc-input" value={f.igv} onChange={e => u('igv', e.target.value)} /></Field>
                    <Field label="Total"><input type="number" step="0.01" className="acc-input" value={f.total} onChange={e => u('total', e.target.value)} /></Field>
                    
                    <Field label="Fuente de Financiamiento" full>
                        <select className="acc-select" value={f.fundingSourceId || ''} onChange={e => u('fundingSourceId', e.target.value)}>
                            <option value="">Fondos Propios de la Empresa</option>
                            {loans?.map(l => (
                                <option key={l.id} value={l.id}>Préstamo: {l.entity} (Queda {new Intl.NumberFormat('es-PE', { style: 'currency', currency: l.currency || 'PEN' }).format(l.availableBalance)})</option>
                            ))}
                        </select>
                    </Field>

                    <div style={{ gridColumn: 'span 3', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                        <label className="acc-check-row">
                            <input type="checkbox" checked={!!f.aceptaCreditoFiscal} onChange={e => u('aceptaCreditoFiscal', e.target.checked)} />
                            Da derecho a crédito fiscal IGV
                        </label>
                        <label className="acc-check-row">
                            <input type="checkbox" checked={!!f.anulado} onChange={e => u('anulado', e.target.checked)} />
                            Comprobante anulado
                        </label>
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
                    <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                    <button className="btn btn-primary" onClick={() => { const { _scannedText, ...clean } = f; onSave(clean); }}>
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

function KpiSmall({ label, value, accent }) {
    const colors = { success: '#047857', danger: '#b91c1c' };
    const color = colors[accent] || 'var(--text-main)';
    return (
        <div className="acc-kpi">
            <span className="acc-kpi-label">{label}</span>
            <div className="acc-kpi-value" style={{ fontSize: '1.35rem', color }}>{value}</div>
        </div>
    );
}

function fmt(n, c) { 
    if (c) return new Intl.NumberFormat('es-PE', { style: 'currency', currency: c }).format(n || 0);
    return new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0); 
}
function fmtDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}
