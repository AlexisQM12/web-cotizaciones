import { getTenantCollection } from '@/lib/firebase-admin';
import { getInventoryConfig } from '@/lib/cgoConfig.server';
import { sanitizeAttributes } from '@/lib/inventoryPayload';

// Referencia al ítem de inventario del tenant.
// OJO: antes se usaba getTenantDoc(empresaId, 'inventory', id), pero getTenantDoc
// sólo acepta empresaId y devuelve el DOC DEL TENANT — así que un update escribía
// sobre el perfil de la empresa y un delete borraba la empresa entera.
function itemRef(empresaId, id) {
    return getTenantCollection(empresaId, 'inventory').doc(id);
}

export async function PUT(req, { params }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { name, sku, category, stock, minStock, unit, cost, imageUrl, attributes, empresaId } = body;

        if (!empresaId) {
            return Response.json({ error: 'empresaId es obligatorio' }, { status: 400 });
        }

        const config = await getInventoryConfig(empresaId);

        const updateData = {
            name,
            sku: sku || '',
            category: category || '',
            stock: Number(stock) || 0,
            minStock: Number(minStock) || 0,
            unit: unit || config.unitOptions[0] || 'Unidades',
            cost: Number(cost) || 0,
            attributes: sanitizeAttributes(attributes, config),
            updatedAt: new Date().toISOString()
        };
        if (imageUrl !== undefined) updateData.imageUrl = imageUrl || '';

        await itemRef(empresaId, id).update(updateData);

        return Response.json({ id, ...updateData });
    } catch (error) {
        console.error('API Error (inventory PUT):', error);
        return Response.json({ error: 'Failed to update inventory item' }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const empresaId = searchParams.get('empresaId');

        if (!empresaId) {
            return Response.json({ error: 'empresaId es obligatorio' }, { status: 400 });
        }

        await itemRef(empresaId, id).delete();

        return Response.json({ success: true });
    } catch (error) {
        console.error('API Error (inventory DELETE):', error);
        return Response.json({ error: 'Failed to delete inventory item' }, { status: 500 });
    }
}
