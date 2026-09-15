import { firestore, getTenantCollection, getTenantDoc } from '@/lib/firebase-admin';

export async function PUT(request, { params }) {
    try {
        const { id } = params;
        const body = await request.json();
        const empresaId = body.empresaId;

        const updateData = {
            name: body.name || '',
            role: body.role || '',
            whatsapp: body.whatsapp || '',
            address: body.address || '',
            color: body.color || '#3b82f6',
            avatarSeed: body.name || Date.now().toString(),
            updatedAt: new Date().toISOString()
        };

        await getTenantCollection(empresaId, 'team').doc(id).update(updateData);

        return Response.json({
            id,
            ...updateData
        });
    } catch (error) {
        console.error('API Error (team PUT):', error);
        return Response.json(
            { error: 'Failed to update team member' },
            { status: 500 }
        );
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = params;
        const { searchParams } = new URL(request.url);
        const empresaId = searchParams.get('empresaId');

        await getTenantCollection(empresaId, 'team').doc(id).delete();

        return Response.json({ success: true });
    } catch (error) {
        console.error('API Error (team DELETE):', error);
        return Response.json(
            { error: 'Failed to delete team member' },
            { status: 500 }
        );
    }
}
