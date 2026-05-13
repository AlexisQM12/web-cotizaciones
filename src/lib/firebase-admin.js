import admin from 'firebase-admin';
import 'dotenv/config';

let firestore = null;
let storage = null;

if (!admin.apps.length) {
    try {
        if (process.env.FIREBASE_PROJECT_ID) {
            const projectId  = process.env.FIREBASE_PROJECT_ID.trim().replace(/^["']|["']$/g, '');
            const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim().replace(/^["']|["']$/g, '');
            let privateKey   = (process.env.FIREBASE_PRIVATE_KEY || '').trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');

            admin.initializeApp({
                credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
                storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim().replace(/^["']|["']$/g, ''),
            });
            console.log('[Firebase] Admin SDK iniciado correctamente.');
        } else {
            console.warn('[Firebase] Sin credenciales — Admin SDK no iniciado.');
        }
    } catch (error) {
        console.error('[Firebase] Error al inicializar:', error.message);
    }
}

if (admin.apps.length > 0) {
    firestore = admin.firestore();
    storage   = admin.storage();
}

export { firestore, storage, admin };
