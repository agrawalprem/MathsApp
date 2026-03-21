/**
 * Script to remove email field from all user_profiles documents
 * 
 * This ensures email is only stored in Firebase Auth (single source of truth),
 * matching the Supabase approach where email column was deleted.
 * 
 * Usage:
 *   node remove-email-from-user-profiles.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account-key.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function removeEmailFromUserProfiles() {
    try {
        console.log('🗑️  Starting removal of email field from user_profiles...\n');

        // Fetch all user_profiles
        console.log('📥 Fetching all user_profiles from Firestore...');
        const snapshot = await db.collection('user_profiles').get();
        console.log(`✅ Found ${snapshot.size} user profiles\n`);

        if (snapshot.empty) {
            console.log('ℹ️  No user profiles found.');
            return;
        }

        // Delete email field in batches
        const batchSize = 500;
        let updatedCount = 0;
        let skippedCount = 0;
        let batch = db.batch();
        let batchCount = 0;

        for (const doc of snapshot.docs) {
            const userCode = doc.id;
            const data = doc.data();
            
            // Only update if email field exists
            if (data.email !== undefined) {
                batch.update(doc.ref, {
                    email: admin.firestore.FieldValue.delete()
                });
                batchCount++;
                updatedCount++;

                // Commit batch when it reaches the limit
                if (batchCount >= batchSize) {
                    await batch.commit();
                    console.log(`✅ Updated batch: ${updatedCount} profiles so far...`);
                    batch = db.batch();
                    batchCount = 0;
                }
            } else {
                skippedCount++;
            }
        }

        // Commit remaining updates
        if (batchCount > 0) {
            await batch.commit();
        }

        console.log(`\n✅ Successfully removed email field from ${updatedCount} profiles`);
        console.log(`   ℹ️  Skipped ${skippedCount} profiles (no email field)`);
        console.log(`\n📝 Email is now only stored in Firebase Auth (single source of truth)`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// Run the script
removeEmailFromUserProfiles()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
