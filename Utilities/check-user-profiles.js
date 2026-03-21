/**
 * Script to check user_profiles collection and see how school_id, class, section are stored
 * 
 * Usage:
 *   node check-user-profiles.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./firebase-service-account-key.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkUserProfiles() {
    try {
        console.log('📊 Checking user_profiles collection...\n');

        // Get all student profiles
        const profilesRef = db.collection('user_profiles');
        const snapshot = await profilesRef.where('user_type', '==', 'Student').get();

        if (snapshot.empty) {
            console.log('✅ No student profiles found.');
            return;
        }

        console.log(`📈 Found ${snapshot.size} student profile(s)\n`);
        console.log('═'.repeat(80));

        // Group by school_id to see what values exist
        const schoolIds = new Set();
        const classSectionCombos = new Set();
        
        snapshot.docs.forEach((doc, index) => {
            const data = doc.data();
            
            const schoolId = data.school_id;
            const schoolIdType = schoolId !== null && schoolId !== undefined ? typeof schoolId : 'null/undefined';
            const classVal = data.class;
            const sectionVal = data.section;
            
            schoolIds.add(`${schoolId} (${schoolIdType})`);
            if (classVal && sectionVal) {
                classSectionCombos.add(`${classVal}${sectionVal}`);
            }
            
            if (index < 5) { // Show first 5 examples
                console.log(`\n📄 Student ${index + 1}:`);
                console.log(`   Document ID (user_code): ${doc.id}`);
                console.log(`   school_id: ${schoolId} (type: ${schoolIdType})`);
                console.log(`   class: ${classVal} (type: ${typeof classVal})`);
                console.log(`   section: ${sectionVal} (type: ${typeof sectionVal})`);
                console.log(`   user_type: ${data.user_type}`);
                console.log(`   first_name: ${data.first_name || 'N/A'}`);
                console.log(`   last_name: ${data.last_name || 'N/A'}`);
            }
        });

        console.log(`\n\n📊 Summary:`);
        console.log(`   Total students: ${snapshot.size}`);
        console.log(`   Unique school_id values: ${Array.from(schoolIds).join(', ')}`);
        console.log(`   Unique class+section combinations: ${Array.from(classSectionCombos).sort().join(', ')}`);
        
        // Check specifically for school_id "2000" or 2000
        const school2000Students = snapshot.docs.filter(doc => {
            const data = doc.data();
            const sid = data.school_id;
            return sid === '2000' || sid === 2000 || String(sid) === '2000';
        });
        
        console.log(`\n🔍 Students with school_id matching "2000" or 2000: ${school2000Students.length}`);
        if (school2000Students.length > 0) {
            console.log(`   Class+Section breakdown:`);
            const breakdown = {};
            school2000Students.forEach(doc => {
                const data = doc.data();
                const key = `${data.class || 'N/A'}${data.section || 'N/A'}`;
                breakdown[key] = (breakdown[key] || 0) + 1;
            });
            Object.entries(breakdown).sort().forEach(([key, count]) => {
                console.log(`     ${key}: ${count} student(s)`);
            });
        }

    } catch (error) {
        console.error('❌ Error checking user_profiles:', error);
        process.exit(1);
    }
}

// Run the check
checkUserProfiles()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
