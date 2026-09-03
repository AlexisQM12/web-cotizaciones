import { getTenantCollection } from '@/lib/firebase-admin';

export async function POST(req, { params }) {
    try {
        const id = await params.id;
        const { empresaId } = await req.json();

        // Generate professional code: COT-YYYY-NNNN
        const currentYear = new Date().getFullYear();

        // Get all published quotations and filter in memory
        const snapshot = await getTenantCollection(empresaId, 'quotations')
            .where('isPublished', '==', true)
            .get();

        // Filter by year in memory
        const yearStart = new Date(currentYear, 0, 1);
        const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

        const quotationsThisYear = snapshot.docs.filter(doc => {
            // Exclude the current quotation being modified
            if (doc.id === id) return false;

            const data = doc.data();
            if (!data.createdAt) return false;
            const createdDate = new Date(data.createdAt);
            return createdDate >= yearStart && createdDate <= yearEnd;
        });

        // Extract code numbers from existing quotations
        const codeNumbers = quotationsThisYear.map(doc => {
            const data = doc.data();
            if (data.code) {
                const match = data.code.match(/COT-\d{4}-(\d+)/);
                return match ? parseInt(match[1], 10) : 0;
            }
            return 0;
        });

        // Find the highest code number and add 1
        const maxCodeNumber = codeNumbers.length > 0 ? Math.max(...codeNumbers) : 0;
        const nextNumber = maxCodeNumber + 1;
        const code = `COT-${currentYear}-${String(nextNumber).padStart(4, '0')}`;

        console.log('🔄 Manual Code Update:', { codeNumbers, maxCodeNumber, nextNumber, code });

        // Update quotation code
        await getTenantCollection(empresaId, 'quotations').doc(id).update({
            code,
            updatedAt: new Date().toISOString()
        });

        return Response.json({ success: true, code });
    } catch (error) {
        console.error('Error assigning new code:', error);
        return Response.json({
            error: 'Failed to assign new code',
            details: error.message
        }, { status: 500 });
    }
}
