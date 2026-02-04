import { firestore } from '@/lib/firebase-admin';

export async function GET(req, { params }) {
    try {
        const { id } = await params;

        // Fetch everything in parallel without server-side sorting
        const [quoteDoc, companySnap, clientSnap, settingsSnap] = await Promise.all([
            firestore.collection('quotations').doc(id).get(),
            firestore.collection('company_profiles').get(),
            firestore.collection('client_profiles').get(),
            firestore.collection('settings').doc('general_conditions').get()
        ]);

        if (!quoteDoc.exists) return Response.json({ error: 'Not found' }, { status: 404 });

        const quotation = { id: quoteDoc.id, ...quoteDoc.data() };

        // Sort Company Profiles in JS
        const companyProfiles = companySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        companyProfiles.sort((a, b) => {
            if (a.isDefault !== b.isDefault) return b.isDefault ? 1 : -1;
            return (a.name || '').localeCompare(b.name || '');
        });

        // Sort Client Profiles in JS
        const clientProfiles = clientSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        clientProfiles.sort((a, b) => {
            if (a.isDefault !== b.isDefault) return b.isDefault ? 1 : -1;
            return (a.name || '').localeCompare(b.name || '');
        });

        // Determine general conditions from the quotation's selected company
        let conditionsText = '';
        const selectedCompanyId = quotation.companyProfileId || companyProfiles.find(cp => cp.isDefault)?.id;
        const selectedCompany = companyProfiles.find(cp => cp.id === selectedCompanyId?.toString());

        if (selectedCompany && selectedCompany.conditions) {
            conditionsText = selectedCompany.conditions;
        } else if (settingsSnap.exists) {
            conditionsText = settingsSnap.data().text || '';
        }

        const generalConditions = { text: conditionsText };

        return Response.json({
            ...quotation,
            companyProfiles,
            clientProfiles,
            generalConditions
        });
    } catch (error) {
        console.error('API Error (quotation-detail):', error);
        return Response.json({
            error: 'Failed to fetch quotation',
            details: error.message
        }, { status: 500 });
    }
}

export async function PUT(req, { params }) {
    try {
        const { id } = await params;
        const body = await req.json();

        // In Firestore, we store everything in the same document
        const updateData = {
            ...body,
            updatedAt: new Date().toISOString()
        };

        // Ensure total is calculated if not provided
        if (body.items) {
            updateData.total = body.items.reduce((acc, item) => acc + (parseFloat(item.quantity || 0) * parseFloat(item.price || 0)), 0);
        }

        await firestore.collection('quotations').doc(id).update(updateData);

        return Response.json({ success: true });
    } catch (error) {
        console.error(error);
        return Response.json({ error: 'Failed to update quotation' }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const { id } = await params;
        await firestore.collection('quotations').doc(id).delete();
        return Response.json({ success: true });
    } catch (error) {
        console.error(error);
        return Response.json({ error: 'Failed to delete quotation' }, { status: 500 });
    }
}
