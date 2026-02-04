// Firestore Client for Browser (Realtime Listeners)
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'web-cot-aya',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'web-cot-aya.firebasestorage.app',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase for client-side Firestore
let clientApp;
let clientDb;

if (typeof window !== 'undefined') {
    clientApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    clientDb = getFirestore(clientApp);
} else {
    clientApp = null;
    clientDb = null;
}

export { clientDb };
export default clientApp;
