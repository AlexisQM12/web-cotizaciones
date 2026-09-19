'use client';
// Compras pendientes en tiendas online.
//
// Las tarjetas se agrupan por tienda (Amazon / AliExpress / Alibaba / otras)
// porque es como se sigue un pedido en la práctica: cada tienda tiene su
// propio rastreo, sus propios plazos y su propia cuenta.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { NavBar } from '@/components/NavBar';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/authFetch';
import TiendaLogo from '@/components/TiendaLogo';
import { ORDEN_TIENDAS, TIENDAS, ESTADOS, estadoDe, detectarTienda, tiendaDe } from '@/lib/tiendas';

const VACIA = {
    titulo: '', url: '', tienda: '', estado: 'porPedir',
    cantidad: 1, precio: '', moneda: 'USD',
    seguimiento: '', fechaPedido: '', fechaEstimada: '', notas: '',
};

const monto = (n, moneda) =>
    `${moneda === 'PEN' ? 'S/' : '$'} ${Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fechaCorta = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function ComprasPage() {
    const { user } = useAuth();
    const empresaId = user?.empresaId;

    const [compras, setCompras] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [form, setForm] = useState(VACIA);
    const [editandoId, setEditandoId] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const [formAbierto, setFormAbierto] = useState(false);
    const [verRecibidas, setVerRecibidas] = useState(false);

    const cargar = useCallback(async () => {
        if (!empresaId) return;
        setCargando(true);
        setError(null);
        try {
            const r = await authFetch(`/api/compras?empresaId=${encodeURIComponent(empresaId)}`);
            const d = await r.json();
            if (!r.ok) throw new Error(d.error || 'No se pudieron cargar las compras');
            setCompras(d.compras || []);
        } catch (e) {
            setError(e.message);
        } finally {
            setCargando(false);
        }
    }, [empresaId]);

    useEffect(() => { cargar(); }, [cargar]);

    // La tienda se deduce del enlace mientras se escribe; el desplegable sólo
    // hace falta si el enlace no la delata (acortadores, tiendas nuevas).
    const tiendaEfectiva = form.tienda || detectarTienda(form.url) || 'otra';

    const guardar = async (e) => {
        e.preventDefault();
        if (!form.titulo.trim() && !form.url.trim()) {
            setError('Escribe al menos un título o un enlace.');
            return;
        }
        setGuardando(true);
        setError(null);
        try {
            const cuerpo = { ...form, empresaId, tienda: tiendaEfectiva };
            const r = editandoId
                ? await authFetch('/api/compras', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...cuerpo, id: editandoId }),
                })
                : await authFetch('/api/compras', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(cuerpo),
                });
            const d = await r.json();
            if (!r.ok) throw new Error(d.error || 'No se pudo guardar');
            await cargar();
            cerrarForm();
        } catch (e) {
            setError(e.message);
        } finally {
            setGuardando(false);
        }
    };

    const cambiarEstado = async (compra, estado) => {
        const previas = compras;
        setCompras(prev => prev.map(c => (c.id === compra.id ? { ...c, estado } : c))); // optimista
        try {
            const r = await authFetch('/api/compras', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ empresaId, id: compra.id, estado, soloEstado: true }),
            });
            if (!r.ok) throw new Error();
        } catch {
            setCompras(previas);
            setError('No se pudo cambiar el estado.');
        }
    };

    const eliminar = async (compra) => {
        if (!confirm(`¿Eliminar "${compra.titulo || compra.url}"?`)) return;
        const previas = compras;
        setCompras(prev => prev.filter(c => c.id !== compra.id));
        try {
            const r = await authFetch(`/api/compras?empresaId=${encodeURIComponent(empresaId)}&id=${compra.id}`, { method: 'DELETE' });
            if (!r.ok) throw new Error();
        } catch {
            setCompras(previas);
            setError('No se pudo eliminar la compra.');
        }
    };

    const editar = (compra) => {
        setForm({
            titulo: compra.titulo || '', url: compra.url || '', tienda: compra.tienda || '',
            estado: compra.estado || 'porPedir', cantidad: compra.cantidad ?? 1,
            precio: compra.precio ?? '', moneda: compra.moneda || 'USD',
            seguimiento: compra.seguimiento || '',
            fechaPedido: compra.fechaPedido || '', fechaEstimada: compra.fechaEstimada || '',
            notas: compra.notas || '',
        });
        setEditandoId(compra.id);
        setFormAbierto(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cerrarForm = () => {
        setForm(VACIA);
        setEditandoId(null);
        setFormAbierto(false);
    };

    // Las recibidas se ocultan por defecto: la pantalla es de *pendientes*, y
    // si no, con el tiempo las entregadas ahogan lo que sí falta seguir.
    const visibles = useMemo(
        () => compras.filter(c => verRecibidas || c.estado !== 'recibido'),
        [compras, verRecibidas]
    );

    const porTienda = useMemo(() => {
        const grupos = {};
        for (const c of visibles) {
            const t = TIENDAS[c.tienda] ? c.tienda : 'otra';
            (grupos[t] ||= []).push(c);
        }
        return grupos;
    }, [visibles]);

    const recibidas = compras.filter(c => c.estado === 'recibido').length;
    const totalPendientes = compras.length - recibidas;

    return (
        <ProtectedRoute>
            <NavBar />
            <main className="container">
                <div className="dashboard-header">
                    <div className="dashboard-title-area">
                        <h1>Compras</h1>
                        <p>
                            Pedidos online pendientes — {totalPendientes} en curso
                            {recibidas > 0 && ` · ${recibidas} recibida${recibidas === 1 ? '' : 's'}`}
                        </p>
                    </div>
                    <div className="dashboard-actions">
                        {recibidas > 0 && (
                            <button className="btn btn-secondary" onClick={() => setVerRecibidas(v => !v)}>
                                {verRecibidas ? 'Ocultar recibidas' : 'Ver recibidas'}
                            </button>
                        )}
                        <button className="btn btn-primary" onClick={() => (formAbierto ? cerrarForm() : setFormAbierto(true))}>
                            {formAbierto ? 'Cancelar' : '+ Nueva compra'}
                        </button>
                    </div>
                </div>

                {error && (
                    <p className="compras-error">{error}</p>
                )}

                {formAbierto && (
                    <form className="card-editor compras-form" onSubmit={guardar}>
                        <div className="compras-form__cabecera">
                            <strong>{editandoId ? 'Editar compra' : 'Nueva compra'}</strong>
                            <TiendaLogo tienda={tiendaEfectiva} />
                        </div>

                        <label className="compras-label">Enlace del producto</label>
                        <input
                            type="url"
                            value={form.url}
                            onChange={(e) => setForm(f => ({ ...f, url: e.target.value }))}
                            placeholder="https://www.amazon.com/dp/..."
                        />
                        <p className="compras-pista">
                            La tienda se detecta sola desde el enlace
                            {form.url && <> — detectada: <strong>{tiendaDe(tiendaEfectiva).nombre}</strong></>}.
                        </p>

                        <label className="compras-label">¿Qué es?</label>
                        <input
                            value={form.titulo}
                            onChange={(e) => setForm(f => ({ ...f, titulo: e.target.value }))}
                            placeholder="Ej. Sensor de temperatura PT100"
                        />

                        <div className="compras-form__grid">
                            <div>
                                <label className="compras-label">Tienda</label>
                                <select value={tiendaEfectiva} onChange={(e) => setForm(f => ({ ...f, tienda: e.target.value }))}>
                                    {ORDEN_TIENDAS.map(id => <option key={id} value={id}>{TIENDAS[id].nombre}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="compras-label">Estado</label>
                                <select value={form.estado} onChange={(e) => setForm(f => ({ ...f, estado: e.target.value }))}>
                                    {ESTADOS.map(e => <option key={e.id} value={e.id}>{e.etiqueta}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="compras-label">Cantidad</label>
                                <input type="number" min="1" step="1" value={form.cantidad}
                                    onChange={(e) => setForm(f => ({ ...f, cantidad: e.target.value }))} />
                            </div>
                            <div>
                                <label className="compras-label">Precio unitario</label>
                                <input type="number" step="0.01" value={form.precio} placeholder="0.00"
                                    onChange={(e) => setForm(f => ({ ...f, precio: e.target.value }))} />
                            </div>
                            <div>
                                <label className="compras-label">Moneda</label>
                                <select value={form.moneda} onChange={(e) => setForm(f => ({ ...f, moneda: e.target.value }))}>
                                    <option value="USD">USD ($)</option>
                                    <option value="PEN">PEN (S/)</option>
                                </select>
                            </div>
                            <div>
                                <label className="compras-label">Nº de seguimiento</label>
                                <input value={form.seguimiento} placeholder="Tracking"
                                    onChange={(e) => setForm(f => ({ ...f, seguimiento: e.target.value }))} />
                            </div>
                            <div>
                                <label className="compras-label">Fecha de pedido</label>
                                <input type="date" value={form.fechaPedido}
                                    onChange={(e) => setForm(f => ({ ...f, fechaPedido: e.target.value }))} />
                            </div>
                            <div>
                                <label className="compras-label">Llegada estimada</label>
                                <input type="date" value={form.fechaEstimada}
                                    onChange={(e) => setForm(f => ({ ...f, fechaEstimada: e.target.value }))} />
                            </div>
                        </div>

                        <label className="compras-label">Notas</label>
                        <textarea rows={2} value={form.notas} placeholder="Observaciones, variante, color…"
                            onChange={(e) => setForm(f => ({ ...f, notas: e.target.value }))} />

                        <div className="compras-form__pie">
                            <button type="button" className="btn btn-secondary" onClick={cerrarForm}>Cancelar</button>
                            <button type="submit" className="btn btn-primary" disabled={guardando}>
                                {guardando ? 'Guardando…' : editandoId ? 'Guardar cambios' : 'Agregar compra'}
                            </button>
                        </div>
                    </form>
                )}

                {cargando ? (
                    <p className="compras-vacio">Cargando compras…</p>
                ) : visibles.length === 0 ? (
                    <div className="content-frame" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                        <p className="compras-vacio">
                            {compras.length === 0
                                ? 'Todavía no hay compras registradas. Pega el enlace de un producto para empezar a seguirlo.'
                                : 'No hay compras pendientes. Las recibidas están ocultas.'}
                        </p>
                    </div>
                ) : (
                    ORDEN_TIENDAS.filter(id => porTienda[id]?.length).map(idTienda => (
                        <section key={idTienda} className="compras-grupo">
                            <header className="compras-grupo__cabecera">
                                <TiendaLogo tienda={idTienda} alto={26} />
                                <span className="compras-grupo__conteo">
                                    {porTienda[idTienda].length} compra{porTienda[idTienda].length === 1 ? '' : 's'}
                                </span>
                            </header>

                            <div className="compras-grid">
                                {porTienda[idTienda].map(c => {
                                    const est = estadoDe(c.estado);
                                    const total = (Number(c.cantidad) || 0) * (Number(c.precio) || 0);
                                    return (
                                        <article key={c.id} className="compra-card">
                                            <div className="compra-card__top">
                                                <span className="compra-card__estado" style={{ background: est.fondo, color: est.color }}>
                                                    {est.etiqueta}
                                                </span>
                                                <div className="compra-card__acciones">
                                                    <button type="button" title="Editar" onClick={() => editar(c)}>✎</button>
                                                    <button type="button" title="Eliminar" className="compra-card__peligro" onClick={() => eliminar(c)}>🗑</button>
                                                </div>
                                            </div>

                                            <h3 className="compra-card__titulo">
                                                {c.titulo || <em style={{ color: '#94a3b8' }}>Sin título</em>}
                                            </h3>

                                            {c.url && (
                                                <a href={c.url} target="_blank" rel="noopener noreferrer" className="compra-card__enlace">
                                                    Abrir en {tiendaDe(c.tienda).nombre} ↗
                                                </a>
                                            )}

                                            <div className="compra-card__datos">
                                                <span>{c.cantidad || 1} × {monto(c.precio, c.moneda)}</span>
                                                <strong>{monto(total, c.moneda)}</strong>
                                            </div>

                                            {(c.seguimiento || c.fechaEstimada) && (
                                                <div className="compra-card__extra">
                                                    {c.seguimiento && <span title="Nº de seguimiento">📦 {c.seguimiento}</span>}
                                                    {fechaCorta(c.fechaEstimada) && <span title="Llegada estimada">🗓 {fechaCorta(c.fechaEstimada)}</span>}
                                                </div>
                                            )}

                                            {c.notas && <p className="compra-card__notas">{c.notas}</p>}

                                            <select
                                                className="compra-card__cambiar-estado"
                                                value={c.estado || 'porPedir'}
                                                onChange={(e) => cambiarEstado(c, e.target.value)}
                                            >
                                                {ESTADOS.map(e => <option key={e.id} value={e.id}>{e.etiqueta}</option>)}
                                            </select>
                                        </article>
                                    );
                                })}
                            </div>
                        </section>
                    ))
                )}
            </main>
        </ProtectedRoute>
    );
}
