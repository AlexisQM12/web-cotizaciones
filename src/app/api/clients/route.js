import { firestore, getTenantCollection, getTenantDoc } from '@/lib/firebase-admin';
import { resolverEmpresaId, faltaEmpresaId } from '@/lib/tenant';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const empresaId = searchParams.get('empresaId');
        if (!empresaId) return faltaEmpresaId();

        // El filtro por empresaId es redundante (la colección ya es del tenant),
        // pero se conserva porque hay documentos antiguos migrados que lo traen.
        const query = getTenantCollection(empresaId, 'portfolio_companies')
            .where('empresaId', '==', empresaId);

        const snapshot = await query.get();

        let companies = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        companies.sort((a, b) => {
            const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
            const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
            return timeB - timeA; // Most recently modified first
        });

        return Response.json(companies);
    } catch (error) {
        console.error('API Error (companies GET):', error);
        return Response.json({ error: 'Failed to fetch companies' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { empresaId, companyName, razonSocial, ruc, address } = body;

        if (!empresaId || !companyName) {
            return Response.json({ error: 'empresaId and companyName are required' }, { status: 400 });
        }

        const newCompanyRef = getTenantCollection(empresaId, 'portfolio_companies').doc();
        await newCompanyRef.set({
            empresaId,
            companyName: companyName || '',
            razonSocial: razonSocial || '',
            ruc: ruc || '',
            address: address || '',
            contacts: [], // Initialize empty contacts array
            createdAt: new Date().toISOString()
        });

        return Response.json({ 
            id: newCompanyRef.id, 
            companyName, 
            razonSocial, 
            ruc, 
            address, 
            contacts: [] 
        });
    } catch (error) {
        console.error('API Error (companies POST):', error);
        return Response.json({ error: 'Failed to create company' }, { status: 500 });
    }
}
