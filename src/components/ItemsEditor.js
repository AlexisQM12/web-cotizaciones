'use client';
// Editor de ítems en dos paneles: los cuadros a la izquierda, el detalle a la
// derecha.
//
// Sustituye a la lista de tarjetas apiladas, donde cada ítem expandido medía
// media pantalla y con ocho ítems la página se volvía interminable. Aquí los
// cuadros son una columna compacta —se ven todos de un vistazo— y el espacio
// grande se reserva para el ítem que estás editando.

import { useEffect } from 'react';
import RichTextEditor from '@/components/RichTextEditor';
import { aTextoPlano } from '@/lib/richText';

const CAMPOS_NUMERICOS = [
    { campo: 'quantity',         etiqueta: 'Cant.',      marcador: '0',    paso: 'any'  },
    { campo: 'basePrice',        etiqueta: 'Costo Base', marcador: '0.00', paso: '0.01' },
    { campo: 'profitPercentage', etiqueta: '% Gan.',     marcador: '0',    paso: 'any'  },
    { campo: 'otherCosts',       etiqueta: '% Otros',    marcador: '0',    paso: 'any'  },
    { campo: 'price',            etiqueta: 'Precio U.',  marcador: '0.00', paso: '0.01' },
];

// Costo base + margen + otros. Estaba repetida en tres onChange de la página.
const precioFinal = ({ basePrice, profitPercentage, otherCosts }) => {
    const base   = parseFloat(basePrice) || 0;
    const gan    = parseFloat(profitPercentage) || 0;
    const otros  = parseFloat(otherCosts) || 0;
    return (base * (1 + (gan + otros) / 100)).toFixed(2);
};

