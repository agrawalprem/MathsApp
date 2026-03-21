/**
 * Script to check date_of_birth formats in user_scores collection
 * 
 * Usage:
 *   node check-user-scores-dob.js
 * 
 * This script:
 * 1. Fetches user_scores from Firestore (sampled or all)
 * 2. Checks the format of date_of_birth for each score
 * 3. Reports statistics on formats found
 * 4. Lists any scores that still have Timestamp format
 */

const admin = require('firebase-admin');
const { loadServiceAccount } = require('./service-account');
const { serviceAccount } = loadServiceAccount();

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

async function checkUserScoresDOB() {
    try {
        console.log('🔍 Checking date_of_birth formats in user_scores...\n');

        // Fetch user_scores (limit to first 1000 for performance, or remove limit to check all)
        console.log('📥 Fetching user_scores from Firestore...');
        const snapshot = await db.collection('user_scores')
            .limit(1000) // Check first 1000 documents
            .get();
        
        const totalCount = snapshot.size;
        console.log(`✅ Found ${totalCount} score documents (checking first 1000)\n`);

        if (totalCount === 0) {
            console.log('ℹ️  No score documents found in user_scores collection.\n');
            return;
        }

        const formatCounts = {};
        const timestampScores = [];
        const otherFormatScores = [];

        snapshot.forEach((doc) => {
            const docId = doc.id;
            const data = doc.data();
            const dob = data.date_of_birth;
            
            const format = detectDOBFormat(dob);
            
            // Count formats
            formatCounts[format] = (formatCounts[format] || 0) + 1;
            
            // Collect scores that need conversion
            if (format === 'Firestore Timestamp' || format === 'Timestamp (seconds property)' || format === 'Date object') {
                timestampScores.push({
                    docId: docId,
                    format: format,
                    value: formatDOBForDisplay(dob),
                    userCode: data.user_code || 'N/A',
                    operation: data.operation || 'N/A',
                    variant: data.variant || 'N/A'
                });
            } else if (format === 'string (other format)') {
                otherFormatScores.push({
                    docId: docId,
                    format: format,
                    value: dob,
                    userCode: data.user_code || 'N/A'
                });
            }
        });

        // Print statistics
        console.log('📊 Format Statistics:');
        console.log('─'.repeat(50));
        Object.entries(formatCounts).forEach(([format, count]) => {
            console.log(`   ${format.padEnd(30)}: ${count} scores`);
        });
        console.log('─'.repeat(50));
        console.log(`   Total checked: ${totalCount} scores\n`);

        // Report scores that need conversion
        if (timestampScores.length > 0) {
            console.log(`⚠️  Found ${timestampScores.length} scores with Timestamp/Date format:`);
            console.log('─'.repeat(80));
            timestampScores.slice(0, 20).forEach(score => { // Show first 20
                console.log(`   Doc ${score.docId}: ${score.format} → "${score.value}" (User: ${score.userCode}, ${score.operation}/${score.variant})`);
            });
            if (timestampScores.length > 20) {
                console.log(`   ... and ${timestampScores.length - 20} more`);
            }
            console.log('─'.repeat(80));
            console.log(`\n💡 These need to be converted to string format.\n`);
        } else {
            console.log('✅ No Timestamp/Date formats found - all dates are strings!\n');
        }

        // Report other string formats
        if (otherFormatScores.length > 0) {
            console.log(`⚠️  Found ${otherFormatScores.length} scores with non-standard string format:`);
            console.log('─'.repeat(50));
            otherFormatScores.slice(0, 10).forEach(score => { // Show first 10
                console.log(`   Doc ${score.docId}: "${score.value}" (User: ${score.userCode})`);
            });
            if (otherFormatScores.length > 10) {
                console.log(`   ... and ${otherFormatScores.length - 10} more`);
            }
            console.log('─'.repeat(50));
            console.log(`\n💡 These should be converted to YYYY-MM-DD format.\n`);
        }

        // Summary
        if (timestampScores.length === 0 && otherFormatScores.length === 0) {
            console.log('✅ All date_of_birth values in user_scores are in correct format (YYYY-MM-DD string)!\n');
        } else {
            console.log(`\n💡 To convert Timestamp values, update summary.html to ensure it converts properly.\n`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// Run the script
checkUserScoresDOB()
    .then(() => {
        console.log('✅ Check completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Check failed:', error);
        process.exit(1);
    });
