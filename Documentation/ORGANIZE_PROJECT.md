# Project Organization Plan

## Files to Move to Utilities/
- ✅ export-user-profiles-to-excel.js (already moved)
- convert-dob-to-string.js (one-time migration, but keep for reference)
- remove-email-from-user-profiles.js (one-time, but keep for reference)
- check-dob-formats.js (utility - diagnostic)
- check-user-scores-dob.js (utility - diagnostic)
- check-user-profiles.js (utility - diagnostic)
- check-excel-columns.js (utility - diagnostic)
- delete-user-scores.js (utility - maintenance)
- classes-collection-update.js (utility - reusable)
- upload-user-profiles.js (utility - reusable)
- prepare-user-profiles.js (utility - reusable)
- view-user-scores.js (utility - diagnostic)

## Files to Delete (one-time, already completed)
- fix-date-of-birth.js (one-time fix, completed)
- update-passwords-from-dob.js (one-time update, completed)
- update-user-emails.js (one-time update, completed)
- update-schools-collection.js (deprecated - using classes collection now)
- download-user-profiles.js (Supabase - deprecated)
- save-score-firebase.js (old version, replaced by summary.html)
- shared_db.js (Supabase - deprecated, migrated to Firebase)

## Files to Move to Documentation/
- ACTIVE_SESSIONS_COLLECTION.md
- Branches.md
- GIT_PRIMER.md
- GLOBAL_VARIABLES.md
- MAINTENANCE_MANUAL.md
- MODULAR_STRUCTURE.md
- README_SCHOOLS_UPDATE.md
- README-migration.md
- README.md (keep in root)
- SESSION_TIMEOUT_IMPLEMENTATION.md
- SPECIFICATION.md
- START_LOCAL_SERVER.md
- SUPABASE_CHECKLIST.md
- USER_MANUAL.md
- USER_SCORES_COLLECTION.md

## Files to Keep in Root
- index.html, question.html, summary.html, student-dashboard.html, teacher-dashboard.html
- *.js files (question.js, summary.js, student-dashboard.js, teacher-dashboard.js, shared.js)
- *.css files
- manifest.json, sw.js
- firebase.json, firebase_config.js
- package.json, package-lock.json
- firebase-service-account-key.json (keep secure)
- classes.xlsx (input file for utilities)
