import { firestore } from '@/lib/firebase-admin';

export async function PUT(req, { params }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { name, category, whatsapp, city, email, notes, supplierType } = body;

        const updateData = {
            updatedAt: new Date().toISOString()
        };

        if (name !== undefined) updateData.name = name;
        if (category !== undefined) updateData.category = category;
        if (whatsapp !== undefined) updateData.whatsapp = whatsapp;
        if (city !== undefined) updateData.city = city;
        if (email !== undefined) updateData.email = email;
        if (notes !== undefined) updateData.notes = notes;
        if (supplierType !== undefined) updateData.supplierType = supplierType;

        await firestore.collection('suppliers').doc(id).update(updateData);

        return Response.json({ success: true });
    } catch (error) {
        console.error(error);
        return Response.json({ error: 'Failed to update supplier' }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const { id } = await params;
        await firestore.collection('suppliers').doc(id).delete();
        return Response.json({ success: true });
    } catch (error) {
        console.error(error);
        return Response.json({ error: 'Failed to delete supplier' }, { status: 500 });
    }
}
