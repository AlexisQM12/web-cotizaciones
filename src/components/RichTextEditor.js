'use client';
// Editor visual para la descripción de un ítem.
//
// Escribe HTML acotado (negrita, cursiva, subrayado, viñetas y saltos), que es
// lo que src/lib/richText.js sabe traducir al PDF. Lo que se ve aquí es lo que
// sale impreso: no hay marcadores a la vista.
//
// Sobre execCommand: está marcado como obsoleto, pero sigue siendo lo único que
// funciona igual en todos los navegadores sin arrastrar una librería de editor
// completa. Como el resultado se sanea antes de guardarse, el riesgo es acotado.

import { useCallback, useEffect, useRef, useState } from 'react';
import { sanitizarHtml } from '@/lib/richText';

const BOTONES = [
    { cmd: 'bold',          etiqueta: 'N', titulo: 'Negrita (Ctrl+B)',    estilo: { fontWeight: 800 } },
    { cmd: 'italic',        etiqueta: 'K', titulo: 'Cursiva (Ctrl+I)',    estilo: { fontStyle: 'italic' } },
    { cmd: 'underline',     etiqueta: 'S', titulo: 'Subrayado (Ctrl+U)',  estilo: { textDecoration: 'underline' } },
    { separador: true },
    { cmd: 'insertUnorderedList', etiqueta: '• —', titulo: 'Lista con viñetas' },
    { cmd: 'removeFormat',        etiqueta: '⌫',   titulo: 'Quitar formato' },
];

export default function RichTextEditor({
    value = '',
    onChange,
    placeholder = 'Describe el ítem…',
    minHeight = 220,
    onFocus,
    onBlur,
}) {
    const ref = useRef(null);
    const [activos, setActivos] = useState({});
    // Evita que un re-render externo pise lo que el usuario está escribiendo:
    // sólo se vuelca `value` en el DOM cuando viene de fuera, no de este editor.
    // Arranca en null a propósito: si arrancara en `value`, la comparación del
    // primer efecto daría falso y el contenido inicial nunca llegaría al DOM.
    const ultimoEmitido = useRef(null);
    // La selección se guarda en cada interacción y se restaura antes de aplicar
    // el formato. Sin esto, basta con que el navegador mueva el foco al pulsar el
    // botón para que execCommand se ejecute sobre una selección vacía y no haga
    // nada —que es exactamente lo que pasaba—.
    const rangoGuardado = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (value !== ultimoEmitido.current && value !== el.innerHTML) {
            el.innerHTML = value || '';
            ultimoEmitido.current = value;
        }
    }, [value]);

    const emitir = useCallback(() => {
        const el = ref.current;
        if (!el) return;
        const limpio = sanitizarHtml(el.innerHTML);
        ultimoEmitido.current = limpio;
        onChange?.(limpio);
    }, [onChange]);

    const guardarRango = useCallback(() => {
        const sel = typeof window !== 'undefined' ? window.getSelection() : null;
        if (!sel || sel.rangeCount === 0) return;
        const rango = sel.getRangeAt(0);
        if (ref.current && ref.current.contains(rango.commonAncestorContainer)) {
            rangoGuardado.current = rango.cloneRange();
        }
    }, []);

    const restaurarRango = useCallback(() => {
        const rango = rangoGuardado.current;
        if (!rango || !ref.current) return false;
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(rango);
        return true;
    }, []);

    // Refresca qué botones se ven pulsados según dónde esté el cursor.
    const refrescarEstado = useCallback(() => {
        if (typeof document === 'undefined') return;
        const estado = {};
        for (const b of BOTONES) {
            if (!b.cmd || b.cmd === 'removeFormat') continue;
            try { estado[b.cmd] = document.queryCommandState(b.cmd); } catch { /* no soportado */ }
        }
        setActivos(estado);
    }, []);

    const aplicar = (cmd) => {
        const el = ref.current;
        if (!el) return;
        el.focus();
        restaurarRango();
        try { document.execCommand(cmd, false, null); } catch { /* ignorar */ }
        guardarRango();
        refrescarEstado();
        emitir();
    };

    const alTeclear = (e) => {
        // Atajos estándar; el navegador ya los mapea, pero los normalizamos para
        // que el estado de los botones se actualice al instante.
        if ((e.ctrlKey || e.metaKey) && ['b', 'i', 'u'].includes(e.key.toLowerCase())) {
            e.preventDefault();
            aplicar({ b: 'bold', i: 'italic', u: 'underline' }[e.key.toLowerCase()]);
        }
    };

    // Al pegar desde Word o una web, se toma sólo el texto: así no entran
    // tipografías, colores ni tablas que el PDF no sabría representar.
    const alPegar = (e) => {
        e.preventDefault();
        const texto = (e.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, texto);
        emitir();
    };

    const vacio = !value || !String(value).replace(/<[^>]*>/g, '').trim();

    return (
        <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
            <div style={{
                display: 'flex', alignItems: 'center', gap: 2, padding: '0.35rem 0.5rem',
                borderBottom: '1px solid #e2e8f0', background: '#f8fafc', flexWrap: 'wrap',
            }}>
                {BOTONES.map((b, i) => b.separador ? (
                    <span key={i} style={{ width: 1, height: 18, background: '#cbd5e1', margin: '0 4px' }} />
                ) : (
                    <button
                        key={b.cmd}
                        type="button"
                        title={b.titulo}
                        // onMouseDown en vez de onClick: evita que el editor pierda
                        // la selección antes de aplicar el formato.
                        onMouseDown={(e) => { e.preventDefault(); aplicar(b.cmd); }}
                        style={{
                            minWidth: 30, height: 28, padding: '0 8px', cursor: 'pointer',
                            border: '1px solid ' + (activos[b.cmd] ? '#0369a1' : 'transparent'),
                            background: activos[b.cmd] ? '#e0f2fe' : 'transparent',
                            color: activos[b.cmd] ? '#0369a1' : '#475569',
                            borderRadius: 5, fontSize: '0.85rem', lineHeight: 1,
                            ...(b.estilo || {}),
                        }}
                    >
                        {b.etiqueta}
                    </button>
                ))}
            </div>

            <div style={{ position: 'relative' }}>
                {vacio && (
                    <span style={{
                        position: 'absolute', top: '0.6rem', left: '0.7rem',
                        color: '#94a3b8', fontSize: '0.85rem', pointerEvents: 'none',
                    }}>
                        {placeholder}
                    </span>
                )}
                <div
                    ref={ref}
                    className="rich-text-editor__area"
                    contentEditable
                    suppressContentEditableWarning
                    onInput={emitir}
                    onBlur={() => { emitir(); onBlur?.(); }}
                    onFocus={() => { guardarRango(); refrescarEstado(); onFocus?.(); }}
                    onKeyUp={() => { guardarRango(); refrescarEstado(); }}
                    onMouseUp={() => { guardarRango(); refrescarEstado(); }}
                    onSelect={guardarRango}
                    onKeyDown={alTeclear}
                    onPaste={alPegar}
                    style={{
                        minHeight, maxHeight: '55vh', overflowY: 'auto',
                        padding: '0.6rem 0.7rem', fontSize: '0.85rem', lineHeight: 1.5,
                        outline: 'none', color: '#0f172a',
                    }}
                />
            </div>
        </div>
    );
}
