/**
 * Script to convert date_of_birth from Firestore Timestamp to string (YYYY-MM-DD) in user_profiles collection
 * 
 * Usage:
 *   node convert-dob-to-string.js
 * 
 * This script:
 * 1. Fetches all user_profiles from Firestore
 * 2. For each profile with date_of_birth as Timestamp:
 *    - Converts to YYYY-MM-DD string using local date components
 *    - Updates the document
 * 3. Reports how many were converted
 */

const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account-key.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/**
 * Convert date_of_birth to YYYY-MM-DD string
 * Handles Firestore Timestamp, Date object, or string
 */
function convertDateOfBirthToString(dob) {
    if (!dob) return null;
    
    // If it's already a string, return as-is
    if (typeof dob === 'string') {
        return dob;
    }
    
    // If it's a Firestore Timestamp, convert to Date first
    let dateObj = null;
    if (dob.toDate && typeof dob.toDate === 'function') {
        dateObj = dob.toDate();
    } else if (dob instanceof Date) {
        dateObj = dob;
    } else if (dob.seconds) {
        // Firestore Timestamp object with seconds property
        dateObj = new Date(dob.seconds * 1000);
    } else {
        // Try to parse as Date
        dateObj = new Date(dob);
    }
    
    // Convert to YYYY-MM-DD using LOCAL date components (not UTC)
    // This prevents timezone shifts
    if (dateObj && !isNaN(dateObj.getTime())) {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    return null;
}

async function convertDOBToString() {
    try {
        console.log('🔄 Starting date_of_birth conversion from Timestamp to string...\n');

        // Fetch all user_profiles
        console.log('📥 Fetching all user_profiles from Firestore...');
        const snapshot = await db.collection('user_profiles').get();
        console.log(`✅ Found ${snapshot.size} user profiles\n`);

        let convertedCount = 0;
        let alreadyStringCount = 0;
        let nullCount = 0;
        let errorCount = 0;

        for (const docSnapshot of snapshot.docs) {
            const userCode = docSnapshot.id;
            const userData = docSnapshot.data();
            const currentDOB = userData.date_of_birth;

            // Skip if no date_of_birth
            if (!currentDOB) {
                nullCount++;
                continue;
            }

            // Skip if already a string
            if (typeof currentDOB === 'string') {
                alreadyStringCount++;
                continue;
            }

            try {
                // Convert to string
                const dobString = convertDateOfBirthToString(currentDOB);
                
                if (!dobString) {
                    console.log(`⚠️  User ${userCode}: Could not convert date_of_birth`);
                    errorCount++;
                    continue;
                }

                // Update the document
                await docSnapshot.ref.update({
                    date_of_birth: dobString
                });

                console.log(`✅ User ${userCode}: ${currentDOB.constructor?.name || typeof currentDOB} → "${dobString}"`);
                convertedCount++;

            } catch (error) {
                console.error(`❌ Error processing user ${userCode}:`, error.message);
                errorCount++;
            }
        }

        console.log('\n📊 Summary:');
        console.log(`   ✅ Converted: ${convertedCount} users`);
        console.log(`   ℹ️  Already string: ${alreadyStringCount} users`);
        console.log(`   ⚠️  No date_of_birth: ${nullCount} users`);
        console.log(`   ❌ Errors: ${errorCount} users`);
        console.log(`   📝 Total: ${snapshot.size} users`);

        console.log('\n✅ Conversion complete!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run the script
convertDOBToString()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
