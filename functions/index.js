const admin = require('firebase-admin');
const { onCall, HttpsError } = require('firebase-functions/v2/https');

admin.initializeApp();

/**
 * Callable: getLoginEmailForUserCode
 *
 * Purpose:
 * - We do NOT store email in Firestore `user_profiles`
 * - Client cannot lookup Auth email by UID
 * - This function finds `user_id` from `user_profiles/{user_code}`,
 *   then resolves the Firebase Auth user's email and returns it for login.
 *
 * Request: { user_code: "100000" }
 * Response: { email: "100000@mathsbaby.app" }
 */
exports.getLoginEmailForUserCode = onCall(async (request) => {
  const userCode = String(request.data?.user_code || '').trim();

  if (!/^\d{6}$/.test(userCode)) {
    throw new HttpsError('invalid-argument', 'user_code must be a 6-digit string');
  }

  const profileSnap = await admin.firestore().collection('user_profiles').doc(userCode).get();
  if (!profileSnap.exists) {
    throw new HttpsError('not-found', 'User profile not found for provided user_code');
  }

  const profile = profileSnap.data() || {};
  const userId = String(profile.user_id || '').trim();
  if (!userId) {
    throw new HttpsError('failed-precondition', 'user_id missing in user profile');
  }

  let userRecord;
  try {
    userRecord = await admin.auth().getUser(userId);
  } catch (e) {
    throw new HttpsError('not-found', 'Firebase Auth user not found for user_id');
  }

  const email = userRecord.email || null;
  if (!email) {
    throw new HttpsError('failed-precondition', 'Email missing for Firebase Auth user');
  }

  return { email };
});

