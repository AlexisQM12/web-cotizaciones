import { firestore } from '@/lib/firebase-admin';

// GET /api/accounting/purchases?companyProfileId=xxx&period=YYYY-MM
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const companyProfileId = searchParams.get('companyProfileId') || searchParams.get('empresaId');
        const period           = searchParams.get('period');

        if (!companyProfileId) {
            return Response.json({ error: 'companyProfileId requerido' }, { status: 400 });
        }

        // Query solo por companyProfileId para evitar requerir índice compuesto
        const snap = await firestore
            .collection('purchases_ledger')
            .where('companyProfileId', '==', companyProfileId)
            .get();

        let items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Filtrar por period en memoria
        if (period) {
            items = items.filter(item => item.period === period);
        }

        items.sort((a, b) => new Date(a.fechaEmision) - new Date(b.fechaEmision));
        return Response.json(items);
    } catch (err) {
        console.error('[accounting/purchases] GET error:', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}

// POST /api/accounting/purchases — crea entrada manual de compra
export async function POST(req) {
    try {
        const body = await req.json();
        const {
            companyProfileId, fechaEmision, fechaVencimiento, tipoComprobante,
            serie, numero, tipoDocProveedor, numeroDocProveedor, proveedorName,
            baseImponible, igv, noGravadas, isc, otrosTributos, total,
            moneda, tipoCambio, tipoGasto, aceptaCreditoFiscal, anulado,
            detrFecha, detrNumero, detrImporte, detrTipoCP, anioDUA, pdfUrl,
        } = body;

        if (!companyProfileId || !fechaEmision || !tipoComprobante) {
            return Response.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
        }

        const d = new Date(fechaEmision);
        const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

        const data = {
            companyProfileId, period,
            fechaEmision, fechaVencimiento: fechaVencimiento || null,
            tipoComprobante,
            serie: serie || '', numero: numero || '',
            tipoDocProveedor: tipoDocProveedor || '6',
            numeroDocProveedor: numeroDocProveedor || '',
            proveedorName: proveedorName || '',
            baseImponible: parseFloat(baseImponible) || 0,
            igv:           parseFloat(igv) || 0,
            noGravadas:    parseFloat(noGravadas) || 0,
            isc:           parseFloat(isc) || 0,
            otrosTributos: parseFloat(otrosTributos) || 0,
            total:         parseFloat(total) || 0,
            moneda: moneda || 'PEN',
            tipoCambio: tipoCambio ? parseFloat(tipoCambio) : null,
            tipoGasto: tipoGasto || 'SERVICIO',
            aceptaCreditoFiscal: aceptaCreditoFiscal !== false,
            anulado: !!anulado,
            detrFecha: detrFecha || null,
            detrNumero: detrNumero || '',
            detrImporte: parseFloat(detrImporte) || 0,
            detrTipoCP: detrTipoCP || '',
            anioDUA: anioDUA || '',
            pdfUrl: pdfUrl || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const ref = await firestore.collection('purchases_ledger').add(data);

        // Mantenemos directorio de proveedores
        if (numeroDocProveedor) {
            await firestore.collection('accounting_providers').doc(numeroDocProveedor).set({
                tipoDoc: data.tipoDocProveedor,
                numeroDoc: numeroDocProveedor,
                razonSocial: proveedorName,
                lastUsedAt: new Date().toISOString(),
            }, { merge: true });
        }

        return Response.json({ id: ref.id, ...data });
    } catch (err) {
        console.error('[accounting/purchases] POST error:', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const body = await req.json();
        const { id, ...update } = body;
        if (!id) return Response.json({ error: 'id requerido' }, { status: 400 });
        if (update.fechaEmision) {
            const d = new Date(update.fechaEmision);
            update.period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        }
        update.updatedAt = new Date().toISOString();
        await firestore.collection('purchases_ledger').doc(id).update(update);
        return Response.json({ success: true });
    } catch (err) {
        console.error('[accounting/purchases] PUT error:', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return Response.json({ error: 'id requerido' }, { status: 400 });
        await firestore.collection('purchases_ledger').doc(id).delete();
        return Response.json({ success: true });
    } catch (err) {
        console.error('[accounting/purchases] DELETE error:', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}
