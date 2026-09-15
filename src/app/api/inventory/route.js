import { getTenantCollection } from '@/lib/firebase-admin';
import { getInventoryConfig } from '@/lib/cgoConfig.server';
import { sanitizeAttributes } from '@/lib/inventoryPayload';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const empresaId = searchParams.get('empresaId');

        if (!empresaId) {
            return Response.json({ error: 'empresaId es obligatorio' }, { status: 400 });
        }

        const snapshot = await getTenantCollection(empresaId, 'inventory').get();

        const inventoryItems = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

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
        const { name, sku, category, stock, minStock, unit, cost, imageUrl, attributes, empresaId } = body;

        if (!empresaId) {
            return Response.json({ error: 'empresaId es obligatorio' }, { status: 400 });
        }

        const config = await getInventoryConfig(empresaId);

        const newItemRef = getTenantCollection(empresaId, 'inventory').doc();
        const itemData = {
            name,
            sku: sku || '',
            category: category || '',
            stock: Number(stock) || 0,
            minStock: Number(minStock) || 0,
            unit: unit || config.unitOptions[0] || 'Unidades',
            cost: Number(cost) || 0,
            imageUrl: imageUrl || '',
            attributes: sanitizeAttributes(attributes, config),
            empresaId,
            createdAt: new Date().toISOString()
        };

        await newItemRef.set(itemData);

        return Response.json({ id: newItemRef.id, ...itemData });
    } catch (error) {
        console.error('API Error (inventory POST):', error);
        return Response.json({ error: 'Failed to create inventory item' }, { status: 500 });
    }
}
