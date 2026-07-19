'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { NavBar } from '@/components/NavBar'

// ─── Helpers ────────────────────────────────────────────────────────────────
const money = (v, cur = 'PEN') =>
    v == null ? '—' : `${cur === 'USD' ? '$' : 'S/'} ${Number(v).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PRIORITY_STYLE = {
    4: { label: 'Muy urgente',  bg: '#fee2e2', color: '#b91c1c' },
    3: { label: 'Urgente',      bg: '#ffedd5', color: '#c2410c' },
    2: { label: 'Importante',   bg: '#fef9c3', color: '#a16207' },
    1: { label: 'Normal',       bg: '#f1f5f9', color: '#475569' },
};

function PriorityChip({ p }) {
    const s = PRIORITY_STYLE[p] || PRIORITY_STYLE[1];
    return (
        <span style={{ background: s.bg, color: s.color, borderRadius: 999, padding: '0.1rem 0.5rem', fontSize: '0.68rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
            {s.label}
        </span>
    );
}

// ─── Página principal ───────────────────────────────────────────────────────
export default function LogisticaPage() {
    const [lists, setLists] = useState([])
    const [expanded, setExpanded] = useState({})    // { [listId]: true }
    const [details, setDetails] = useState({})      // { [listId]: lista + quotes }
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')
    const fileRef = useRef(null)

    const loadLists = async () => {
        try {
            const r = await fetch('/api/logistics/requirements');
            const d = await r.json();
            setLists(d.lists || []);
        } catch { /* noop */ }
        setLoading(false);
    };

    const loadDetail = async (id) => {
        try {
            const r = await fetch(`/api/logistics/requirements/${id}`);
            const d = await r.json();
            if (r.ok) setDetails(prev => ({ ...prev, [id]: d }));
            else setError(d.error || 'Error cargando la lista');
        } catch (e) { setError(e.message); }
    };

    const toggleSection = (id) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
        if (!details[id]) loadDetail(id);
    };

    useEffect(() => { loadLists(); }, []);

    const uploadRequirements = async (file) => {
        if (!file) return;
        setUploading(true); setError('');
        try {
            const fd = new FormData();
            fd.append('file', file);
            const r = await fetch('/api/logistics/requirements', { method: 'POST', body: fd });
            const d = await r.json();
            if (!r.ok) throw new Error(d.error || 'Error al procesar el archivo');
            await loadLists();
            setDetails(prev => ({ ...prev, [d.id]: { ...d, quotes: [] } }));
            setExpanded(prev => ({ ...prev, [d.id]: true }));
        } catch (e) { setError(e.message); }
        setUploading(false);
        if (fileRef.current) fileRef.current.value = '';
    };

    const deleteList = async (id, e) => {
        e.stopPropagation();
        if (!confirm('¿Eliminar esta lista de requerimientos y todas sus cotizaciones?')) return;
        await fetch(`/api/logistics/requirements?id=${id}`, { method: 'DELETE' });
        setExpanded(prev => { const n = { ...prev }; delete n[id]; return n; });
        setDetails(prev => { const n = { ...prev }; delete n[id]; return n; });
        loadLists();
    };

    return (
        <ProtectedRoute>
            <NavBar />
            <main className="container">
                <div className="dashboard-header">
                    <div className="dashboard-title-area">
                        <h1>Asistente Logístico</h1>
                        <p>Comparador de cotizaciones de proveedores contra tus requerimientos</p>
                    </div>
                </div>

                {error && (
                    <div style={{ background: '#fee2e2', color: '#b91c1c', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.9rem' }}>
                        {error} <button onClick={() => setError('')} style={{ marginLeft: 8, border: 'none', background: 'none', cursor: 'pointer', color: '#b91c1c', fontWeight: 700 }}>✕</button>
                    </div>
                )}

                {/* Upload: siempre visible para agregar más listas */}
                <div className="content-frame" style={{ marginBottom: '1.25rem' }}>
                    <div style={{ border: '2px dashed #cbd5e1', borderRadius: 12, padding: '1.5rem', textAlign: 'center', background: '#f8fafc' }}>
                        <p style={{ marginBottom: '0.75rem', color: '#475569' }}>
                            Sube un <strong>Registro de Requerimientos</strong> (.xlsx) — cada lista se abre como una sección independiente con sus propias cotizaciones
                        </p>
                        <input ref={fileRef} type="file" accept=".xlsx,.xlsm,.xls" style={{ display: 'none' }}
                            onChange={e => uploadRequirements(e.target.files?.[0])} />
                        <button className="button-primary" disabled={uploading}
                            onClick={() => fileRef.current?.click()}
                            style={{ padding: '0.6rem 1.4rem', borderRadius: 8, cursor: 'pointer', background: '#3b82f6', color: 'white', border: 'none', fontWeight: 600 }}>
                            {uploading ? 'Procesando…' : '📄 Agregar lista de requerimientos'}
                        </button>
                    </div>
                </div>

                {/* Secciones: una por lista de requerimientos */}
                {loading ? <p>Cargando…</p> : lists.length === 0 ? (
                    <p style={{ color: '#94a3b8', textAlign: 'center' }}>Aún no hay listas de requerimientos.</p>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {lists.map(l => {
                            const isOpen = !!expanded[l.id];
                            const detail = details[l.id];
                            return (
                                <div key={l.id} className="content-frame" style={{ padding: 0, overflow: 'hidden' }}>
                                    {/* Cabecera de sección */}
                                    <div onClick={() => toggleSection(l.id)}
                                        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', background: isOpen ? '#f5f3ff' : 'white', borderBottom: isOpen ? '1px solid #e2e8f0' : 'none' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <span style={{ fontSize: '0.85rem', color: '#8b5cf6', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .2s', display: 'inline-block' }}>▶</span>
                                            <div>
                                                <strong style={{ color: '#101828' }}>{l.name}</strong>
                                                <div style={{ fontSize: '0.8rem', color: '#667085' }}>
                                                    {l.laboratorio && <>Lab: {l.laboratorio} · </>}
                                                    {l.itemCount} ítems · {new Date(l.createdAt).toLocaleDateString('es-PE')}
                                                    {detail?.quotes?.length > 0 && <> · <span style={{ color: '#8b5cf6', fontWeight: 600 }}>{detail.quotes.length} cotización{detail.quotes.length > 1 ? 'es' : ''}</span></>}
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={e => deleteList(l.id, e)} title="Eliminar"
                                            style={{ border: 'none', background: '#fef2f2', color: '#b91c1c', borderRadius: 8, padding: '0.4rem 0.7rem', cursor: 'pointer' }}>
                                            🗑
                                        </button>
                                    </div>

                                    {/* Contenido de sección: comparador propio */}
                                    {isOpen && (
                                        <div style={{ padding: '1.25rem' }}>
                                            {!detail ? <p style={{ color: '#94a3b8' }}>Cargando sección…</p> : (
                                                <ComparatorView detail={detail} onReload={() => loadDetail(l.id)} />
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </ProtectedRoute>
    )
}

// ─── Vista comparadora ──────────────────────────────────────────────────────
function ComparatorView({ detail, onReload }) {
    const [providerName, setProviderName] = useState('')
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')
    const [editCell, setEditCell] = useState(null) // { quoteId, reqN, item }
    const quoteFileRef = useRef(null)
    const [pendingFile, setPendingFile] = useState(null)

    const items  = detail.items || [];
    const quotes = detail.quotes || [];

    // ── Análisis por proveedor ──
    const analysis = useMemo(() => {
        return quotes.map(q => {
            let total = 0, covered = 0;
            for (const it of items) {
                const cell = q.items?.[it.n];
                if (cell?.unitPrice != null) {
                    covered++;
                    total += cell.total ?? cell.unitPrice * (it.quantity || 1);
                }
            }
            return {
                ...q,
                covered,
                coverage: items.length ? covered / items.length : 0,
                total: Math.round(total * 100) / 100,
            };
        });
    }, [quotes, items]);

    // Ganador por fila (precio total de línea más bajo)
    const cheapestByRow = useMemo(() => {
        const map = {};
        for (const it of items) {
            let best = null;
            for (const q of quotes) {
                const cell = q.items?.[it.n];
                if (cell?.unitPrice == null) continue;
                const t = cell.total ?? cell.unitPrice * (it.quantity || 1);
                if (!best || t < best.total) best = { quoteId: q.id, total: t };
            }
            if (best) map[it.n] = best.quoteId;
        }
        return map;
    }, [quotes, items]);

    const bestTotal    = analysis.length ? [...analysis].filter(a => a.covered > 0).sort((a, b) => a.total - b.total)[0] : null;
    const bestCoverage = analysis.length ? [...analysis].sort((a, b) => b.coverage - a.coverage)[0] : null;

    const uploadQuote = async () => {
        if (!providerName.trim()) { setError('Ingresa el nombre del proveedor.'); return; }
        setUploading(true); setError('');
        try {
            const fd = new FormData();
            fd.append('listId', detail.id);
            fd.append('providerName', providerName.trim());
            if (pendingFile) fd.append('file', pendingFile);
            const r = await fetch('/api/logistics/quotes', { method: 'POST', body: fd });
            const d = await r.json();
            if (!r.ok) throw new Error(d.error || 'Error al procesar la cotización');
            setProviderName(''); setPendingFile(null);
            if (quoteFileRef.current) quoteFileRef.current.value = '';
            onReload();
        } catch (e) { setError(e.message); }
        setUploading(false);
    };

    const deleteQuote = async (id) => {
        if (!confirm('¿Eliminar esta cotización de proveedor?')) return;
        await fetch(`/api/logistics/quotes/${id}`, { method: 'DELETE' });
        onReload();
    };

    const editQuoteNumber = async (q) => {
        const val = prompt('N° de cotización / presupuesto:', q.quoteNumber || '');
        if (val === null) return;
        await fetch(`/api/logistics/quotes/${q.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quoteNumber: val }),
        });
        onReload();
    };

    const saveCell = async (quoteId, reqN, values) => {
        await fetch(`/api/logistics/quotes/${quoteId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: { [reqN]: values } }),
        });
        setEditCell(null);
        onReload();
    };

    const clearCell = async (quoteId, reqN) => {
        await fetch(`/api/logistics/quotes/${quoteId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: { [reqN]: null } }),
        });
        setEditCell(null);
        onReload();
    };

    const maxTotal = Math.max(...analysis.map(a => a.total), 1);

    return (
        <div>
            <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>
                    <div>
                        <p style={{ margin: '0.25rem 0 0', color: '#667085', fontSize: '0.85rem' }}>
                            {detail.laboratorio && <>Laboratorio: <strong>{detail.laboratorio}</strong> · </>}
                            {detail.solicitante && <>Solicitante: {detail.solicitante} · </>}
                            {items.length} requerimientos
                        </p>
                    </div>

                    {/* Alta de cotización de proveedor */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <input value={providerName} onChange={e => setProviderName(e.target.value)}
                            placeholder="Nombre del proveedor"
                            style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                        <input ref={quoteFileRef} type="file" accept=".pdf,.xlsx,.xlsm,.xls,.csv,image/*" style={{ display: 'none' }}
                            onChange={e => setPendingFile(e.target.files?.[0] || null)} />
                        <button onClick={() => quoteFileRef.current?.click()}
                            style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontSize: '0.85rem' }}>
                            {pendingFile ? `📎 ${pendingFile.name.slice(0, 22)}${pendingFile.name.length > 22 ? '…' : ''}` : '📎 Adjuntar PDF/Excel'}
                        </button>
                        <button onClick={uploadQuote} disabled={uploading}
                            style={{ padding: '0.5rem 1rem', borderRadius: 8, border: 'none', background: '#10b981', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
                            {uploading ? 'Analizando…' : '+ Agregar cotización'}
                        </button>
                    </div>
                </div>
                {error && <p style={{ color: '#b91c1c', fontSize: '0.85rem', marginTop: '0.5rem' }}>{error}</p>}
            </div>

            {/* ── Tarjetas resumen ── */}
            {quotes.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <SummaryCard title="Proveedores" value={quotes.length} sub="cotizaciones recibidas" />
                    <SummaryCard title="Mejor precio total" value={bestTotal ? money(bestTotal.total, bestTotal.currency) : '—'}
                        sub={bestTotal ? bestTotal.providerName : 'sin datos'} accent="#10b981" />
                    <SummaryCard title="Mejor cobertura" value={bestCoverage ? `${Math.round(bestCoverage.coverage * 100)}%` : '—'}
                        sub={bestCoverage ? `${bestCoverage.providerName} (${bestCoverage.covered}/${items.length} ítems)` : 'sin datos'} accent="#3b82f6" />
                    <SummaryCard title="Ítems sin cotizar" value={items.filter(it => !quotes.some(q => q.items?.[it.n]?.unitPrice != null)).length}
                        sub="de ningún proveedor" accent="#f59e0b" />
                </div>
            )}

            {/* ── Gráfico de totales por proveedor ── */}
            {analysis.filter(a => a.covered > 0).length > 0 && (
                <div className="content-frame" style={{ marginBottom: '1.25rem' }}>
                    <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', color: '#101828' }}>Comparación de totales cotizados</h3>
                    {analysis.map(a => (
                        <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
                            <div style={{ width: 150, fontSize: '0.8rem', color: '#334155', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {a.providerName}
                            </div>
                            <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 6, height: 26, position: 'relative', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${(a.total / maxTotal) * 100}%`, height: '100%',
                                    background: bestTotal?.id === a.id ? 'linear-gradient(90deg,#34d399,#10b981)' : 'linear-gradient(90deg,#93c5fd,#3b82f6)',
                                    borderRadius: 6, transition: 'width .4s',
                                }} />
                                <span style={{ position: 'absolute', right: 8, top: 3, fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>
                                    {money(a.total, a.currency)} · {Math.round(a.coverage * 100)}% cobertura
                                </span>
                            </div>
                        </div>
                    ))}
                    <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '0.5rem 0 0' }}>
                        * Totales sobre los ítems que cada proveedor cotizó — compara junto con la cobertura.
                    </p>
                </div>
            )}

            {/* ── Matriz comparativa ── */}
            <div className="content-frame" style={{ overflowX: 'auto' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', color: '#101828' }}>Matriz de comparación</h3>
                {quotes.length === 0 && (
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                        Agrega cotizaciones de proveedores para comenzar la comparación. El sistema intentará detectar automáticamente los precios de cada ítem; también puedes editar cada celda manualmente.
                    </p>
                )}
                <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.82rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                            <th style={{ textAlign: 'left', padding: '0.5rem', position: 'sticky', left: 0, background: 'white', minWidth: 220 }}>Requerimiento</th>
                            <th style={{ textAlign: 'center', padding: '0.5rem', whiteSpace: 'nowrap' }}>Cant.</th>
                            {quotes.map(q => (
                                <th key={q.id} style={{ textAlign: 'center', padding: '0.5rem', minWidth: 130 }}>
                                    <div style={{ fontWeight: 700, color: '#101828' }}>{q.providerName}</div>
                                    <div onClick={() => editQuoteNumber(q)} title="Click para editar el N° de cotización"
                                        style={{ fontSize: '0.7rem', color: q.quoteNumber ? '#7c3aed' : '#cbd5e1', fontWeight: 600, cursor: 'pointer', margin: '2px 0' }}>
                                        {q.quoteNumber ? `N° ${q.quoteNumber}` : 'N° sin detectar ✎'}
                                    </div>
                                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 400 }}>
                                        {q.fileName ? q.fileName.slice(0, 18) + (q.fileName.length > 18 ? '…' : '') : 'manual'}
                                        <button onClick={() => deleteQuote(q.id)} title="Eliminar cotización"
                                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', marginLeft: 4 }}>✕</button>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(it => (
                            <tr key={it.n} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '0.5rem', position: 'sticky', left: 0, background: 'white' }}>
                                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <strong style={{ color: '#101828' }}>{it.name}</strong>
                                        <PriorityChip p={it.priority} />
                                    </div>
                                    {it.specs && <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 2 }}>{it.specs.slice(0, 80)}</div>}
                                </td>
                                <td style={{ textAlign: 'center', padding: '0.5rem', whiteSpace: 'nowrap', color: '#475569' }}>
                                    {it.quantity} {it.unit}
                                </td>
                                {quotes.map(q => {
                                    const cell = q.items?.[it.n];
                                    const isCheapest = cheapestByRow[it.n] === q.id && quotes.length > 1;
                                    const lineTotal = cell?.unitPrice != null ? (cell.total ?? cell.unitPrice * (it.quantity || 1)) : null;
                                    return (
                                        <td key={q.id}
                                            onClick={() => setEditCell({ quoteId: q.id, reqN: it.n, provider: q.providerName, reqName: it.name, item: cell || {} })}
                                            style={{
                                                textAlign: 'center', padding: '0.5rem', cursor: 'pointer',
                                                background: isCheapest ? '#ecfdf5' : cell?.unitPrice != null ? 'white' : '#fafafa',
                                                border: isCheapest ? '1.5px solid #10b981' : undefined,
                                                borderRadius: isCheapest ? 8 : 0,
                                            }}
                                            title={cell?.matchedText ? `Detectado: ${cell.matchedText}` : 'Click para ingresar precio'}>
                                            {cell?.unitPrice != null ? (
                                                <>
                                                    <div style={{ fontWeight: 700, color: isCheapest ? '#047857' : '#101828' }}>
                                                        {money(lineTotal, q.currency)}
                                                        {cell.source === 'auto' && cell.uncertain && (
                                                            <span title={`Coincidencia dudosa (${Math.round((cell.score || 0) * 100)}% de similitud) — haz clic para verificar`} style={{ marginLeft: 4 }}>⚠️</span>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                                                        {money(cell.unitPrice, q.currency)} c/u
                                                        {cell.source === 'auto' && <span title={`Coincidencia automática (${Math.round((cell.score || 0) * 100)}%)`}> 🤖</span>}
                                                    </div>
                                                    {cell.matchedText && (
                                                        <div style={{ fontSize: '0.62rem', color: cell.uncertain ? '#c2410c' : '#a1a1aa', marginTop: 2, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginLeft: 'auto', marginRight: 'auto' }}>
                                                            “{cell.matchedText}”
                                                        </div>
                                                    )}
                                                    <div style={{ fontSize: '0.75rem' }}>
                                                        {cell.compliant === true  && <span title="Cumple especificaciones">✅</span>}
                                                        {cell.compliant === false && <span title="No cumple especificaciones">⚠️</span>}
                                                    </div>
                                                </>
                                            ) : (
                                                <span style={{ color: '#cbd5e1' }}>—</span>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ── Resumen de condiciones por proveedor ── */}
            {analysis.length > 0 && (
                <div className="content-frame" style={{ marginTop: '1.25rem' }}>
                    <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', color: '#101828' }}>Resumen de condiciones</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
                        {analysis.map(a => {
                            const cheapestCount = items.filter(it => cheapestByRow[it.n] === a.id).length;
                            const nonCompliant  = items.filter(it => a.items?.[it.n]?.compliant === false);
                            const missing       = items.filter(it => a.items?.[it.n]?.unitPrice == null);
                            const missingHighPriority = missing.filter(it => it.priority >= 3);
                            return (
                                <div key={a.id} className="card" style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <div>
                                            <strong style={{ color: '#101828' }}>{a.providerName}</strong>
                                            {a.quoteNumber && <div style={{ fontSize: '0.7rem', color: '#7c3aed', fontWeight: 600 }}>Cotización N° {a.quoteNumber}</div>}
                                        </div>
                                        {bestTotal?.id === a.id && <span style={{ background: '#ecfdf5', color: '#047857', fontSize: '0.68rem', fontWeight: 700, borderRadius: 999, padding: '0.15rem 0.5rem' }}>💰 Mejor total</span>}
                                    </div>
                                    <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.7 }}>
                                        <div>Total cotizado: <strong>{money(a.total, a.currency)}</strong></div>
                                        <div>Cobertura: <strong>{a.covered}/{items.length}</strong> ítems ({Math.round(a.coverage * 100)}%)</div>
                                        <div>Más barato en: <strong>{cheapestCount}</strong> ítem{cheapestCount !== 1 ? 's' : ''}</div>
                                        {nonCompliant.length > 0 && (
                                            <div style={{ color: '#c2410c' }}>⚠️ No cumple specs en: {nonCompliant.map(i => i.name).slice(0, 3).join(', ')}{nonCompliant.length > 3 ? '…' : ''}</div>
                                        )}
                                        {missingHighPriority.length > 0 && (
                                            <div style={{ color: '#b91c1c' }}>❗ No cotiza ítems prioritarios: {missingHighPriority.map(i => i.name).slice(0, 3).join(', ')}{missingHighPriority.length > 3 ? '…' : ''}</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Editor de celda ── */}
            {editCell && (
                <CellEditor
                    cell={editCell}
                    onSave={(values) => saveCell(editCell.quoteId, editCell.reqN, values)}
                    onClear={() => clearCell(editCell.quoteId, editCell.reqN)}
                    onClose={() => setEditCell(null)}
                />
            )}
        </div>
    );
}

function SummaryCard({ title, value, sub, accent = '#101828' }) {
    return (
        <div className="card" style={{ padding: '0.9rem 1.1rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{title}</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: accent, margin: '0.15rem 0' }}>{value}</div>
            <div style={{ fontSize: '0.75rem', color: '#667085' }}>{sub}</div>
        </div>
    );
}

// ─── Modal simple para editar una celda ─────────────────────────────────────
function CellEditor({ cell, onSave, onClear, onClose }) {
    const [unitPrice, setUnitPrice] = useState(cell.item.unitPrice ?? '')
    const [total, setTotal]         = useState(cell.item.total ?? '')
    const [compliant, setCompliant] = useState(cell.item.compliant === true ? 'si' : cell.item.compliant === false ? 'no' : 'na')
    const [note, setNote]           = useState(cell.item.note || '')

    const save = () => {
        const up = parseFloat(unitPrice);
        if (isNaN(up) || up <= 0) { alert('Ingresa un precio unitario válido.'); return; }
        const t = parseFloat(total);
        onSave({
            unitPrice: Math.round(up * 100) / 100,
            total: !isNaN(t) && t > 0 ? Math.round(t * 100) / 100 : null,
            compliant: compliant === 'si' ? true : compliant === 'no' ? false : null,
            note: note.trim(),
            source: 'manual',
            uncertain: false,
        });
    };

    return (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 14, padding: '1.5rem', width: 380, maxWidth: '92vw', boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }}>
                <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem', color: '#101828' }}>{cell.reqName}</h3>
                <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: '#667085' }}>Proveedor: <strong>{cell.provider}</strong></p>

                {cell.item.matchedText && (
                    <div style={{ background: '#f8fafc', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.72rem', color: '#475569', marginBottom: '0.9rem' }}>
                        🤖 Detectado automáticamente: “{cell.item.matchedText}”
                    </div>
                )}

                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>Precio unitario</label>
                <input type="number" step="0.01" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} autoFocus
                    style={{ width: '100%', padding: '0.5rem 0.7rem', borderRadius: 8, border: '1px solid #cbd5e1', margin: '0.25rem 0 0.75rem' }} />

                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>Total de línea (opcional — si difiere de precio × cantidad)</label>
                <input type="number" step="0.01" value={total} onChange={e => setTotal(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem 0.7rem', borderRadius: 8, border: '1px solid #cbd5e1', margin: '0.25rem 0 0.75rem' }} />

                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>¿Cumple las especificaciones técnicas?</label>
                <select value={compliant} onChange={e => setCompliant(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem 0.7rem', borderRadius: 8, border: '1px solid #cbd5e1', margin: '0.25rem 0 0.75rem', background: 'white' }}>
                    <option value="na">Sin evaluar</option>
                    <option value="si">✅ Sí cumple</option>
                    <option value="no">⚠️ No cumple</option>
                </select>

                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>Nota</label>
                <input value={note} onChange={e => setNote(e.target.value)} placeholder="Ej. marca alternativa, plazo de entrega…"
                    style={{ width: '100%', padding: '0.5rem 0.7rem', borderRadius: 8, border: '1px solid #cbd5e1', margin: '0.25rem 0 1rem' }} />

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between' }}>
                    {cell.item.unitPrice != null ? (
                        <button onClick={onClear} style={{ border: 'none', background: '#fef2f2', color: '#b91c1c', borderRadius: 8, padding: '0.5rem 0.9rem', cursor: 'pointer', fontSize: '0.82rem' }}>
                            Quitar precio
                        </button>
                    ) : <span />}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={onClose} style={{ border: '1px solid #cbd5e1', background: 'white', borderRadius: 8, padding: '0.5rem 0.9rem', cursor: 'pointer', fontSize: '0.82rem' }}>
                            Cancelar
                        </button>
                        <button onClick={save} style={{ border: 'none', background: '#3b82f6', color: 'white', borderRadius: 8, padding: '0.5rem 1.1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>
                            Guardar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
