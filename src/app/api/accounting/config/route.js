import { firestore, getTenantCollection, getTenantDoc } from '@/lib/firebase-admin';
import { COMPANY_TYPES, TAX_REGIMES, isRegimeAllowed } from '@/lib/accounting/sunatRules';
import { autorizarTenant, respuestaDeAuthError } from '@/lib/apiAuth';

// Campos que NUNCA se devuelven al navegador: son las credenciales SOL del
// contribuyente. Sólo el servidor las lee, para hablar con SUNAT.
const CAMPOS_SECRETOS = ['clientId', 'clientSecret', 'solUser', 'solPass'];

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

        await autorizarTenant(req, empresaId);

        const doc = await getTenantCollection(empresaId, 'accounting_config').doc(empresaId).get();
        if (!doc.exists) {
            return Response.json({ exists: false, companyProfileId: empresaId });
        }

        // Antes esto hacía spread del documento completo, así que cualquiera que
        // acertara el empresaId se llevaba la clave SOL y el client_secret.
        const datos = doc.data();
        const publico = { ...datos };
        for (const campo of CAMPOS_SECRETOS) delete publico[campo];

        return Response.json({
            exists: true,
            companyProfileId: empresaId,
            ...publico,
            // La UI sólo necesita saber si ya están configuradas, no su valor.
            tieneCredencialesSunat: CAMPOS_SECRETOS.every(c => !!datos[c]),
        });
    } catch (err) {
        const authRes = respuestaDeAuthError(err);
        if (authRes) return authRes;
        console.error('[accounting/config] GET error:', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}

// PUT /api/accounting/config — crea o actualiza
export async function PUT(req) {
    try {
        const body = await req.json();        const empresaId = body.empresaId || new URL(req.url).searchParams.get('empresaId');

        const {
            companyProfileId, empresaId: bodyEmpresaId, companyType, taxRegime, ruc, razonSocial,
            direccionFiscal, fechaInicioActividades, esBuenContribuyente,
            tieneTrabajadores, ingresosAnualesProyectados, coeficienteRenta,
            clientId, clientSecret, solUser, solPass
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

        await autorizarTenant(req, resolvedId);

        const ref = getTenantCollection(resolvedId, 'accounting_config').doc(resolvedId);
        const existing = await ref.get();
        const previo = existing.exists ? existing.data() : {};

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

        // El GET ya no devuelve las credenciales, así que el formulario las envía
        // vacías. Sólo se reemplazan cuando el usuario escribe una nueva: de otro
        // modo, guardar cualquier otro campo las borraría.
        for (const [campo, valor] of Object.entries({ clientId, clientSecret, solUser, solPass })) {
            const nuevo = typeof valor === 'string' ? valor.trim() : valor;
            if (nuevo) data[campo] = nuevo;
            else if (previo[campo] !== undefined) data[campo] = previo[campo];
            else data[campo] = '';
        }

        if (!existing.exists) data.createdAt = data.updatedAt;

        await ref.set(data, { merge: true });

        const publico = { ...data };
        for (const campo of CAMPOS_SECRETOS) delete publico[campo];
        return Response.json({
            success: true,
            ...publico,
            tieneCredencialesSunat: CAMPOS_SECRETOS.every(c => !!data[c]),
        });
    } catch (err) {
        const authRes = respuestaDeAuthError(err);
        if (authRes) return authRes;
        console.error('[accounting/config] PUT error:', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}
