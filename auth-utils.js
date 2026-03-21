/**
 * Shared logout utilities.
 *
 * Goal: define logout behavior once and reuse from multiple pages.
 * Pages pass their Firebase Auth instance (created inside module scripts).
 */
(function () {
  async function safeCall(fn) {
    try {
      if (typeof fn === 'function') await fn();
    } catch (e) {
      // best-effort cleanup should not block logout
      console.warn('Logout cleanup warning:', e?.message || e);
    }
  }

  /**
   * Common logout handler.
   *
   * @param {Object} options
   * @param {import("firebase/auth").Auth} options.auth - Firebase Auth instance
   * @param {string} [options.redirectTo="index.html"] - where to go after logout
   * @param {string[]} [options.sessionKeys] - sessionStorage keys to remove
   */
  window.handleLogoutCommon = async function handleLogoutCommon(options = {}) {
    const {
      auth,
      redirectTo = 'index.html',
      sessionKeys = ['currentUserProfile', 'quizUserProfile', 'quizOperation', 'quizVariant'],
    } = options;

    // Page-specific optional cleanups (if implemented on that page)
    await safeCall(window.clearActiveSession);
    await safeCall(window.clearSessionTimeout);
    await safeCall(window.stopInactivityTracking);

    // Clear common session data
    try {
      sessionKeys.forEach((k) => sessionStorage.removeItem(k));
    } catch (e) {
      console.warn('Could not clear sessionStorage keys:', e?.message || e);
    }

    // Sign out
    if (!auth || typeof auth.signOut !== 'function') {
      // Some pages may pass signOut(auth) style instead of auth instance
      // If auth is not provided correctly, still redirect to avoid trapping user.
      console.warn('handleLogoutCommon: auth instance missing');
      window.location.href = redirectTo;
      return;
    }

    try {
      await auth.signOut();
    } catch (e) {
      // Even if signOut fails, redirect to avoid trapping the user in a bad state
      console.error('Sign out error:', e?.message || e);
    }

    window.location.href = redirectTo;
  };
})();

