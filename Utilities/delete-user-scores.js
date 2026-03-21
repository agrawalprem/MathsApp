/**
 * Script to delete all documents from the user_scores collection in Firestore
 * 
 * WARNING: This will permanently delete all score records!
 * The collection will be automatically recreated when the first new score is saved.
 * 
 * Usage:
 *   node delete-user-scores.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../firebase-service-account-key.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteUserScores() {
    try {
        console.log('🗑️  Starting deletion of user_scores collection...\n');

        // Get all documents in user_scores collection
        const scoresRef = db.collection('user_scores');
        const snapshot = await scoresRef.get();

        if (snapshot.empty) {
            console.log('✅ user_scores collection is already empty.');
            return;
        }

        console.log(`📊 Found ${snapshot.size} documents to delete\n`);

        // Delete in batches (Firestore batch limit is 500)
        const batchSize = 500;
        let deletedCount = 0;
        let batch = db.batch();
        let batchCount = 0;

        for (const doc of snapshot.docs) {
            batch.delete(doc.ref);
            batchCount++;
            deletedCount++;

            // Commit batch when it reaches the limit
            if (batchCount >= batchSize) {
                await batch.commit();
                console.log(`✅ Deleted batch: ${deletedCount} documents so far...`);
                batch = db.batch();
                batchCount = 0;
            }
        }

        // Commit remaining documents
        if (batchCount > 0) {
            await batch.commit();
        }

        console.log(`\n✅ Successfully deleted ${deletedCount} documents from user_scores collection`);
        console.log('\n📝 Note: The collection will be automatically recreated when the first new score is saved.');

    } catch (error) {
        console.error('❌ Error deleting user_scores:', error);
        process.exit(1);
    }
}

// Run the deletion
deleteUserScores()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
