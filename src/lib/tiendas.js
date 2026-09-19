// ── Catálogo de tiendas online ───────────────────────────────────────────────
//
// Se usa para agrupar y colorear las compras. La tienda no se pide como un
// campo aparte en el formulario: se deduce del propio enlace que ya vas a
// pegar (ver `detectarTienda`), y sólo se puede corregir a mano si hace falta.

export const TIENDAS = {
    amazon: {
        id: 'amazon',
        nombre: 'Amazon',
        color: '#ff9900',
        colorTexto: '#111827',
        // Dominios que identifican la tienda. Se compara por sufijo, así que
        // "amazon.es", "amazon.com.mx", etc. también caen aquí.
        dominios: ['amazon.'],
    },
    aliexpress: {
        id: 'aliexpress',
        nombre: 'AliExpress',
        color: '#e62e04',
        colorTexto: '#ffffff',
        dominios: ['aliexpress.', 'a.aliexpress.'],
    },
    alibaba: {
        id: 'alibaba',
        nombre: 'Alibaba',
        color: '#ff6a00',
        colorTexto: '#ffffff',
        dominios: ['alibaba.', 'm.alibaba.'],
    },
    otra: {
        id: 'otra',
        nombre: 'Otra tienda',
        color: '#64748b',
        colorTexto: '#ffffff',
        dominios: [],
    },
};

// Orden en que se muestran los grupos. "otra" siempre al final.
export const ORDEN_TIENDAS = ['amazon', 'aliexpress', 'alibaba', 'otra'];

export function tiendaDe(id) {
    return TIENDAS[id] || TIENDAS.otra;
}

// Deduce la tienda a partir del enlace pegado. Devuelve null si no reconoce
// ninguna, para que quien llama decida (el formulario deja 'otra').
export function detectarTienda(url) {
    if (!url || typeof url !== 'string') return null;
    let host;
    try {
        // Tolera que se pegue sin protocolo ("www.amazon.com/...").
        host = new URL(url.includes('://') ? url : `https://${url}`).hostname.toLowerCase();
    } catch {
        return null;
    }
    for (const id of ORDEN_TIENDAS) {
        const { dominios } = TIENDAS[id];
        if (dominios.some(d => host.includes(d))) return id;
    }
    return null;
}

// Estados de una compra pendiente, en el orden natural del proceso.
export const ESTADOS = [
    { id: 'porPedir',  etiqueta: 'Por pedir',  color: '#64748b', fondo: '#f1f5f9' },
    { id: 'pedido',    etiqueta: 'Pedido',     color: '#0369a1', fondo: '#e0f2fe' },
    { id: 'enCamino',  etiqueta: 'En camino',  color: '#b45309', fondo: '#fef3c7' },
    { id: 'recibido',  etiqueta: 'Recibido',   color: '#15803d', fondo: '#dcfce7' },
];

export function estadoDe(id) {
    return ESTADOS.find(e => e.id === id) || ESTADOS[0];
}
