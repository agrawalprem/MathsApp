const fs = require('fs');
const path = require('path');

function resolveServiceAccountPath() {
  const candidates = [
    // Preferred: keep secrets in a dedicated root folder.
    path.join(__dirname, '..', 'Secrets', 'firebase-service-account-key.json'),
    // Backward compatibility (older scripts / local setups).
    path.join(__dirname, '..', 'WB', 'secrets', 'firebase-service-account-key.json'),
    // Backward compatibility (older scripts / local setups).
    path.join(__dirname, '..', 'firebase-service-account-key.json'),
    path.join(__dirname, 'firebase-service-account-key.json')
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function loadServiceAccount() {
  const serviceAccountPath = resolveServiceAccountPath();
  if (!serviceAccountPath) {
    throw new Error(
      'Firebase service account key not found. Expected firebase-service-account-key.json in Secrets/, project root, or Utilities/.'
    );
  }
  // eslint-disable-next-line import/no-dynamic-require, global-require
  const serviceAccount = require(serviceAccountPath);
  return { serviceAccount, serviceAccountPath };
}

module.exports = { resolveServiceAccountPath, loadServiceAccount };

