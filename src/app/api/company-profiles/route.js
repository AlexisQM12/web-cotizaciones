import { firestore, storage } from '@/lib/firebase-admin';

export async function GET(req) {
    try {
        const snapshot = await firestore.collection('company_profiles').get();

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
        console.error('API Error (company-profiles):', error);
        return Response.json({
            error: 'Failed to fetch company profiles',
            details: error.message
        }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const formData = await req.formData();
        const name = formData.get('name');
        const address = formData.get('address');
        const email = formData.get('email');
        const phone = formData.get('phone');
        const ruc = formData.get('ruc');
        const website = formData.get('website');
        const isDefault = formData.get('isDefault') === 'true';
        const logoFile = formData.get('logo');
        const accountsJson = formData.get('accounts') || '[]';
        const conditions = formData.get('conditions') || '';

        let accounts = [];
        try {
            accounts = JSON.parse(accountsJson);
        } catch (e) {
            console.error('Failed to parse accounts JSON', e);
        }

        let logoUrl = null;
        if (logoFile && logoFile.size > 0) {
            const buffer = Buffer.from(await logoFile.arrayBuffer());
            const filename = `logos/${Date.now()}-${logoFile.name}`;
            const file = storage.bucket().file(filename);

            await file.save(buffer, {
                metadata: { contentType: logoFile.type },
                public: true
            });

            // Construct the Firebase standard download URL
            const bucket = storage.bucket();
            const encodedPath = encodeURIComponent(filename);
            logoUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;
        }

        const batch = firestore.batch();

        // If this is set as default, unset others
        if (isDefault) {
            const defaultQuery = await firestore.collection('company_profiles').where('isDefault', '==', true).get();
            defaultQuery.forEach(doc => {
                batch.update(doc.ref, { isDefault: false });
            });
        }

        const newProfileRef = firestore.collection('company_profiles').doc();
        batch.set(newProfileRef, {
            name,
            address,
            email,
            phone,
            ruc,
            website,
            logoUrl,
            conditions,
            isDefault,
            accounts,
            createdAt: new Date().toISOString()
        });

        await batch.commit();

        return Response.json({ success: true, id: newProfileRef.id });
    } catch (error) {
        console.error(error);
        return Response.json({ error: 'Failed to create company profile' }, { status: 500 });
    }
}
