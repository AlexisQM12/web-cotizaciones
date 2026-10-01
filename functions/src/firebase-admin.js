import admin from 'firebase-admin';

// Bucket de Storage donde se suben los PDFs (OCs y facturas). Sin esto,
// storage.bucket() lanza "Bucket name not specified or invalid" y uploadOcPdf
// devuelve null, dejando invoicePdfUrl/ocPdfUrl en null. Usamos el bucket de
// zenlogic (mismo proyecto que la credencial y los datos).
const STORAGE_BUCKET = (
  process.env.STORAGE_BUCKET
  || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  || 'zenlogic-8a575.firebasestorage.app'
).replace(/^["']|["']$/g, '');

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
      }),
      storageBucket: STORAGE_BUCKET,
    });
    console.log(`[Firebase Admin] Conectado a base de datos externa: ${projectId} | bucket: ${STORAGE_BUCKET}`);
  } else {
    admin.initializeApp({ storageBucket: STORAGE_BUCKET });
    console.log(`[Firebase Admin] Conectado al proyecto por defecto | bucket: ${STORAGE_BUCKET}`);
  }
}

export const firestore = admin.firestore();
export const storage = admin.storage();
export { admin };
