// Quick script to check Excel file columns
const XLSX = require('xlsx');

try {
    const filename = 'user_profiles.xlsx';
    console.log(`📖 Reading ${filename}...`);
    
    const workbook = XLSX.readFile(filename);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: null });
    
    if (data.length === 0) {
        console.log('⚠️ No data found in Excel file');
        process.exit(1);
    }
    
    console.log(`✅ Found ${data.length} rows`);
    console.log('\n📋 Column names in Excel file:');
    const columns = Object.keys(data[0]);
    columns.forEach((col, index) => {
        console.log(`   ${index + 1}. "${col}"`);
    });
    
    console.log('\n📋 Expected column names (case-sensitive):');
    const expected = [
        'User Code',
        'Email',
        'Password',
        'First Name',
        'Last Name',
        'User Type',
        'Gender',
        'Date of Birth',
        'School ID',
        'Class',
        'Section',
        'Roll Number'
    ];
    
    expected.forEach((col, index) => {
        const exists = columns.includes(col);
        const status = exists ? '✅' : '❌ MISSING';
        console.log(`   ${index + 1}. "${col}" ${status}`);
    });
    
    console.log('\n📊 First row sample:');
    console.log(JSON.stringify(data[0], null, 2));
    
} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}
