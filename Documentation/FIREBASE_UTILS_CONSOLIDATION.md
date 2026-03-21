# Firebase Utilities Consolidation

## Overview

Common Firebase-related functions have been consolidated into a single shared file (`firebase-utils.js`) to eliminate code duplication across multiple HTML files.

## Shared Functions

The `firebase-utils.js` file contains:

1. **`window.updateActiveSession(operation, variant, questionNo, isCorrect, totalQuestions)`**
   - Updates active session in Firestore
   - Used when student starts quiz or answers questions

2. **`window.clearActiveSession()`**
   - Deletes active session from Firestore
   - Used when student completes quiz, abandons it, or logs out

3. **`window.cleanupStaleSessions(thresholdMinutes = 10)`**
   - Cleans up stale sessions older than threshold
   - Used on page load and auth state changes

4. **`window.handleLogoutCommon(options)`**
   - Common logout handler that:
     - Calls page-specific cleanup (`handleLogoutCleanup`)
     - Clears active session
     - Signs out from Firebase Auth
     - Cleans up sessionStorage
     - Redirects or calls callbacks

## Requirements

For `firebase-utils.js` to work, each page must:

1. **Initialize Firebase** in a module script
2. **Expose Firebase instances globally**:
   ```javascript
   import { doc, getDoc, deleteDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
   
   window.firebaseAuth = auth;
   window.firebaseDb = db;
   window.firebaseServerTimestamp = serverTimestamp;
   window.firebaseFirestore = { doc, getDoc, deleteDoc, setDoc };
   window.firebaseSignOut = signOut;
   ```
3. **Include firebase-utils.js** after Firebase initialization:
   ```html
   <script src="firebase-utils.js"></script>
   ```

## Files Updated

### ✅ Completed
- `index.html` - Uses shared utilities
- `firebase-utils.js` - Created with all shared functions

### 🔄 In Progress
- `student-dashboard.html` - Partially updated (needs script tag fix)
- `teacher-dashboard.html` - Needs update
- `question.html` - Needs update

## Migration Steps for Remaining Files

For each HTML file (`student-dashboard.html`, `teacher-dashboard.html`, `question.html`):

1. **Add Firestore imports** to Firebase initialization:
   ```javascript
   import { doc, getDoc, deleteDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
   ```

2. **Expose Firebase instances** after initialization:
   ```javascript
   window.firebaseAuth = auth;
   window.firebaseDb = db;
   window.firebaseServerTimestamp = serverTimestamp;
   window.firebaseFirestore = { doc, getDoc, deleteDoc, setDoc };
   window.firebaseSignOut = signOut;
   ```

3. **Include firebase-utils.js** after the Firebase initialization script:
   ```html
   </script>
   <script src="firebase-utils.js"></script>
   <script type="module">
   ```

4. **Remove duplicate function definitions**:
   - Remove `window.clearActiveSession` definition
   - Remove `window.updateActiveSession` definition (if present)
   - Remove `window.cleanupStaleSessions` definition (if present)

5. **Update logout handlers** to use `window.handleLogoutCommon()`:
   ```javascript
   window.handleLogout = async function() {
       await window.handleLogoutCommon({
           redirectUrl: 'index.html',
           onError: (error) => {
               alert('Error signing out: ' + error.message);
           }
       });
   };
   ```

## Benefits

- ✅ **Single source of truth** - All Firebase session management in one place
- ✅ **Easier maintenance** - Fix bugs once, applies everywhere
- ✅ **Consistent behavior** - All pages use the same logic
- ✅ **Reduced code duplication** - ~100+ lines removed per file

## Testing

After migration, test:
1. Logout from each page clears active sessions
2. Active sessions update correctly during quizzes
3. Stale sessions are cleaned up on page load
4. No console errors related to Firebase functions
