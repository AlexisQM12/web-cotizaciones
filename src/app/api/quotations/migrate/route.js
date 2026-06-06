import { firestore, getTenantCollection, getTenantDoc } from '@/lib/firebase-admin';

// Allow GET request so user can just open this URL in browser
export async function GET(req) {
    try {
        console.log('🔄 Starting migration of quotations...');

        const quotationsRef = getTenantCollection(typeof empresaId !== 'undefined' ? empresaId : 'ayatech', 'quotations');
        const snapshot = await quotationsRef.get();

        console.log(`📊 Found ${snapshot.size} quotations`);

        const batch = firestore.batch();
        let count = 0;
        let results = [];

        snapshot.docs.forEach(doc => {
            const data = doc.data();

            // Only update if isPublished doesn't exist
            if (data.isPublished === undefined || data.isPublished === null) {
                // Mark as published if it has a code, otherwise draft
                const shouldBePublished = !!(data.code && data.code !== null);

                batch.update(doc.ref, {
                    isPublished: shouldBePublished
                });
                count++;
                results.push({
                    id: doc.id,
                    code: data.code || 'BORRADOR',
                    isPublished: shouldBePublished
                });
            }
        });

        if (count > 0) {
            await batch.commit();
            console.log(`✅ Migration completed! Updated ${count} quotations.`);

            return Response.json({
                success: true,
                message: `✅ Successfully migrated ${count} quotations`,
                results
            });
        } else {
            return Response.json({
                success: true,
                message: '✅ All quotations already have isPublished field. No migration needed.',
                results: []
            });
        }
    } catch (error) {
        console.error('❌ Migration failed:', error);
        return Response.json({
            success: false,
            error: 'Migration failed',
            details: error.message
        }, { status: 500 });
    }
}

export async function POST(req) {
    // Also support POST for compatibility
    return GET(req);
}
