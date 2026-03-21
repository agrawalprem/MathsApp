/**
 * Script to check date_of_birth formats in user_profiles collection
 * 
 * Usage:
 *   node check-dob-formats.js
 * 
 * This script:
 * 1. Fetches all user_profiles from Firestore
 * 2. Checks the format of date_of_birth for each profile
 * 3. Reports statistics on formats found
 * 4. Lists any profiles that still have Timestamp format
 */

const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account-key.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/**
 * Detect the format of date_of_birth
 */
function detectDOBFormat(dob) {
    if (!dob) {
        return 'null';
    }
    
    if (typeof dob === 'string') {
        // Check if it's in YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
            return 'string (YYYY-MM-DD)';
        } else {
            return 'string (other format)';
        }
    }
    
    if (dob.toDate && typeof dob.toDate === 'function') {
        return 'Firestore Timestamp';
    }
    
    if (dob instanceof Date) {
        return 'Date object';
    }
    
    if (dob.seconds && typeof dob.seconds === 'number') {
        return 'Timestamp (seconds property)';
    }
    
    return 'unknown';
}

/**
 * Convert date_of_birth to string for display
 */
function formatDOBForDisplay(dob) {
    if (!dob) return 'null';
    
    if (typeof dob === 'string') {
        return dob;
    }
    
    let dateObj = null;
    if (dob.toDate && typeof dob.toDate === 'function') {
        dateObj = dob.toDate();
    } else if (dob instanceof Date) {
        dateObj = dob;
    } else if (dob.seconds) {
        dateObj = new Date(dob.seconds * 1000);
    } else {
        return 'unparseable';
    }
    
    if (dateObj && !isNaN(dateObj.getTime())) {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    return 'invalid';
}

async function checkDOBFormats() {
    try {
        console.log('🔍 Checking date_of_birth formats in user_profiles...\n');

        // Fetch all user_profiles
        console.log('📥 Fetching all user_profiles from Firestore...');
        const snapshot = await db.collection('user_profiles').get();
        console.log(`✅ Found ${snapshot.size} user profiles\n`);

        const formatCounts = {};
        const timestampProfiles = [];
        const otherFormatProfiles = [];

        snapshot.forEach((doc) => {
            const userCode = doc.id;
            const data = doc.data();
            const dob = data.date_of_birth;
            
            const format = detectDOBFormat(dob);
            
            // Count formats
            formatCounts[format] = (formatCounts[format] || 0) + 1;
            
            // Collect profiles that need conversion
            if (format === 'Firestore Timestamp' || format === 'Timestamp (seconds property)' || format === 'Date object') {
                timestampProfiles.push({
                    userCode: userCode,
                    format: format,
                    value: formatDOBForDisplay(dob)
                });
            } else if (format === 'string (other format)') {
                otherFormatProfiles.push({
                    userCode: userCode,
                    format: format,
                    value: dob
                });
            }
        });

        // Print statistics
        console.log('📊 Format Statistics:');
        console.log('─'.repeat(50));
        Object.entries(formatCounts).forEach(([format, count]) => {
            console.log(`   ${format.padEnd(30)}: ${count} profiles`);
        });
        console.log('─'.repeat(50));
        console.log(`   Total: ${snapshot.size} profiles\n`);

        // Report profiles that need conversion
        if (timestampProfiles.length > 0) {
            console.log(`⚠️  Found ${timestampProfiles.length} profiles with Timestamp/Date format:`);
            console.log('─'.repeat(50));
            timestampProfiles.forEach(profile => {
                console.log(`   User ${profile.userCode}: ${profile.format} → "${profile.value}"`);
            });
            console.log('─'.repeat(50));
            console.log(`\n💡 Run 'node convert-dob-to-string.js' to convert these to string format.\n`);
        } else {
            console.log('✅ No Timestamp/Date formats found - all dates are strings!\n');
        }

        // Report other string formats
        if (otherFormatProfiles.length > 0) {
            console.log(`⚠️  Found ${otherFormatProfiles.length} profiles with non-standard string format:`);
            console.log('─'.repeat(50));
            otherFormatProfiles.forEach(profile => {
                console.log(`   User ${profile.userCode}: "${profile.value}"`);
            });
            console.log('─'.repeat(50));
            console.log(`\n💡 These should be converted to YYYY-MM-DD format.\n`);
        }

        // Summary
        if (timestampProfiles.length === 0 && otherFormatProfiles.length === 0) {
            console.log('✅ All date_of_birth values are in correct format (YYYY-MM-DD string)!\n');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// Run the script
checkDOBFormats()
    .then(() => {
        console.log('✅ Check completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Check failed:', error);
        process.exit(1);
    });
