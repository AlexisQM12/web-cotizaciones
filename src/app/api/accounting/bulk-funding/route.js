import { getTenantCollection, firestore } from '@/lib/firebase-admin';
import { autorizarTenant, respuestaDeAuthError } from '@/lib/apiAuth';

export async function POST(req) {
    try {
        const { companyProfileId, purchaseIds, fundingSourceId } = await req.json();

        if (!companyProfileId || !Array.isArray(purchaseIds)) {
            return Response.json({ error: 'Faltan parámetros requeridos.' }, { status: 400 });
        }

        await autorizarTenant(req, companyProfileId);

        const batch = firestore.batch();
        const purchasesRef = getTenantCollection(companyProfileId, 'purchases_ledger');
        const cajaChicaRef = getTenantCollection(companyProfileId, 'caja_chica');
        const quotationsRef = getTenantCollection(companyProfileId, 'quotations');

        const promises = purchaseIds.map(id => purchasesRef.doc(id).get());
        const docs = await Promise.all(promises);

        for (const docSnap of docs) {
            if (!docSnap.exists) continue;
            
            const data = docSnap.data();
            batch.update(docSnap.ref, { fundingSourceId, updatedAt: new Date().toISOString() });

            // Sincronizar con Caja Chica
            if (data.sourceKey && data.sourceKey.startsWith('caja-chica:')) {
                const cajaChicaId = data.sourceKey.split(':')[1];
                if (cajaChicaId) {
                    batch.update(cajaChicaRef.doc(cajaChicaId), { fundingSourceId });
                }
            }

            // Sincronizar con Mis Pendientes (Cotizaciones)
            if (data.sourceQuotationId) {
                const qSnap = await quotationsRef.doc(data.sourceQuotationId).get();
                if (qSnap.exists) {
                    const qData = qSnap.data();
                    if (qData.operationsData && Array.isArray(qData.operationsData.materials)) {
                        let updated = false;
                        const newMaterials = qData.operationsData.materials.map(mat => {
                            if (mat.purchaseLedgerId === docSnap.id || (data.sourceKey && data.sourceKey.endsWith(`:${mat.id}`))) {
                                updated = true;
                                return { ...mat, fundingSourceId };
                            }
                            return mat;
                        });
                        
                        if (updated) {
                            batch.update(quotationsRef.doc(data.sourceQuotationId), { 
                                'operationsData.materials': newMaterials 
                            });
                        }
                    }
                }
            }
        }

        await batch.commit();

        return Response.json({ success: true, count: docs.length });
    } catch (error) {
        const authRes = respuestaDeAuthError(error);
        if (authRes) return authRes;
        console.error('[bulk-funding] POST error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
