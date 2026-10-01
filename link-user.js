import 'dotenv/config';
import admin from 'firebase-admin';

const projectId  = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey   = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
}

const db = admin.firestore();

async function linkUser() {
    try {
        const emailToFind = 'ken.qm@ayatech.com.pe';
        console.log(`Buscando usuario con email: ${emailToFind}...`);
        
        const usersSnapshot = await db.collection('users').where('email', '==', emailToFind).get();
        
        if (usersSnapshot.empty) {
            console.log('❌ Usuario no encontrado en la colección "users".');
            return;
        }

        const userDoc = usersSnapshot.docs[0];
        console.log(`✅ Usuario encontrado: ${userDoc.id}`);
        
        // Asignar empresaId "6"
        await userDoc.ref.update({
            empresaId: '6',
            companyProfileId: '6' // Para retrocompatibilidad si CGO lo requiere
        });
        
        // Crear el tenant 6 si no existe
        const tenantRef = db.collection('tenants').doc('6');
        const tenantSnap = await tenantRef.get();
        if (!tenantSnap.exists) {
            await tenantRef.set({
                id: '6',
                name: 'AYA Technologies',
                slug: 'aya-tech',
                email: 'ken.qm@ayatech.com.pe',
                createdAt: new Date().toISOString()
            });
            console.log('✅ Documento Tenant 6 creado.');
        } else {
            console.log('✅ Documento Tenant 6 ya existe.');
        }

        console.log('🎉 Usuario vinculado exitosamente a los datos migrados (Tenant 6).');
    } catch (error) {
        console.error('Error:', error);
    }
}

linkUser();
