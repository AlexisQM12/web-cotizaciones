import { firestore } from '@/lib/firebase-admin';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const empresaId = searchParams.get('empresaId');

        if (!empresaId) {
            return Response.json({ error: 'Falta empresaId' }, { status: 400 });
        }

        const snapshot = await firestore.collection('users')
            .where('empresaId', '==', empresaId)
            .get();

        // Also check tenantId just in case
        const snapshot2 = await firestore.collection('users')
            .where('tenantId', '==', empresaId)
            .get();

        const usersMap = new Map();

        snapshot.docs.forEach(doc => {
            usersMap.set(doc.id, { id: doc.id, ...doc.data() });
        });
        snapshot2.docs.forEach(doc => {
            usersMap.set(doc.id, { id: doc.id, ...doc.data() });
        });

        // Add whitelist users from tenant_users who might not have logged in yet
        const whitelistSnap = await firestore.collection('tenant_users')
            .where('tenantId', '==', empresaId)
            .get();

        const whitelist = [];
        whitelistSnap.docs.forEach(doc => {
            const data = doc.data();
            whitelist.push({
                email: doc.id,
                name: data.name || doc.id,
                role: data.role || 'employee',
                isWhitelist: true
            });
        });

        const activeUsers = Array.from(usersMap.values());

        return Response.json({
            active: activeUsers,
            whitelist: whitelist
        });

    } catch (err) {
        console.error('[users/list] GET error:', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}
