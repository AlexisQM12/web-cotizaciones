'use client';
// Editor de un formato.
//
// El documento se abre dentro de un <iframe> con su propio HTML y sus propios
// estilos: así la hoja se ve y se imprime exactamente igual que el archivo
// original, sin que el CSS del panel se meta por medio. Dentro del iframe el
// cuerpo queda en `contenteditable`, de modo que se escribe encima del
// documento —sobre la casilla, sobre la celda, sobre el párrafo— en vez de
// rellenar un formulario que después hay que imaginarse cómo queda.
//
// El estado nunca se sincroniza con cada tecla: lo que hay en el iframe es la
// verdad, y al guardar se lee el DOM de una vez. Sincronizarlo a cada pulsación
// obligaría a recargar el iframe en cada letra (y a perder el cursor).

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { NavBar } from '@/components/NavBar';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/authFetch';
import { storage } from '@/lib/firebaseConfig';
import { ref as refStorage, uploadBytes, getDownloadURL } from 'firebase/storage';
import { TIPOS, ORDEN_TIPOS, tipoDe } from '@/lib/formatos';

const ID_ESTILO = 'cgo-editor-estilo';
const LIMITE_CODIGO = 2 * 1024 * 1024;   // por encima, el textarea se arrastra

// Lo que se inyecta en el documento mientras se edita. Se quita al guardar:
// el archivo que sale es el documento limpio.
const ESTILO_EDITOR = `
  body { cursor: text; }
  [contenteditable="true"] { outline: none; }
  .page { outline: 1px solid transparent; transition: outline-color .15s; }
  .page:hover { outline-color: rgba(37,99,235,.25); }
  img { cursor: pointer; outline: 2px solid transparent; transition: outline-color .15s; }
  img:hover { outline-color: #2563eb; outline-offset: 2px; }
  [data-cgo-sel="1"] { outline: 2px solid #2563eb !important; outline-offset: 2px; }
  td:hover, th:hover { background-color: rgba(37,99,235,.05); }
`;

