import { firestore, getTenantCollection, getTenantDoc } from '@/lib/firebase-admin';

export async function POST(req) {
    try {
        const { quotationId, empresaId } = await req.json();

        if (!quotationId) {
            return Response.json({ error: 'Quotation ID is required' }, { status: 400 });
        }

        // Generate professional code: COT-YYYY-NNNN
        const currentYear = new Date().getFullYear();

        // Get all published quotations and filter in memory to avoid composite index
        const snapshot = await getTenantCollection(typeof empresaId !== 'undefined' ? empresaId : '6', 'quotations')
            .where('isPublished', '==', true)
            .get();

        // Filter by year in memory
        const yearStart = new Date(currentYear, 0, 1);
        const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

        const quotationsThisYear = snapshot.docs.filter(doc => {
            // Exclude the current quotation being published
            if (doc.id === quotationId) return false;

            const data = doc.data();
            if (!data.createdAt) return false;
            const createdDate = new Date(data.createdAt);
            return createdDate >= yearStart && createdDate <= yearEnd;
        });

        // Extract code numbers from existing quotations
        const codeNumbers = quotationsThisYear.map(doc => {
            const data = doc.data();
            // Extract number from code like "COT-2026-0002" -> 2
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

        console.log('📊 Code generation:', { codeNumbers, maxCodeNumber, nextNumber, code });

        // Update quotation to published with code
        await getTenantCollection(typeof empresaId !== 'undefined' ? empresaId : '6', 'quotations').doc(quotationId).update({
            code,
            isPublished: true,
            status: 'published',
            updatedAt: new Date().toISOString()
        });

        return Response.json({ success: true, code });
    } catch (error) {
        console.error('Error publishing quotation:', error);
        return Response.json({
            error: 'Failed to publish quotation',
            details: error.message
        }, { status: 500 });
    }
}
