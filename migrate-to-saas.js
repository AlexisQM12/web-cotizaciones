import { firestore } from './src/lib/firebase-admin.js';

async function migrate() {
    console.log('Iniciando migración SaaS...');
    
    // 1. Encontrar o crear una empresa para AYA TECHNOLOGIES
    const companies = await firestore.collection('company_profiles').get();
    let empresaId = null;
    
    if (!companies.empty) {
        empresaId = companies.docs[0].id; // Usar la primera empresa (AYA TECHNOLOGIES)
        console.log(`✅ Empresa maestra encontrada: ${empresaId} (${companies.docs[0].data().name})`);
    } else {
        console.log('⚠️ No se encontró perfil de empresa, saltando (Debes hacer el Onboarding primero).');
        return;
    }

    // 2. Asignar esa empresa a todos los usuarios actuales
    const users = await firestore.collection('users').get();
    let usersCount = 0;
    for (const doc of users.docs) {
        if (!doc.data().empresaId) {
            await doc.ref.update({ empresaId });
            usersCount++;
        }
    }
    console.log(`✅ ${usersCount} usuarios migrados al empresaId.`);

    // 3. Asignar esa empresa a todas las cotizaciones
    const quotations = await firestore.collection('quotations').get();
    let quoCount = 0;
    for (const doc of quotations.docs) {
        if (!doc.data().empresaId) {
            await doc.ref.update({ empresaId });
            quoCount++;
        }
    }
    console.log(`✅ ${quoCount} cotizaciones migradas al empresaId.`);

    // 4. Asignar esa empresa a todos los clientes
    const clients = await firestore.collection('client_profiles').get();
    let cliCount = 0;
    for (const doc of clients.docs) {
        if (!doc.data().empresaId) {
            await doc.ref.update({ empresaId });
            cliCount++;
        }
    }
    console.log(`✅ ${cliCount} clientes migrados al empresaId.`);

    console.log('🎉 Migración completada exitosamente.');
}

migrate().catch(console.error);
