/**
 * Script to export user_profiles from Firestore to Excel file
 * 
 * Usage:
 *   node export-user-profiles-to-excel.js
 * 
 * This script:
 * 1. Fetches all user_profiles from Firestore
 * 2. Converts data to Excel format
 * 3. Exports to user_profiles_export.xlsx
 */

const admin = require('firebase-admin');
const XLSX = require('xlsx');
const { loadServiceAccount } = require('./service-account');

// Initialize Firebase Admin SDK
const { serviceAccount } = loadServiceAccount();

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function exportUserProfilesToExcel() {
    try {
        console.log('📥 Fetching user_profiles from Firestore...');
        
        // Fetch all user profiles
        const snapshot = await db.collection('user_profiles').get();
        console.log(`✅ Found ${snapshot.size} user profiles\n`);

        // Prepare data for Excel
        const excelData = [];
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            const userCode = doc.id; // Document ID is user_code
            
            // Format date_of_birth for display (if it's a string in YYYY-MM-DD, keep as is)
            let dobDisplay = '';
            if (data.date_of_birth) {
                if (typeof data.date_of_birth === 'string') {
                    // Already a string, use as-is
                    dobDisplay = data.date_of_birth;
                } else if (data.date_of_birth.toDate && typeof data.date_of_birth.toDate === 'function') {
                    // Firestore Timestamp - convert to YYYY-MM-DD
                    const dateObj = data.date_of_birth.toDate();
                    const year = dateObj.getFullYear();
                    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const day = String(dateObj.getDate()).padStart(2, '0');
                    dobDisplay = `${year}-${month}-${day}`;
                } else if (data.date_of_birth instanceof Date) {
                    // Date object
                    const year = data.date_of_birth.getFullYear();
                    const month = String(data.date_of_birth.getMonth() + 1).padStart(2, '0');
                    const day = String(data.date_of_birth.getDate()).padStart(2, '0');
                    dobDisplay = `${year}-${month}-${day}`;
                } else if (data.date_of_birth.seconds) {
                    // Timestamp with seconds property
                    const dateObj = new Date(data.date_of_birth.seconds * 1000);
                    const year = dateObj.getFullYear();
                    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const day = String(dateObj.getDate()).padStart(2, '0');
                    dobDisplay = `${year}-${month}-${day}`;
                }
            }

            // Format created_at timestamp if it exists
            let createdAtDisplay = '';
            if (data.created_at) {
                if (data.created_at.toDate && typeof data.created_at.toDate === 'function') {
                    createdAtDisplay = data.created_at.toDate().toLocaleString();
                } else if (data.created_at instanceof Date) {
                    createdAtDisplay = data.created_at.toLocaleString();
                } else if (data.created_at.seconds) {
                    createdAtDisplay = new Date(data.created_at.seconds * 1000).toLocaleString();
                }
            }

            excelData.push({
                'User Code': userCode,
                'User ID': data.user_id || '',
                // Email is NOT included - it's stored in Firebase Auth only (not in user_profiles)
                'First Name': data.first_name || '',
                'Last Name': data.last_name || '',
                'User Type': data.user_type || '',
                'Gender': data.gender || '',
                'Date of Birth': dobDisplay,
                'School ID': data.school_id || '',
                'Class': data.class || '',
                'Section': data.section || '',
                'Roll Number': data.roll_number || '',
                'Created At': createdAtDisplay
            });
        });

        // Sort by User Code (document ID)
        excelData.sort((a, b) => {
            const codeA = parseInt(a['User Code']) || 0;
            const codeB = parseInt(b['User Code']) || 0;
            return codeA - codeB;
        });

        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(excelData);

        // Set column widths for better readability
        const columnWidths = [
            { wch: 12 }, // User Code
            { wch: 30 }, // User ID
            // Email column removed - not stored in user_profiles
            { wch: 15 }, // First Name
            { wch: 15 }, // Last Name
            { wch: 12 }, // User Type
            { wch: 10 }, // Gender
            { wch: 15 }, // Date of Birth
            { wch: 12 }, // School ID
            { wch: 8 },  // Class
            { wch: 8 },  // Section
            { wch: 12 }, // Roll Number
            { wch: 25 }  // Created At
        ];
        worksheet['!cols'] = columnWidths;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'User Profiles');

        // Write to file
        const filename = 'user_profiles_export.xlsx';
        XLSX.writeFile(workbook, filename);

        console.log(`✅ Exported ${excelData.length} profiles to ${filename}`);
        console.log(`📄 File saved in current directory: ${process.cwd()}\\${filename}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// Run the script
exportUserProfilesToExcel()
    .then(() => {
        console.log('\n✅ Export completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Export failed:', error);
        process.exit(1);
    });
