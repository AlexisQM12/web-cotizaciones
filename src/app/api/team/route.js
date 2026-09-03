import { firestore, getTenantCollection, getTenantDoc } from '@/lib/firebase-admin';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const empresaId = searchParams.get('empresaId');
        
        let query = getTenantCollection(empresaId, 'team');

        const snapshot = await query.get();
        let team = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        team.sort((a, b) => a.name.localeCompare(b.name));

        return Response.json(team);
    } catch (error) {
        console.error('API Error (team):', error);
        return Response.json(
            { error: 'Failed to fetch team' },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const empresaId = body.empresaId;
        
        const newMemberRef = getTenantCollection(empresaId, 'team').doc();
        
        const memberData = {
            name: body.name || '',
            role: body.role || '',
            whatsapp: body.whatsapp || '',
            address: body.address || '',
            color: body.color || '#3b82f6',
            avatarSeed: body.name || Date.now().toString(),
            createdAt: new Date().toISOString()
        };

        await newMemberRef.set(memberData);

        return Response.json({
            id: newMemberRef.id,
            ...memberData
        });
    } catch (error) {
        console.error('API Error (team POST):', error);
        return Response.json(
            { error: 'Failed to create team member' },
            { status: 500 }
        );
    }
}
