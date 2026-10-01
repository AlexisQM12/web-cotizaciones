// ============================================================
// PROYECCIÓN PÚBLICA DEL INVENTARIO
// ============================================================
//
// La tienda de un cliente (p. ej. aceroslima.com) necesita leer su catálogo sin
// sesión. El inventario NO puede ser esa fuente: lleva el costo de compra, el
// stock real y el stock mínimo. Publicar eso es regalarle a la competencia el
// margen y el nivel de almacén.
//
// Por eso el inventario se proyecta a una colección aparte,
// `tenants/{empresaId}/cgo_catalogo_publico`, que contiene SOLO lo que una
// tienda necesita enseñar. Es la misma forma de trabajar que el perfil público
// de SAC: lo privado queda cerrado y se publica una vista recortada.
//
// Qué se publica y qué no:
//
//   SÍ   nombre, sku, categoría, unidad, imagen, precio de venta, atributos
//        descriptivos (norma, espesor, medidas…) y si hay existencias.
//   NO   `cost` (lo que le cuesta a la empresa), `stock` y `minStock` exactos,
//        ni ningún dato de proveedor.
//
// Un artículo entra en la tienda cuando tiene **precio de venta**. Es el
// criterio que eligió el cliente y tiene una ventaja práctica: el insumo
// interno, el retazo y la materia prima no llevan precio de venta, así que se
// quedan fuera solos, sin que nadie tenga que acordarse de marcar nada. Quitar
// el precio retira el artículo de la tienda.

import { getTenantCollection } from '@/lib/firebase-admin';

export const COLECCION_PUBLICA = 'cgo_catalogo_publico';

/** Clave del atributo que hace de precio de cara al público. */
export const CAMPO_PRECIO = 'precioVenta';

const numero = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};

/**
 * Convierte un ítem de inventario en su versión pública.
 * Devuelve `null` si el artículo no debe salir en la tienda.
 */
export function proyectar(item) {
    if (!item) return null;

    const atributos = { ...(item.attributes || {}) };
    const precio = numero(atributos[CAMPO_PRECIO]);
    if (precio <= 0) return null;          // sin precio de venta, no es de tienda

    delete atributos[CAMPO_PRECIO];        // el precio va en su propio campo

    return {
        nombre: String(item.name || '').trim(),
        sku: String(item.sku || '').trim(),
        categoria: String(item.category || '').trim(),
        unidad: String(item.unit || '').trim(),
        imagen: String(item.imageUrl || '').trim(),
        precio,
        // Disponibilidad, NO la cantidad: el cliente necesita saber si puede
        // llevárselo hoy; nadie de fuera necesita saber cuántas planchas hay.
        disponible: numero(item.stock) > 0,
        atributos,
        actualizadoEn: new Date().toISOString(),
    };
}

const refPublica = (empresaId, id) =>
    getTenantCollection(empresaId, COLECCION_PUBLICA).doc(String(id));

/**
 * Deja la copia pública de un ítem al día: la escribe si el artículo es de
 * tienda, y la retira si dejó de serlo (le quitaron el precio de venta).
 *
 * Nunca lanza: que falle la vitrina no puede tumbar el guardado del inventario,
 * que es lo que de verdad le importa al usuario en ese momento.
 */
export async function sincronizar(empresaId, id, item) {
    try {
        const publico = proyectar(item);
        if (publico) await refPublica(empresaId, id).set(publico);
        else await refPublica(empresaId, id).delete();
        return !!publico;
    } catch (error) {
        console.error('[catalogoPublico] No se pudo sincronizar', id, error.message);
        return false;
    }
}

/** Retira un artículo de la tienda (se borró del inventario). */
export async function retirar(empresaId, id) {
    try {
        await refPublica(empresaId, id).delete();
    } catch (error) {
        console.error('[catalogoPublico] No se pudo retirar', id, error.message);
    }
}

/**
 * Reconstruye la tienda entera desde el inventario.
 *
 * Hace falta para los artículos que ya existían antes de que esto se
 * sincronizara solo, y como red de seguridad si alguna escritura se perdió.
 */
export async function reconstruir(empresaId) {
    const [inventario, publicados] = await Promise.all([
        getTenantCollection(empresaId, 'inventory').get(),
        getTenantCollection(empresaId, COLECCION_PUBLICA).get(),
    ]);

    const vivos = new Set();
    let publicadosAhora = 0;

    for (const doc of inventario.docs) {
        const publico = proyectar(doc.data());
        if (!publico) continue;
        await refPublica(empresaId, doc.id).set(publico);
        vivos.add(doc.id);
        publicadosAhora += 1;
    }

    // Lo que ya no corresponde publicar se retira, incluidos los artículos
    // borrados del inventario mientras esto no miraba.
    let retirados = 0;
    for (const doc of publicados.docs) {
        if (vivos.has(doc.id)) continue;
        await doc.ref.delete();
        retirados += 1;
    }

    return { publicados: publicadosAhora, retirados, revisados: inventario.size };
}
