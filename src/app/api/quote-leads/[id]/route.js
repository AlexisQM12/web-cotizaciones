import { firestore } from '@/lib/firebase-admin';

// PATCH /api/quote-leads/[id]  { status: 'dismissed' | 'converted' }
export async function PATCH(req, { params }) {
    try {
        const { id } = params;
        const { status } = await req.json();

        if (!['dismissed', 'converted', 'pending'].includes(status)) {
            return Response.json({ error: 'status inválido' }, { status: 400 });
        }

        await firestore.collection('quote_leads').doc(id).update({
            status,
            updatedAt: new Date().toISOString(),
        });

        return Response.json({ ok: true });
    } catch (err) {
        console.error('[quote-leads] PATCH error:', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}
