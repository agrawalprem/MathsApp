/**
 * Script to view all documents in the user_scores collection
 * 
 * Usage:
 *   node view-user-scores.js
 */

const admin = require('firebase-admin');
const { loadServiceAccount } = require('./service-account');

// Initialize Firebase Admin SDK
const { serviceAccount } = loadServiceAccount();

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function viewUserScores() {
    try {
        console.log('📊 Fetching user_scores collection...\n');

        // Get all documents in user_scores collection
        const scoresRef = db.collection('user_scores');
        const snapshot = await scoresRef.get();

        if (snapshot.empty) {
            console.log('✅ user_scores collection is empty.');
            console.log('   No scores have been saved yet.');
            return;
        }

        console.log(`📈 Found ${snapshot.size} document(s) in user_scores collection\n`);
        console.log('═'.repeat(80));

        // Display each document
        snapshot.docs.forEach((doc, index) => {
            const data = doc.data();
            
            console.log(`\n📄 Document ${index + 1}:`);
            console.log(`   Document ID: ${doc.id}`);
            console.log(`   ──────────────────────────────────────────────────────────────`);
            
            // User Identification
            console.log(`   👤 User Identification:`);
            console.log(`      user_id: ${data.user_id || 'N/A'}`);
            console.log(`      user_code: ${data.user_code || 'N/A'}`);
            console.log(`      email: ${data.email || 'N/A'}`);
            
            // User Profile
            console.log(`   📋 User Profile:`);
            console.log(`      first_name: ${data.first_name || 'N/A'}`);
            console.log(`      last_name: ${data.last_name || 'N/A'}`);
            console.log(`      user_type: ${data.user_type || 'N/A'}`);
            console.log(`      gender: ${data.gender || 'N/A'}`);
            console.log(`      date_of_birth: ${data.date_of_birth ? (data.date_of_birth.toDate ? data.date_of_birth.toDate().toLocaleDateString() : data.date_of_birth) : 'N/A'}`);
            console.log(`      roll_number: ${data.roll_number || 'N/A'}`);
            
            // School and Class
            console.log(`   🏫 School and Class:`);
            console.log(`      school_id: ${data.school_id || 'N/A'}`);
            console.log(`      school_name: ${data.school_name || 'N/A'}`);
            console.log(`      class: ${data.class || 'N/A'}`);
            console.log(`      section: ${data.section || 'N/A'}`);
            
            // Score Fields
            console.log(`   📊 Score:`);
            console.log(`      operation: ${data.operation || 'N/A'}`);
            console.log(`      variant: ${data.variant || 'N/A'}`);
            console.log(`      correct_count: ${data.correct_count || 0}`);
            console.log(`      wrong_count: ${data.wrong_count || 0}`);
            console.log(`      total_questions: ${data.total_questions || 0}`);
            console.log(`      total_time: ${data.total_time || 0}s`);
            console.log(`      average_time: ${data.average_time || 0}s`);
            console.log(`      passed: ${data.passed ? '✅ Yes' : '❌ No'}`);
            
            // Check for removed fields
            if (data.completed_at !== undefined) {
                console.log(`   ⚠️  WARNING: 'completed_at' field found (should be removed)`);
            }
            if (data.created_at !== undefined) {
                console.log(`   ⚠️  WARNING: 'created_at' field found (should be removed)`);
            }
            
            console.log(`   ──────────────────────────────────────────────────────────────`);
        });

        console.log(`\n✅ Display complete. Total documents: ${snapshot.size}`);
        console.log(`\n💡 Note: Document ID serves as timestamp (${snapshot.docs[0]?.id || 'N/A'})`);

    } catch (error) {
        console.error('❌ Error viewing user_scores:', error);
        process.exit(1);
    }
}

// Run the viewer
viewUserScores()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
