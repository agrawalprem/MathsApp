/**
 * Scan user_scores and report how many documents are missing user_id (or have null/empty).
 *
 * Usage (from project root):
 *   node Utilities/check-user-scores-user-id.js
 *
 * Requires firebase-service-account-key.json (see Utilities/service-account.js).
 */
const admin = require('firebase-admin');
const { loadServiceAccount } = require('./service-account');
const { serviceAccount } = loadServiceAccount();

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

function classifyUserId(data) {
    if (!data || typeof data !== 'object') return 'no_data';
    if (!Object.prototype.hasOwnProperty.call(data, 'user_id')) return 'field_missing';
    const v = data.user_id;
    if (v === null || v === undefined) return 'null_or_undefined';
    if (typeof v === 'string' && v.trim() === '') return 'empty_string';
    return 'present';
}

async function scanAllUserScores() {
    const col = db.collection('user_scores');
    const orderById = admin.firestore.FieldPath.documentId();
    const pageSize = 500;
    let lastDoc = null;
    const counts = {
        total: 0,
        present: 0,
        field_missing: 0,
        null_or_undefined: 0,
        empty_string: 0,
        no_data: 0
    };
    const samples = [];

    while (true) {
        let q = col.orderBy(orderById).limit(pageSize);
        if (lastDoc) q = q.startAfter(lastDoc);
        const snap = await q.get();
        if (snap.empty) break;

        for (const doc of snap.docs) {
            counts.total++;
            const bucket = classifyUserId(doc.data());
            counts[bucket] = (counts[bucket] || 0) + 1;
            if (bucket !== 'present' && samples.length < 25) {
                samples.push({
                    doc_id: doc.id,
                    user_code: doc.data()?.user_code ?? null,
                    user_id: doc.data()?.user_id,
                    issue: bucket
                });
            }
        }

        lastDoc = snap.docs[snap.docs.length - 1];
        if (snap.size < pageSize) break;
        if (counts.total % 5000 === 0) {
            console.log(`   … scanned ${counts.total} documents`);
        }
    }

    return { counts, samples };
}

async function main() {
    console.log('🔍 Scanning user_scores for user_id field…\n');
    const { counts, samples } = await scanAllUserScores();

    const bad =
        counts.field_missing +
        counts.null_or_undefined +
        counts.empty_string +
        counts.no_data;

    console.log('📊 Results');
    console.log('─'.repeat(50));
    console.log(`   Total documents:     ${counts.total}`);
    console.log(`   user_id present:     ${counts.present}`);
    console.log(`   field missing:       ${counts.field_missing}`);
    console.log(`   null / undefined:  ${counts.null_or_undefined}`);
    console.log(`   empty string:        ${counts.empty_string}`);
    console.log(`   no document data:    ${counts.no_data}`);
    console.log('─'.repeat(50));
    console.log(`   Any issue (not OK):  ${bad}\n`);

    if (samples.length > 0) {
        console.log('📎 Sample documents without a usable user_id (max 25):\n');
        samples.forEach((s) => console.log(JSON.stringify(s)));
        console.log('');
    }

    if (bad === 0) {
        console.log('✅ All scanned documents have a non-empty user_id.\n');
    } else {
        console.log(
            '⚠️  Some rows lack Auth UID. The student dashboard query uses where("user_id","==", uid) only — those rows will not show for that user.\n' +
                '   Typical causes: Excel upload with blank user_id column, or legacy imports.\n'
        );
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
