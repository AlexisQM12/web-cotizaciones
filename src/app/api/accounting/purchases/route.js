import { firestore, getTenantCollection, getTenantDoc } from '@/lib/firebase-admin';
import { autorizarTenant, respuestaDeAuthError } from '@/lib/apiAuth';

// GET /api/accounting/purchases?companyProfileId=xxx&period=YYYY-MM
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);        const empresaId = searchParams.get('empresaId');

        const companyProfileId = searchParams.get('companyProfileId') || searchParams.get('empresaId');
        await autorizarTenant(req, empresaId || companyProfileId);
        const period           = searchParams.get('period');

        if (!companyProfileId) {
            return Response.json({ error: 'companyProfileId requerido' }, { status: 400 });
        }

        // Query en la colección del tenant
        const snap = await getTenantCollection(companyProfileId, 'purchases_ledger').get();

        let items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Filtrar por period en memoria
        if (period) {
            items = items.filter(item => item.period === period);
        }

        items.sort((a, b) => new Date(a.fechaEmision) - new Date(b.fechaEmision));

        // Obtener códigos de cotización legibles
        const quotationIds = [...new Set(items.filter(i => i.sourceQuotationId).map(i => i.sourceQuotationId))];
        if (quotationIds.length > 0) {
            const quotesCache = {};
            // Fetch quotations one by one to avoid 30-limit 'in' query issues, or batch if there are many. 
            // Usually there are not hundreds per month.
            await Promise.all(quotationIds.map(async (qid) => {
                try {
                    const qDoc = await getTenantCollection(companyProfileId, 'quotations').doc(qid).get();
                    if (qDoc.exists) {
                        quotesCache[qid] = qDoc.data().code || qid;
                    } else {
                        quotesCache[qid] = qid;
                    }
                } catch (e) {
        const authRes = respuestaDeAuthError(e);
        if (authRes) return authRes;
                    quotesCache[qid] = qid;
                }
            }));
            for (const item of items) {
                if (item.sourceQuotationId) {
                    item.sourceQuotationNumber = quotesCache[item.sourceQuotationId];
                }
            }
        }

        return Response.json(items);
    } catch (err) {
        const authRes = respuestaDeAuthError(err);
        if (authRes) return authRes;
        console.error('[accounting/purchases] GET error:', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}

// POST /api/accounting/purchases — crea entrada manual de compra
export async function POST(req) {
    try {
        const body = await req.json();        const empresaId = body.empresaId || new URL(req.url).searchParams.get('empresaId');
        await autorizarTenant(req, empresaId);

        const {
            companyProfileId, fechaEmision, fechaVencimiento, tipoComprobante,
            serie, numero, tipoDocProveedor, numeroDocProveedor, proveedorName,
            baseImponible, igv, noGravadas, isc, otrosTributos, total,
            moneda, tipoCambio, tipoGasto, aceptaCreditoFiscal, anulado,
            detrFecha, detrNumero, detrImporte, detrTipoCP, anioDUA, pdfUrl, fundingSourceId, uploadedBy
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
            fundingSourceId: fundingSourceId || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            uploadedBy: uploadedBy || null,
        };

        const ref = await getTenantCollection(empresaId, 'purchases_ledger').add(data);

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
        const authRes = respuestaDeAuthError(err);
        if (authRes) return authRes;
        console.error('[accounting/purchases] POST error:', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const body = await req.json();        const empresaId = body.empresaId || new URL(req.url).searchParams.get('empresaId');
        await autorizarTenant(req, empresaId);

        const { id, companyProfileId, ...update } = body;
        if (!id || !companyProfileId) return Response.json({ error: 'id y companyProfileId requeridos' }, { status: 400 });

        if (update.fechaEmision) {
            const d = new Date(update.fechaEmision);
            update.period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        }
        update.updatedAt = new Date().toISOString();

        const docRef = getTenantCollection(companyProfileId, 'purchases_ledger').doc(id);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            const oldData = docSnap.data();

            // Sincronizar si cambió el total o la fuente de fondos
            const totalChanged = update.total !== undefined && update.total !== oldData.total;
            const fundChanged = update.fundingSourceId !== undefined && update.fundingSourceId !== oldData.fundingSourceId;

            if (totalChanged || fundChanged) {
                // Sync con Caja Chica
                if (oldData.sourceKey && oldData.sourceKey.startsWith('caja-chica:')) {
                    const cajaChicaId = oldData.sourceKey.split(':')[1];
                    if (cajaChicaId) {
                        const ccUpdates = {};
                        if (totalChanged) ccUpdates.totalAmount = update.total;
                        if (fundChanged) ccUpdates.fundingSourceId = update.fundingSourceId;
                        if (update.pdfUrl !== undefined) ccUpdates.receiptUrl = update.pdfUrl;
                        
                        if (Object.keys(ccUpdates).length > 0) {
                            ccUpdates.updatedAt = new Date().toISOString();
                            await getTenantCollection(companyProfileId, 'caja_chica').doc(cajaChicaId).update(ccUpdates).catch(console.error);
                        }
                    }
                }

                // Sync con Cotizaciones (Mis Pendientes)
                if (oldData.sourceQuotationId) {
                    const qRef = getTenantCollection(companyProfileId, 'quotations').doc(oldData.sourceQuotationId);
                    const qSnap = await qRef.get();
                    if (qSnap.exists) {
                        const qData = qSnap.data();
                        let qUpdated = false;
                        if (qData.operationsData && Array.isArray(qData.operationsData.materials)) {
                            for (const mat of qData.operationsData.materials) {
                                if (mat.purchaseLedgerId === id || (oldData.sourceKey && oldData.sourceKey.endsWith(`:${mat.id}`))) {
                                    if (totalChanged) mat.cost = update.total;
                                    if (fundChanged) mat.fundingSourceId = update.fundingSourceId;
                                    qUpdated = true;
                                }
                            }
                            if (qUpdated) {
                                await qRef.update({ 'operationsData.materials': qData.operationsData.materials });
                            }
                        }
                    }
                }
            }
        }

        await docRef.update(update);
        return Response.json({ success: true });
    } catch (err) {
        const authRes = respuestaDeAuthError(err);
        if (authRes) return authRes;
        console.error('[accounting/purchases] PUT error:', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);        const empresaId = searchParams.get('empresaId');

        const id = searchParams.get('id');
        const companyProfileId = searchParams.get('companyProfileId');
        await autorizarTenant(req, empresaId || companyProfileId);
        if (!id || !companyProfileId) return Response.json({ error: 'id y companyProfileId requeridos' }, { status: 400 });

        const docRef = getTenantCollection(companyProfileId, 'purchases_ledger').doc(id);
        const docSnap = await docRef.get();
        
        if (docSnap.exists) {
            const data = docSnap.data();

            // 1. Sync con Caja Chica
            if (data.sourceKey && data.sourceKey.startsWith('caja-chica:')) {
                const cajaChicaId = data.sourceKey.split(':')[1];
                if (cajaChicaId) {
                    await getTenantCollection(companyProfileId, 'caja_chica').doc(cajaChicaId).delete().catch(console.error);
                }
            }
            
            // 2. Sync con Cotizaciones (Mis Pendientes)
            if (data.sourceQuotationId) {
                const qRef = getTenantCollection(companyProfileId, 'quotations').doc(data.sourceQuotationId);
                const qSnap = await qRef.get();
                if (qSnap.exists) {
                    const qData = qSnap.data();
                    let updated = false;
                    if (qData.operationsData && Array.isArray(qData.operationsData.materials)) {
                        for (const mat of qData.operationsData.materials) {
                            if (mat.purchaseLedgerId === id || (data.sourceKey && data.sourceKey.endsWith(`:${mat.id}`))) {
                                mat.purchased = false;
                                delete mat.purchaseLedgerId;
                                updated = true;
                            }
                        }
                        if (updated) {
                            await qRef.update({ 'operationsData.materials': qData.operationsData.materials });
                        }
                    }
                }
            }
        }

        await docRef.delete();
        return Response.json({ success: true });
    } catch (err) {
        const authRes = respuestaDeAuthError(err);
        if (authRes) return authRes;
        console.error('[accounting/purchases] DELETE error:', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}
