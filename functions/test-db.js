import 'dotenv/config';
import admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.DB_PROJECT_ID,
    clientEmail: process.env.DB_CLIENT_EMAIL,
    privateKey: process.env.DB_PRIVATE_KEY.replace(/\\n/g, '\n'),
  })
});

const firestore = admin.firestore();

async function check() {
  const snapshot = await firestore.collection('tenants').doc('6').collection('cgo_quotations').where('code', '==', 'COT-2026-0046').get();
  console.log(`Found ${snapshot.size} for COT-2026-0046:`);
  snapshot.forEach(doc => console.log(doc.id, '=>', doc.data()));
}

check();
