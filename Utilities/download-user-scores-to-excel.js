/**
 * Download the entire user_scores collection to an Excel file.
 *
 * Usage:
 *   node Utilities/download-user-scores-to-excel.js [output.xlsx]
 *
 * cd "C:\Users\agraw\Documents\Prem\NGMF\MathsInBabySteps"
 * npm run download-scores-xlsx
 * or
 * npm run download-scores-xlsx user_scores_export.xlsx
 * Notes:
 * - Requires Firebase Admin SDK with service account permissions.
 * - Looks for firebase-service-account-key.json in the project root first,
 *   then falls back to Utilities/ for compatibility with older scripts.
 */
const admin = require('firebase-admin');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const { loadServiceAccount } = require('./service-account');

function toIsoStringMaybeTimestamp(value) {
  if (!value) return value;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (value instanceof Date) return value.toISOString();
  if (value.toDate && typeof value.toDate === 'function') {
    const d = value.toDate();
    return d instanceof Date ? d.toISOString() : value;
  }
  if (typeof value === 'object' && typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000).toISOString();
  }
  return value;
}

function flattenForExcel(obj, prefix = '') {
  const out = {};
  if (!obj || typeof obj !== 'object') return out;

  for (const [key, raw] of Object.entries(obj)) {
    const col = prefix ? `${prefix}.${key}` : key;
    const value = toIsoStringMaybeTimestamp(raw);

    if (value === null || value === undefined) {
      out[col] = '';
      continue;
    }

    if (Array.isArray(value)) {
      out[col] = JSON.stringify(value);
      continue;
    }

    if (typeof value === 'object') {
      // Keep objects but flatten deeper; also preserve original as JSON for safety.
      out[col] = JSON.stringify(value);
      Object.assign(out, flattenForExcel(value, col));
      continue;
    }

    out[col] = value;
  }

  return out;
}

function stableBaseColumns() {
  // Based on existing utilities (view-user-scores.js) and expected schema.
  return [
    'doc_id',
    'user_id',
    'user_code',
    'email',
    'first_name',
    'last_name',
    'user_type',
    'gender',
    'date_of_birth',
    'roll_number',
    'school_id',
    'school_name',
    'class',
    'section',
    'operation',
    'variant',
    'correct_count',
    'wrong_count',
    'total_questions',
    'total_time',
    'average_time',
    'passed'
  ];
}

async function fetchAllUserScores(db) {
  const collection = db.collection('user_scores');
  const pageSize = 5000;

  let lastDoc = null;
  let total = 0;
  const rows = [];

  // Use orderBy(FieldPath.documentId()) to enable startAfter pagination reliably.
  const orderById = admin.firestore.FieldPath.documentId();

  while (true) {
    let query = collection.orderBy(orderById).limit(pageSize);
    if (lastDoc) query = query.startAfter(lastDoc);

    const snap = await query.get();
    if (snap.empty) break;

    for (const doc of snap.docs) {
      const data = doc.data();
      const base = {
        doc_id: doc.id,
        ...data
      };
      rows.push(flattenForExcel(base));
    }

    total += snap.size;
    lastDoc = snap.docs[snap.docs.length - 1];
    console.log(`📥 Downloaded ${total} score document(s)...`);

    if (snap.size < pageSize) break;
  }

  return rows;
}

function buildWorksheet(rows) {
  const baseCols = stableBaseColumns();
  const keySet = new Set(baseCols);

  for (const r of rows) {
    for (const k of Object.keys(r)) keySet.add(k);
  }

  const allCols = Array.from(keySet);

  // Keep base columns first, then the rest alphabetically.
  const rest = allCols.filter((c) => !baseCols.includes(c)).sort((a, b) => a.localeCompare(b));
  const header = [...baseCols, ...rest];

  const ordered = rows.map((r) => {
    const o = {};
    for (const col of header) o[col] = r[col] ?? '';
    return o;
  });

  return XLSX.utils.json_to_sheet(ordered, { header });
}

async function main() {
  try {
    const outputArg = process.argv[2];
    const outputPath = outputArg
      ? path.resolve(process.cwd(), outputArg)
      : path.resolve(process.cwd(), `user_scores_${new Date().toISOString().slice(0, 10)}.xlsx`);

    const { serviceAccount } = loadServiceAccount();

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }

    const db = admin.firestore();

    console.log('📊 Fetching entire user_scores collection...');
    const rows = await fetchAllUserScores(db);

    if (rows.length === 0) {
      console.log('✅ user_scores collection is empty. No Excel file created.');
      return;
    }

    console.log(`🧾 Building Excel workbook for ${rows.length} row(s)...`);
    const ws = buildWorksheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'user_scores');

    XLSX.writeFile(wb, outputPath);
    console.log(`✅ Export complete: ${outputPath}`);
  } catch (err) {
    console.error('❌ Export failed:', err?.message || err);
    process.exit(1);
  }
}

main();

