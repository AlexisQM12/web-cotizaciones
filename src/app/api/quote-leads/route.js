import { firestore } from '@/lib/firebase-admin';

// GET /api/quote-leads?status=pending
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || 'pending';

        const snap = await firestore.collection('quote_leads')
            .where('status', '==', status)
            .limit(50)
            .get();

        const leads = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.receivedAt || '').localeCompare(a.receivedAt || ''));
        return Response.json({ leads });
    } catch (err) {
        console.error('[quote-leads] GET error:', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}
