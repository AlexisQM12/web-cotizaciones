import admin from 'firebase-admin';
import 'dotenv/config';

const projectId  = process.env.FIREBASE_PROJECT_ID.trim().replace(/^["']|["']$/g, '');
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim().replace(/^["']|["']$/g, '');
const privateKey   = (process.env.FIREBASE_PRIVATE_KEY || '').trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
}

const db = admin.firestore();

async function run() {
    console.log('Querying last 30 quotations...');
    const snap = await db.collection('quotations').limit(100).get();
    console.log(`Found ${snap.size} quotations.`);

    let withImagesCount = 0;
    let oldWithImagesCount = 0;
    snap.docs.forEach(doc => {
        const data = doc.data();
        const items = data.items || [];
        
        // Let's see if any item has any property containing "image"
        const itemsWithImages = items.filter(item => {
            return Object.keys(item).some(key => key.toLowerCase().includes('image') && item[key]);
        });

        if (itemsWithImages.length > 0) {
            withImagesCount++;
            console.log(`\nQuotation: ID=${doc.id}, Code=${data.code || 'DRAFT'}, isPublished=${data.isPublished}`);
            itemsWithImages.forEach((item, idx) => {
                console.log(`  Item ${idx + 1}: ${item.name || item.description || '(no description)'}`);
                Object.keys(item).forEach(key => {
                    if (key.toLowerCase().includes('image')) {
                        console.log(`    ${key}: "${item[key]}"`);
                    }
                });
            });
        }
    });

    console.log(`\nTotal quotations with item images in some field: ${withImagesCount}`);
}

run().catch(console.error);
