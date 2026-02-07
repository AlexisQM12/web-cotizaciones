import { firestore } from '@/lib/firebase-admin';

export async function GET(req) {
    try {
        const snapshot = await firestore.collection('quotations').get();

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
        return Response.json({
            error: 'Failed to fetch quotations',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const { clientName } = await req.json();

        // Generate professional code: COT-YYYY-NNNN
        const currentYear = new Date().getFullYear();

        // Query quotations from current year
        const yearStart = new Date(currentYear, 0, 1).toISOString();
        const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59).toISOString();

        const snapshot = await firestore.collection('quotations')
            .where('createdAt', '>=', yearStart)
            .where('createdAt', '<=', yearEnd)
            .get();

        // Count quotations in current year
        const countThisYear = snapshot.size;
        const nextNumber = countThisYear + 1;

        // Format: COT-2026-0001
        const code = `COT-${currentYear}-${String(nextNumber).padStart(4, '0')}`;

        const newQuote = {
            code,
            clientName: clientName || 'Nuevo Cliente',
            status: 'draft',
            authorId: '1', // Dummy author id until auth is migrated
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
