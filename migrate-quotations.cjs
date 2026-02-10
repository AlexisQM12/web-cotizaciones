// Script to mark all existing quotations as published
// Run this once: node migrate-quotations.cjs

const admin = require('firebase-admin');

// Check if already initialized
if (!admin.apps.length) {
    try {
        const serviceAccount = require('./serviceAccountKey.json');
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (error) {
        console.error('❌ Error initializing Firebase Admin:', error.message);
        console.log('\nMake sure serviceAccountKey.json exists in the project root.');
        process.exit(1);
    }
}

const db = admin.firestore();

async function migrateQuotations() {
    try {
        console.log('🔄 Starting migration...\n');

        const quotationsRef = db.collection('quotations');
        const snapshot = await quotationsRef.get();

        console.log(`📊 Found ${snapshot.size} quotations\n`);

        const batch = db.batch();
        let count = 0;

        snapshot.docs.forEach(doc => {
            const data = doc.data();

            // Only update if isPublished doesn't exist
            if (data.isPublished === undefined || data.isPublished === null) {
                // Mark as published if it has a code, otherwise draft
                const shouldBePublished = data.code && data.code !== null;

                batch.update(doc.ref, {
                    isPublished: shouldBePublished
                });
                count++;
                console.log(`  ${shouldBePublished ? '✅' : '📝'} ${data.code || 'BORRADOR'} → isPublished: ${shouldBePublished}`);
            }
        });

        if (count > 0) {
            await batch.commit();
            console.log(`\n🎉 Migration completed! Updated ${count} quotations.`);
        } else {
            console.log('\n✅ All quotations already have isPublished field.');
        }

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    }
}

migrateQuotations();
