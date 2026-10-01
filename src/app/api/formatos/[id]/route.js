import { getTenantCollection } from '@/lib/firebase-admin';
import { autorizarTenant, respuestaDeAuthError } from '@/lib/apiAuth';
import { resolverEmpresaId, faltaEmpresaId } from '@/lib/tenant';
import { guardarHtml, leerHtml } from '@/lib/formatosStore';
import { contarHojas } from '@/lib/formatos';

// El documento en sí (el HTML). Va aparte de la ficha porque puede pesar
// megas: la lista de formatos no tiene por qué arrastrarlos.

function manejarError(err, contexto) {
    const authRes = respuestaDeAuthError(err);
    if (authRes) return authRes;
    console.error(`[formatos/:id] ${contexto}:`, err);
    return Response.json({ error: err.message }, { status: 500 });
}

// GET /api/formatos/{id}?empresaId=     → { formato, html }
export async function GET(req, { params }) {
    try {
        const { id } = await params;
        const empresaId = resolverEmpresaId(req);
        if (!empresaId) return faltaEmpresaId();
        await autorizarTenant(req, empresaId);

        const doc = await getTenantCollection(empresaId, 'formatos').doc(id).get();
        if (!doc.exists) return Response.json({ error: 'Ese formato no existe.' }, { status: 404 });

        const html = await leerHtml(empresaId, id);
        if (html == null) return Response.json({ error: 'El formato no tiene documento guardado.' }, { status: 409 });

        return Response.json({ formato: { id: doc.id, ...doc.data() }, html });
    } catch (err) {
        return manejarError(err, 'GET');
    }
}

// PUT /api/formatos/{id}   { empresaId, html }   → guarda el documento editado
export async function PUT(req, { params }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const empresaId = resolverEmpresaId(req, body);
        if (!empresaId) return faltaEmpresaId();
        const sesion = await autorizarTenant(req, empresaId);

        const html = body.html;
        if (typeof html !== 'string' || !html.trim()) {
            return Response.json({ error: 'No llegó el documento.' }, { status: 400 });
        }

        const ref = getTenantCollection(empresaId, 'formatos').doc(id);
        const doc = await ref.get();
        if (!doc.exists) return Response.json({ error: 'Ese formato no existe.' }, { status: 404 });

        await guardarHtml(empresaId, id, html);

        const cambios = {
            hojas: contarHojas(html),
            bytes: Buffer.byteLength(html, 'utf8'),
            actualizadoEn: new Date().toISOString(),
            actualizadoPorEmail: sesion.email || null,
        };
        await ref.update(cambios);

        return Response.json({ id, ...cambios });
    } catch (err) {
        return manejarError(err, 'PUT');
    }
}
