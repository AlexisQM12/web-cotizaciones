import { getTenantCollection } from '@/lib/firebase-admin';
import { autorizarTenant, respuestaDeAuthError } from '@/lib/apiAuth';
import { resolverEmpresaId, faltaEmpresaId } from '@/lib/tenant';

// Notas rápidas por empresa: ideas sueltas que se apuntan desde cualquier
// pantalla. Viven en tenants/{empresaId}/cgo_notas.
//
// Cada nota guarda quién la escribió para poder mostrarlo, pero son visibles
// para toda la empresa: la idea es que el equipo comparta apuntes.

function manejarError(err, contexto) {
    const authRes = respuestaDeAuthError(err);
    if (authRes) return authRes;
    console.error(`[notas] ${contexto}:`, err);
    return Response.json({ error: err.message }, { status: 500 });
}

// GET /api/notas?empresaId=
export async function GET(req) {
    try {
        const empresaId = resolverEmpresaId(req);
        if (!empresaId) return faltaEmpresaId();
        await autorizarTenant(req, empresaId);

        const snap = await getTenantCollection(empresaId, 'notas').get();
        const notas = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            // Se ordena en memoria para no exigir un índice compuesto en Firestore.
            .sort((a, b) => String(b.actualizadaEn || '').localeCompare(String(a.actualizadaEn || '')));

        return Response.json({ notas });
    } catch (err) {
        return manejarError(err, 'GET');
    }
}

// POST /api/notas  { empresaId, texto }
export async function POST(req) {
    try {
        const body = await req.json();
        const empresaId = resolverEmpresaId(req, body);
        if (!empresaId) return faltaEmpresaId();
        const sesion = await autorizarTenant(req, empresaId);

        const texto = String(body.texto ?? '');
        const ahora = new Date().toISOString();
        const nota = {
            texto,
            autorUid:    sesion.uid,
            autorEmail:  sesion.email || null,
            creadaEn:    ahora,
            actualizadaEn: ahora,
        };
        const ref = await getTenantCollection(empresaId, 'notas').add(nota);
        return Response.json({ id: ref.id, ...nota });
    } catch (err) {
        return manejarError(err, 'POST');
    }
}

// PUT /api/notas  { empresaId, id, texto }
export async function PUT(req) {
    try {
        const body = await req.json();
        const empresaId = resolverEmpresaId(req, body);
        if (!empresaId) return faltaEmpresaId();
        await autorizarTenant(req, empresaId);

        const { id, texto } = body;
        if (!id) return Response.json({ error: 'id requerido' }, { status: 400 });

        const cambios = { texto: String(texto ?? ''), actualizadaEn: new Date().toISOString() };
        await getTenantCollection(empresaId, 'notas').doc(id).update(cambios);
        return Response.json({ id, ...cambios });
    } catch (err) {
        return manejarError(err, 'PUT');
    }
}

// DELETE /api/notas?empresaId=&id=
export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const empresaId = resolverEmpresaId(req);
        if (!empresaId) return faltaEmpresaId();
        await autorizarTenant(req, empresaId);

        const id = searchParams.get('id');
        if (!id) return Response.json({ error: 'id requerido' }, { status: 400 });

        await getTenantCollection(empresaId, 'notas').doc(id).delete();
        return Response.json({ success: true });
    } catch (err) {
        return manejarError(err, 'DELETE');
    }
}
