// ── Configuración por empresa (tenant) del producto CGO ──────────────────────
//
// Cada cliente de Zentria puede tener prácticas distintas (una ferretería de
// aceros no registra su inventario igual que una tienda de comestibles). En vez
// de bifurcar el código por cliente, el formulario se DESCRIBE en datos:
//
//     tenants/{empresaId}/cgo_settings/inventory
//
// Este archivo es puro (sin imports de Firebase) para poder usarse tanto en el
// navegador como en el servidor.
//
// REGLA DE ORO: un tenant sin configuración se comporta exactamente como antes
// de existir este sistema (preset 'general'). Así no hay regresión para nadie.

// Tipos de campo que sabe renderizar DynamicFields.
export const FIELD_TYPES = ['text', 'number', 'select', 'date'];

// Unidades por defecto (las que tenía el formulario original).
const UNITS_GENERAL = ['Unidades', 'Kg', 'Litros', 'Metros', 'Cajas', 'Pares', 'Galones', 'Sacos'];

// ── Presets por rubro ────────────────────────────────────────────────────────
// Punto de partida para un cliente nuevo. Se pueden ajustar por tenant sin
// tocar código (sobrescribiendo extraFields/labels/unitOptions en Firestore).
export const INVENTORY_PRESETS = {
    // Comportamiento histórico: solo los campos núcleo, sin extras.
    general: {
        label: 'General (por defecto)',
        description: 'Materiales y compras diversas. Equivale al formulario clásico.',
        labels: {},
        unitOptions: UNITS_GENERAL,
        extraFields: [],
        listColumns: [],
    },

    // Tienda de planchas y barras de acero.
    aceros: {
        label: 'Acería / Metalmecánica',
        description: 'Planchas, barras y perfiles: dimensiones, norma y peso.',
        labels: {
            itemName: 'Descripción del material',
            category: 'Familia (plancha, barra, perfil…)',
            cost: 'Costo por unidad (S/)',
        },
        unitOptions: ['Plancha', 'Barra', 'Kg', 'Metros', 'Unidades', 'Tonelada'],
        extraFields: [
            { key: 'calidad',  label: 'Norma / Calidad', type: 'select', options: ['A36', 'A572', 'ASTM A1011', 'Inox 304', 'Inox 316', 'Otro'] },
            { key: 'espesor',  label: 'Espesor',         type: 'number', unit: 'mm', step: '0.01' },
            { key: 'ancho',    label: 'Ancho',           type: 'number', unit: 'mm' },
            { key: 'largo',    label: 'Largo',           type: 'number', unit: 'mm' },
            { key: 'pesoUnit', label: 'Peso por unidad', type: 'number', unit: 'kg', step: '0.01' },
            { key: 'acabado',  label: 'Acabado',         type: 'select', options: ['Laminado en caliente', 'Laminado en frío', 'Galvanizado', 'Negro', 'Pulido'] },
        ],
        listColumns: ['calidad', 'espesor'],
    },

    // Tienda de productos comestibles.
    comestibles: {
        label: 'Comestibles / Abarrotes',
        description: 'Productos perecibles: vencimiento, lote y presentación.',
        labels: {
            itemName: 'Producto',
            sku: 'Código de barras',
            category: 'Categoría (lácteos, bebidas…)',
            cost: 'Costo de compra (S/)',
        },
        unitOptions: ['Unidades', 'Cajas', 'Kg', 'Gramos', 'Litros', 'Mililitros', 'Paquetes', 'Docenas'],
        extraFields: [
            { key: 'fechaVencimiento', label: 'Fecha de vencimiento', type: 'date' },
            { key: 'lote',             label: 'Lote',                 type: 'text' },
            { key: 'presentacion',     label: 'Presentación',         type: 'text',   help: 'Ej. Botella 500 ml, Bolsa 1 kg' },
            { key: 'marca',            label: 'Marca',                type: 'text' },
            { key: 'precioVenta',      label: 'Precio de venta',      type: 'number', unit: 'S/', step: '0.01' },
            { key: 'conservacion',     label: 'Conservación',         type: 'select', options: ['Ambiente', 'Refrigerado', 'Congelado'] },
        ],
        listColumns: ['fechaVencimiento', 'lote'],
    },
};

