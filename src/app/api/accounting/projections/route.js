import { getTenantCollection } from '@/lib/firebase-admin';
import { autorizarTenant, respuestaDeAuthError } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const empresaId = searchParams.get('empresaId');
        await autorizarTenant(req, empresaId);
        if (!empresaId) return Response.json({ error: 'Missing empresaId' }, { status: 400 });

        const query = getTenantCollection(empresaId, 'quotations')
            .where('empresaId', '==', empresaId);

        const snapshot = await query.get();

        const projections = [];
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            
            // Only consider projects (approved or completed or pending invoice)
            const allowedStatuses = ['aprobada', 'completado', 'pendiente_factura'];
            if (!allowedStatuses.includes(data.quotationStatus)) return;

            let total = data.total || 0;
            if (data.items && Array.isArray(data.items) && data.items.length > 0) {
                const subtotal = data.items.reduce((sum, item) => {
                    return sum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0));
                }, 0);
                total = subtotal * 1.18; // Add IGV
            }

            let projectStartDate = data.executionStartDate || null;
            let projectEndDate = data.executionEndDate || null;

            // Fetch dates from tasks
            if (data.operationsData?.tasks && Array.isArray(data.operationsData.tasks) && data.operationsData.tasks.length > 0) {
                const tasksWithDates = data.operationsData.tasks.filter(t => t.startDate && t.endDate);
                if (tasksWithDates.length > 0) {
                    const minMs = Math.min(...tasksWithDates.map(t => new Date(`${t.startDate}T00:00:00`).getTime()));
                    const maxMs = Math.max(...tasksWithDates.map(t => new Date(`${t.endDate}T23:59:59`).getTime()));
                    projectStartDate = new Date(minMs).toISOString().split('T')[0];
                    projectEndDate = new Date(maxMs).toISOString().split('T')[0];
                }
            } else if (data.operationsData?.projectEndDate) {
                projectEndDate = data.operationsData.projectEndDate;
                projectStartDate = data.operationsData.projectStartDate || null;
            }

            // Fallback for invoiced projects without an end date in cronograma
            if (!projectEndDate && (data.isOcInvoiced || data.invoicePdfUrl || data.quotationStatus === 'completado')) {
                const fallbackDate = data.invoiceDate || data.updatedAt || new Date().toISOString();
                projectEndDate = new Date(fallbackDate).toISOString().split('T')[0];
            }

            let projCost = 0;
            if (data.operationsData && Array.isArray(data.operationsData.materials)) {
                projCost = data.operationsData.materials.reduce((acc, m) => acc + (parseFloat(m.cost) || 0), 0);
            }

            projections.push({
                id: doc.id,
                code: data.code,
                clientName: data.clientName,
                projectName: data.projectName || data.serviceDescription || 'Sin Nombre',
                total,
                totalCost: projCost,
                executionEndDate: projectEndDate,
                executionStartDate: projectStartDate,
                isOcInvoiced: data.isOcInvoiced || !!data.invoicePdfUrl || data.quotationStatus === 'completado',
                isExcludedFromProjections: data.isExcludedFromProjections || false,
                status: data.quotationStatus
            });
        });

        return Response.json(projections);
    } catch (error) {
        const authRes = respuestaDeAuthError(error);
        if (authRes) return authRes;
        console.error('Projections API Error:', error);
        return Response.json({ error: 'Failed to load projections' }, { status: 500 });
    }
}
