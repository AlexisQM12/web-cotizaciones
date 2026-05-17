import { firestore } from '@/lib/firebase-admin';

// GET /api/accounting/periods-summary?companyProfileId=xxx
// Devuelve un resumen de qué periodos tienen movimientos (ventas/compras)
// para que la UI pueda navegar al periodo correcto y resaltar los que tienen datos.
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const companyProfileId = searchParams.get('companyProfileId');
        if (!companyProfileId) return Response.json({ error: 'companyProfileId requerido' }, { status: 400 });

        const [salesSnap, purchasesSnap] = await Promise.all([
            firestore.collection('sales_ledger').where('companyProfileId', '==', companyProfileId).get(),
            firestore.collection('purchases_ledger').where('companyProfileId', '==', companyProfileId).get(),
        ]);

        const periods = {};
        const bump = (p, key) => {
            if (!p) return;
            periods[p] = periods[p] || { period: p, sales: 0, purchases: 0 };
            periods[p][key] += 1;
        };
        salesSnap.docs.forEach(d => bump(d.data().period, 'sales'));
        purchasesSnap.docs.forEach(d => bump(d.data().period, 'purchases'));

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
