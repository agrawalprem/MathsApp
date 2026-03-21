// ============================================================================
// UPLOAD USER PROFILES TO FIRESTORE FROM EXCEL
// ============================================================================
// This script reads user_profiles from Excel and uploads to Firestore
// Run: node upload-user-profiles.js
// ============================================================================

const admin = require('firebase-admin');
const XLSX = require('xlsx');
const fs = require('fs');

// Note: Email and Password are now read from Excel file
// No auto-generation - user must provide them in the Excel file

// Initialize Firebase Admin SDK
// You'll need to download service account key from Firebase Console
// Go to: Project Settings → Service Accounts → Generate New Private Key

// Find the Firebase service account key file (any name with firebase-adminsdk)
let serviceAccountPath = './firebase-service-account-key.json';
if (!fs.existsSync(serviceAccountPath)) {
    // Try to find any file with firebase-adminsdk in the name
    const files = fs.readdirSync('.');
    const firebaseKeyFile = files.find(f => f.includes('firebase-adminsdk') && f.endsWith('.json'));
    if (firebaseKeyFile) {
        serviceAccountPath = firebaseKeyFile;
        console.log(`📁 Found Firebase key file: ${firebaseKeyFile}`);
    } else {
        throw new Error('Firebase service account key file not found! Please download it from Firebase Console and place it in this folder.');
    }
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function uploadUserProfiles() {
    try {
        // Read Excel file (try both possible filenames)
        let filename = 'user_profiles.xlsx';
        if (!fs.existsSync(filename)) {
            filename = 'user_profiles_export.xlsx';
        }
        if (!fs.existsSync(filename)) {
            throw new Error('Excel file not found! Please save your file as user_profiles.xlsx in this directory.');
        }
        console.log(`📖 Reading ${filename}...`);
        
        const workbook = XLSX.readFile(filename);
        // Get the first worksheet (Excel files usually have one sheet)
        const sheetName = workbook.SheetNames[0];
        console.log(`📄 Using worksheet: "${sheetName}"`);
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        console.log(`✅ Found ${data.length} records in Excel file`);
        
        // Upload to Firestore
        console.log('📤 Uploading to Firestore...');
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            
            try {
                // Convert user code to string (Firestore document IDs must be strings)
                const userCode = String(row['User Code'] || '').trim();
                
                if (!userCode || userCode === '') {
                    console.warn(`⚠️ Skipping row ${i + 1}: No User Code`);
                    errorCount++;
                    continue;
                }
                
                // Get email and password from Excel (required)
                const email = row['Email'];
                const password = row['Password'];
                
                if (!email || !password) {
                    console.warn(`⚠️ Skipping row ${i + 1}: Missing Email or Password`);
                    console.warn(`   User Code: ${userCode}, Email: ${email || 'MISSING'}, Password: ${password ? '***' : 'MISSING'}`);
                    errorCount++;
                    continue;
                }
                
                // Use user_code as document ID (or user_id if available)
                const docId = row['User ID'] || userCode;
                
                console.log(`\n📤 Processing user ${i + 1}/${data.length}: ${userCode}`);
                console.log(`   Email: ${email}`);
                console.log(`   Password: ${password ? '***' : 'MISSING'}`);
                
                // Step 1: Check if Firestore document already exists
                const existingDoc = await db.collection('user_profiles').doc(userCode).get();
                const isExistingUser = existingDoc.exists;
                
                if (isExistingUser) {
                    console.log(`   ⚠️ User profile already exists in Firestore`);
                }
                
                // Step 2: Create or get Firebase Authentication user
                let authUser;
                try {
                    authUser = await admin.auth().createUser({
                        email: email,
                        password: password,
                        emailVerified: false,
                        disabled: false
                    });
                    console.log(`   ✅ Auth user created: ${authUser.uid}`);
                } catch (authError) {
                    if (authError.code === 'auth/email-already-exists') {
                        console.log(`   ⚠️ Auth user already exists, using existing user`);
                        // Get existing user
                        authUser = await admin.auth().getUserByEmail(email);
                        console.log(`   ✅ Using existing Auth user: ${authUser.uid}`);
                    } else {
                        throw authError;
                    }
                }
                
                // Step 3: Prepare Firestore document
                // Use class as-is from Excel (already updated)
                const updatedClass = row['Class'] || null;
                
                // Convert Excel date serial number to string (YYYY-MM-DD format)
                // Fixes off-by-one day issue: Excel incorrectly treats 1900 as leap year
                let dateOfBirth = null;
                if (row['Date of Birth']) {
                    const dobValue = row['Date of Birth'];
                    if (typeof dobValue === 'number') {
                        // Excel serial date: convert to Date object first
                        // Excel epoch is Jan 1, 1900, but Excel incorrectly treats 1900 as leap year
                        // So we subtract 1 for dates after Feb 28, 1900
                        let adjustedSerial = dobValue;
                        if (dobValue > 59) { // Feb 29, 1900 and later
                            adjustedSerial = dobValue - 1;
                        }
                        
                        const excelEpochMs = new Date(1900, 0, 1).getTime();
                        const jsDate = new Date(excelEpochMs + (adjustedSerial - 1) * 24 * 60 * 60 * 1000);
                        jsDate.setHours(0, 0, 0, 0); // Set to midnight for date-only
                        
                        // Convert to YYYY-MM-DD string using local date components (no timezone shift)
                        const year = jsDate.getFullYear();
                        const month = String(jsDate.getMonth() + 1).padStart(2, '0');
                        const day = String(jsDate.getDate()).padStart(2, '0');
                        dateOfBirth = `${year}-${month}-${day}`;
                    } else if (typeof dobValue === 'string') {
                        // String date: parse and format as YYYY-MM-DD
                        const dateObj = new Date(dobValue);
                        if (!isNaN(dateObj.getTime())) {
                            dateObj.setHours(0, 0, 0, 0); // Set to midnight
                            // Use local date components to avoid timezone shifts
                            const year = dateObj.getFullYear();
                            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                            const day = String(dateObj.getDate()).padStart(2, '0');
                            dateOfBirth = `${year}-${month}-${day}`;
                        }
                    }
                }
                
                const profileData = {
                    user_id: authUser.uid, // Use Firebase Auth UID
                    user_code: userCode,
                    email: email, // Store email for login (teachers use real emails, not generated)
                    first_name: row['First Name'] || '',
                    last_name: row['Last Name'] || '',
                    user_type: row['User Type'] || '',
                    gender: row['Gender'] || '',
                    date_of_birth: dateOfBirth,
                    school_id: row['School ID'] || null,
                    class: updatedClass,
                    section: row['Section'] || null,
                    roll_number: row['Roll Number'] || null,
                    updated_at: admin.firestore.FieldValue.serverTimestamp()
                };
                
                // If existing user, preserve created_at; if new, add created_at
                if (!isExistingUser) {
                    profileData.created_at = admin.firestore.FieldValue.serverTimestamp();
                } else {
                    // Preserve existing created_at if document exists
                    const existingData = existingDoc.data();
                    if (existingData && existingData.created_at) {
                        profileData.created_at = existingData.created_at;
                    } else {
                        profileData.created_at = admin.firestore.FieldValue.serverTimestamp();
                    }
                }
                
                // Step 4: Upload to Firestore (use user_code as document ID for easy lookup)
                // set() will create or update the document
                await db.collection('user_profiles').doc(userCode).set(profileData, { merge: false });
                
                if (isExistingUser) {
                    console.log(`   ✅ Firestore document updated`);
                } else {
                    console.log(`   ✅ Firestore document created`);
                }
                
                successCount++;
                if ((i + 1) % 10 === 0) {
                    console.log(`\n📊 Progress: ${i + 1}/${data.length} processed...`);
                }
                
            } catch (error) {
                console.error(`❌ Error processing row ${i + 1}:`, error.message);
                errorCount++;
            }
        }
        
        console.log('\n✅ Upload complete!');
        console.log(`   Success: ${successCount}`);
        console.log(`   Errors: ${errorCount}`);
        console.log(`   Total: ${data.length}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run the script
uploadUserProfiles();
