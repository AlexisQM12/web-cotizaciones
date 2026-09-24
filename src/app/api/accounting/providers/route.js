import { firestore, getTenantCollection, getTenantDoc } from '@/lib/firebase-admin';
import { verificarSesion, respuestaDeAuthError } from '@/lib/apiAuth';

// GET /api/accounting/providers — directorio de proveedores
export async function GET(req) {
    try {
        await verificarSesion(req);
        const snap = await firestore.collection('accounting_providers').get();
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        items.sort((a, b) => (a.razonSocial || '').localeCompare(b.razonSocial || ''));
        return Response.json(items);
    } catch (err) {
        const authRes = respuestaDeAuthError(err);
        if (authRes) return authRes;
        console.error('[accounting/providers] GET error:', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}

// POST — crear/actualizar proveedor
export async function POST(req) {
    try {
        await verificarSesion(req);
        const body = await req.json();
        const { tipoDoc, numeroDoc, razonSocial, direccion, email, telefono } = body;
        if (!numeroDoc) return Response.json({ error: 'numeroDoc requerido' }, { status: 400 });

        const data = {
            tipoDoc: tipoDoc || '6',
            numeroDoc,
            razonSocial: razonSocial || '',
            direccion: direccion || '',
            email: email || '',
            telefono: telefono || '',
            updatedAt: new Date().toISOString(),
        };
        await firestore.collection('accounting_providers').doc(numeroDoc).set(data, { merge: true });
        return Response.json({ id: numeroDoc, ...data });
    } catch (err) {
        const authRes = respuestaDeAuthError(err);
        if (authRes) return authRes;
        console.error('[accounting/providers] POST error:', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}
