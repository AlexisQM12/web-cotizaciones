import { firestore, getTenantCollection, getTenantDoc } from '@/lib/firebase-admin';

// GET /api/accounting/daily-summary?companyProfileId=xxx&period=YYYY-MM
// Devuelve los totales de ventas y compras desglosados por día del mes.
// Se usa para graficar la tendencia diaria dentro del periodo activo.
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const companyProfileId = searchParams.get('companyProfileId');
        const period           = searchParams.get('period');

        if (!companyProfileId) return Response.json({ error: 'companyProfileId requerido' }, { status: 400 });
        if (!period || !/^\d{4}-\d{2}$/.test(period)) {
            return Response.json({ error: 'period requerido en formato YYYY-MM' }, { status: 400 });
        }

        const [salesSnap, purchasesSnap] = await Promise.all([
            getTenantCollection(typeof empresaId !== 'undefined' ? empresaId : 'ayatech', 'sales_ledger')
                .where('companyProfileId', '==', companyProfileId)
                .where('period', '==', period).get(),
            getTenantCollection(typeof empresaId !== 'undefined' ? empresaId : 'ayatech', 'purchases_ledger')
                .where('companyProfileId', '==', companyProfileId)
                .where('period', '==', period).get(),
        ]);

        const [yearStr, monthStr] = period.split('-');
        const year  = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);
        const daysInMonth = new Date(year, month, 0).getDate();

        // Prellenamos todos los días del mes con ceros para que la línea sea continua.
        const days = {};
        for (let d = 1; d <= daysInMonth; d++) {
            days[d] = { day: d, salesAmount: 0, purchasesAmount: 0, salesCount: 0, purchasesCount: 0 };
        }

        const dayOf = (iso) => {
            if (!iso) return null;
            const d = new Date(iso);
            if (isNaN(d.getTime())) return null;
            // Si la fecha cae en otro mes (datos inconsistentes), la ignoramos
            if (d.getFullYear() !== year || d.getMonth() + 1 !== month) return null;
            return d.getDate();
        };

        salesSnap.docs.forEach(doc => {
            const data = doc.data();
            if (data.anulado) return;
            const day = dayOf(data.fechaEmision);
            if (!day) return;
            days[day].salesAmount += Number(data.total) || 0;
            days[day].salesCount  += 1;
        });

        purchasesSnap.docs.forEach(doc => {
            const data = doc.data();
            if (data.anulado) return;
            const day = dayOf(data.fechaEmision);
            if (!day) return;
            days[day].purchasesAmount += Number(data.total) || 0;
            days[day].purchasesCount  += 1;
        });

        const list = Object.values(days).map(r => ({
            ...r,
            salesAmount:     Math.round(r.salesAmount     * 100) / 100,
            purchasesAmount: Math.round(r.purchasesAmount * 100) / 100,
        }));

        return Response.json({
            period,
            daysInMonth,
            days: list,
            totals: {
                salesAmount:     list.reduce((s, d) => s + d.salesAmount, 0),
                purchasesAmount: list.reduce((s, d) => s + d.purchasesAmount, 0),
                salesCount:      list.reduce((s, d) => s + d.salesCount, 0),
                purchasesCount:  list.reduce((s, d) => s + d.purchasesCount, 0),
            },
        });
    } catch (err) {
        console.error('[accounting/daily-summary] error:', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}
