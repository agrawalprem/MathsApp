/**
 * Delete user_scores documents for addition variant 1D (legacy grid before 1DS/1D/1ES/1E split).
 *
 * Removes every document where operation === "addition" and variant === "1D".
 * Run once after deploying the new 1D definition so history does not mix old and new sets.
 * Re-running after students use the new 1D will delete those scores too.
 *
 * Usage:
 *   node Utilities/delete-addition-1d-user-scores.js           # delete
 *   node Utilities/delete-addition-1d-user-scores.js --dry-run # count + pass/fail breakdown
 *   node Utilities/delete-addition-1d-user-scores.js --stats   # same as dry-run (no delete)
 */

const admin = require('firebase-admin');
const { loadServiceAccount } = require('./service-account');

const dryRun = process.argv.includes('--dry-run') || process.argv.includes('--stats');

const { serviceAccount } = loadServiceAccount();

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const PAGE = 500;

function addition1DQuery() {
    return db
        .collection('user_scores')
        .where('operation', '==', 'addition')
        .where('variant', '==', '1D');
}

async function scanAddition1D() {
    let total = 0;
    let passed = 0;
    let failed = 0;
    let noPassedField = 0;
    let lastDoc = null;

    for (;;) {
        let q = addition1DQuery().limit(PAGE);
        if (lastDoc) q = q.startAfter(lastDoc);
        const snapshot = await q.get();
        if (snapshot.empty) break;

        for (const doc of snapshot.docs) {
            total++;
            const p = doc.data().passed;
            if (p === true) passed++;
            else if (p === false) failed++;
            else noPassedField++;
        }
        lastDoc = snapshot.docs[snapshot.docs.length - 1];
    }

    return { total, passed, failed, noPassedField };
}

async function dryRunCount() {
    console.log('🔎 Scanning user_scores: operation=addition, variant=1D (no deletes)...\n');
    const { total, passed, failed, noPassedField } = await scanAddition1D();

    console.log(`📊 Total documents:     ${total}`);
    console.log(`   passed: true         ${passed}`);
    console.log(`   passed: false        ${failed}`);
    if (noPassedField > 0) {
        console.log(`   passed: (missing)    ${noPassedField}`);
    }
    console.log('\n   Re-run without flags to delete these documents.');
    return total;
}

async function deleteAllPages() {
    console.log('🗑️  Deleting user_scores where operation=addition, variant=1D...\n');
    let total = 0;

    for (;;) {
        const snapshot = await addition1DQuery().limit(PAGE).get();
        if (snapshot.empty) break;

        const batch = db.batch();
        for (const doc of snapshot.docs) {
            batch.delete(doc.ref);
        }
        await batch.commit();
        total += snapshot.size;
        console.log(`✅ Deleted ${snapshot.size} document(s) (running total ${total})`);
    }

    if (total === 0) {
        console.log('✅ No matching documents found.');
    } else {
        console.log(`\n✅ Finished. Deleted ${total} document(s) in total.`);
    }
    return total;
}

(dryRun ? dryRunCount() : deleteAllPages())
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('❌ Error:', err);
        process.exit(1);
    });
