import { firestore, getTenantDoc } from '@/lib/firebase-admin';

export async function PUT(req, { params }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { name, sku, category, stock, minStock, unit, cost, empresaId } = body;

        const docRef = getTenantDoc(typeof empresaId !== 'undefined' && empresaId ? empresaId : 'ayatech', 'inventory', id);
        
        const updateData = {
            name,
            sku: sku || '',
            category: category || '',
            stock: Number(stock) || 0,
            minStock: Number(minStock) || 0,
            unit: unit || 'Unidades',
            cost: Number(cost) || 0,
            updatedAt: new Date().toISOString()
        };

        await docRef.update(updateData);

        return Response.json({ id, ...updateData });
    } catch (error) {
        console.error(error);
        return Response.json({ error: 'Failed to update inventory item' }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const { id } = await params;
        
        // Note: For deletion, we need empresaId from URL or request body. 
        // Or we can just search if we assume the user deleting it has the right.
        // It's safer to just get the searchParams or body, but typically we can pass it via URL.
        const { searchParams } = new URL(req.url);
        const empresaId = searchParams.get('empresaId');

        const docRef = getTenantDoc(typeof empresaId !== 'undefined' && empresaId ? empresaId : 'ayatech', 'inventory', id);
        await docRef.delete();

        return Response.json({ success: true });
    } catch (error) {
        console.error(error);
        return Response.json({ error: 'Failed to delete inventory item' }, { status: 500 });
    }
}
