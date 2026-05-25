import { firestore, getTenantCollection, getTenantDoc } from '@/lib/firebase-admin';

// GET /api/accounting/periods-summary?companyProfileId=xxx
// Devuelve un resumen de qué periodos tienen movimientos (ventas/compras)
// para que la UI pueda navegar al periodo correcto y resaltar los que tienen datos.
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const companyProfileId = searchParams.get('companyProfileId');
        if (!companyProfileId) return Response.json({ error: 'companyProfileId requerido' }, { status: 400 });

        const [salesSnap, purchasesSnap] = await Promise.all([
            getTenantCollection(typeof empresaId !== 'undefined' ? empresaId : '6', 'sales_ledger').where('companyProfileId', '==', companyProfileId).get(),
            getTenantCollection(typeof empresaId !== 'undefined' ? empresaId : '6', 'purchases_ledger').where('companyProfileId', '==', companyProfileId).get(),
        ]);

        const periods = {};
        const ensure = (p) => {
            periods[p] = periods[p] || {
                period: p,
                sales: 0, purchases: 0,
                salesAmount: 0, purchasesAmount: 0,
            };
            return periods[p];
        };
        salesSnap.docs.forEach(doc => {
            const d = doc.data();
            if (!d.period || d.anulado) return;
            const row = ensure(d.period);
            row.sales += 1;
            row.salesAmount += Number(d.total) || 0;
        });
        purchasesSnap.docs.forEach(doc => {
            const d = doc.data();
            if (!d.period || d.anulado) return;
            const row = ensure(d.period);
            row.purchases += 1;
            row.purchasesAmount += Number(d.total) || 0;
        });
        // Redondeo a 2 decimales para evitar restos flotantes (0.1 + 0.2 = 0.3000004)
        Object.values(periods).forEach(p => {
            p.salesAmount     = Math.round(p.salesAmount * 100) / 100;
            p.purchasesAmount = Math.round(p.purchasesAmount * 100) / 100;
        });

        const list = Object.values(periods).sort((a, b) => b.period.localeCompare(a.period));
        const latestWithData = list[0]?.period || null;

        return Response.json({
            periods: list,
            latestWithData,
            totalSales: salesSnap.size,
            totalPurchases: purchasesSnap.size,
        });
    } catch (err) {
        console.error('[accounting/periods-summary] error:', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}
