import { getTenantCollection } from '@/lib/firebase-admin';
import { autorizarTenant, respuestaDeAuthError } from '@/lib/apiAuth';
import { resolverEmpresaId, faltaEmpresaId } from '@/lib/tenant';
import { detectarTienda, TIENDAS, ESTADOS } from '@/lib/tiendas';

// Compras pendientes en tiendas online (Amazon, AliExpress, Alibaba…).
// Viven en tenants/{empresaId}/cgo_compras y son compartidas por la empresa:
// quien registra un pedido queda anotado, pero todo el equipo lo ve.

const ESTADOS_VALIDOS = ESTADOS.map(e => e.id);

function manejarError(err, contexto) {
    const authRes = respuestaDeAuthError(err);
    if (authRes) return authRes;
    console.error(`[compras] ${contexto}:`, err);
    return Response.json({ error: err.message }, { status: 500 });
}

// Normaliza lo que llega del formulario. La tienda se deduce del enlace, pero
// se respeta la elegida a mano si vino explícita (p. ej. una tienda que no
// reconocemos, o un enlace acortado).
function normalizar(body) {
    const url = String(body.url ?? '').trim();
    const tiendaPedida = body.tienda && TIENDAS[body.tienda] ? body.tienda : null;
    const estado = ESTADOS_VALIDOS.includes(body.estado) ? body.estado : 'porPedir';

    return {
        titulo:    String(body.titulo ?? '').trim(),
        url,
        tienda:    tiendaPedida || detectarTienda(url) || 'otra',
        estado,
        cantidad:  Number.isFinite(parseFloat(body.cantidad)) ? parseFloat(body.cantidad) : 1,
        precio:    Number.isFinite(parseFloat(body.precio)) ? parseFloat(body.precio) : 0,
        moneda:    body.moneda === 'PEN' ? 'PEN' : 'USD',
        seguimiento:   String(body.seguimiento ?? '').trim(),
        fechaPedido:   body.fechaPedido || null,
        fechaEstimada: body.fechaEstimada || null,
        notas:     String(body.notas ?? '').trim(),
    };
}

// GET /api/compras?empresaId=
export async function GET(req) {
    try {
        const empresaId = resolverEmpresaId(req);
        if (!empresaId) return faltaEmpresaId();
        await autorizarTenant(req, empresaId);

        const snap = await getTenantCollection(empresaId, 'compras').get();
        const compras = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            // Se ordena en memoria para no exigir un índice compuesto en Firestore.
            .sort((a, b) => String(b.creadaEn || '').localeCompare(String(a.creadaEn || '')));

        return Response.json({ compras });
    } catch (err) {
        return manejarError(err, 'GET');
    }
}

// POST /api/compras  { empresaId, titulo, url, ... }
export async function POST(req) {
    try {
        const body = await req.json();
        const empresaId = resolverEmpresaId(req, body);
        if (!empresaId) return faltaEmpresaId();
        const sesion = await autorizarTenant(req, empresaId);

        const datos = normalizar(body);
        if (!datos.titulo && !datos.url) {
            return Response.json({ error: 'Escribe al menos un título o un enlace.' }, { status: 400 });
        }

        const ahora = new Date().toISOString();
        const compra = {
            ...datos,
            creadaPor:   sesion.uid,
            creadaPorEmail: sesion.email || null,
            creadaEn:    ahora,
            actualizadaEn: ahora,
        };
        const ref = await getTenantCollection(empresaId, 'compras').add(compra);
        return Response.json({ id: ref.id, ...compra });
    } catch (err) {
        return manejarError(err, 'POST');
    }
}

// PUT /api/compras  { empresaId, id, ...campos }
export async function PUT(req) {
    try {
        const body = await req.json();
        const empresaId = resolverEmpresaId(req, body);
        if (!empresaId) return faltaEmpresaId();
        await autorizarTenant(req, empresaId);

        const { id } = body;
        if (!id) return Response.json({ error: 'id requerido' }, { status: 400 });

        // Cambiar sólo el estado (arrastrar entre columnas) no debe borrar el
        // resto de campos, así que un PUT con `soloEstado` actualiza ese campo.
        const cambios = body.soloEstado
            ? { estado: ESTADOS_VALIDOS.includes(body.estado) ? body.estado : 'porPedir' }
            : normalizar(body);

        cambios.actualizadaEn = new Date().toISOString();
        await getTenantCollection(empresaId, 'compras').doc(id).update(cambios);
        return Response.json({ id, ...cambios });
    } catch (err) {
        return manejarError(err, 'PUT');
    }
}

// DELETE /api/compras?empresaId=&id=
export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const empresaId = resolverEmpresaId(req);
        if (!empresaId) return faltaEmpresaId();
        await autorizarTenant(req, empresaId);

        const id = searchParams.get('id');
        if (!id) return Response.json({ error: 'id requerido' }, { status: 400 });

        await getTenantCollection(empresaId, 'compras').doc(id).delete();
        return Response.json({ success: true });
    } catch (err) {
        return manejarError(err, 'DELETE');
    }
}
