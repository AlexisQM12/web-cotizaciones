'use client';
// Formatos: los documentos que la empresa rellena una y otra vez.
//
// Arriba están las plantillas (los moldes que trae la aplicación) y abajo los
// formatos ya creados. Crear uno es copiar el molde: la plantilla no se toca
// nunca, así que siempre queda para el siguiente ATS, la siguiente máquina o
// el siguiente practicante.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { NavBar } from '@/components/NavBar';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/authFetch';
import { PLANTILLAS, TIPOS, ORDEN_TIPOS, tipoDe, nombreSugerido, tituloDelHtml } from '@/lib/formatos';

const pesoLegible = (bytes) => {
    if (!bytes) return null;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const fechaCorta = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function FormatosPage() {
    const { user } = useAuth();
    const router = useRouter();
    const empresaId = user?.empresaId;

    const [formatos, setFormatos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [creando, setCreando] = useState(null);   // id de la plantilla en curso
    const [filtro, setFiltro] = useState('todos');
    const [verPlantillas, setVerPlantillas] = useState(true);
    const inputHtml = useRef(null);

    const cargar = useCallback(async () => {
        if (!empresaId) return;
        setCargando(true);
        setError(null);
        try {
            const r = await authFetch(`/api/formatos?empresaId=${encodeURIComponent(empresaId)}`);
            const d = await r.json();
            if (!r.ok) throw new Error(d.error || 'No se pudieron cargar los formatos');
            setFormatos(d.formatos || []);
        } catch (e) {
            setError(e.message);
        } finally {
            setCargando(false);
        }
    }, [empresaId]);

    useEffect(() => { cargar(); }, [cargar]);

    const crear = async (cuerpo, etiqueta) => {
        setCreando(etiqueta);
        setError(null);
        try {
            const r = await authFetch('/api/formatos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...cuerpo, empresaId }),
            });
            const d = await r.json();
            if (!r.ok) throw new Error(d.error || 'No se pudo crear el formato');
            router.push(`/formatos/${d.id}`);
        } catch (e) {
            setError(e.message);
            setCreando(null);
        }
    };

    const usarPlantilla = (p) => crear({ plantillaId: p.id, nombre: nombreSugerido(p), tipo: p.tipo }, p.id);

    const duplicar = (f) => crear({ duplicarDe: f.id, nombre: `${f.nombre} (copia)`, tipo: f.tipo }, `dup-${f.id}`);

    // Importar un HTML suelto: el mismo editor sirve para documentos que no
    // salieron de una plantilla.
    const importar = async (file) => {
        if (!file) return;
        if (!/\.html?$/i.test(file.name)) {
            setError('Solo se pueden importar archivos .html');
            return;
        }
        const html = await file.text();
        await crear({ html, nombre: tituloDelHtml(html) || file.name.replace(/\.html?$/i, ''), tipo: 'libre' }, 'importar');
    };

    const eliminar = async (f) => {
        if (!confirm(`¿Eliminar "${f.nombre}"? Se borra el documento, no la plantilla.`)) return;
        const previos = formatos;
        setFormatos(prev => prev.filter(x => x.id !== f.id));
        try {
            const r = await authFetch(`/api/formatos?empresaId=${encodeURIComponent(empresaId)}&id=${f.id}`, { method: 'DELETE' });
            if (!r.ok) throw new Error();
        } catch {
            setFormatos(previos);
            setError('No se pudo eliminar el formato.');
        }
    };

    const visibles = useMemo(
        () => (filtro === 'todos' ? formatos : formatos.filter(f => (f.tipo || 'libre') === filtro)),
        [formatos, filtro],
    );

    const cuentaPorTipo = useMemo(() => {
        const c = {};
        for (const f of formatos) c[f.tipo || 'libre'] = (c[f.tipo || 'libre'] || 0) + 1;
        return c;
    }, [formatos]);

    return (
        <ProtectedRoute>
            <NavBar />
            <main className="container">
                <div className="dashboard-header">
                    <div className="dashboard-title-area">
                        <h1>Formatos</h1>
                        <p>
                            Documentos de la empresa listos para duplicar y rellenar
                            {formatos.length > 0 && ` — ${formatos.length} guardado${formatos.length === 1 ? '' : 's'}`}
                        </p>
                    </div>
                    <div className="dashboard-actions">
                        <button className="btn btn-secondary" onClick={() => inputHtml.current?.click()}>
                            Importar HTML
                        </button>
                        <input
                            ref={inputHtml} type="file" accept=".html,.htm,text/html"
                            style={{ display: 'none' }}
                            onChange={(e) => { importar(e.target.files?.[0]); e.target.value = ''; }}
                        />
                        <button className="btn btn-primary" onClick={() => setVerPlantillas(v => !v)}>
                            {verPlantillas ? 'Ocultar plantillas' : '+ Nuevo formato'}
                        </button>
                    </div>
                </div>

                {error && <p className="formatos-error">{error}</p>}

                {verPlantillas && (
                    <section className="formatos-bloque">
                        <header className="formatos-bloque__cabecera">
                            <h2>Plantillas</h2>
                            <span>Elige un molde: se copia a tus formatos y lo editas ahí.</span>
                        </header>
                        <div className="formatos-grid">
                            {PLANTILLAS.map(p => {
                                const t = tipoDe(p.tipo);
                                return (
                                    <article key={p.id} className="plantilla-card">
                                        <span className="formato-chip" style={{ background: t.fondo, color: t.color }}>{t.nombre}</span>
                                        <h3>{p.nombre}</h3>
                                        <p className="plantilla-card__sub">{p.subtitulo}</p>
                                        <p className="plantilla-card__para">{p.paraQue}</p>
                                        <footer>
                                            <span className="formato-meta">{p.hojas} hoja{p.hojas === 1 ? '' : 's'}{p.pesada ? ' · con fotos' : ''}</span>
                                            <div className="formato-acciones">
                                                <a className="btn btn-ghost btn-sm" href={p.archivo} target="_blank" rel="noopener noreferrer">Ver</a>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => usarPlantilla(p)}
                                                    disabled={!!creando}
                                                >
                                                    {creando === p.id ? 'Creando…' : 'Usar'}
                                                </button>
                                            </div>
                                        </footer>
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                )}

                <section className="formatos-bloque">
                    <header className="formatos-bloque__cabecera">
                        <h2>Mis formatos</h2>
                        {formatos.length > 0 && (
                            <div className="formatos-filtros">
                                <button
                                    className={`formatos-filtro${filtro === 'todos' ? ' formatos-filtro--activo' : ''}`}
                                    onClick={() => setFiltro('todos')}
                                >
                                    Todos ({formatos.length})
                                </button>
                                {ORDEN_TIPOS.filter(id => cuentaPorTipo[id]).map(id => (
                                    <button
                                        key={id}
                                        className={`formatos-filtro${filtro === id ? ' formatos-filtro--activo' : ''}`}
                                        onClick={() => setFiltro(id)}
                                        style={filtro === id ? { background: TIPOS[id].fondo, color: TIPOS[id].color, borderColor: TIPOS[id].color } : undefined}
                                    >
                                        {TIPOS[id].nombre} ({cuentaPorTipo[id]})
                                    </button>
                                ))}
                            </div>
                        )}
                    </header>

                    {cargando ? (
                        <p className="formatos-vacio">Cargando…</p>
                    ) : visibles.length === 0 ? (
                        <p className="formatos-vacio">
                            {formatos.length === 0
                                ? 'Todavía no hay formatos. Elige una plantilla de arriba para crear el primero.'
                                : 'No hay formatos de ese tipo.'}
                        </p>
                    ) : (
                        <div className="formatos-grid">
                            {visibles.map(f => {
                                const t = tipoDe(f.tipo);
                                return (
                                    <article key={f.id} className="formato-card">
                                        <span className="formato-chip" style={{ background: t.fondo, color: t.color }}>{t.nombre}</span>
                                        <h3>
                                            <Link href={`/formatos/${f.id}`}>{f.nombre}</Link>
                                        </h3>
                                        <p className="formato-meta">
                                            {f.hojas ? `${f.hojas} hoja${f.hojas === 1 ? '' : 's'}` : 'Documento'}
                                            {pesoLegible(f.bytes) && ` · ${pesoLegible(f.bytes)}`}
                                            {f.actualizadoEn && ` · ${fechaCorta(f.actualizadoEn)}`}
                                        </p>
                                        {f.actualizadoPorEmail && (
                                            <p className="formato-autor">Último cambio: {f.actualizadoPorEmail}</p>
                                        )}
                                        <footer>
                                            <div className="formato-acciones">
                                                <Link className="btn btn-primary btn-sm" href={`/formatos/${f.id}`}>Abrir</Link>
                                                <button className="btn btn-ghost btn-sm" onClick={() => duplicar(f)} disabled={!!creando}>
                                                    {creando === `dup-${f.id}` ? 'Duplicando…' : 'Duplicar'}
                                                </button>
                                                <button className="btn btn-ghost btn-sm formato-eliminar" onClick={() => eliminar(f)}>
                                                    Eliminar
                                                </button>
                                            </div>
                                        </footer>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>
        </ProtectedRoute>
    );
}
