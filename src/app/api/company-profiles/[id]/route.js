import { firestore, storage } from '@/lib/firebase-admin';

export async function GET(req, { params }) {
    try {
        const { id } = await params;
        const doc = await firestore.collection('company_profiles').doc(id).get();

        if (!doc.exists) return Response.json({ error: 'Not found' }, { status: 404 });

        return Response.json({ id: doc.id, ...doc.data() });
    } catch (error) {
        console.error(error);
        return Response.json({ error: 'Failed to fetch company profile' }, { status: 500 });
    }
}

export async function PUT(req, { params }) {
    try {
        const { id } = await params;
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

        let logoUrl = formData.get('existingLogoUrl');
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
                if (doc.id !== id) {
                    batch.update(doc.ref, { isDefault: false });
                }
            });
        }

        const docRef = firestore.collection('company_profiles').doc(id);
        batch.update(docRef, {
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
            updatedAt: new Date().toISOString()
        });

        await batch.commit();

        return Response.json({ success: true });
    } catch (error) {
        console.error(error);
        return Response.json({ error: 'Failed to update company profile' }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const { id } = await params;
        await firestore.collection('company_profiles').doc(id).delete();
        return Response.json({ success: true });
    } catch (error) {
        console.error(error);
        return Response.json({ error: 'Failed to delete company profile' }, { status: 500 });
    }
}
