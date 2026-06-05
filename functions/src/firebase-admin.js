import admin from 'firebase-admin';

if (!admin.apps.length) {
  const projectId = process.env.DB_PROJECT_ID;
  const clientEmail = process.env.DB_CLIENT_EMAIL;
  const privateKey = process.env.DB_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId.replace(/^["']|["']$/g, ''),
        clientEmail: clientEmail.replace(/^["']|["']$/g, ''),
        privateKey: privateKey.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n'),
      })
    });
    console.log(`[Firebase Admin] Conectado a base de datos externa: ${projectId}`);
  } else {
    admin.initializeApp();
    console.log(`[Firebase Admin] Conectado al proyecto por defecto`);
  }
}

export const firestore = admin.firestore();
export const storage = admin.storage();
export { admin };
