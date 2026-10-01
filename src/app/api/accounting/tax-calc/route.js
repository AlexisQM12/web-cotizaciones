import { firestore, getTenantCollection, getTenantDoc } from '@/lib/firebase-admin';
import { autorizarTenant, respuestaDeAuthError } from '@/lib/apiAuth';
import { calculateMonthlyTaxes } from '@/lib/accounting/taxCalculator';
import { buildSalesEntry, buildPurchaseEntry, buildLibroDiario, buildLibroMayor, resetEntryNumber } from '@/lib/accounting/journalGenerator';

// GET /api/accounting/tax-calc?companyProfileId=xxx&period=YYYY-MM
// Calcula impuestos del mes y devuelve también asientos contables y libros derivados.
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);        const empresaId = searchParams.get('empresaId');

        const companyProfileId = searchParams.get('companyProfileId');
        await autorizarTenant(req, empresaId || companyProfileId);
        const period           = searchParams.get('period');
        if (!companyProfileId || !period) {
            return Response.json({ error: 'companyProfileId y period requeridos' }, { status: 400 });
        }

        // 1) Cargar configuración
        const configDoc = await getTenantCollection(empresaId, 'accounting_config').doc(companyProfileId).get();
        if (!configDoc.exists) {
            return Response.json({ error: 'Configuración contable no encontrada. Completa el setup.' }, { status: 404 });
        }
        const config = configDoc.data();

        // 2) Cargar ventas y compras del periodo
        const [salesSnap, purchasesSnap] = await Promise.all([
            getTenantCollection(empresaId, 'sales_ledger')
                .where('companyProfileId', '==', companyProfileId).where('period', '==', period).get(),
            getTenantCollection(empresaId, 'purchases_ledger')
                .where('companyProfileId', '==', companyProfileId).where('period', '==', period).get(),
        ]);
        const sales     = salesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const purchases = purchasesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // 3) Calcular ingresos acumulados del año (para tasa RMT 1% vs 1.5%)
        const year = period.split('-')[0];
        const yearSnap = await getTenantCollection(empresaId, 'sales_ledger')
            .where('companyProfileId', '==', companyProfileId).get();
        const ingresosAnualesAcumulados = yearSnap.docs
            .filter(d => (d.data().period || '').startsWith(year))
            .reduce((s, d) => s + (parseFloat(d.data().baseImponible) || 0), 0);

        // 4) Calcular impuestos
        const result = calculateMonthlyTaxes({
            regimeCode: config.taxRegime,
            period,
            sales, purchases,
            opciones: {
                ingresosAnualesAcumulados,
                coeficienteRenta: config.coeficienteRenta,
            },
        });

        // 5) Generar asientos contables
        resetEntryNumber(1);
        const salesEntries     = sales.map(buildSalesEntry);
        const purchasesEntries = purchases.map(buildPurchaseEntry);
        const allEntries       = [...salesEntries, ...purchasesEntries];
        const diario = buildLibroDiario(allEntries);
        const mayor  = buildLibroMayor(allEntries);

        return Response.json({
            config: {
                companyType: config.companyType,
                taxRegime:   config.taxRegime,
                ruc:         config.ruc,
                razonSocial: config.razonSocial,
                esBuenContribuyente: !!config.esBuenContribuyente,
            },
            calc: result,
            counts: {
                sales: sales.length,
                purchases: purchases.length,
                journalEntries: allEntries.length,
            },
            journal: { diario, mayor },
        });
    } catch (err) {
        const authRes = respuestaDeAuthError(err);
        if (authRes) return authRes;
        console.error('[accounting/tax-calc] error:', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}
