/**
 * Script to create/update the `classes` collection in Firestore.
 *
 * Collection: `classes`
 * Document ID: taken directly from Excel as `id` (e.g. "20003A"),
 * using the convention: `${school_id}${class}${section}`
 *
 * Required (non-null) fields for each document:
 * - id                      (string)  // Firestore document ID, e.g. "20003A"
 * - school_id               (string)
 * - school_name             (string)
 * - class                   (string)  e.g. "3"
 * - section                 (string)  e.g. "A"
 * - teacher_email           (string)
 * - principal_email         (string)
 * - administrator_email     (string)
 * - session_timeout_minutes (number)
 * - created_at              (Timestamp)
 * - updated_at              (Timestamp)
 *
 * Input Excel file: `classes.xlsx`
 * Recommended column headers (case-insensitive):
 * - ID                      (class id, e.g. 20003A)
 * - School ID
 * - School Name
 * - Class
 * - Section
 * - Teacher Email
 * - Principal Email
 * - Administrator Email
 * - Session Timeout (minutes)
 *
 * Usage:
 *   node classes-collection-update.js
 */

const admin = require('firebase-admin');
const XLSX = require('xlsx');
const path = require('path');

// IMPORTANT:
// Re‑use the same service account file that you already use for other admin scripts.
// If you already adjusted the path in another script, mirror that change here.
const serviceAccount = require('./firebase-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

/**
 * Normalize and validate a single Excel row.
 * Returns { ok: true, data } or { ok: false, error }.
 */
function normalizeRow(row, index) {
  const rowLabel = `Row ${index + 2}`; // +2 because of header + 0-based index

  const docId = String(
    row['ID'] ??
      row['Id'] ??
      row['id'] ??
      row['Class ID'] ??
      row['CLASS_ID'] ??
      ''
  ).trim();

  const schoolId = String(
    row['School ID'] ??
      row['school_id'] ??
      row['SCHOOL_ID'] ??
      ''
  ).trim();

  const schoolName =
    (row['School Name'] ??
      row['school_name'] ??
      row['SCHOOL_NAME'] ??
      '').toString().trim();

  const classValue = String(
    row['Class'] ??
      row['class'] ??
      row['CLASS'] ??
      ''
  ).trim();

  const section =
    (row['Section'] ??
      row['section'] ??
      row['SECTION'] ??
      '').toString().trim();

  const teacherEmail =
    (row['Teacher Email'] ??
      row['teacher_email'] ??
      row['TEACHER_EMAIL'] ??
      '').toString().trim();

  const principalEmail =
    (row['Principal Email'] ??
      row['principal_email'] ??
      row['PRINCIPAL_EMAIL'] ??
      '').toString().trim();

  const administratorEmail =
    (row['Administrator Email'] ??
      row['administrator_email'] ??
      row['ADMINISTRATOR_EMAIL'] ??
      '').toString().trim();

  const timeoutRaw =
    row['Session Timeout (minutes)'] ??
    row['session_timeout_minutes'] ??
    row['SESSION_TIMEOUT_MINUTES'] ??
    30;

  const sessionTimeoutMinutes = Number(timeoutRaw);

  const missing = [];
  if (!docId) missing.push('ID');
  if (!schoolId) missing.push('School ID');
  if (!schoolName) missing.push('School Name');
  if (!classValue) missing.push('Class');
  if (!section) missing.push('Section');
  if (!teacherEmail) missing.push('Teacher Email');
  if (!principalEmail) missing.push('Principal Email');
  if (!administratorEmail) missing.push('Administrator Email');
  if (!Number.isFinite(sessionTimeoutMinutes) || sessionTimeoutMinutes <= 0) {
    missing.push('Valid Session Timeout (minutes)');
  }

  if (missing.length > 0) {
    return {
      ok: false,
      error: `${rowLabel}: Missing/invalid required fields: ${missing.join(', ')}`,
    };
  }

  return {
    ok: true,
    data: {
      docId,
      school_id: schoolId,
      school_name: schoolName,
      class: classValue,
      section,
      teacher_email: teacherEmail,
      principal_email: principalEmail,
      administrator_email: administratorEmail,
      session_timeout_minutes: sessionTimeoutMinutes,
    },
  };
}

async function updateClassesCollection() {
  console.log('🏫 Starting classes collection update...\n');

  const excelFilePath = path.join(__dirname, 'classes.xlsx');
  let rows = [];

  try {
    const workbook = XLSX.readFile(excelFilePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    rows = XLSX.utils.sheet_to_json(worksheet);
    console.log(`✅ Read ${rows.length} rows from ${excelFilePath}\n`);
  } catch (error) {
    console.error('❌ Could not read classes.xlsx. Please create it first.');
    console.error('Error:', error.message);
    process.exit(1);
  }

  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const normalized = normalizeRow(row, i);

    if (!normalized.ok) {
      console.warn(`⚠️  Skipping row: ${normalized.error}`);
      skippedCount++;
      continue;
    }

    const data = normalized.data;

    try {
      const classRef = db.collection('classes').doc(data.docId);
      const existing = await classRef.get();

      const now = admin.firestore.FieldValue.serverTimestamp();
      const payload = {
        school_id: data.school_id,
        school_name: data.school_name,
        class: data.class,
        section: data.section,
        teacher_email: data.teacher_email,
        principal_email: data.principal_email,
        administrator_email: data.administrator_email,
        session_timeout_minutes: data.session_timeout_minutes,
        updated_at: now,
      };

      if (existing.exists) {
        // Update existing document (merge to preserve any extra fields)
        await classRef.set(payload, { merge: true });
        console.log(
          `✅ Updated class ${data.docId} (${data.school_name} - Class ${data.class}${data.section})`
        );
      } else {
        // Create new document
        await classRef.set({
          ...payload,
          created_at: now,
        });
        console.log(
          `✅ Created class ${data.docId} (${data.school_name} - Class ${data.class}${data.section})`
        );
      }

      successCount++;
    } catch (error) {
      console.error(
        `❌ Error processing class ${data.docId}:`,
        error.message
      );
      errorCount++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   ✅ Successfully processed: ${successCount} classes`);
  console.log(`   ⚠️  Skipped (validation issues): ${skippedCount} rows`);
  console.log(`   ❌ Errors while writing to Firestore: ${errorCount} rows`);
  console.log('\n✅ Classes collection update completed!');
}

updateClassesCollection()
  .then(() => {
    console.log('\n✅ Script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

