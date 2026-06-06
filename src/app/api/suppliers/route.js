import { firestore, getTenantCollection, getTenantDoc } from '@/lib/firebase-admin';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const empresaId = searchParams.get('empresaId');

        let query = getTenantCollection(typeof empresaId !== 'undefined' ? empresaId : 'ayatech', 'suppliers');
        if (empresaId) {
            query = query.where('empresaId', '==', empresaId);
        }

        const snapshot = await query.get();

        let suppliers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        suppliers.sort((a, b) => a.name.localeCompare(b.name));

        return Response.json(suppliers);
    } catch (error) {
        console.error('API Error (suppliers):', error);
        return Response.json({
            error: 'Failed to fetch suppliers',
            details: error.message
        }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { name, category, whatsapp, city, email, notes, empresaId, supplierType } = body;

        const newSupplierRef = getTenantCollection(typeof empresaId !== 'undefined' ? empresaId : 'ayatech', 'suppliers').doc();
        const supplierData = {
            name,
            category: category || '',
            whatsapp: whatsapp || '',
            city: city || '',
            email: email || '',
            notes: notes || '',
            supplierType: supplierType || 'productos',
            empresaId: empresaId || null,
            createdAt: new Date().toISOString()
        };

        await newSupplierRef.set(supplierData);

        return Response.json({ id: newSupplierRef.id, ...supplierData });
    } catch (error) {
        console.error(error);
        return Response.json({ error: 'Failed to create supplier' }, { status: 500 });
    }
}
