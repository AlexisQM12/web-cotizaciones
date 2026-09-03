import { firestore, getTenantCollection, getTenantDoc } from '@/lib/firebase-admin';
import { buildSire141, buildSire81 } from '@/lib/accounting/sireExporter';

// GET /api/accounting/sire-export?companyProfileId=xxx&period=YYYY-MM&libro=14.1|8.1
// Devuelve el archivo plano como texto descargable.
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const companyProfileId = searchParams.get('companyProfileId');
        const period           = searchParams.get('period');
        const libro            = searchParams.get('libro');
        if (!companyProfileId || !period || !libro) {
            return Response.json({ error: 'companyProfileId, period y libro requeridos' }, { status: 400 });
        }

        const configDoc = await getTenantCollection((empresaId), 'accounting_config').doc(companyProfileId).get();
        if (!configDoc.exists) {
            return Response.json({ error: 'Configuración no encontrada' }, { status: 404 });
        }
        const { ruc } = configDoc.data();
        if (!ruc) return Response.json({ error: 'RUC no configurado' }, { status: 400 });

        let payload;
        if (libro === '14.1') {
            const snap = await getTenantCollection((empresaId), 'sales_ledger')
                .where('companyProfileId', '==', companyProfileId).where('period', '==', period).get();
            const sales = snap.docs.map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => new Date(a.fechaEmision) - new Date(b.fechaEmision));
            payload = buildSire141({ ruc, period, sales });
        } else if (libro === '8.1') {
            const snap = await getTenantCollection((empresaId), 'purchases_ledger')
                .where('companyProfileId', '==', companyProfileId).where('period', '==', period).get();
            const purchases = snap.docs.map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => new Date(a.fechaEmision) - new Date(b.fechaEmision));
            payload = buildSire81({ ruc, period, purchases });
        } else {
            return Response.json({ error: 'Libro no soportado' }, { status: 400 });
        }

        return new Response(payload.content, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Content-Disposition': `attachment; filename="${payload.filename}"`,
                'X-Row-Count': String(payload.rowCount),
            },
        });
    } catch (err) {
        console.error('[accounting/sire-export] error:', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}
