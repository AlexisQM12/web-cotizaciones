import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import 'dotenv/config';

let firestore = null;
let storage = null;

const defaultApp = admin.apps.find(app => app.name === '[DEFAULT]') || getApps().find(app => app.name === '[DEFAULT]');

if (!defaultApp) {
    try {
        // Sin paréntesis defensivo, si las tres variables faltan esto lanzaba
        // TypeError sobre undefined; el catch lo silenciaba y el fallo reaparecía
        // más tarde como un críptico "Failed to collect page data".
        const limpiar = (v) => (v || '').trim().replace(/^["']|["']$/g, '');
        const projectId  = limpiar(process.env.DB_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
        const clientEmail = (process.env.DB_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL)?.trim().replace(/^["']|["']$/g, '');
        let privateKey   = (process.env.DB_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY || '').trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');

        if (!projectId) {
            console.error('[Firebase] Falta el ID de proyecto: define DB_PROJECT_ID (o FIREBASE_PROJECT_ID). Sin él, todas las rutas de API fallarán.');
        }

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
    // Esto corre al importar el módulo. Si lanza, Next aborta la compilación con
    // "Failed to collect page data for <ruta>", señalando la ruta que estuviera
    // recolectando en ese momento en vez de la causa real. Lo hacemos explícito.
    try {
        firestore = admin.firestore();
        storage   = admin.storage();
    } catch (error) {
        console.error('[Firebase] No se pudo obtener Firestore/Storage:', error.message);
    }
}

export { firestore, storage, admin };

// ── Multi-Tenant SaaS Helpers ──
export const getTenantCollection = (empresaId, collectionName) => {
    if (!empresaId) throw new Error("empresaId is required to access tenant data");
    const finalEmpresaId = empresaId;

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
    if (!empresaId) throw new Error("empresaId is required to access tenant data");
    const finalEmpresaId = empresaId;
    return firestore.collection('tenants').doc(String(finalEmpresaId));
};
