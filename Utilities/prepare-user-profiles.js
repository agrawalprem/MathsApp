// ============================================================================
// PREPARE USER PROFILES FOR FIREBASE UPLOAD
// ============================================================================
// This script reads manually exported CSV/Excel from Supabase and prepares it
// for Firebase upload by adding emails, passwords, and updating classes
// Run: node prepare-user-profiles.js
// ============================================================================

const XLSX = require('xlsx');
const fs = require('fs');

// Email template: user_code@mathsbaby.app
const EMAIL_DOMAIN = '@mathsbaby.app';

// Password generation: 1st+3rd+5th+2nd+4th+6th digits
// Example: user_code 123456 → password "135246"
function generatePassword(userCode) {
    const code = String(userCode).padStart(6, '0');
    if (code.length !== 6) {
        return ''; // Invalid code
    }
    return code[0] + code[2] + code[4] + code[1] + code[3] + code[5];
}

// Generate email from user code
function generateEmail(userCode) {
    return `${userCode}${EMAIL_DOMAIN}`;
}

async function prepareUserProfiles() {
    try {
        // Look for exported file (CSV or Excel)
        const possibleFiles = [
            'user_profiles.csv',
            'user_profiles.xlsx',
            'user_profiles.xls',
            'export.csv',
            'export.xlsx'
        ];
        
        let inputFile = null;
        for (const file of possibleFiles) {
            if (fs.existsSync(file)) {
                inputFile = file;
                break;
            }
        }
        
        if (!inputFile) {
            console.log('📁 Looking for exported file...');
            console.log('   Please export user_profiles from Supabase Dashboard and save as:');
            console.log('   - user_profiles.csv (preferred)');
            console.log('   - user_profiles.xlsx');
            console.log('   - export.csv');
            console.log('   - export.xlsx');
            console.log('\n   Place the file in this directory and run the script again.');
            return;
        }
        
        console.log(`📖 Reading ${inputFile}...`);
        
        let data;
        if (inputFile.endsWith('.csv')) {
            // Read CSV file
            const csvContent = fs.readFileSync(inputFile, 'utf-8');
            const workbook = XLSX.read(csvContent, { type: 'string' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            data = XLSX.utils.sheet_to_json(worksheet);
        } else {
            // Read Excel file
            const workbook = XLSX.readFile(inputFile);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            data = XLSX.utils.sheet_to_json(worksheet);
        }
        
        console.log(`✅ Found ${data.length} records`);
        
        // Prepare data with generated emails, passwords, and updated classes
        const excelData = data.map((row, index) => {
            // Find user_code field (case-insensitive)
            const userCodeKey = Object.keys(row).find(key => 
                key.toLowerCase().includes('user_code') || 
                key.toLowerCase().includes('usercode') ||
                key.toLowerCase() === 'code'
            );
            
            const userCode = userCodeKey ? String(row[userCodeKey]).trim() : '';
            
            if (!userCode || userCode.length !== 6) {
                console.warn(`⚠️ Row ${index + 1}: Invalid or missing user_code: ${userCode}`);
            }
            
            // Find class field (case-insensitive)
            const classKey = Object.keys(row).find(key => 
                key.toLowerCase() === 'class'
            );
            
            let updatedClass = classKey ? row[classKey] : null;
            if (updatedClass !== null && updatedClass !== '' && updatedClass !== undefined) {
                const classNum = parseInt(updatedClass);
                if (!isNaN(classNum)) {
                    updatedClass = classNum + 1; // Add 1 for next academic session
                }
            }
            
            // Generate email and password
            const email = userCode ? generateEmail(userCode) : '';
            const password = userCode ? generatePassword(userCode) : '';
            
            // Map all fields, preserving original structure
            const mappedRow = {};
            
            // Copy all original fields
            Object.keys(row).forEach(key => {
                // Skip class field, we'll add updated one
                if (key.toLowerCase() !== 'class') {
                    mappedRow[key] = row[key];
                }
            });
            
            // Add/update specific fields
            mappedRow['User Code'] = userCode;
            mappedRow['Email'] = email;
            mappedRow['Password'] = password;
            if (classKey) {
                mappedRow[classKey] = updatedClass;
            } else {
                mappedRow['Class'] = updatedClass;
            }
            
            return mappedRow;
        });
        
        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'User Profiles');
        
        // Write to file
        const filename = 'user_profiles_export.xlsx';
        XLSX.writeFile(workbook, filename);
        
        console.log(`\n✅ Prepared ${excelData.length} profiles`);
        console.log(`📄 File created: ${filename}`);
        console.log('\n📋 Summary:');
        console.log(`   - Emails generated: ${excelData.filter(r => r.Email).length}`);
        console.log(`   - Passwords generated: ${excelData.filter(r => r.Password).length}`);
        console.log(`   - Classes updated: ${excelData.filter(r => r.Class !== null && r.Class !== '').length}`);
        console.log('\n✅ File ready for review and upload!');
        console.log('   Review the Excel file, make any edits, then run: npm run upload');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the script
prepareUserProfiles();
