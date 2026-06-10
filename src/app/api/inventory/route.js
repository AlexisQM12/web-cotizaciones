import { firestore, getTenantCollection, getTenantDoc } from '@/lib/firebase-admin';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const empresaId = searchParams.get('empresaId');

        let query = getTenantCollection(typeof empresaId !== 'undefined' && empresaId ? empresaId : 'ayatech', 'inventory');
        if (empresaId) {
            query = query.where('empresaId', '==', empresaId);
        }

        const snapshot = await query.get();

        let inventoryItems = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        inventoryItems.sort((a, b) => a.name.localeCompare(b.name));

        return Response.json(inventoryItems);
    } catch (error) {
        console.error('API Error (inventory):', error);
        return Response.json({
            error: 'Failed to fetch inventory',
            details: error.message
        }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { name, sku, category, stock, minStock, unit, cost, empresaId } = body;

        const newItemRef = getTenantCollection(typeof empresaId !== 'undefined' && empresaId ? empresaId : 'ayatech', 'inventory').doc();
        const itemData = {
            name,
            sku: sku || '',
            category: category || '',
            stock: Number(stock) || 0,
            minStock: Number(minStock) || 0,
            unit: unit || 'Unidades',
            cost: Number(cost) || 0,
            empresaId: empresaId || null,
            createdAt: new Date().toISOString()
        };

        await newItemRef.set(itemData);

        return Response.json({ id: newItemRef.id, ...itemData });
    } catch (error) {
        console.error(error);
        return Response.json({ error: 'Failed to create inventory item' }, { status: 500 });
    }
}
