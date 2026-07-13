import { getTenantCollection } from '@/lib/firebase-admin';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const empresaId = searchParams.get('empresaId') || 'ayatech';
        const amount = parseFloat(searchParams.get('amount') || 0);
        const excludeSourceKey = searchParams.get('excludeSourceKey');

        if (!amount || isNaN(amount)) {
            return Response.json([]);
        }

        // Calcular fecha hace 2 meses
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
        const isoLimit = twoMonthsAgo.toISOString();

        // Buscar en purchases_ledger (donde caen todos los gastos consolidados)
        const snap = await getTenantCollection(empresaId, 'purchases_ledger')
            .where('total', '==', amount)
            .get();

        const duplicates = [];
        
        snap.forEach(doc => {
            const data = doc.data();

            if (excludeSourceKey && data.sourceKey === excludeSourceKey) {
                return; // Excluir el gasto actual si se está editando
            }

            // Filtrar en memoria por fecha (createdAt o fechaEmision)
            const dateStr = data.createdAt || data.fechaEmision;
            if (dateStr && dateStr >= isoLimit) {
                duplicates.push({
                    id: doc.id,
                    total: data.total,
                    date: dateStr,
                    description: data.proveedorName || data.description || 'Gasto Operativo',
                    receiptUrl: data.pdfUrl || data.receiptUrl || null,
                    moneda: data.moneda || 'PEN'
                });
            }
        });

        // Ordenar más recientes primero
        duplicates.sort((a, b) => new Date(b.date) - new Date(a.date));

        return Response.json(duplicates);
    } catch (err) {
        console.error('[check-duplicate] GET error:', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}
