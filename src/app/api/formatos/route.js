import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getTenantCollection } from '@/lib/firebase-admin';
import { autorizarTenant, respuestaDeAuthError } from '@/lib/apiAuth';
import { resolverEmpresaId, faltaEmpresaId } from '@/lib/tenant';
import { guardarHtml, leerHtml, borrarHtml } from '@/lib/formatosStore';
import { PLANTILLAS, TIPOS, plantillaDe, contarHojas, tituloDelHtml } from '@/lib/formatos';

// Formatos: los documentos que la empresa rellena una y otra vez (un ATS por
// trabajo, una ficha por máquina, una carta por practicante). Cada uno nace de
// una plantilla o de otro formato y desde ahí se edita por su cuenta.

function manejarError(err, contexto) {
    const authRes = respuestaDeAuthError(err);
    if (authRes) return authRes;
    console.error(`[formatos] ${contexto}:`, err);
    return Response.json({ error: err.message }, { status: 500 });
}

/** El HTML de una plantilla que viene con la aplicación (carpeta public). */
async function htmlDePlantilla(plantillaId) {
    const plantilla = plantillaDe(plantillaId);
    if (!plantilla) return null;
    const archivo = path.basename(plantilla.archivo);
    return readFile(path.join(process.cwd(), 'public', 'plantillas', archivo), 'utf8');
}

const limpiarNombre = (v) => String(v ?? '').trim().slice(0, 140);
const tipoValido = (v) => (TIPOS[v] ? v : 'libre');

// GET /api/formatos?empresaId=          → lista de formatos de la empresa
export async function GET(req) {
    try {
        const empresaId = resolverEmpresaId(req);
        if (!empresaId) return faltaEmpresaId();
        await autorizarTenant(req, empresaId);

        const snap = await getTenantCollection(empresaId, 'formatos').get();
        const formatos = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            // Se ordena en memoria para no exigir un índice compuesto.
            .sort((a, b) => String(b.actualizadoEn || '').localeCompare(String(a.actualizadoEn || '')));

        return Response.json({ formatos, plantillas: PLANTILLAS });
    } catch (err) {
        return manejarError(err, 'GET');
    }
}

// POST /api/formatos  { empresaId, plantillaId | duplicarDe | html, nombre?, tipo? }
export async function POST(req) {
    try {
        const body = await req.json();
        const empresaId = resolverEmpresaId(req, body);
        if (!empresaId) return faltaEmpresaId();
        const sesion = await autorizarTenant(req, empresaId);

        let html = null;
        let origen = 'importado';
        let plantillaId = null;
        let tipo = body.tipo;

        if (body.plantillaId) {
            const plantilla = plantillaDe(body.plantillaId);
            if (!plantilla) return Response.json({ error: 'Esa plantilla no existe.' }, { status: 400 });
            html = await htmlDePlantilla(body.plantillaId);
            origen = 'plantilla';
            plantillaId = plantilla.id;
            tipo = tipo || plantilla.tipo;
        } else if (body.duplicarDe) {
            const doc = await getTenantCollection(empresaId, 'formatos').doc(String(body.duplicarDe)).get();
            if (!doc.exists) return Response.json({ error: 'El formato que quieres duplicar ya no existe.' }, { status: 404 });
            html = await leerHtml(empresaId, doc.id);
            if (html == null) return Response.json({ error: 'Ese formato no tiene documento guardado.' }, { status: 409 });
            origen = 'duplicado';
            plantillaId = doc.data().plantillaId || null;
            tipo = tipo || doc.data().tipo;
        } else if (typeof body.html === 'string' && body.html.trim()) {
            html = body.html;
        } else {
            return Response.json({ error: 'Elige una plantilla, duplica un formato o sube un HTML.' }, { status: 400 });
        }

        const ahora = new Date().toISOString();
        const ref = getTenantCollection(empresaId, 'formatos').doc();
        await guardarHtml(empresaId, ref.id, html);

        const ficha = {
            nombre: limpiarNombre(body.nombre) || tituloDelHtml(html) || 'Formato sin nombre',
            tipo: tipoValido(tipo),
            origen,
            plantillaId,
            hojas: contarHojas(html),
            bytes: Buffer.byteLength(html, 'utf8'),
            notas: limpiarNombre(body.notas),
            creadoPor: sesion.uid,
            creadoPorEmail: sesion.email || null,
            creadoEn: ahora,
            actualizadoEn: ahora,
            actualizadoPorEmail: sesion.email || null,
        };
        await ref.set(ficha);

        return Response.json({ id: ref.id, ...ficha });
    } catch (err) {
        return manejarError(err, 'POST');
    }
}

// PUT /api/formatos  { empresaId, id, nombre?, tipo?, notas? }  → solo la ficha
export async function PUT(req) {
    try {
        const body = await req.json();
        const empresaId = resolverEmpresaId(req, body);
        if (!empresaId) return faltaEmpresaId();
        const sesion = await autorizarTenant(req, empresaId);

        const { id } = body;
        if (!id) return Response.json({ error: 'id requerido' }, { status: 400 });

        const cambios = { actualizadoEn: new Date().toISOString(), actualizadoPorEmail: sesion.email || null };
        if (body.nombre !== undefined) cambios.nombre = limpiarNombre(body.nombre) || 'Formato sin nombre';
        if (body.tipo !== undefined) cambios.tipo = tipoValido(body.tipo);
        if (body.notas !== undefined) cambios.notas = limpiarNombre(body.notas);

        await getTenantCollection(empresaId, 'formatos').doc(String(id)).update(cambios);
        return Response.json({ id, ...cambios });
    } catch (err) {
        return manejarError(err, 'PUT');
    }
}

// DELETE /api/formatos?empresaId=&id=
export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const empresaId = resolverEmpresaId(req);
        if (!empresaId) return faltaEmpresaId();
        await autorizarTenant(req, empresaId);

        const id = searchParams.get('id');
        if (!id) return Response.json({ error: 'id requerido' }, { status: 400 });

        await getTenantCollection(empresaId, 'formatos').doc(id).delete();
        // El HTML se borra después: si fallara, quedaría un archivo huérfano en
        // Storage, pero el formato ya no aparece y nadie se queda sin borrar.
        try {
            await borrarHtml(empresaId, id);
        } catch (e) {
            console.warn('[formatos] no se pudo borrar el HTML:', e.message);
        }

        return Response.json({ success: true });
    } catch (err) {
        return manejarError(err, 'DELETE');
    }
}
