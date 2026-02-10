// Script to mark all existing quotations as published
// Run this once: node migrate-quotations.js

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateQuotations() {
    try {
        console.log('🔄 Starting migration...');

        const quotationsRef = db.collection('quotations');
        const snapshot = await quotationsRef.get();

        console.log(`📊 Found ${snapshot.size} quotations to migrate`);

        const batch = db.batch();
        let count = 0;

        snapshot.docs.forEach(doc => {
            const data = doc.data();

            // Only update if isPublished doesn't exist or if it has a code
            if (data.isPublished === undefined) {
                batch.update(doc.ref, {
                    isPublished: data.code ? true : false
                });
                count++;
                console.log(`  ✓ Updating ${doc.id}: ${data.code || 'DRAFT'} → isPublished: ${data.code ? 'true' : 'false'}`);
            }
        });

        if (count > 0) {
            await batch.commit();
            console.log(`\n✅ Migration completed! Updated ${count} quotations.`);
        } else {
            console.log('\n✅ No quotations needed migration.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrateQuotations();
