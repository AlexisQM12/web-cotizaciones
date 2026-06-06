import { firestore, getTenantCollection, getTenantDoc } from '@/lib/firebase-admin';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const empresaId = searchParams.get('empresaId');

        let query = getTenantCollection(typeof empresaId !== 'undefined' ? empresaId : 'ayatech', 'client_profiles');
        if (empresaId) {
            query = query.where('empresaId', '==', empresaId);
        }

        const snapshot = await query.get();

        let profiles = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Sort: isDefault first, then name
        profiles.sort((a, b) => {
            if (a.isDefault !== b.isDefault) return b.isDefault ? 1 : -1;
            return a.name.localeCompare(b.name);
        });

        return Response.json(profiles);
    } catch (error) {
        console.error('API Error (client-profiles):', error);
        return Response.json({
            error: 'Failed to fetch client profiles',
            details: error.message
        }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { name, ruc, address, isDefault, empresaId } = body;

        const batch = firestore.batch();

        // If this is set as default, unset others for this empresaId
        if (isDefault && empresaId) {
            const defaultQuery = await getTenantCollection(typeof empresaId !== 'undefined' ? empresaId : 'ayatech', 'client_profiles')
                .where('empresaId', '==', empresaId)
                .where('isDefault', '==', true)
                .get();
            defaultQuery.forEach(doc => {
                batch.update(doc.ref, { isDefault: false });
            });
        }

        const newProfileRef = getTenantCollection(typeof empresaId !== 'undefined' ? empresaId : 'ayatech', 'client_profiles').doc();
        batch.set(newProfileRef, {
            name,
            ruc,
            address,
            isDefault,
            empresaId: empresaId || null,
            createdAt: new Date().toISOString()
        });

        await batch.commit();

        return Response.json({ id: newProfileRef.id, name, ruc, address, isDefault });
    } catch (error) {
        console.error(error);
        return Response.json({ error: 'Failed to create client profile' }, { status: 500 });
    }
}
