import { firestore, getTenantCollection, getTenantDoc } from '@/lib/firebase-admin';
import { COMPANY_TYPES, TAX_REGIMES, isRegimeAllowed } from '@/lib/accounting/sunatRules';

// GET /api/accounting/config?companyProfileId=xxx
// Si no existe configuración, devuelve null (la UI debe redirigir al wizard).
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        let empresaId = searchParams.get('empresaId') || searchParams.get('companyProfileId');

        // Fallback: si no se especifica, esto fallará en SaaS
        if (!empresaId) {
            return Response.json({
                error: 'No hay empresa seleccionada. Haz el Onboarding o inicia sesión nuevamente.',
                code: 'NO_PROFILES',
            }, { status: 400 });
        }

        const doc = await getTenantCollection((typeof empresaId !== 'undefined' ? empresaId : (typeof companyProfileId !== 'undefined' && companyProfileId ? companyProfileId : 'ayatech')), 'accounting_config').doc(empresaId).get();
        if (!doc.exists) {
            return Response.json({ exists: false, companyProfileId: empresaId });
        }
        return Response.json({ exists: true, companyProfileId: empresaId, ...doc.data() });
    } catch (err) {
        console.error('[accounting/config] GET error:', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}

// PUT /api/accounting/config — crea o actualiza
export async function PUT(req) {
    try {
        const body = await req.json();
        const {
            companyProfileId, empresaId: bodyEmpresaId, companyType, taxRegime, ruc, razonSocial,
            direccionFiscal, fechaInicioActividades, esBuenContribuyente,
            tieneTrabajadores, ingresosAnualesProyectados, coeficienteRenta,
        } = body;

        // Accept either companyProfileId (legacy) or empresaId (SaaS)
        const resolvedId = bodyEmpresaId || companyProfileId;

        if (!resolvedId) {
            return Response.json({ error: 'empresaId requerido' }, { status: 400 });
        }
        if (!COMPANY_TYPES[companyType]) {
            return Response.json({ error: 'Tipo de empresa inválido' }, { status: 400 });
        }
        if (!TAX_REGIMES[taxRegime]) {
            return Response.json({ error: 'Régimen tributario inválido' }, { status: 400 });
        }
        if (!isRegimeAllowed(companyType, taxRegime)) {
            return Response.json({
                error: `El régimen ${taxRegime} no aplica para tipo ${companyType}`,
            }, { status: 400 });
        }
        if (!ruc || !/^\d{11}$/.test(String(ruc))) {
            return Response.json({ error: 'RUC inválido (debe tener 11 dígitos)' }, { status: 400 });
        }

        const data = {
            companyProfileId: resolvedId, companyType, taxRegime,
            ruc: String(ruc), razonSocial: razonSocial || '',
            direccionFiscal: direccionFiscal || '',
            fechaInicioActividades: fechaInicioActividades || null,
            esBuenContribuyente: !!esBuenContribuyente,
            tieneTrabajadores: !!tieneTrabajadores,
            ingresosAnualesProyectados: parseFloat(ingresosAnualesProyectados) || 0,
            coeficienteRenta: parseFloat(coeficienteRenta) || 0.015,
            updatedAt: new Date().toISOString(),
        };

        const ref = getTenantCollection((typeof empresaId !== 'undefined' ? empresaId : (typeof companyProfileId !== 'undefined' && companyProfileId ? companyProfileId : 'ayatech')), 'accounting_config').doc(resolvedId);
        const existing = await ref.get();
        if (!existing.exists) data.createdAt = data.updatedAt;

        await ref.set(data, { merge: true });
        return Response.json({ success: true, ...data });
    } catch (err) {
        console.error('[accounting/config] PUT error:', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}
