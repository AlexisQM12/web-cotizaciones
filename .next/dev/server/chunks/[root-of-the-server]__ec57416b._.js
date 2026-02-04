module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[externals]/os [external] (os, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("os", () => require("os"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/url [external] (url, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("url", () => require("url"));

module.exports = mod;
}),
"[project]/src/lib/firebase-admin.js [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "firestore",
    ()=>firestore,
    "storage",
    ()=>storage
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__ = __turbopack_context__.i("[externals]/firebase-admin [external] (firebase-admin, cjs, [project]/node_modules/firebase-admin)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$dotenv$2f$lib$2f$main$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/dotenv/lib/main.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$url__$5b$external$5d$__$28$url$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/url [external] (url, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs [external] (fs, cjs)");
const __TURBOPACK__import$2e$meta__ = {
    get url () {
        return `file://${__turbopack_context__.P("src/lib/firebase-admin.js")}`;
    }
};
;
;
;
;
;
const __filename = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$url__$5b$external$5d$__$28$url$2c$__cjs$29$__["fileURLToPath"])(__TURBOPACK__import$2e$meta__.url);
const __dirname = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["dirname"])(__filename);
const rootDir = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"])(__dirname, '../../');
const envPath = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"])(rootDir, '.env');
console.log('--- FIREBASE DEBUG ---');
console.log('Project Root:', rootDir);
console.log('Dotenv Path:', envPath);
if (__TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].existsSync(envPath)) {
    console.log('.env file exists at this path.');
    const result = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$dotenv$2f$lib$2f$main$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].config({
        path: envPath
    });
    if (result.error) console.error('Dotenv Error:', result.error);
    else console.log('Dotenv loaded successfully.');
} else {
    console.error('.env file DOES NOT exist at expected path.');
}
console.log('Project ID in process.env:', process.env.FIREBASE_PROJECT_ID || 'MISSING');
console.log('----------------------');
let firestore = null;
let storage = null;
// Initialize Firebase Admin
if (!__TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__["default"].apps.length) {
    try {
        if (process.env.FIREBASE_PROJECT_ID) {
            const projectId = process.env.FIREBASE_PROJECT_ID.trim().replace(/^["']|["']$/g, '');
            const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim().replace(/^["']|["']$/g, '');
            let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
            privateKey = privateKey.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
            __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__["default"].initializeApp({
                credential: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__["default"].credential.cert({
                    projectId,
                    clientEmail,
                    privateKey
                }),
                storageBucket: ("TURBOPACK compile-time value", "web-cot-aya.firebasestorage.app")?.trim().replace(/^["']|["']$/g, '')
            });
            firestore = __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__["default"].firestore();
            storage = __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__["default"].storage();
            console.log('Firebase initialized successfully!');
        } else {
            console.warn('Firebase Admin SDK not initialized: Missing credentials.');
        }
    } catch (error) {
        console.error('Firebase admin initialization error', error);
    }
}
if (__TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__["default"].apps.length > 0) {
    firestore = __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__["default"].firestore();
    storage = __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__["default"].storage();
}
;
}),
"[project]/src/app/api/quotations/[id]/route.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DELETE",
    ()=>DELETE,
    "GET",
    ()=>GET,
    "PUT",
    ()=>PUT
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/lib/firebase-admin.js [app-route] (ecmascript) <locals>");
;
async function GET(req, { params }) {
    try {
        const { id } = await params;
        // Fetch everything in parallel without server-side sorting
        const [quoteDoc, companySnap, clientSnap, settingsSnap] = await Promise.all([
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('quotations').doc(id).get(),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('company_profiles').get(),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('client_profiles').get(),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('settings').doc('general_conditions').get()
        ]);
        if (!quoteDoc.exists) return Response.json({
            error: 'Not found'
        }, {
            status: 404
        });
        const quotation = {
            id: quoteDoc.id,
            ...quoteDoc.data()
        };
        // Sort Company Profiles in JS
        const companyProfiles = companySnap.docs.map((doc)=>({
                id: doc.id,
                ...doc.data()
            }));
        companyProfiles.sort((a, b)=>{
            if (a.isDefault !== b.isDefault) return b.isDefault ? 1 : -1;
            return (a.name || '').localeCompare(b.name || '');
        });
        // Sort Client Profiles in JS
        const clientProfiles = clientSnap.docs.map((doc)=>({
                id: doc.id,
                ...doc.data()
            }));
        clientProfiles.sort((a, b)=>{
            if (a.isDefault !== b.isDefault) return b.isDefault ? 1 : -1;
            return (a.name || '').localeCompare(b.name || '');
        });
        // Determine general conditions from the quotation's selected company
        let conditionsText = '';
        const selectedCompanyId = quotation.companyProfileId || companyProfiles.find((cp)=>cp.isDefault)?.id;
        const selectedCompany = companyProfiles.find((cp)=>cp.id === selectedCompanyId?.toString());
        if (selectedCompany && selectedCompany.conditions) {
            conditionsText = selectedCompany.conditions;
        } else if (settingsSnap.exists) {
            conditionsText = settingsSnap.data().text || '';
        }
        const generalConditions = {
            text: conditionsText
        };
        return Response.json({
            ...quotation,
            companyProfiles,
            clientProfiles,
            generalConditions
        });
    } catch (error) {
        console.error('API Error (quotation-detail):', error);
        return Response.json({
            error: 'Failed to fetch quotation',
            details: error.message
        }, {
            status: 500
        });
    }
}
async function PUT(req, { params }) {
    try {
        const { id } = await params;
        const body = await req.json();
        // In Firestore, we store everything in the same document
        const updateData = {
            ...body,
            updatedAt: new Date().toISOString()
        };
        // Ensure total is calculated if not provided
        if (body.items) {
            updateData.total = body.items.reduce((acc, item)=>acc + parseFloat(item.quantity || 0) * parseFloat(item.price || 0), 0);
        }
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('quotations').doc(id).update(updateData);
        return Response.json({
            success: true
        });
    } catch (error) {
        console.error(error);
        return Response.json({
            error: 'Failed to update quotation'
        }, {
            status: 500
        });
    }
}
async function DELETE(req, { params }) {
    try {
        const { id } = await params;
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('quotations').doc(id).delete();
        return Response.json({
            success: true
        });
    } catch (error) {
        console.error(error);
        return Response.json({
            error: 'Failed to delete quotation'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__ec57416b._.js.map