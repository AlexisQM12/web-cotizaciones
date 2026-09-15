import { firestore, getTenantCollection, getTenantDoc } from '@/lib/firebase-admin';
import { resolverEmpresaId, faltaEmpresaId } from '@/lib/tenant';

export async function GET(req, { params }) {
    try {
        const { id } = await params;
        const empresaId = resolverEmpresaId(req);
        if (!empresaId) return faltaEmpresaId();
        const doc = await getTenantCollection(empresaId, 'client_profiles').doc(id).get();

        if (!doc.exists) return Response.json({ error: 'Not found' }, { status: 404 });

        return Response.json({ id: doc.id, ...doc.data() });
    } catch (error) {
        console.error(error);
        return Response.json({ error: 'Failed to fetch client profile' }, { status: 500 });
    }
}

export async function PUT(req, { params }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const empresaId = resolverEmpresaId(req, body);
        if (!empresaId) return faltaEmpresaId();
        const { name, ruc, address, isDefault } = body;

        const batch = firestore.batch();

        // If this is set as default, unset others
        if (isDefault) {
            const defaultQuery = await getTenantCollection(empresaId, 'client_profiles').where('isDefault', '==', true).get();
            defaultQuery.forEach(doc => {
                if (doc.id !== id) {
                    batch.update(doc.ref, { isDefault: false });
                }
            });
        }

        const docRef = getTenantCollection(empresaId, 'client_profiles').doc(id);
        batch.update(docRef, {
            name,
            ruc,
            address,
            isDefault,
            updatedAt: new Date().toISOString()
        });

        await batch.commit();

        return Response.json({ id, name, ruc, address, isDefault });
    } catch (error) {
        console.error(error);
        return Response.json({ error: 'Failed to update client profile' }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const { id } = await params;
        const empresaId = resolverEmpresaId(req);
        if (!empresaId) return faltaEmpresaId();
        await getTenantCollection(empresaId, 'client_profiles').doc(id).delete();
        return Response.json({ success: true });
    } catch (error) {
        console.error(error);
        return Response.json({ error: 'Failed to delete client profile' }, { status: 500 });
    }
}