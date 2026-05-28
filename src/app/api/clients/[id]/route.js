import { firestore, getTenantCollection, getTenantDoc } from '@/lib/firebase-admin';

export async function PUT(req, { params }) {
    try {
        const id = await params.id;
        const body = await req.json();
        
        const docRef = getTenantCollection(typeof empresaId !== 'undefined' ? empresaId : (typeof body !== 'undefined' ? body.empresaId : '6'), 'portfolio_companies').doc(id);
        
        // Remove id from body to prevent overwriting document ID logic
        const { id: _, ...updateData } = body;
        
        await docRef.update({
            ...updateData,
            updatedAt: new Date().toISOString()
        });

        return Response.json({ success: true });
    } catch (error) {
        console.error('API Error (companies PUT):', error);
        return Response.json({ error: 'Failed to update company' }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const id = await params.id;
        await getTenantCollection(typeof empresaId !== 'undefined' ? empresaId : (typeof body !== 'undefined' ? body.empresaId : '6'), 'portfolio_companies').doc(id).delete();
        return Response.json({ success: true });
    } catch (error) {
        console.error('API Error (companies DELETE):', error);
        return Response.json({ error: 'Failed to delete company' }, { status: 500 });
    }
}