export default function EditorFormatoPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const empresaId = user?.empresaId;

    const [formato, setFormato] = useState(null);
    const [htmlInicial, setHtmlInicial] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [aviso, setAviso] = useState(null);

    const [sucio, setSucio] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [guardadoEn, setGuardadoEn] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [modoCodigo, setModoCodigo] = useState(false);
    const [codigo, setCodigo] = useState('');
    const [subiendo, setSubiendo] = useState(false);
    const [nombre, setNombre] = useState('');

    const iframeRef = useRef(null);
    const inputImagen = useRef(null);
    const imagenElegida = useRef(null);   // <img> sobre la que se hizo clic
    const ultimoNodo = useRef(null);      // dónde se tocó por última vez

    // ── Carga ────────────────────────────────────────────────────────────────
    const cargar = useCallback(async () => {
        if (!empresaId || !id) return;
        setCargando(true);
        setError(null);
        try {
            const r = await authFetch(`/api/formatos/${id}?empresaId=${encodeURIComponent(empresaId)}`);
            const d = await r.json();
            if (!r.ok) throw new Error(d.error || 'No se pudo abrir el formato');
            setFormato(d.formato);
            setNombre(d.formato?.nombre || '');
            setHtmlInicial(d.html);
        } catch (e) {
            setError(e.message);
        } finally {
            setCargando(false);
        }
    }, [empresaId, id]);

    useEffect(() => { cargar(); }, [cargar]);

    // Avisar antes de cerrar la pestaña con cambios sin guardar.
    useEffect(() => {
        if (!sucio) return;
        const alSalir = (e) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', alSalir);
        return () => window.removeEventListener('beforeunload', alSalir);
    }, [sucio]);

    // ── El documento dentro del iframe ───────────────────────────────────────
    const doc = () => iframeRef.current?.contentDocument || null;

    const prepararDocumento = useCallback(() => {
        const d = doc();
        if (!d || !d.body) return;

        if (!d.getElementById(ID_ESTILO)) {
            const estilo = d.createElement('style');
            estilo.id = ID_ESTILO;
            estilo.textContent = ESTILO_EDITOR;
            d.head.appendChild(estilo);
        }

        d.body.setAttribute('contenteditable', 'true');
        d.body.spellcheck = false;
        // El botón de imprimir del propio documento no se edita: es un control,
        // no contenido.
        d.querySelectorAll('.pdf-btn').forEach(b => b.setAttribute('contenteditable', 'false'));

        d.addEventListener('input', () => setSucio(true));
        d.addEventListener('pointerdown', (e) => {
            ultimoNodo.current = e.target;
            d.querySelectorAll('[data-cgo-sel]').forEach(el => el.removeAttribute('data-cgo-sel'));
            if (e.target.tagName === 'IMG') {
                imagenElegida.current = e.target;
                e.target.setAttribute('data-cgo-sel', '1');
            } else {
                imagenElegida.current = null;
            }
        });
        d.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                guardar();
            }
        });

        ajustarZoom();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Zoom: la hoja mide 210 mm (~794 px) y el panel casi nunca los tiene.
    const ajustarZoom = useCallback(() => {
        const marco = iframeRef.current;
        if (!marco) return;
        const ancho = marco.clientWidth;
        if (!ancho) return;
        const z = Math.min(1, Math.max(0.35, (ancho - 24) / 810));
        aplicarZoom(z);
    }, []);

    const aplicarZoom = (z) => {
        setZoom(z);
        const d = doc();
        if (d?.body) d.body.style.zoom = z;
    };

    // ── Guardar ──────────────────────────────────────────────────────────────
    // Sale el documento limpio: sin el estilo del editor, sin contenteditable y
    // sin las marcas de selección.
    const htmlActual = () => {
        const d = doc();
        if (!d?.documentElement) return null;
        const clon = d.documentElement.cloneNode(true);
        clon.querySelector(`#${ID_ESTILO}`)?.remove();
        clon.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
        clon.querySelectorAll('[data-cgo-sel]').forEach(el => el.removeAttribute('data-cgo-sel'));
        clon.querySelectorAll('[spellcheck]').forEach(el => el.removeAttribute('spellcheck'));
        const cuerpo = clon.querySelector('body');
        if (cuerpo) cuerpo.style.removeProperty('zoom');
        return `<!DOCTYPE html>\n${clon.outerHTML}`;
    };

    const guardar = async () => {
        const html = modoCodigo ? codigo : htmlActual();
        if (!html) return;
        setGuardando(true);
        setError(null);
        try {
            const r = await authFetch(`/api/formatos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ empresaId, html }),
            });
            const d = await r.json();
            if (!r.ok) throw new Error(d.error || 'No se pudo guardar');
            setFormato(f => ({ ...f, ...d }));
            setSucio(false);
            setGuardadoEn(new Date());
        } catch (e) {
            setError(e.message);
        } finally {
            setGuardando(false);
        }
    };

    // Guardar con Ctrl+S también desde el panel (fuera del iframe).
    useEffect(() => {
        const alTeclear = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                guardar();
            }
        };
        window.addEventListener('keydown', alTeclear);
        return () => window.removeEventListener('keydown', alTeclear);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modoCodigo, codigo, empresaId, id]);

    // ── Acciones sobre el documento ──────────────────────────────────────────
    const comando = (nombreCmd) => {
        const d = doc();
        if (!d) return;
        d.body.focus();
        d.execCommand(nombreCmd, false, null);
        setSucio(true);
    };

    const masCercano = (selector) => {
        const nodo = ultimoNodo.current;
        if (!nodo) return null;
        const el = nodo.nodeType === 1 ? nodo : nodo.parentElement;
        return el?.closest(selector) || null;
    };

    // Una fila más en la tabla donde está el cursor, vacía y con el número
    // correlativo si la tabla lleva columna de numeración.
    const anadirFila = () => {
        const fila = masCercano('tr');
        if (!fila) { setAviso('Toca primero una fila de la tabla.'); return; }
        const nueva = fila.cloneNode(true);
        nueva.querySelectorAll('td, th').forEach(celda => { celda.textContent = ''; });
        const primera = nueva.querySelector('td');
        const num = parseInt(fila.querySelector('td')?.textContent?.trim(), 10);
        if (primera && Number.isFinite(num)) primera.textContent = String(num + 1);
        fila.after(nueva);
        setSucio(true);
        setAviso(null);
    };

    const borrarFila = () => {
        const fila = masCercano('tr');
        if (!fila) { setAviso('Toca primero una fila de la tabla.'); return; }
        fila.remove();
        setSucio(true);
    };

    const duplicarHoja = () => {
        const hoja = masCercano('.page');
        if (!hoja) { setAviso('Toca primero la hoja que quieres duplicar.'); return; }
        hoja.after(hoja.cloneNode(true));
        setSucio(true);
        setAviso(null);
    };

    const borrarHoja = () => {
        const hoja = masCercano('.page');
        if (!hoja) { setAviso('Toca primero la hoja que quieres quitar.'); return; }
        if (!confirm('¿Quitar esta hoja del documento?')) return;
        hoja.remove();
        setSucio(true);
    };

    // Cambiar una foto: se sube al espacio de la empresa y se sustituye el src.
    // Las fotos de las plantillas vienen incrustadas en base64 (por eso pesan);
    // las nuevas van por URL, que es más ligero.
    const cambiarImagen = async (file) => {
        const img = imagenElegida.current;
        if (!file || !img) return;
        if (!file.type.startsWith('image/')) { setError('Elige una imagen.'); return; }
        if (!storage) { setError('El almacenamiento no está disponible.'); return; }
        setSubiendo(true);
        setError(null);
        try {
            const ext = file.name.split('.').pop() || 'png';
            const nombreArchivo = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
            const destino = refStorage(storage, `tenants/${empresaId}/formatos/${id}/${nombreArchivo}`);
            await uploadBytes(destino, file);
            img.src = await getDownloadURL(destino);
            img.removeAttribute('srcset');
            setSucio(true);
        } catch (e) {
            console.error(e);
            setError('No se pudo subir la imagen: ' + (e.message || 'error desconocido'));
        } finally {
            setSubiendo(false);
        }
    };

    const imprimir = () => {
        const marco = iframeRef.current;
        if (!marco) return;
        const d = doc();
        const zoomPrevio = d?.body?.style.zoom;
        if (d?.body) d.body.style.zoom = 1;      // se imprime a tamaño real
        marco.contentWindow.focus();
        marco.contentWindow.print();
        if (d?.body && zoomPrevio) d.body.style.zoom = zoomPrevio;
    };

    const descargar = () => {
        const html = modoCodigo ? codigo : htmlActual();
        if (!html) return;
        const archivo = `${(formato?.nombre || 'formato').replace(/[^\w\s.-]/g, '').trim() || 'formato'}.html`;
        const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = archivo;
        a.click();
        URL.revokeObjectURL(url);
    };

    const duplicar = async () => {
        try {
            const r = await authFetch('/api/formatos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ empresaId, duplicarDe: id, nombre: `${formato?.nombre || 'Formato'} (copia)`, tipo: formato?.tipo }),
            });
            const d = await r.json();
            if (!r.ok) throw new Error(d.error || 'No se pudo duplicar');
            router.push(`/formatos/${d.id}`);
        } catch (e) {
            setError(e.message);
        }
    };

    const guardarFicha = async (cambios) => {
        try {
            const r = await authFetch('/api/formatos', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ empresaId, id, ...cambios }),
            });
            const d = await r.json();
            if (!r.ok) throw new Error(d.error || 'No se pudo guardar el nombre');
            setFormato(f => ({ ...f, ...d }));
        } catch (e) {
            setError(e.message);
        }
    };

    // Modo código: el escape para retocar el HTML a mano.
    const abrirCodigo = () => {
        const html = htmlActual();
        if (!html) return;
        if (html.length > LIMITE_CODIGO) {
            setAviso('Este documento es demasiado grande para editarlo como texto (tiene fotos incrustadas). Descárgalo si necesitas tocarlo a mano.');
            return;
        }
        setCodigo(html);
        setModoCodigo(true);
        setAviso(null);
    };

    const aplicarCodigo = () => {
        setHtmlInicial(codigo);      // recarga el iframe con lo escrito
        setModoCodigo(false);
        setSucio(true);
    };

    const volver = (e) => {
        if (sucio && !confirm('Hay cambios sin guardar. ¿Salir de todos modos?')) {
            e.preventDefault();
        }
    };

    const t = tipoDe(formato?.tipo);
    const horaGuardado = useMemo(
        () => (guardadoEn ? guardadoEn.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : null),
        [guardadoEn],
    );

    return (
        <ProtectedRoute>
            <NavBar />
            <main className="formato-editor">
                <header className="formato-editor__barra">
                    <div className="formato-editor__izq">
                        <Link href="/formatos" className="btn btn-ghost btn-sm" onClick={volver}>← Formatos</Link>
                        <input
                            className="formato-editor__nombre"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            onBlur={() => nombre.trim() && nombre !== formato?.nombre && guardarFicha({ nombre })}
                            placeholder="Nombre del formato"
                        />
                        <select
                            className="formato-editor__tipo"
                            value={formato?.tipo || 'libre'}
                            onChange={(e) => guardarFicha({ tipo: e.target.value })}
                            style={{ background: t.fondo, color: t.color }}
                        >
                            {ORDEN_TIPOS.map(idt => <option key={idt} value={idt}>{TIPOS[idt].nombre}</option>)}
                        </select>
                    </div>

                    <div className="formato-editor__der">
                        <span className="formato-editor__estado">
                            {guardando ? 'Guardando…' : sucio ? 'Sin guardar' : horaGuardado ? `Guardado ${horaGuardado}` : 'Al día'}
                        </span>
                        <button className="btn btn-ghost btn-sm" onClick={duplicar}>Duplicar</button>
                        <button className="btn btn-ghost btn-sm" onClick={descargar}>Descargar</button>
                        <button className="btn btn-secondary btn-sm" onClick={imprimir}>Imprimir / PDF</button>
                        <button className="btn btn-primary btn-sm" onClick={guardar} disabled={guardando || (!sucio && !modoCodigo)}>
                            Guardar
                        </button>
                    </div>
                </header>

                {!modoCodigo && (
                    <div className="formato-editor__herramientas">
                        <div className="fe-grupo">
                            <button title="Negrita" onClick={() => comando('bold')}><b>N</b></button>
                            <button title="Cursiva" onClick={() => comando('italic')}><i>K</i></button>
                            <button title="Subrayado" onClick={() => comando('underline')}><u>S</u></button>
                            <button title="Deshacer" onClick={() => comando('undo')}>↶</button>
                            <button title="Rehacer" onClick={() => comando('redo')}>↷</button>
                        </div>
                        <div className="fe-grupo">
                            <button onClick={anadirFila}>+ Fila</button>
                            <button onClick={borrarFila}>− Fila</button>
                            <button onClick={duplicarHoja}>Duplicar hoja</button>
                            <button onClick={borrarHoja}>Quitar hoja</button>
                        </div>
                        <div className="fe-grupo">
                            <button onClick={() => inputImagen.current?.click()} disabled={subiendo}>
                                {subiendo ? 'Subiendo…' : 'Cambiar imagen'}
                            </button>
                            <input
                                ref={inputImagen} type="file" accept="image/*" style={{ display: 'none' }}
                                onChange={(e) => { cambiarImagen(e.target.files?.[0]); e.target.value = ''; }}
                            />
                            <button onClick={abrirCodigo}>HTML</button>
                        </div>
                        <div className="fe-grupo fe-grupo--zoom">
                            <button onClick={() => aplicarZoom(Math.max(0.3, zoom - 0.1))}>−</button>
                            <span>{Math.round(zoom * 100)}%</span>
                            <button onClick={() => aplicarZoom(Math.min(2, zoom + 0.1))}>+</button>
                            <button onClick={ajustarZoom}>Ajustar</button>
                        </div>
                        <p className="fe-pista">
                            Escribe directamente sobre la hoja. Toca una foto y pulsa «Cambiar imagen» para sustituirla.
                        </p>
                    </div>
                )}

                {error && <p className="formatos-error">{error}</p>}
                {aviso && <p className="formato-aviso">{aviso}</p>}

                {cargando ? (
                    <p className="formatos-vacio">Abriendo el documento…</p>
                ) : modoCodigo ? (
                    <div className="formato-codigo">
                        <textarea value={codigo} onChange={(e) => setCodigo(e.target.value)} spellCheck={false} />
                        <div className="formato-codigo__acciones">
                            <button className="btn btn-ghost btn-sm" onClick={() => setModoCodigo(false)}>Cancelar</button>
                            <button className="btn btn-primary btn-sm" onClick={aplicarCodigo}>Aplicar al documento</button>
                        </div>
                    </div>
                ) : (
                    <iframe
                        ref={iframeRef}
                        className="formato-lienzo"
                        title={formato?.nombre || 'Documento'}
                        srcDoc={htmlInicial || ''}
                        onLoad={prepararDocumento}
                    />
                )}
            </main>
        </ProtectedRoute>
    );
}
