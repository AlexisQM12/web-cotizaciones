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

async function check() {
    const tenants = await db.collection('tenants').get();
    console.log("Tenants:");
    tenants.forEach(doc => console.log(doc.id, doc.data()));
    
    const users = await db.collection('users').get();
    console.log("\nUsers:");
    users.forEach(doc => console.log(doc.id, doc.data().email, doc.data().empresaId, doc.data().tenantId));
}
check().catch(console.error);
