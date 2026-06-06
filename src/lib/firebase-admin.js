import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import 'dotenv/config';

let firestore = null;
let storage = null;

const defaultApp = admin.apps.find(app => app.name === '[DEFAULT]') || getApps().find(app => app.name === '[DEFAULT]');

if (!defaultApp) {
    try {
        const projectId  = (process.env.DB_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID).trim().replace(/^["']|["']$/g, '');
        const clientEmail = (process.env.DB_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL)?.trim().replace(/^["']|["']$/g, '');
        let privateKey   = (process.env.DB_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY || '').trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');

        if (clientEmail && privateKey) {
            admin.initializeApp({
                credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
                storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim().replace(/^["']|["']$/g, ''),
            });
            console.log('[Firebase] Admin SDK iniciado correctamente con Service Account para el proyecto:', projectId);
        } else {
            // Fallback to Application Default Credentials
            admin.initializeApp({
                projectId: projectId,
                storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim().replace(/^["']|["']$/g, ''),
            });
            console.log('[Firebase] Admin SDK iniciado con ADC para el proyecto:', projectId);
        }
    } catch (error) {
        console.error('[Firebase] Error al inicializar:', error.message);
    }
}

if (admin.apps.find(app => app.name === '[DEFAULT]') || getApps().find(app => app.name === '[DEFAULT]')) {
    firestore = admin.firestore();
    storage   = admin.storage();
}

export { firestore, storage, admin };

// ── Multi-Tenant SaaS Helpers ──
export const getTenantCollection = (empresaId, collectionName) => {
    const finalEmpresaId = empresaId || 'ayatech';

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
    const finalEmpresaId = empresaId || 'ayatech';
    return firestore.collection('tenants').doc(String(finalEmpresaId));
};
