import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import 'dotenv/config';

let firestore = null;
let storage = null;

if (!admin.apps.length && !getApps().length) {
    try {
        if (process.env.DB_PROJECT_ID || process.env.FIREBASE_PROJECT_ID) {
            const projectId  = (process.env.DB_PROJECT_ID || process.env.FIREBASE_PROJECT_ID).trim().replace(/^["']|["']$/g, '');
            const clientEmail = (process.env.DB_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL)?.trim().replace(/^["']|["']$/g, '');
            let privateKey   = (process.env.DB_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY || '').trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');

            admin.initializeApp({
                credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
                storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim().replace(/^["']|["']$/g, ''),
            });
            console.log('[Firebase] Admin SDK iniciado correctamente para el proyecto:', projectId);
        } else {
            console.warn('[Firebase] Sin credenciales — Admin SDK no iniciado.');

        }
    } catch (error) {
        console.error('[Firebase] Error al inicializar:', error.message);
    }
}

if (admin.apps.length > 0 || getApps().length > 0) {
    firestore = admin.firestore();
    storage   = admin.storage();
}

export { firestore, storage, admin };

// ── Multi-Tenant SaaS Helpers ──
export const getTenantCollection = (empresaId, collectionName) => {
    const finalEmpresaId = empresaId || '6';

    const map = {
        'quotations': 'cgo_quotations',
        'client_profiles': 'cgo_clients',
        'suppliers': 'cgo_suppliers',
        'accounting_config': 'cgo_accounting_config',
        'purchases_ledger': 'cgo_purchases',
        'sales_ledger': 'cgo_sales',
        'portfolio_companies': 'cgo_portfolio_companies',
        'quote_leads': 'cgo_quote_leads'
    };
    const cgoCollection = map[collectionName] || collectionName;
    return firestore.collection('tenants').doc(String(finalEmpresaId)).collection(cgoCollection);
};

export const getTenantDoc = (empresaId) => {
    const finalEmpresaId = empresaId || '6';
    return firestore.collection('tenants').doc(String(finalEmpresaId));
};
