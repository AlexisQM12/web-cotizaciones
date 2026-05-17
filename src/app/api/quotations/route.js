import { firestore } from '@/lib/firebase-admin';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const empresaId = searchParams.get('empresaId');

        let query = firestore.collection('quotations');
        if (empresaId) {
            query = query.where('empresaId', '==', empresaId);
        }

        const snapshot = await query.get();

        let quotations = snapshot.docs.map(doc => {
            const data = doc.data();

            // Calculate total from items if items exist
            let total = data.total || 0;
            if (data.items && Array.isArray(data.items) && data.items.length > 0) {
                const subtotal = data.items.reduce((sum, item) => {
                    const itemTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0);
                    return sum + itemTotal;
                }, 0);
                // Add IGV (18%) to get the total
                const igv = subtotal * 0.18;
                total = subtotal + igv;
            }

            return {
                id: doc.id,
                ...data,
                total
            };
        });

        // Sort by updatedAt desc
        quotations.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

        return Response.json(quotations);
    } catch (error) {
        console.error('Quotations GET Error:', error);
        return Response.json({ error: 'Failed to get quotations' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const { clientName, empresaId } = await req.json();

        // Fetch default profiles
        const companySnap = await firestore.collection('company_profiles').doc(empresaId).get();
        const clientSnap = await firestore.collection('client_profiles').where('empresaId', '==', empresaId).where('isDefault', '==', true).limit(1).get();

        const defaultCompany = companySnap.exists ? companySnap : null;
        const defaultClient = !clientSnap.empty ? clientSnap.docs[0] : null;

        // Create draft quotation without code
        const newQuote = {
            code: null,  // No code for drafts
            clientName: clientName || 'Nuevo Cliente',
            status: 'draft',
            isPublished: false,  // New field to track draft/published state
            authorId: '1',
            companyProfileId: defaultCompany?.id || null,
            clientProfileId: defaultClient?.id || null,
            empresaId: empresaId || null,
            items: [],
            total: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const docRef = await firestore.collection('quotations').add(newQuote);

        return Response.json({ id: docRef.id, ...newQuote });
    } catch (error) {
        console.error(error);
        return Response.json({ error: 'Failed to create quotation' }, { status: 500 });
    }
}
