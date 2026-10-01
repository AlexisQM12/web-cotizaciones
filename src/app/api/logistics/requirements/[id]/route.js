import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase-admin';

const LISTS_COL  = 'logistics_lists';
const QUOTES_COL = 'logistics_quotes';

// ── GET: detalle de una lista + sus cotizaciones de proveedores ─────────────
export async function GET(req, { params }) {
    try {
        const { id } = await params;
        const snap = await firestore.collection(LISTS_COL).doc(id).get();
        if (!snap.exists) return NextResponse.json({ error: 'Lista no encontrada' }, { status: 404 });

        const quotesSnap = await firestore.collection(QUOTES_COL)
            .where('listId', '==', id).get();
        const quotes = quotesSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));

        return NextResponse.json({ id: snap.id, ...snap.data(), quotes });
    } catch (err) {
        console.error('[logistics/requirements/[id] GET]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
