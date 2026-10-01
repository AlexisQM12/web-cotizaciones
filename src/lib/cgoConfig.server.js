// Lectura de la configuración CGO de un tenant desde el servidor (Admin SDK).
// Se cachea en memoria unos segundos porque las API routes la piden en cada
// request y la configuración cambia muy pocas veces.
import { getTenantCollection } from '@/lib/firebase-admin';
import { resolveInventoryConfig } from '@/lib/cgoConfig';

const CACHE_TTL_MS = 60_000;
const cache = new Map(); // empresaId → { at, config }

export async function getInventoryConfig(empresaId) {
    if (!empresaId) return resolveInventoryConfig(null);

    const hit = cache.get(empresaId);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.config;

    let raw = null;
    try {
        const snap = await getTenantCollection(empresaId, 'cgo_settings').doc('inventory').get();
        if (snap.exists) raw = snap.data();
    } catch (err) {
        // Si falla la lectura seguimos con los defaults: nunca bloqueamos la operación.
        console.warn(`[cgoConfig] No se pudo leer config de inventario de "${empresaId}":`, err.message);
    }

    const config = resolveInventoryConfig(raw);
    cache.set(empresaId, { at: Date.now(), config });
    return config;
}

/** Invalida la caché de un tenant (llamar al guardar su configuración). */
export function invalidateInventoryConfig(empresaId) {
    if (empresaId) cache.delete(empresaId);
    else cache.clear();
}
