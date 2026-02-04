import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '../../');
const envPath = join(rootDir, '.env');

console.log('--- FIREBASE DEBUG ---');
console.log('Project Root:', rootDir);
console.log('Dotenv Path:', envPath);
if (fs.existsSync(envPath)) {
    console.log('.env file exists at this path.');
    const result = dotenv.config({ path: envPath });
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
if (!admin.apps.length) {
    try {
        if (process.env.FIREBASE_PROJECT_ID) {
            const projectId = process.env.FIREBASE_PROJECT_ID.trim().replace(/^["']|["']$/g, '');
            const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim().replace(/^["']|["']$/g, '');

            let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
            privateKey = privateKey.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');

            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
                storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim().replace(/^["']|["']$/g, '')
            });
            firestore = admin.firestore();
            storage = admin.storage();
            console.log('Firebase initialized successfully!');
        } else {
            console.warn('Firebase Admin SDK not initialized: Missing credentials.');
        }
    } catch (error) {
        console.error('Firebase admin initialization error', error);
    }
}

if (admin.apps.length > 0) {
    firestore = admin.firestore();
    storage = admin.storage();
}

export { firestore, storage, admin };
