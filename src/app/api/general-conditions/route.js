import { firestore, getTenantCollection, getTenantDoc } from '@/lib/firebase-admin';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const empresaId = searchParams.get('empresaId');
        
        if (!empresaId) {
            return Response.json({ error: 'empresaId is required' }, { status: 400 });
        }

        const docRef = firestore.collection('settings').doc(`general_conditions_${empresaId}`);
        const doc = await docRef.get();

        if (!doc.exists) {
            // Create default
            const defaultData = { text: '', updatedAt: new Date().toISOString() };
            await docRef.set(defaultData);
            return Response.json(defaultData);
        }

        return Response.json(doc.data());
    } catch (error) {
        console.error(error);
        return Response.json({ error: 'Failed to fetch general conditions' }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const { text, empresaId } = await req.json();
        
        if (!empresaId) {
            return Response.json({ error: 'empresaId is required' }, { status: 400 });
        }

        const docRef = firestore.collection('settings').doc(`general_conditions_${empresaId}`);
        const updatedData = {
            text,
            updatedAt: new Date().toISOString()
        };
        await docRef.set(updatedData, { merge: true });
        return Response.json(updatedData);
    } catch (error) {
        console.error(error);
        return Response.json({ error: 'Failed to update general conditions' }, { status: 500 });
    }
}
