import { firestore } from './src/lib/firebase-admin.js';

async function mergeTenant() {
    const sourceTenant = '6';
    const destTenant = 'ayatech';

    console.log(`🚀 Iniciando migración de datos de Tenant ${sourceTenant} -> ${destTenant}`);

    const collectionsToMigrate = [
        'cgo_quotations',
        'cgo_clients',
        'cgo_suppliers',
        'cgo_accounting_config',
        'cgo_purchases',
        'cgo_sales',
        'cgo_portfolio_companies',
        'cgo_quote_leads'
    ];

    try {
        for (const coll of collectionsToMigrate) {
            const snap = await firestore.collection('tenants').doc(sourceTenant).collection(coll).get();
            console.log(`> Colección: ${coll} (${snap.size} documentos)`);
            
            let count = 0;
            for (const doc of snap.docs) {
                let data = doc.data();
                // Update empresaId in data if it exists
                if (data.empresaId === sourceTenant) {
                    data.empresaId = destTenant;
                }
                if (data.tenantId === sourceTenant) {
                    data.tenantId = destTenant;
                }

                await firestore.collection('tenants')
                    .doc(destTenant)
                    .collection(coll)
                    .doc(doc.id)
                    .set(data, { merge: true });
                count++;
            }
            console.log(`  ✅ ${count} documentos migrados a ${destTenant}/${coll}`);
        }

        console.log('\n✅ Fusión de Tenant completada exitosamente.');
    } catch (e) {
        console.error('Error durante la fusión:', e);
    }
    process.exit(0);
}

mergeTenant();
