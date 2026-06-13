import { firestore, getTenantCollection, getTenantDoc } from '@/lib/firebase-admin';

// GET /api/accounting/sales?companyProfileId=xxx&period=YYYY-MM
// Lista las ventas de un periodo
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const companyProfileId = searchParams.get('companyProfileId');
        const period           = searchParams.get('period');
        if (!companyProfileId) return Response.json({ error: 'companyProfileId requerido' }, { status: 400 });

        let q = getTenantCollection((typeof empresaId !== 'undefined' ? empresaId : (typeof companyProfileId !== 'undefined' && companyProfileId ? companyProfileId : 'ayatech')), 'sales_ledger').where('companyProfileId', '==', companyProfileId);
        if (period) q = q.where('period', '==', period);

        const snap = await q.get();
        const sales = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        sales.sort((a, b) => new Date(a.fechaEmision) - new Date(b.fechaEmision));
        return Response.json(sales);
    } catch (err) {
        console.error('[accounting/sales] GET error:', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}

// POST /api/accounting/sales — crea entrada manual o desde cotización
export async function POST(req) {
    try {
        const body = await req.json();
        const {
            companyProfileId, fechaEmision, fechaVencimiento, tipoComprobante,
            serie, numero, tipoDocCliente, numeroDocCliente, clienteName,
            tipoOperacion, baseImponible, igv, exoneradas, inafectas, exportaciones,
            total, moneda, tipoCambio, tipoBien, anulado, sourceQuotationId,
        } = body;

        if (!companyProfileId || !fechaEmision || !tipoComprobante) {
            return Response.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
        }

        // Periodo derivado de la fecha
        const d = new Date(fechaEmision);
        const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

        const data = {
            companyProfileId, period,
            fechaEmision, fechaVencimiento: fechaVencimiento || null,
            tipoComprobante,
            serie: serie || '', numero: numero || '',
            tipoDocCliente: tipoDocCliente || '6',
            numeroDocCliente: numeroDocCliente || '',
            clienteName: clienteName || '',
            tipoOperacion: tipoOperacion || 'GRAVADA',
            baseImponible: parseFloat(baseImponible) || 0,
            igv:           parseFloat(igv) || 0,
            exoneradas:    parseFloat(exoneradas) || 0,
            inafectas:     parseFloat(inafectas) || 0,
            exportaciones: parseFloat(exportaciones) || 0,
            total:         parseFloat(total) || 0,
            moneda: moneda || 'PEN',
            tipoCambio: tipoCambio ? parseFloat(tipoCambio) : null,
            tipoBien: tipoBien || 'SERVICIO',
            anulado: !!anulado,
            sourceQuotationId: sourceQuotationId || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const ref = await getTenantCollection((typeof empresaId !== 'undefined' ? empresaId : (typeof companyProfileId !== 'undefined' && companyProfileId ? companyProfileId : 'ayatech')), 'sales_ledger').add(data);
        return Response.json({ id: ref.id, ...data });
    } catch (err) {
        console.error('[accounting/sales] POST error:', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}

// PUT /api/accounting/sales — actualiza
export async function PUT(req) {
    try {
        const body = await req.json();
        const { id, ...update } = body;
        if (!id) return Response.json({ error: 'id requerido' }, { status: 400 });

        // Recalcula periodo si cambió la fecha
        if (update.fechaEmision) {
            const d = new Date(update.fechaEmision);
            update.period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        }
        update.updatedAt = new Date().toISOString();

        await getTenantCollection((typeof empresaId !== 'undefined' ? empresaId : (typeof companyProfileId !== 'undefined' && companyProfileId ? companyProfileId : 'ayatech')), 'sales_ledger').doc(id).update(update);
        return Response.json({ success: true });
    } catch (err) {
        console.error('[accounting/sales] PUT error:', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}

// DELETE /api/accounting/sales?id=xxx
export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return Response.json({ error: 'id requerido' }, { status: 400 });
        await getTenantCollection((typeof empresaId !== 'undefined' ? empresaId : (typeof companyProfileId !== 'undefined' && companyProfileId ? companyProfileId : 'ayatech')), 'sales_ledger').doc(id).delete();
        return Response.json({ success: true });
    } catch (err) {
        console.error('[accounting/sales] DELETE error:', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}
