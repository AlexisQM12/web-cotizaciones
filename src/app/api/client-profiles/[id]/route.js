import { firestore } from '@/lib/firebase-admin';

export async function GET(req, { params }) {
    try {
        const { id } = await params;
        const doc = await firestore.collection('client_profiles').doc(id).get();

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
        const { name, ruc, address, isDefault } = body;

        const batch = firestore.batch();

        // If this is set as default, unset others
        if (isDefault) {
            const defaultQuery = await firestore.collection('client_profiles').where('isDefault', '==', true).get();
            defaultQuery.forEach(doc => {
                if (doc.id !== id) {
                    batch.update(doc.ref, { isDefault: false });
                }
            });
        }

        const docRef = firestore.collection('client_profiles').doc(id);
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
        await firestore.collection('client_profiles').doc(id).delete();
        return Response.json({ success: true });
    } catch (error) {
        console.error(error);
        return Response.json({ error: 'Failed to delete client profile' }, { status: 500 });
    }
}