/**
 * Script to add email field to user_profiles by fetching from Firebase Auth
 * 
 * This script:
 * 1. Reads all user_profiles from Firestore
 * 2. For each profile with a user_id, fetches the email from Firebase Auth
 * 3. Updates the user_profiles document with the email field
 * 
 * Usage:
 *   node Utilities/add-email-to-user-profiles.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../firebase-service-account-key.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function addEmailToUserProfiles() {
    try {
        console.log('🚀 Starting email update for user_profiles...\n');

        // Get all user_profiles
        const profilesRef = db.collection('user_profiles');
        const snapshot = await profilesRef.get();

        if (snapshot.empty) {
            console.log('✅ No user profiles found.');
            return;
        }

        console.log(`📊 Found ${snapshot.size} user profiles\n`);

        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;
        const errors = [];

        // Process in batches to avoid overwhelming Firebase
        const batchSize = 10;
        let batch = db.batch();
        let batchCount = 0;

        for (const docSnap of snapshot.docs) {
            try {
                const userCode = docSnap.id;
                const profileData = docSnap.data();
                const userId = profileData.user_id;

                // Skip if no user_id
                if (!userId) {
                    console.log(`⏭️  Skipping ${userCode}: No user_id`);
                    skipCount++;
                    continue;
                }

                // Skip if email already exists
                if (profileData.email) {
                    console.log(`⏭️  Skipping ${userCode}: Email already exists (${profileData.email})`);
                    skipCount++;
                    continue;
                }

                // Fetch email from Firebase Auth
                let email = null;
                try {
                    const userRecord = await admin.auth().getUser(userId);
                    email = userRecord.email || null;
                    
                    if (!email) {
                        console.log(`⚠️  Warning: User ${userId} (${userCode}) has no email in Auth`);
                        errorCount++;
                        errors.push({
                            user_code: userCode,
                            user_id: userId,
                            error: 'No email in Firebase Auth'
                        });
                        continue;
                    }
                } catch (authError) {
                    console.log(`❌ Error fetching Auth user for ${userCode} (${userId}):`, authError.message);
                    errorCount++;
                    errors.push({
                        user_code: userCode,
                        user_id: userId,
                        error: authError.message
                    });
                    continue;
                }

                // Update profile with email
                const profileRef = db.collection('user_profiles').doc(userCode);
                batch.update(profileRef, { email: email });
                batchCount++;
                successCount++;

                console.log(`✅ Updated ${userCode}: ${email}`);

                // Commit batch when it reaches the limit
                if (batchCount >= batchSize) {
                    await batch.commit();
                    console.log(`\n📦 Committed batch: ${batchCount} updates\n`);
                    batch = db.batch();
                    batchCount = 0;
                }

            } catch (error) {
                const userCode = docSnap.id;
                console.error(`❌ Error processing ${userCode}:`, error.message);
                errorCount++;
                errors.push({
                    user_code: userCode,
                    error: error.message
                });
            }
        }

        // Commit remaining updates
        if (batchCount > 0) {
            await batch.commit();
            console.log(`\n📦 Committed final batch: ${batchCount} updates\n`);
        }

        // Summary
        console.log('\n============================================================');
        console.log('📊 Update Summary');
        console.log('============================================================');
        console.log(`✅ Successfully updated: ${successCount} profiles`);
        console.log(`⏭️  Skipped: ${skipCount} profiles`);
        console.log(`❌ Errors: ${errorCount} profiles`);
        console.log(`📦 Total processed: ${snapshot.size} profiles`);

        if (errors.length > 0) {
            console.log('\n❌ Errors:');
            errors.forEach(err => {
                console.log(`   - ${err.user_code || 'unknown'}: ${err.error}`);
            });
        }

        console.log('\n✅ Script completed successfully');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Run the script
addEmailToUserProfiles()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
