/**
 * Sync Firebase Hosting PROD files into local WORKTREE.
 *
 * This downloads files from https://<project>.web.app/<file> and overwrites
 * matching files in the repo root (WORKTREE), so local behavior matches PROD.
 *
 * Usage:
 *   node Utilities/sync-prod-to-worktree.js
 *
 * Optional:
 *   PROD_BASE_URL=https://your-site.web.app node Utilities/sync-prod-to-worktree.js
 *
 * Notes:
 * - Only touches files in the repo root directory (one level).
 * - Only syncs known hosted assets (html/css/js + sw/manifest).
 * - Intentionally skips config/developer files (firebase.json, package.json, etc).
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const DEFAULT_BASE = 'https://maths-in-baby-steps.web.app';
const PROD_BASE_URL = (process.env.PROD_BASE_URL || DEFAULT_BASE).replace(/\/+$/, '');

const ALLOWLIST_FILES = new Set(['sw.js', 'manifest.json']);
const ALLOWLIST_EXT = new Set(['.html', '.css', '.js']);

function isFileSafeToSync(filename) {
  if (ALLOWLIST_FILES.has(filename)) return true;
  const ext = path.extname(filename).toLowerCase();
  return ALLOWLIST_EXT.has(ext);
}

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        const { statusCode } = res;
        if (statusCode !== 200) {
          res.resume();
          resolve({ statusCode, buffer: null });
          return;
        }
        const chunks = [];
        res.on('data', (d) => chunks.push(d));
        res.on('end', () => resolve({ statusCode, buffer: Buffer.concat(chunks) }));
      })
      .on('error', reject);
  });
}

async function main() {
  const repoRoot = path.join(__dirname, '..');
  const entries = fs.readdirSync(repoRoot, { withFileTypes: true });

  const candidates = entries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter(isFileSafeToSync)
    // Explicitly skip developer/config/secrets even if extension matches.
    .filter(
      (name) =>
        ![
          'firebase.json',
          '.firebaserc',
          '.gitignore',
          'package.json',
          'package-lock.json',
          'firebase-service-account-key.json'
        ].includes(name)
    );

  if (candidates.length === 0) {
    console.log('No eligible root files found to sync.');
    return;
  }

  console.log(`PROD base: ${PROD_BASE_URL}`);
  console.log(`Found ${candidates.length} eligible local root file(s).`);

  let synced = 0;
  let missing = 0;
  let failed = 0;

  for (const filename of candidates) {
    const url = `${PROD_BASE_URL}/${encodeURIComponent(filename)}`;
    const localPath = path.join(repoRoot, filename);

    try {
      const { statusCode, buffer } = await fetchBuffer(url);
      if (statusCode !== 200 || !buffer) {
        missing++;
        console.log(`SKIP (not on PROD) ${filename}  [HTTP ${statusCode}]`);
        continue;
      }

      fs.writeFileSync(localPath, buffer);
      synced++;
      console.log(`SYNC ${filename}`);
    } catch (err) {
      failed++;
      console.log(`FAIL ${filename}: ${err?.message || err}`);
    }
  }

  console.log('---');
  console.log(`Done. Synced: ${synced}, Missing on PROD: ${missing}, Failed: ${failed}`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});

