/**
 * Script to upload user_scores from Excel file to Firestore
 * 
 * Usage:
 *   node upload-user-scores-from-excel.js
 * 
 * Prerequisites:
 * 1. Run export-user-scores-from-supabase.js to create Excel file
 * 2. Review and clean the Excel file (user_scores_export.xlsx)
 * 3. Ensure all required fields are filled
 * 4. Save the cleaned Excel file
 * 
 * This script:
 * 1. Reads user_scores_export.xlsx
 * 2. Validates data
 * 3. Uploads to Firestore with YYYYMMDDHHMISEC document IDs
 * 4. Handles collisions and merges user profile data
 * 
 * Note: The following columns in Excel are IGNORED (kept for reference only):
 * - email (only used for login/auth, not stored in user_scores)
 * - completed_at (reference timestamp from Supabase)
 * - Supabase ID (reference ID from Supabase)
 * These columns can remain in the Excel file but will not be uploaded to Firestore.
 */

const admin = require('firebase-admin');
const XLSX = require('xlsx');

// ============================================================================
// INITIALIZATION
// ============================================================================

// Initialize Firebase Admin SDK
const serviceAccount = require('../firebase-service-account-key.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format timestamp to YYYYMMDDHHMISEC format for Firestore document ID
 */
function formatTimestampId(date) {
    if (!date) {
        // If no date, use current timestamp
        const now = new Date();
        return formatTimestampId(now);
    }
    
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) {
        // Invalid date, use current timestamp
        return formatTimestampId(new Date());
    }
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * Convert date to YYYY-MM-DD string (using local timezone to avoid shifts)
 */
function formatDateOfBirth(date) {
    if (!date) return null;
    
    // If already a string in YYYY-MM-DD format, return as-is
    if (typeof date === 'string') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return date;
        }
        // Try to parse and reformat
        const parsed = new Date(date);
        if (!isNaN(parsed.getTime())) {
            const year = parsed.getFullYear();
            const month = String(parsed.getMonth() + 1).padStart(2, '0');
            const day = String(parsed.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
        return null;
    }
    
    // If it's a Date object or timestamp
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return null;
    
    // Use local timezone components to avoid timezone shifts
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Get or generate document ID with collision handling
 */
async function getDocumentId(docIdFromExcel, completedAt, existingIds) {
    // If Excel has a document ID, use it (but check for collisions)
    if (docIdFromExcel && docIdFromExcel.trim() !== '') {
        let baseId = docIdFromExcel.trim();
        let docId = baseId;
        let counter = 0;
        
        // Check if ID already exists
        while (existingIds.has(docId) && counter < 100) {
            counter++;
            docId = `${baseId}_${counter}`;
        }
        
        // Double-check in Firestore
        if (counter === 0) {
            const docRef = db.collection('user_scores').doc(docId);
            const docSnap = await docRef.get();
            if (docSnap.exists) {
                counter = 1;
                docId = `${baseId}_${counter}`;
                // Check collision chain
                while (counter < 100) {
                    const checkRef = db.collection('user_scores').doc(docId);
                    const checkSnap = await checkRef.get();
                    if (!checkSnap.exists) break;
                    counter++;
                    docId = `${baseId}_${counter}`;
                }
            }
        }
        
        return docId;
    }
    
    // If no document ID in Excel, generate new timestamp (completed_at is reference only)
    const now = new Date();
    let baseId = formatTimestampId(now);
    let docId = baseId;
    let counter = 0;
    
    // Handle collisions
    while (existingIds.has(docId) && counter < 100) {
        counter++;
        docId = `${baseId}_${counter}`;
    }
    
    // Double-check in Firestore
    if (counter === 0) {
        const docRef = db.collection('user_scores').doc(docId);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            counter = 1;
            docId = `${baseId}_${counter}`;
            while (counter < 100) {
                const checkRef = db.collection('user_scores').doc(docId);
                const checkSnap = await checkRef.get();
                if (!checkSnap.exists) break;
                counter++;
                docId = `${baseId}_${counter}`;
            }
        }
    }
    
    return docId;
}

/**
 * Fetch school name from classes or schools collection
 */
async function getSchoolName(schoolId, classNum, section) {
    if (!schoolId) return null;
    
    try {
        // Try to get from classes collection (ID format: school_id||class||section)
        if (classNum && section) {
            const classId = `${schoolId}${classNum}${section}`;
            const classDoc = await db.collection('classes').doc(classId).get();
            if (classDoc.exists) {
                const classData = classDoc.data();
                return classData.school_name || null;
            }
        }
        
        // Fallback: try to get from schools collection
        const schoolDoc = await db.collection('schools').doc(String(schoolId)).get();
        if (schoolDoc.exists) {
            const schoolData = schoolDoc.data();
            return schoolData.school_name || null;
        }
    } catch (error) {
        console.warn(`⚠️  Could not fetch school name for ${schoolId}:`, error.message);
    }
    
    return null;
}

// ============================================================================
// UPLOAD FUNCTION
// ============================================================================

async function uploadUserScoresFromExcel() {
    try {
        console.log('🚀 Starting user_scores upload from Excel to Firestore...\n');
        
        // Step 1: Read Excel file
        const filename = 'user_scores_export.xlsx';
        console.log(`📥 Reading ${filename}...`);
        
        const workbook = XLSX.readFile(filename);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const excelData = XLSX.utils.sheet_to_json(worksheet);
        
        if (!excelData || excelData.length === 0) {
            console.log('ℹ️  No data found in Excel file.');
            return;
        }
        
        console.log(`✅ Found ${excelData.length} rows in Excel file\n`);
        
        // Step 2: Get existing Firestore document IDs to avoid collisions
        console.log('📋 Checking existing Firestore documents...');
        const existingSnapshot = await db.collection('user_scores').get();
        const existingIds = new Set();
        existingSnapshot.forEach(doc => existingIds.add(doc.id));
        console.log(`✅ Found ${existingIds.size} existing documents in Firestore\n`);
        
        // Step 3: Process and upload each score
        console.log('📤 Uploading scores to Firestore...\n');
        
        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;
        const errors = [];
        
        // Process in batches to avoid overwhelming Firestore
        const batchSize = 100;
        for (let i = 0; i < excelData.length; i += batchSize) {
            const batch = db.batch();
            const batchRows = excelData.slice(i, i + batchSize);
            let batchSuccessCount = 0;
            let batchSkipCount = 0;
            let batchErrorCount = 0;
            
            for (const row of batchRows) {
                try {
                    // Get document ID (from Excel or generate new one)
                    // Note: completed_at and Supabase ID columns are reference only, not used for upload
                    const docId = await getDocumentId(
                        row['Document ID (YYYYMMDDHHMISEC)'],
                        null, // Don't use completed_at - generate new timestamp if needed
                        existingIds
                    );
                    
                    // Check if document already exists (skip if it does)
                    if (existingIds.has(docId)) {
                        batchSkipCount++;
                        skipCount++;
                        continue;
                    }
                    
                    // Prepare Firestore document
                    // Note: email, completed_at, and Supabase ID columns are ignored (reference only)
                    const firestoreScore = {
                        // User identification
                        user_id: row['user_id'] || null,
                        user_code: row['user_code'] || null,
                        // email is NOT stored in user_scores (only used for login/auth)
                        
                        // Score fields
                        operation: row['operation'] || null,
                        variant: row['variant'] || null,
                        correct_count: row['correct_count'] || 0,
                        wrong_count: row['wrong_count'] || 0,
                        total_questions: row['total_questions'] || 0,
                        total_time: row['total_time'] || 0,
                        average_time: row['average_time'] || 0,
                        passed: row['passed'] === 'Yes' || row['passed'] === true || row['passed'] === 'true' || false,
                        
                        // User profile fields (denormalized)
                        first_name: row['first_name'] || null,
                        last_name: row['last_name'] || null,
                        user_type: row['user_type'] || null,
                        gender: row['gender'] || null,
                        date_of_birth: formatDateOfBirth(row['date_of_birth']) || null,
                        roll_number: row['roll_number'] || null,
                        
                        // School and class fields
                        school_id: row['school_id'] || null,
                        class: row['class'] || null,
                        section: row['section'] || null,
                        school_name: row['school_name'] || null,
                    };
                    
                    // Fetch school_name if not present
                    if (!firestoreScore.school_name && firestoreScore.school_id && firestoreScore.class && firestoreScore.section) {
                        firestoreScore.school_name = await getSchoolName(
                            firestoreScore.school_id,
                            firestoreScore.class,
                            firestoreScore.section
                        );
                    }
                    
                    // Add to batch
                    const docRef = db.collection('user_scores').doc(docId);
                    batch.set(docRef, firestoreScore);
                    existingIds.add(docId); // Track to avoid duplicates in same batch
                    batchSuccessCount++;
                    
                } catch (error) {
                    batchErrorCount++;
                    errorCount++;
                    errors.push({
                        row: i + batchRows.indexOf(row) + 1,
                        error: error.message
                    });
                    console.error(`❌ Error processing row ${i + batchRows.indexOf(row) + 1}:`, error.message);
                }
            }
            
            // Commit batch
            try {
                if (batchSuccessCount > 0) {
                    await batch.commit();
                    successCount += batchSuccessCount;
                }
                console.log(`✅ Processed batch ${Math.floor(i / batchSize) + 1}: ${batchSuccessCount} uploaded, ${batchSkipCount} skipped, ${batchErrorCount} errors`);
            } catch (error) {
                console.error(`❌ Error committing batch:`, error.message);
                errorCount += batchSuccessCount; // Count as errors since commit failed
                successCount -= batchSuccessCount; // Remove from success count
            }
        }
        
        // Step 4: Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 Upload Summary');
        console.log('='.repeat(60));
        console.log(`✅ Successfully uploaded: ${successCount} scores`);
        console.log(`⏭️  Skipped (already exists): ${skipCount} scores`);
        console.log(`❌ Errors: ${errorCount} scores`);
        console.log(`📦 Total processed: ${excelData.length} scores`);
        
        if (errors.length > 0) {
            console.log('\n⚠️  Errors encountered:');
            errors.slice(0, 10).forEach(err => {
                console.log(`   - Row ${err.row}: ${err.error}`);
            });
            if (errors.length > 10) {
                console.log(`   ... and ${errors.length - 10} more errors`);
            }
        }
        
        console.log('\n✅ Upload complete!');
        
    } catch (error) {
        console.error('\n❌ Upload failed:', error);
        process.exit(1);
    }
}

// ============================================================================
// RUN UPLOAD
// ============================================================================

if (require.main === module) {
    uploadUserScoresFromExcel()
        .then(() => {
            console.log('\n🎉 Done!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { uploadUserScoresFromExcel };
