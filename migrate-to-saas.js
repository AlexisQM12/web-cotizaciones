import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

// Inicializar Firebase Admin
const serviceAccount = JSON.parse(fs.readFileSync('./firebase-credentials.json', 'utf8'));
const app = initializeApp({
    credential: cert(serviceAccount)
});
const db = getFirestore(app);

async function migrate() {
    console.log('Iniciando migración SaaS...');
    
    // 1. Encontrar o crear una empresa para AYA TECHNOLOGIES
    const companies = await db.collection('company_profiles').get();
    let empresaId = null;
    
    if (!companies.empty) {
        empresaId = companies.docs[0].id; // Usar la primera empresa (AYA TECHNOLOGIES)
        console.log(`✅ Empresa maestra encontrada: ${empresaId} (${companies.docs[0].data().name})`);
    } else {
        console.log('⚠️ No se encontró perfil de empresa, saltando (Debes hacer el Onboarding primero).');
        return;
    }

    // 2. Asignar esa empresa a todos los usuarios actuales
    const users = await db.collection('users').get();
    let usersCount = 0;
    for (const doc of users.docs) {
        if (!doc.data().empresaId) {
            await doc.ref.update({ empresaId });
            usersCount++;
        }
    }
    console.log(`✅ ${usersCount} usuarios migrados al empresaId.`);

    // 3. Asignar esa empresa a todas las cotizaciones
    const quotations = await db.collection('quotations').get();
    let quoCount = 0;
    for (const doc of quotations.docs) {
        if (!doc.data().empresaId) {
            await doc.ref.update({ empresaId });
            quoCount++;
        }
    }
    console.log(`✅ ${quoCount} cotizaciones migradas al empresaId.`);

    // 4. Asignar esa empresa a todos los clientes
    const clients = await db.collection('client_profiles').get();
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
