import { firestore, getTenantCollection, getTenantDoc } from '@/lib/firebase-admin';
import { faltaEmpresaId } from '@/lib/tenant';

// PATCH /api/quote-leads/[id]  { status: 'dismissed' | 'converted' }
export async function PATCH(req, { params }) {
    try {
        const { id } = params;
        const { status } = await req.json();

        if (!['dismissed', 'converted', 'pending'].includes(status)) {
            return Response.json({ error: 'status inválido' }, { status: 400 });
        }

        const { searchParams } = new URL(req.url);
        const empresaId = searchParams.get('empresaId');
        if (!empresaId) return faltaEmpresaId();

        await getTenantCollection(empresaId, 'quote_leads').doc(id).update({
            status,
            updatedAt: new Date().toISOString(),
        });

        return Response.json({ ok: true });
    } catch (err) {
        console.error('[quote-leads] PATCH error:', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}
