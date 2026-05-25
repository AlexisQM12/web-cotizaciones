import { firestore, getTenantCollection, getTenantDoc } from '@/lib/firebase-admin';
import { getUpcomingObligations, getDueDate, getCurrentDeclarationPeriod, listAvailablePeriods, formatPeriod } from '@/lib/accounting/taxCalendar';

// GET /api/accounting/calendar?companyProfileId=xxx&monthsAhead=6
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const companyProfileId = searchParams.get('companyProfileId');
        const monthsAhead      = parseInt(searchParams.get('monthsAhead') || '6', 10);
        if (!companyProfileId) return Response.json({ error: 'companyProfileId requerido' }, { status: 400 });

        const configDoc = await getTenantCollection(typeof empresaId !== 'undefined' ? empresaId : '6', 'accounting_config').doc(companyProfileId).get();
        if (!configDoc.exists) return Response.json({ error: 'Sin configuración contable' }, { status: 404 });
        const { ruc, esBuenContribuyente } = configDoc.data();
        if (!ruc) return Response.json({ error: 'RUC no configurado' }, { status: 400 });

        const upcoming = getUpcomingObligations(ruc, new Date(), monthsAhead, !!esBuenContribuyente);
        const currentPeriod = getCurrentDeclarationPeriod();
        const currentPeriodDue = getDueDate(currentPeriod, ruc, !!esBuenContribuyente);

        return Response.json({
            ruc,
            esBuenContribuyente: !!esBuenContribuyente,
            currentDeclarationPeriod: currentPeriod,
            currentPeriodLabel: formatPeriod(currentPeriod),
            currentPeriodDueDate: currentPeriodDue?.toISOString() || null,
            upcoming,
            availablePeriods: listAvailablePeriods(),
        });
    } catch (err) {
        console.error('[accounting/calendar] error:', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}