export const DEFAULT_PRESET = 'general';

// Campos núcleo: los gestiona siempre el sistema porque alimentan los KPIs
// (valorización, alertas de stock bajo). No se pueden quitar por configuración;
// solo se les puede cambiar la etiqueta vía `labels`.
export const CORE_FIELDS = ['name', 'sku', 'category', 'stock', 'minStock', 'unit', 'cost', 'imageUrl'];

// Normaliza un campo extra venido de Firestore, descartando lo inválido.
function normalizeField(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const key = String(raw.key || '').trim();
    if (!key || CORE_FIELDS.includes(key)) return null; // no puede pisar un campo núcleo
    const type = FIELD_TYPES.includes(raw.type) ? raw.type : 'text';
    return {
        key,
        label: String(raw.label || key),
        type,
        unit: raw.unit ? String(raw.unit) : null,
        step: raw.step ? String(raw.step) : undefined,
        required: !!raw.required,
        help: raw.help ? String(raw.help) : null,
        options: type === 'select' && Array.isArray(raw.options) ? raw.options.map(String) : [],
    };
}

/**
 * Combina el preset elegido con los ajustes propios del tenant.
 * Devuelve siempre una configuración válida y completa, incluso si `raw` es
 * null (tenant sin configurar) o tiene datos corruptos.
 */
export function resolveInventoryConfig(raw) {
    const presetKey = raw?.preset && INVENTORY_PRESETS[raw.preset] ? raw.preset : DEFAULT_PRESET;
    const preset = INVENTORY_PRESETS[presetKey];

    // Los campos extra del tenant, si existen, reemplazan los del preset.
    const fieldsSource = Array.isArray(raw?.extraFields) && raw.extraFields.length > 0
        ? raw.extraFields
        : preset.extraFields;

    const extraFields = fieldsSource.map(normalizeField).filter(Boolean);
    const validKeys = new Set(extraFields.map(f => f.key));

    const unitOptions = Array.isArray(raw?.unitOptions) && raw.unitOptions.length > 0
        ? raw.unitOptions.map(String)
        : preset.unitOptions;

    const listColumns = (Array.isArray(raw?.listColumns) ? raw.listColumns : preset.listColumns)
        .map(String)
        .filter(k => validKeys.has(k)); // solo columnas que existan como campo

    return {
        preset: presetKey,
        presetLabel: preset.label,
        variant: raw?.variant || 'simple',   // reservado: 'simple' | 'kardex'
        labels: { ...(preset.labels || {}), ...(raw?.labels || {}) },
        unitOptions,
        extraFields,
        listColumns,
    };
}

/** Etiqueta de un campo núcleo, respetando el override del tenant. */
export function coreLabel(config, key, fallback) {
    return config?.labels?.[key] || fallback;
}

/** Formatea el valor de un campo extra para mostrarlo en tablas. */
export function formatFieldValue(field, value) {
    if (value === undefined || value === null || value === '') return '—';
    if (field?.type === 'date') {
        // Un "YYYY-MM-DD" se interpreta como UTC y en Perú (UTC-5) se vería un día
        // antes, así que lo construimos como fecha local.
        const iso = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
        const d = iso ? new Date(+iso[1], +iso[2] - 1, +iso[3]) : new Date(value);
        return isNaN(d) ? String(value) : d.toLocaleDateString('es-PE');
    }
    if (!field?.unit) return String(value);
    // Los símbolos de moneda van delante; las unidades físicas, detrás.
    return /^(S\/|\$|€)$/.test(field.unit) ? `${field.unit} ${value}` : `${value} ${field.unit}`;
}
