/**
 * Update Passwords for Users in Firebase Auth
 * 
 * This script reads user codes from Excel and updates passwords in Firebase Auth.
 * 
 * Excel Format Required:
 * - Column: "User Code" (6-digit code)
 * - Column: "Password" (new password to set)
 * - Optional: "Email" (for verification)
 * 
 * Usage:
 *   node Utilities/update-passwords.js [excel-file.xlsx]
 * 
 * Example:
 *   node Utilities/update-passwords.js password-updates.xlsx
 * 
 * Notes:
 * - Updates passwords in Firebase Authentication
 * - Does NOT update password field in user_profiles (if you need that, use upload-user-profiles.js)
 * - Requires Firebase Admin SDK with proper permissions
 */

const admin = require('firebase-admin');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { loadServiceAccount } = require('./service-account');

// Initialize Firebase Admin
const { serviceAccount } = loadServiceAccount();

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
const auth = admin.auth();

async function updatePasswords() {
    try {
        // Get Excel filename from command line or use default
        const excelFilename = process.argv[2] || 'password-updates.xlsx';
        const excelPath = path.join(__dirname, excelFilename);
        
        if (!fs.existsSync(excelPath)) {
            // Try in current directory
            if (fs.existsSync(excelFilename)) {
                console.log(`📖 Reading ${excelFilename} from current directory...`);
            } else {
                throw new Error(`Excel file not found: ${excelFilename}\nPlease provide the Excel file path as an argument or save it as 'password-updates.xlsx' in the Utilities folder.`);
            }
        } else {
            console.log(`📖 Reading ${excelPath}...`);
        }
        
        const workbook = XLSX.readFile(fs.existsSync(excelPath) ? excelPath : excelFilename);
        const sheetName = workbook.SheetNames[0];
        console.log(`📄 Using worksheet: "${sheetName}"`);
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        console.log(`✅ Found ${data.length} records in Excel file\n`);
        
        if (data.length === 0) {
            console.log('⚠️ No data found in Excel file. Exiting.');
            return;
        }
        
        let successCount = 0;
        let errorCount = 0;
        const errors = [];
        
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            
            try {
                // Get user code and password from Excel
                const userCode = String(row['User Code'] || row['user_code'] || row['User Code'] || '').trim();
                const password = row['Password'] || row['password'] || '';
                
                if (!userCode || userCode === '') {
                    console.warn(`⚠️ Row ${i + 1}: Skipping - No User Code`);
                    errorCount++;
                    errors.push({ row: i + 1, userCode: 'N/A', error: 'No User Code provided' });
                    continue;
                }
                
                if (!password || password === '') {
                    console.warn(`⚠️ Row ${i + 1} (User Code: ${userCode}): Skipping - No Password provided`);
                    errorCount++;
                    errors.push({ row: i + 1, userCode, error: 'No Password provided' });
                    continue;
                }
                
                console.log(`\n📤 Processing row ${i + 1}/${data.length}: User Code ${userCode}`);
                
                // Step 1: Get user profile from Firestore to find user_id (Firebase Auth UID)
                const userProfileRef = db.collection('user_profiles').doc(userCode);
                const userProfileSnap = await userProfileRef.get();
                
                if (!userProfileSnap.exists) {
                    console.warn(`   ❌ User profile not found in Firestore for User Code: ${userCode}`);
                    errorCount++;
                    errors.push({ row: i + 1, userCode, error: 'User profile not found in Firestore' });
                    continue;
                }
                
                const userProfile = userProfileSnap.data();
                const userId = userProfile.user_id;
                
                if (!userId) {
                    console.warn(`   ❌ No user_id found in user profile for User Code: ${userCode}`);
                    errorCount++;
                    errors.push({ row: i + 1, userCode, error: 'No user_id in user profile' });
                    continue;
                }
                
                // Step 2: Update password in Firebase Auth
                try {
                    await auth.updateUser(userId, {
                        password: password
                    });
                    
                    console.log(`   ✅ Password updated successfully for User Code: ${userCode}`);
                    console.log(`      User ID: ${userId}`);
                    if (userProfile.email) {
                        console.log(`      Email: ${userProfile.email}`);
                    }
                    successCount++;
                } catch (authError) {
                    console.error(`   ❌ Failed to update password in Firebase Auth:`, authError.message);
                    errorCount++;
                    errors.push({ row: i + 1, userCode, userId, error: `Auth error: ${authError.message}` });
                    continue;
                }
                
            } catch (error) {
                console.error(`   ❌ Error processing row ${i + 1}:`, error.message);
                errorCount++;
                const userCode = String(row['User Code'] || row['user_code'] || '').trim() || 'N/A';
                errors.push({ row: i + 1, userCode, error: error.message });
            }
        }
        
        // Summary
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📊 Update Summary:`);
        console.log(`   Total rows processed: ${data.length}`);
        console.log(`   ✅ Successfully updated: ${successCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);
        
        if (errors.length > 0) {
            console.log(`\n❌ Error Details:`);
            errors.forEach(({ row, userCode, error }) => {
                console.log(`   Row ${row} (User Code: ${userCode}): ${error}`);
            });
        }
        
        console.log(`\n✅ Password update completed!\n`);
        
    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

// Run update
updatePasswords()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
