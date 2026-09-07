import { firestore, getTenantCollection, getTenantDoc } from '@/lib/firebase-admin';
import { resolverEmpresaId, faltaEmpresaId } from '@/lib/tenant';
export const dynamic = 'force-dynamic';
export async function GET(req, { params }) {
    try {
        const { id } = await params;
        const empresaId = resolverEmpresaId(req);
        if (!empresaId) return faltaEmpresaId();

        // Fetch everything in parallel without server-side sorting
        const [quoteDoc, companySnap, clientSnap, settingsSnap] = await Promise.all([
            getTenantCollection(empresaId, 'quotations').doc(id).get(),
            firestore.collection('company_profiles').get(),
            getTenantCollection(empresaId, 'client_profiles').get(),
            firestore.collection('settings').doc('general_conditions').get()
        ]);

        if (!quoteDoc.exists) return Response.json({ error: 'Not found' }, { status: 404 });

        const quotation = { id: quoteDoc.id, ...quoteDoc.data() };

        // Sort Company Profiles in JS
        const companyProfiles = companySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        companyProfiles.sort((a, b) => {
            if (a.isDefault !== b.isDefault) return b.isDefault ? 1 : -1;
            return (a.name || '').localeCompare(b.name || '');
        });

        // Sort Client Profiles in JS
        const clientProfiles = clientSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        clientProfiles.sort((a, b) => {
            if (a.isDefault !== b.isDefault) return b.isDefault ? 1 : -1;
            return (a.name || '').localeCompare(b.name || '');
        });

        // Determine general conditions from the quotation's selected company
        let conditionsText = '';
        const selectedCompanyId = quotation.companyProfileId || companyProfiles.find(cp => cp.isDefault)?.id;
        const selectedCompany = companyProfiles.find(cp => cp.id === selectedCompanyId?.toString());

        if (selectedCompany && selectedCompany.conditions) {
            conditionsText = selectedCompany.conditions;
        } else if (settingsSnap.exists) {
            conditionsText = settingsSnap.data().text || '';
        }

        const generalConditions = { text: conditionsText };

        return Response.json({
            ...quotation,
            companyProfiles,
            clientProfiles,
            generalConditions
        });
    } catch (error) {
        console.error('API Error (quotation-detail):', error);
        return Response.json({
            error: 'Failed to fetch quotation',
            details: error.message
        }, { status: 500 });
    }
}

export async function PUT(req, { params }) {
    try {
        const { id } = await params;
        const body = await req.json();

        // In Firestore, we store everything in the same document
        const updateData = {
            ...body,
            updatedAt: new Date().toISOString()
        };

        // Ensure total is calculated if not provided
        if (body.items) {
            updateData.total = body.items.reduce((acc, item) => acc + (parseFloat(item.quantity || 0) * parseFloat(item.price || 0)), 0);
        }

        const tenantId = body.empresaId;
        await getTenantCollection(tenantId, 'quotations').doc(id).update(updateData);

        // Check for orphaned materials in purchases_ledger and delete them
        if (body.operationsData && body.operationsData.materials) {
            try {
                const currentMaterialIds = body.operationsData.materials.map(m => String(m.id));
                const purchasesSnap = await getTenantCollection(tenantId, 'purchases_ledger')
                    .where('sourceQuotationId', '==', id)
                    .get();
                
                const batch = getTenantCollection(tenantId, 'purchases_ledger').firestore.batch();
                let hasDeletes = false;
                
                purchasesSnap.forEach(doc => {
                    const data = doc.data();
                    if (data.sourceKey && data.sourceKey.startsWith(`pending:${id}:`)) {
                        const matId = data.sourceKey.split(':')[2];
                        if (matId) {
                            const material = body.operationsData.materials.find(m => String(m.id) === matId);
                            // Delete if material is deleted or if it's no longer marked as purchased
                            if (!material || !material.purchased) {
                                batch.delete(doc.ref);
                                hasDeletes = true;
                            }
                        }
                    }
                });
                
                if (hasDeletes) {
                    await batch.commit();
                }
            } catch (err) {
                console.error('Error cleaning up orphaned purchases:', err);
            }
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error(error);
        return Response.json({ error: 'Failed to update quotation' }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const { id } = await params;
        const empresaId = resolverEmpresaId(req);
        if (!empresaId) return faltaEmpresaId();
        await getTenantCollection(empresaId, 'quotations').doc(id).delete();
        return Response.json({ success: true });
    } catch (error) {
        console.error(error);
        return Response.json({ error: 'Failed to delete quotation' }, { status: 500 });
    }
}
