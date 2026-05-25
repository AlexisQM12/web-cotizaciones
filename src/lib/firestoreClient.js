// Firestore Client for Browser (Realtime Listeners)
import { initializeApp, getApps } from 'firebase/app';
import { initializeFirestore, getFirestore, persistentLocalCache } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'zenlogic-8a575',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'zenlogic-8a575.firebasestorage.app',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase for client-side Firestore
let clientApp;
let clientDb;

if (typeof window !== 'undefined') {
    if (getApps().length === 0) {
        clientApp = initializeApp(firebaseConfig);
        clientDb = initializeFirestore(clientApp, {
            localCache: persistentLocalCache(),
        });
    } else {
        clientApp = getApps()[0];
        clientDb = getFirestore(clientApp);
    }
} else {
    clientApp = null;
    clientDb = null;
}

export { clientDb };
export default clientApp;

// ── Multi-Tenant SaaS Helpers (Client Side) ──
import { collection, doc } from 'firebase/firestore';

export const getTenantCollectionClient = (empresaId, collectionName) => {
    if (!empresaId) throw new Error(`empresaId is required for collection ${collectionName}`);

    const map = {
        'quotations': 'cgo_quotations',
        'client_profiles': 'cgo_clients',
        'suppliers': 'cgo_suppliers',
        'accounting_config': 'cgo_accounting_config',
        'purchases_ledger': 'cgo_purchases',
        'sales_ledger': 'cgo_sales'
    };
    const cgoCollection = map[collectionName] || collectionName;
    return collection(clientDb, 'tenants', String(empresaId), cgoCollection);
};

export const getTenantDocClient = (empresaId) => {
    if (!empresaId) throw new Error('empresaId is required');
    return doc(clientDb, 'tenants', String(empresaId));
};