const moneda = (n) => Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ItemsEditor({
    items = [],
    seleccionado,
    onSeleccionar,
    onCambiar,          // (index, campo, valor)
    onAgregar,
    onEliminar,
    onDuplicar,
    onSubir,
    onBajar,
    onSubirImagen,      // (index, file)
    onQuitarImagen,     // (index, imageUrl)
    onAbrirSubItems,    // (index)
    subiendoImagen = {},
    getInputStyle = (_, base) => base,
    onFocusCampo,
    onBlurCampo,
    usarPrecioGeneral = false,
}) {
    // Si el ítem seleccionado desaparece (por borrado), volvemos al anterior.
    useEffect(() => {
        if (items.length === 0) return;
        if (seleccionado == null || seleccionado > items.length - 1) {
            onSeleccionar?.(Math.max(0, items.length - 1));
        }
    }, [items.length, seleccionado, onSeleccionar]);

    const indice = Math.min(seleccionado ?? 0, Math.max(0, items.length - 1));
    const item = items[indice];

    // Tocar el costo base o los porcentajes recalcula el precio unitario; el
    // precio escrito a mano se respeta tal cual.
    const cambiarNumero = (campo, valor) => {
        onCambiar?.(indice, campo, valor);
        if (campo === 'basePrice' || campo === 'profitPercentage' || campo === 'otherCosts') {
            onCambiar?.(indice, 'price', precioFinal({ ...item, [campo]: valor }));
        }
    };

    return (
        <div className="items-editor">
            {/* ── Columna izquierda: los cuadros ─────────────────────────── */}
            <aside className="items-editor__lista">
                <div className="items-editor__lista-cabecera">
                    <span>{items.length} ítem{items.length === 1 ? '' : 's'}</span>
                    <button type="button" onClick={onAgregar} className="items-editor__anadir">
                        + Añadir
                    </button>
                </div>

                <div className="items-editor__cuadros">
                    {items.map((it, i) => {
                        const activo = i === indice;
                        const total = Number(it.quantity || 0) * Number(it.price || 0);
                        const resumen = aTextoPlano(it.details || '').replace(/\n/g, ' ').trim();
                        return (
                            <button
                                type="button"
                                key={i}
                                onClick={() => onSeleccionar?.(i)}
                                className={`items-editor__cuadro${activo ? ' items-editor__cuadro--activo' : ''}`}
                            >
                                <div className="items-editor__cuadro-fila">
                                    <span className="items-editor__num">{i + 1}</span>
                                    <span className="items-editor__titulo">
                                        {it.description || <em style={{ color: '#94a3b8' }}>Sin título</em>}
                                    </span>
                                </div>
                                {resumen && <div className="items-editor__resumen">{resumen}</div>}
                                {!usarPrecioGeneral && (
                                    <div className="items-editor__cuadro-pie">
                                        <span>{moneda(it.quantity || 0)} × S/ {moneda(it.price)}</span>
                                        <strong>S/ {moneda(total)}</strong>
                                    </div>
                                )}
                                {(it.imageUrl || (it.subItems || []).length > 0) && (
                                    <div className="items-editor__marcas">
                                        {it.imageUrl && <span title="Tiene imagen">🖼</span>}
                                        {(it.subItems || []).length > 0 && <span title="Tiene sub-ítems">☰ {it.subItems.length}</span>}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </aside>

            {/* ── Columna derecha: el detalle del ítem elegido ───────────── */}
            <section className="items-editor__detalle">
                {!item ? (
                    <p style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>
                        No hay ítems. Pulsa «Añadir» para crear el primero.
                    </p>
                ) : (
                    <>
                        <header className="items-editor__detalle-cabecera">
                            <span className="items-editor__etiqueta">Ítem {indice + 1} de {items.length}</span>
                            <div className="items-editor__acciones">
                                <button type="button" title="Subir" onClick={() => onSubir?.(indice)} disabled={indice === 0}>↑</button>
                                <button type="button" title="Bajar" onClick={() => onBajar?.(indice)} disabled={indice === items.length - 1}>↓</button>
                                <button type="button" title="Duplicar" onClick={() => onDuplicar?.(indice)}>⧉</button>
                                <button
                                    type="button" title="Eliminar" className="items-editor__peligro"
                                    onClick={() => onEliminar?.(indice)} disabled={items.length <= 1}
                                >🗑</button>
                            </div>
                        </header>

                        <label className="items-editor__label">Título del ítem</label>
                        <input
                            className="items-editor__input-titulo"
                            placeholder="Ej. Suministro e instalación de estructura metálica"
                            value={item.description || ''}
                            onChange={(e) => onCambiar?.(indice, 'description', e.target.value)}
                            onFocus={() => onFocusCampo?.(`item_${indice}_description`)}
                            onBlur={() => onBlurCampo?.(`item_${indice}_description`)}
                            style={getInputStyle(`item_${indice}_description`, {})}
                        />

                        <label className="items-editor__label">Descripción</label>
                        <RichTextEditor
                            value={item.details || ''}
                            onChange={(html) => onCambiar?.(indice, 'details', html)}
                            onFocus={() => onFocusCampo?.(`item_${indice}_details`)}
                            onBlur={() => onBlurCampo?.(`item_${indice}_details`)}
                            placeholder="Detalla el alcance, materiales, medidas… Usa los botones para dar formato."
                        />

                        {usarPrecioGeneral ? (
                            <p className="items-editor__nota items-editor__nota--aviso">
                                El precio de este ítem no se pide aquí: la cotización usa un precio general
                                para todos los ítems (ver «Precios globales» en el paso Datos).
                            </p>
                        ) : (
                            <>
                                <div className="items-editor__numeros">
                                    {CAMPOS_NUMERICOS.map(({ campo, etiqueta, marcador, paso }) => (
                                        <div key={campo}>
                                            <label className="items-editor__label">{etiqueta}</label>
                                            <input
                                                type="number"
                                                step={paso}
                                                placeholder={marcador}
                                                value={item[campo] ?? ''}
                                                onChange={(e) => cambiarNumero(campo, e.target.value)}
                                                onFocus={() => onFocusCampo?.(`item_${indice}_${campo}`)}
                                                onBlur={() => onBlurCampo?.(`item_${indice}_${campo}`)}
                                                style={getInputStyle(`item_${indice}_${campo}`, {})}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <p className="items-editor__nota">
                                    El precio unitario se recalcula solo: costo base + % ganancia + % otros.
                                </p>
                            </>
                        )}

                        <div className="items-editor__extras">
                            {item.imageUrl ? (
                                <div className="items-editor__imagen">
                                    <img src={item.imageUrl} alt="Imagen del ítem" />
                                    <div>
                                        <label className="items-editor__label">Imagen adjunta</label>
                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                            <label className="items-editor__boton-suave">
                                                Cambiar
                                                <input type="file" accept="image/*" hidden
                                                    onChange={(e) => e.target.files[0] && onSubirImagen?.(indice, e.target.files[0])} />
                                            </label>
                                            <button type="button" className="items-editor__peligro-suave"
                                                onClick={() => onQuitarImagen?.(indice, item.imageUrl)}>Quitar</button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <label className="items-editor__subir">
                                    {subiendoImagen[indice] ? 'Subiendo…' : '＋ Añadir imagen'}
                                    <input type="file" accept="image/*" hidden disabled={subiendoImagen[indice]}
                                        onChange={(e) => e.target.files[0] && onSubirImagen?.(indice, e.target.files[0])} />
                                </label>
                            )}

                            <button type="button" className="items-editor__boton-suave"
                                onClick={() => onAbrirSubItems?.(indice)}>
                                ☰ Sub-ítems {(item.subItems || []).length > 0 ? `(${item.subItems.length})` : ''}
                            </button>
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}
