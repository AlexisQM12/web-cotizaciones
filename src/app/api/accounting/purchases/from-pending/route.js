import { firestore, getTenantCollection, getTenantDoc } from '@/lib/firebase-admin';

// POST /api/accounting/purchases/from-pending
// Crea una entrada en purchases_ledger a partir de un material escaneado en Pendings.
// Body: { companyProfileId, quotationId, materialId, ocrData, attachmentUrl, title }
//
// Si ya existe una compra para el mismo (materialId + quotationId), la devuelve
// sin crear duplicado.
export async function POST(req) {
    try {
        const body = await req.json();
        const { companyProfileId, quotationId, materialId, materialTitle, ocrData, attachmentUrl, fundingSourceId, moneda, tipoCambio, totalCost, pendienteFactura } = body;

        if (!companyProfileId) return Response.json({ error: 'companyProfileId requerido' }, { status: 400 });
        if (!ocrData)          return Response.json({ error: 'Sin datos OCR para registrar la compra' }, { status: 400 });

        const sourceKey = `pending:${quotationId}:${materialId}`;

        // Evitar duplicados
        const existing = await getTenantCollection((typeof empresaId !== 'undefined' ? empresaId : (typeof companyProfileId !== 'undefined' && companyProfileId ? companyProfileId : 'ayatech')), 'purchases_ledger')
            .where('companyProfileId', '==', companyProfileId)
            .where('sourceKey', '==', sourceKey)
            .limit(1).get();
        if (!existing.empty) {
            const doc = existing.docs[0];
            const currentData = doc.data();
            
            const updates = {};
            if (fundingSourceId !== undefined && currentData.fundingSourceId !== fundingSourceId) updates.fundingSourceId = fundingSourceId;
            if (moneda !== undefined && currentData.moneda !== moneda) updates.moneda = moneda;
            if (pendienteFactura !== undefined && currentData.pendienteFactura !== pendienteFactura) updates.pendienteFactura = pendienteFactura;
            
            const newTipoCambio = tipoCambio ? parseFloat(tipoCambio) : null;
            if (tipoCambio !== undefined && currentData.tipoCambio !== newTipoCambio) updates.tipoCambio = newTipoCambio;
            
            const newTotal = totalCost !== undefined && totalCost !== null ? parseFloat(totalCost) : parseFloat(ocrData.amount || 0);
            if (newTotal > 0 && newTotal !== currentData.total) {
                updates.total = newTotal;
                updates.baseImponible = Math.round((newTotal / 1.18) * 100) / 100;
                updates.igv = Math.round((newTotal - updates.baseImponible) * 100) / 100;
            }

            if (Object.keys(updates).length > 0) {
                updates.updatedAt = new Date().toISOString();
                await doc.ref.update(updates);
            }

            return Response.json({
                alreadyExists: true,
                updated: Object.keys(updates).length > 0,
                id: doc.id,
                ...currentData,
                ...updates
            });
        }

        const total = totalCost !== undefined && totalCost !== null ? parseFloat(totalCost) : (parseFloat(ocrData.amount) || 0);
        const base  = Math.round((total / 1.18) * 100) / 100;
        const igv   = Math.round((total - base) * 100) / 100;

        const fechaEmision = ocrData.fecha || new Date().toISOString().slice(0, 10);
        const d = new Date(fechaEmision);
        const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

        const data = {
            companyProfileId, period,
            fechaEmision,
            fechaVencimiento: null,
            tipoComprobante: '01',
            serie:  ocrData.serie  || '',
            numero: ocrData.numero || '',
            tipoDocProveedor: '6',
            numeroDocProveedor: ocrData.ruc || '',
            proveedorName: ocrData.razonSocial || materialTitle || 'Proveedor por completar',
            baseImponible: base,
            igv,
            noGravadas: 0, isc: 0, otrosTributos: 0,
            total,
            moneda: moneda || 'PEN',
            tipoCambio: tipoCambio ? parseFloat(tipoCambio) : null,
            tipoGasto: 'MERCADERIA', // material → mercadería por defecto
            aceptaCreditoFiscal: !!ocrData.ruc, // sin RUC no tiene derecho a crédito
            anulado: false,
            pdfUrl: attachmentUrl || null,
            sourceKey,
            sourceQuotationId: quotationId,
            sourceMaterialTitle: materialTitle || null,
            fundingSourceId: fundingSourceId || '',
            pendienteFactura: pendienteFactura || false,
            needsReview: !ocrData.serie || !ocrData.numero || !ocrData.ruc, // datos incompletos
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const ref = await getTenantCollection((typeof empresaId !== 'undefined' ? empresaId : (typeof companyProfileId !== 'undefined' && companyProfileId ? companyProfileId : 'ayatech')), 'purchases_ledger').add(data);

        // Directorio de proveedores
        if (ocrData.ruc) {
            await firestore.collection('accounting_providers').doc(ocrData.ruc).set({
                tipoDoc: '6',
                numeroDoc: ocrData.ruc,
                razonSocial: ocrData.razonSocial || data.proveedorName,
                lastUsedAt: new Date().toISOString(),
            }, { merge: true });
        }

        return Response.json({ id: ref.id, ...data });
    } catch (err) {
        console.error('[purchases/from-pending] error:', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}
