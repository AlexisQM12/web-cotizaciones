require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
    });
}
const firestore = admin.firestore();

async function check() {
    const doc6 = await firestore.collection('tenants').doc('6').collection('cgo_accounting_config').doc('6').get();
    console.log("Tenant 6 config exists:", doc6.exists);
    if (doc6.exists) console.log(doc6.data());
}
check();
