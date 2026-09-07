import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase-admin';

const QUOTES_COL = 'logistics_quotes';

// ── PATCH: corrección manual de precios / cumplimiento / notas ──────────────
export async function PATCH(req, { params }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const ref  = firestore.collection(QUOTES_COL).doc(id);
        const snap = await ref.get();
        if (!snap.exists) return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });

        const update = { updatedAt: new Date().toISOString() };
        if (typeof body.providerName === 'string') update.providerName = body.providerName.trim();
        if (typeof body.notes === 'string')        update.notes = body.notes;
        if (typeof body.quoteNumber === 'string')  update.quoteNumber = body.quoteNumber.trim().toUpperCase() || null;
        if (typeof body.currency === 'string')     update.currency = body.currency;

        // items: merge por clave (n del requerimiento). null elimina la entrada.
        if (body.items && typeof body.items === 'object') {
            const current = snap.data().items || {};
            for (const [key, val] of Object.entries(body.items)) {
                if (val === null) {
                    delete current[key];
                } else {
                    current[key] = { ...(current[key] || {}), ...val, source: val.source || 'manual' };
                }
            }
            update.items = current;
            update.matchedCount = Object.keys(current).length;
        }

        await ref.update(update);
        const updated = await ref.get();
        return NextResponse.json({ id, ...updated.data() });
    } catch (err) {
        console.error('[logistics/quotes/[id] PATCH]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ── DELETE: eliminar cotización de proveedor ────────────────────────────────
export async function DELETE(req, { params }) {
    try {
        const { id } = await params;
        await firestore.collection(QUOTES_COL).doc(id).delete();
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('[logistics/quotes/[id] DELETE]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
