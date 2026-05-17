import { firestore } from '@/lib/firebase-admin';

// POST /api/accounting/ingest-quotations
// Importa al sales_ledger todas las cotizaciones con quotationStatus='completado'
// que aún no estén ingresadas. Para cada una se requiere que el usuario complete
// los datos faltantes (serie/número/fecha de la factura emitida), pero como
// punto de partida ingresamos lo que ya conocemos.
//
// Body: { companyProfileId, defaultSerie?, defaultFechaEmision? }
export async function POST(req) {
    try {
        const body = await req.json();
        const { companyProfileId, defaultSerie = 'F001', overwrite = false } = body;
        if (!companyProfileId) return Response.json({ error: 'companyProfileId requerido' }, { status: 400 });

        // 1) Cotizaciones completadas
        const quotsSnap = await firestore.collection('quotations')
            .where('quotationStatus', '==', 'completado').get();

        // 2) Cargar clientes para resolver RUC
        const clientsSnap = await firestore.collection('client_profiles').get();
        const clients = Object.fromEntries(clientsSnap.docs.map(d => [d.id, d.data()]));

        // 3) Ventas ya ingresadas (para no duplicar)
        const existingSnap = await firestore.collection('sales_ledger')
            .where('companyProfileId', '==', companyProfileId).get();
        const existingBySource = new Map();
        existingSnap.docs.forEach(d => {
            const data = d.data();
            if (data.sourceQuotationId) existingBySource.set(data.sourceQuotationId, d.id);
        });

        const ingested = [];
        const skipped  = [];
        const batch = firestore.batch();

        for (const doc of quotsSnap.docs) {
            const q = doc.data();
            const exists = existingBySource.has(doc.id);
            if (exists && !overwrite) {
                skipped.push({ id: doc.id, reason: 'ya_ingresada' });
                continue;
            }

            // Calcular base / IGV / total desde items
            let subtotal = 0;
            if (q.items && q.items.length > 0) {
                subtotal = q.items.reduce((s, item) =>
                    s + (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0), 0);
            } else {
                subtotal = parseFloat(q.total) || 0;
            }
            subtotal = Math.round(subtotal * 100) / 100;
            const igv   = Math.round(subtotal * 0.18 * 100) / 100;
            const total = Math.round((subtotal + igv) * 100) / 100;

            // Cliente
            const client = q.clientProfileId ? clients[q.clientProfileId] : null;
            const clienteName     = client?.name || q.clientName || '';
            const numeroDocCliente = client?.ruc || '';
            const tipoDocCliente   = numeroDocCliente && /^\d{11}$/.test(numeroDocCliente) ? '6'
                                     : numeroDocCliente && /^\d{8}$/.test(numeroDocCliente) ? '1' : '6';

            // Fecha — usamos updatedAt de la cotización (cuando se completó)
            const fechaEmision = q.updatedAt || q.createdAt || new Date().toISOString();
            const d = new Date(fechaEmision);
            const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

            const data = {
                companyProfileId, period,
                fechaEmision,
                fechaVencimiento: null,
                tipoComprobante: '01',
                serie: defaultSerie,
                numero: '',  // pendiente de completar manualmente
                tipoDocCliente, numeroDocCliente,
                clienteName,
                tipoOperacion: 'GRAVADA',
                baseImponible: subtotal,
                igv, exoneradas: 0, inafectas: 0, exportaciones: 0,
                total,
                moneda: 'PEN', tipoCambio: null,
                tipoBien: 'SERVICIO',
                anulado: false,
                sourceQuotationId: doc.id,
                sourceQuotationCode: q.code || null,
                needsCompletion: true,  // bandera para que la UI pida serie/número/fecha
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            if (exists && overwrite) {
                const existingId = existingBySource.get(doc.id);
                batch.update(firestore.collection('sales_ledger').doc(existingId), data);
                ingested.push({ id: existingId, source: doc.id, code: q.code, action: 'updated' });
            } else {
                const ref = firestore.collection('sales_ledger').doc();
                batch.set(ref, data);
                ingested.push({ id: ref.id, source: doc.id, code: q.code, action: 'created' });
            }
        }

        await batch.commit();

        // Desglose por periodo de TODAS las ventas asociadas (nuevas + ya existentes)
        const allRelevant = await firestore.collection('sales_ledger')
            .where('companyProfileId', '==', companyProfileId).get();
        const byPeriod = {};
        let latestPeriod = null;
        allRelevant.docs.forEach(d => {
            const p = d.data().period;
            if (!p) return;
            byPeriod[p] = (byPeriod[p] || 0) + 1;
            if (!latestPeriod || p > latestPeriod) latestPeriod = p;
        });

        return Response.json({
            ingested: ingested.length,
            skipped:  skipped.length,
            byPeriod,
            latestPeriod,
            totalSales: allRelevant.size,
            details:  { ingested, skipped },
        });
    } catch (err) {
        console.error('[accounting/ingest-quotations] error:', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}
