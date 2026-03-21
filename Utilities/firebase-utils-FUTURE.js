/**
 * Shared Firebase Utilities (FOR FUTURE USE)
 * 
 * ⚠️ THIS FILE IS PRESERVED FOR FUTURE CODE CONSOLIDATION
 * ⚠️ DO NOT USE IN PRODUCTION YET - WILL BE INTEGRATED DURING SCHOOL HOLIDAYS
 * 
 * This file contains common Firebase-related functions that can be consolidated
 * across multiple HTML files to eliminate code duplication.
 * 
 * See Documentation/FIREBASE_UTILS_CONSOLIDATION.md for migration plan.
 * 
 * REQUIREMENTS:
 * - Firebase must be initialized before this file is loaded
 * - Each page should expose Firebase instances globally:
 *   - window.firebaseAuth (Firebase Auth instance)
 *   - window.firebaseDb (Firestore instance)
 *   - window.firebaseServerTimestamp (serverTimestamp function from Firestore)
 * 
 * USAGE:
 *   After Firebase initialization in each page:
 *   <script>
 *     window.firebaseAuth = auth;
 *     window.firebaseDb = db;
 *     window.firebaseServerTimestamp = serverTimestamp;
 *   </script>
 *   <script src="firebase-utils.js"></script>
 */

/**
 * Update active session in Firestore
 * Called when student starts quiz or answers each question
 * 
 * @param {string} operation - Quiz operation (e.g., "addition")
 * @param {string} variant - Quiz variant (e.g., "1A0")
 * @param {number} questionNo - Current question number (1-based)
 * @param {boolean|null} isCorrect - Whether the answer was correct (null if not answered yet)
 * @param {number} totalQuestions - Total number of questions
 */
window.updateActiveSession = async function(operation, variant, questionNo, isCorrect, totalQuestions) {
    try {
        const auth = window.firebaseAuth;
        const db = window.firebaseDb;
        const serverTimestamp = window.firebaseServerTimestamp;
        
        if (!auth || !db || !serverTimestamp) {
            console.warn('⚠️ Firebase not initialized - cannot update active session');
            return;
        }
        
        const user = auth.currentUser;
        if (!user || !user.uid) {
            // Not logged in - silently skip (anonymous users don't track active sessions)
            return;
        }
        
        const userId = user.uid;
        const { doc, setDoc } = window.firebaseFirestore || {};
        
        if (!doc || !setDoc) {
            console.warn('⚠️ Firestore functions not available - cannot update active session');
            return;
        }
        
        const sessionRef = doc(db, 'active_sessions', userId);
        
        // Update or create active session document
        await setDoc(sessionRef, {
            user_id: userId,
            operation: operation,
            variant: variant,
            last_question_no_completed: questionNo,
            last_question_correct_wrong: isCorrect !== undefined ? isCorrect : null,
            total_questions: totalQuestions,
            last_activity: serverTimestamp()
        }, { merge: true });
        
        if (window.debugLog) {
            window.debugLog('updateActiveSession', `Updated: ${operation}/${variant}, Q${questionNo}/${totalQuestions}`);
        }
    } catch (error) {
        // Silently fail - don't interrupt student's quiz flow
        console.warn('⚠️ Could not update active session:', error.message);
    }
};

/**
 * Clear active session from Firestore
 * Called when student completes quiz, abandons it, or logs out
 */
window.clearActiveSession = async function() {
    try {
        const auth = window.firebaseAuth;
        const db = window.firebaseDb;
        
        if (!auth || !db) {
            console.warn('⚠️ Firebase not initialized - cannot clear active session');
            return;
        }
        
        const user = auth.currentUser;
        if (!user || !user.uid) {
            return;
        }
        
        const userId = user.uid;
        const { doc, deleteDoc } = window.firebaseFirestore || {};
        
        if (!doc || !deleteDoc) {
            console.warn('⚠️ Firestore functions not available - cannot clear active session');
            return;
        }
        
        const sessionRef = doc(db, 'active_sessions', userId);
        await deleteDoc(sessionRef);
        
        if (window.debugLog) {
            window.debugLog('clearActiveSession', 'Cleared active session');
        }
    } catch (error) {
        // Silently fail - don't interrupt flow
        console.warn('⚠️ Could not clear active session:', error.message);
    }
};

/**
 * Clean up stale active sessions (sessions older than threshold)
 * Called on page load and auth state changes
 * 
 * @param {number} thresholdMinutes - Minutes threshold (default: 10)
 */
window.cleanupStaleSessions = async function(thresholdMinutes = 10) {
    try {
        const auth = window.firebaseAuth;
        const db = window.firebaseDb;
        
        if (!auth || !db) {
            return;
        }
        
        const user = auth.currentUser;
        if (!user || !user.uid) {
            return;
        }
        
        const userId = user.uid;
        const { doc, getDoc, deleteDoc } = window.firebaseFirestore || {};
        
        if (!doc || !getDoc || !deleteDoc) {
            return;
        }
        
        const sessionRef = doc(db, 'active_sessions', userId);
        const sessionSnap = await getDoc(sessionRef);
        
        if (sessionSnap.exists()) {
            const sessionData = sessionSnap.data();
            const lastActivity = sessionData.last_activity;
            
            if (lastActivity) {
                // Check if last_activity is older than threshold
                const now = new Date();
                const lastActivityTime = lastActivity.toDate ? lastActivity.toDate() : new Date(lastActivity);
                const minutesSinceActivity = (now - lastActivityTime) / (1000 * 60);
                
                if (minutesSinceActivity > thresholdMinutes) {
                    // Session is stale, delete it
                    await deleteDoc(sessionRef);
                    console.log('✅ Cleaned up stale active session');
                }
            }
        }
    } catch (error) {
        // Silently fail - don't interrupt flow
        console.warn('⚠️ Could not cleanup stale sessions:', error.message);
    }
};

/**
 * Common logout handler
 * Handles cleanup and sign out
 * 
 * @param {object} options - { redirectUrl, onSuccess, onError }
 */
window.handleLogoutCommon = async function(options = {}) {
    const {
        redirectUrl = 'index.html',
        onSuccess = null,
        onError = null
    } = options;
    
    const auth = window.firebaseAuth;
    
    try {
        // Call cleanup from page-specific JS files (timeout, inactivity tracking)
        if (typeof window.handleLogoutCleanup === 'function') {
            await window.handleLogoutCleanup();
        }
        
        // Clear active session before signing out
        if (typeof window.clearActiveSession === 'function') {
            await window.clearActiveSession();
        }
        
        // Sign out
        if (!auth) {
            throw new Error('Firebase Auth not initialized');
        }
        
        const { signOut } = window.firebaseSignOut || await import("https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js").then(m => m.signOut);
        await signOut(auth);
        
        console.log('✅ User signed out');
        sessionStorage.removeItem('currentUserProfile');
        
        if (onSuccess) {
            onSuccess();
        } else {
            window.location.href = redirectUrl;
        }
    } catch (error) {
        console.error('❌ Sign out error:', error);
        if (onError) {
            onError(error);
        } else {
            alert('Error signing out: ' + error.message);
        }
    }
};
