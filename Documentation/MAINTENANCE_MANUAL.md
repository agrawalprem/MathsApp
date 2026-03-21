# Learning Maths in Baby Steps - Maintenance Manual

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Database Structure](#database-structure)
4. [Configuration](#configuration)
5. [Deployment](#deployment)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)
7. [Troubleshooting](#troubleshooting)
8. [Updates and Versioning](#updates-and-versioning)
9. [Backup and Recovery](#backup-and-recovery)

---

## Overview

**Learning Maths in Baby Steps** is a Progressive Web Application (PWA) built with:
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Firebase (Firestore database, Authentication, Analytics)
- **Hosting**: Firebase Hosting (static site hosting)
- **Service Worker**: For offline functionality and caching (currently disabled during development)

### Key Components

- **Authentication**: Firebase Authentication (user code/password)
- **Database**: Firestore (NoSQL document database)
- **Storage**: Browser localStorage/sessionStorage (client-side caching)
- **PWA**: Service Worker for offline capability

---

## System Architecture

### File Structure

```
MathsInBabySteps/
├── index.html              # Login page
├── student-dashboard.html  # Student dashboard page
├── student-dashboard.js    # Student dashboard logic
├── student-dashboard.css   # Student dashboard styles
├── teacher-dashboard.html  # Teacher dashboard page
├── teacher-dashboard.js    # Teacher dashboard logic
├── teacher-dashboard.css   # Teacher dashboard styles
├── question.html           # Quiz question page
├── question.js             # Quiz logic and question generation
├── question.css            # Quiz page styles
├── summary.html            # Quiz summary/results page
├── summary.js              # Summary display logic
├── summary.css             # Summary page styles
├── shared.js               # Variant definitions and session state
├── shared.css              # Shared styles
├── sw.js                   # Service Worker for PWA
├── manifest.json           # PWA manifest
├── firebase.json           # Firebase Hosting configuration
├── .firebaserc            # Firebase project configuration
├── icon-192.png            # PWA icon (192x192)
├── icon-512.png           # PWA icon (512x512)
├── Documentation/          # Project documentation
└── Utilities/              # Utility scripts for data management
```

### Data Flow

1. **User Login**:
   - User logs in via `index.html` using 6-digit user code and password
   - Firebase Auth handles authentication
   - User profile fetched from `user_profiles` collection in Firestore
   - Session data stored in sessionStorage

2. **Student Quiz Flow**:
   - Student selects operation → variant from dashboard
   - Quiz questions generated in `question.js`
   - Answers checked in real-time
   - Active session tracked in `active_sessions` collection
   - Session data stored in `sessionStorage`
   - On completion, data saved to `user_scores` collection
   - Summary page displays results

3. **Teacher Dashboard Flow**:
   - Teacher dashboard loads student list and scores from Firestore
   - Polls `active_sessions` collection every 5 seconds (see [ACTIVE_SESSIONS_COLLECTION.md](./ACTIVE_SESSIONS_COLLECTION.md))
   - Displays active sessions and progress
   - Exports data to Excel

---

## Database Structure

### Firestore Collections

#### `user_profiles`
Stores user account information.

**Document ID**: `user_code` (6-digit code, e.g., "100001")

**Fields:**
- `user_id` (string, Firebase Auth UID)
- `user_code` (string, 6-digit code)
- `user_type` (string: "Student" or "Teacher")
- `first_name` (string)
- `last_name` (string)
- `gender` (string)
- `date_of_birth` (string, YYYY-MM-DD format)
- `school_id` (string or number)
- `class` (string or number, e.g., "5")
- `section` (string, e.g., "A")
- `roll_number` (string, Students only)
- `created_at` (Timestamp)

**Indexes:**
- `user_id` (for querying by Firebase Auth UID)
- `school_id`, `class`, `section` (for teacher dashboard queries)

#### `user_scores`
Stores quiz session results.

**Document ID**: `YYYYMMDDHHMISEC` format (timestamp with collision handling)

**See**: **[USER_SCORES_COLLECTION.md](./USER_SCORES_COLLECTION.md)** for complete specification.

**Summary:**
- Fields: `user_id`, `user_code`, `operation`, `variant`, `correct_count`, `wrong_count`, `total_questions`, `total_time`, `average_time`, `passed`, `date_of_birth`, `school_id`, `school_name`, `class`, `section`, and denormalized user profile fields
- Denormalized data for efficient querying
- Document ID serves as timestamp

#### `active_sessions`
Tracks students currently taking quizzes (for teacher dashboard).

**Document ID**: `user_id` (Firebase Auth UID)

**See**: **[ACTIVE_SESSIONS_COLLECTION.md](./ACTIVE_SESSIONS_COLLECTION.md)** for complete specification.

**Summary:**
- Fields: `user_id`, `operation`, `variant`, `last_question_no_completed`, `last_question_correct_wrong`, `total_questions`, `last_activity`
- Teacher Dashboard polls this collection every 5 seconds
- One active session per user (document ID ensures uniqueness)

#### `schools`
Stores school configuration.

**Document ID**: `school_id` (string, e.g., "2000")

**Fields:**
- `school_id` (string or number)
- `school_name` (string)
- `administrator_email` (string, optional)
- `principal_email` (string, optional)
- `created_at` (Timestamp)

#### `classes`
Stores class information.

**Document ID**: `school_id||class||section` (e.g., "20003A")

**Fields:**
- `school_id` (string or number)
- `class` (string or number)
- `section` (string)
- `school_name` (string, denormalized)
- `teacher_email` (string, optional)

### Firebase Security Rules

**Important**: Ensure Security Rules are configured in Firebase Console:

1. **`user_profiles`**:
   - Users can read their own profile
   - Users can update their own profile
   - Teachers can read profiles of students in their school/class/section

2. **`user_scores`**:
   - Users can read their own scores
   - Users can create their own scores
   - Teachers can read scores of students in their school/class/section

3. **`active_sessions`**:
   - Users can read/update/delete their own active session
   - Teachers can read active sessions of students in their school/class/section

4. **`schools`**:
   - All authenticated users can read (for school name lookup)

---

## Configuration

### Firebase Configuration

**Location**: Firebase config is embedded in HTML files (`index.html`, `student-dashboard.html`, `teacher-dashboard.html`, etc.)

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyBqCWeT44wwh92OL_8O0-j4IBwLeOaGSmc",
    authDomain: "maths-in-baby-steps.firebaseapp.com",
    projectId: "maths-in-baby-steps",
    storageBucket: "maths-in-baby-steps.firebasestorage.app",
    messagingSenderId: "235467885199",
    appId: "1:235467885199:web:dff119a28e6f897d1dfefa",
    measurementId: "G-XKB7TT32RL"
};
```

**To Update:**
1. Go to Firebase Console → Project Settings → General
2. Copy the Firebase configuration object
3. Update Firebase config in all HTML files
4. Redeploy to Firebase Hosting: `firebase deploy --only hosting`

### Service Worker Version

**File**: `sw.js`

```javascript
const CACHE_NAME = 'maths-app-v2';
const STATIC_CACHE_NAME = 'maths-app-static-v2';
```

**To Force Cache Refresh:**
1. Increment version numbers in `sw.js`
2. Deploy to Firebase: `firebase deploy --only hosting`
3. Users will get new cache on next visit

### Variant Definitions

**File**: `shared.js`

Variants are defined in two objects:
- `variants`: Standard single-digit variants
- `multiDigitVariants`: Multi-digit variants

**To Add a New Variant:**
1. Add variant definition to appropriate object in `shared.js`
2. Add variant key to `learningSequence` in `student-dashboard.html` and `teacher-dashboard.js`
3. Test the variant
4. Deploy

---

## Deployment

### Firebase Hosting Deployment

**Current Setup:**
- **Build Command**: None (static site)
- **Public Directory**: `.` (root, configured in `firebase.json`)
- **Project ID**: `maths-in-baby-steps` (configured in `.firebaserc`)

**Deployment Process:**

1. **Initial Setup**:
   ```bash
   # Install Firebase CLI
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Initialize hosting (already done)
   firebase init hosting
   ```

2. **Deploy to Firebase Hosting**:
   ```bash
   # Deploy to production
   firebase deploy --only hosting
   
   # Or deploy everything
   firebase deploy
   ```

3. **Automatic Deployment** (if configured):
   - Connect Firebase to GitHub repository
   - Push to `main` branch → Firebase auto-deploys
   - Configure in Firebase Console → Hosting → GitHub integration

4. **Environment Variables**:
   - Firebase config is in code (firebaseConfig object in HTML files)
   - No environment variables needed for hosting
   - Firebase Auth and Firestore are configured in Firebase Console

### Deployment Checklist

- [ ] Test locally using `firebase serve`
- [ ] Update version in `sw.js` (if cache changes needed)
- [ ] Deploy: `firebase deploy --only hosting`
- [ ] Verify Firebase Hosting deployment succeeds
- [ ] Test on production URL: `https://maths-in-baby-steps.web.app`
- [ ] Clear browser cache if needed (for service worker updates)

### Domain Configuration

**Custom Domain:**
1. Firebase Console → Hosting → Custom domains
2. Add custom domain
3. Configure DNS as instructed
4. SSL certificate auto-provisioned by Firebase

---

## Monitoring and Maintenance

### Daily Tasks

1. **Check Firebase Hosting Deployments**:
   - Verify latest deployment is successful
   - Check for failed builds

2. **Monitor Firebase Console**:
   - Check Firestore usage
   - Monitor API requests
   - Check for errors in logs

3. **Review Active Sessions**:
   - Check `active_sessions` collection for stale sessions
   - Sessions should auto-clear when quiz ends
   - Can manually delete stale sessions older than 1 hour

### Weekly Tasks

1. **Database Cleanup**:
   - Remove stale active sessions (older than 1 hour)
   - Use Firebase Console or utility script

2. **Review Error Logs**:
   - Check browser console errors (if reported by users)
   - Check Firebase Console → Logs for errors

3. **Performance Check**:
   - Test application load times
   - Check Firebase Analytics (if enabled)
   - Review Firestore query performance

### Monthly Tasks

1. **Database Backup**:
   - Export collections using Firebase Console or utility scripts
   - See [Backup and Recovery](#backup-and-recovery) section

2. **User Account Review**:
   - Check for inactive accounts
   - Review teacher accounts
   - Verify school configurations

3. **Variant Performance Analysis**:
   - Query `user_scores` to find:
     - Most failed variants
     - Average completion times
     - Pass rates per variant

---

## Troubleshooting

### Common Issues

#### 1. Users Can't Login

**Symptoms**: "Invalid login credentials" or "User not found"

**Diagnosis:**
- Check Firebase Auth logs
- Verify user exists in Firebase Authentication
- Check if user profile exists in `user_profiles` collection

**Solution:**
- Verify user in Firebase Console → Authentication → Users
- Check `user_profiles` collection for matching `user_code`
- Verify password format (DDMMYY from date of birth)

#### 2. Scores Not Saving

**Symptoms**: Quiz completes but no score in database

**Diagnosis:**
- Check browser console for errors
- Check Firebase Console → Logs
- Verify Firestore Security Rules allow writes

**Solution:**
- Ensure Security Rules allow users to create their own scores
- Check `saveScoreToFirestore()` function in `summary.html`
- Verify Firebase connection (check config in HTML files)

#### 3. Teacher Dashboard Not Loading

**Symptoms**: Dashboard shows "Loading..." indefinitely

**Diagnosis:**
- Check browser console for errors
- Verify teacher profile has `school_id`, `class`, `section`
- Check Firestore query logs

**Solution:**
- Ensure teacher profile is complete
- Verify Security Rules allow teacher to read student data
- Check network tab for failed API calls

#### 4. Service Worker Not Updating

**Symptoms**: Users see old version after deployment

**Diagnosis:**
- Check `sw.js` version number
- Check Firebase Hosting deployment timestamp
- Verify service worker registration

**Solution:**
- Increment version in `sw.js`
- Redeploy
- Instruct users to hard refresh (Ctrl+Shift+R) or clear cache

#### 5. Active Sessions Not Showing

**Symptoms**: Teacher dashboard doesn't show active sessions

**Diagnosis:**
- Check if polling is running (check browser console)
- Verify `active_sessions` collection exists
- Check Security Rules

**Solution:**
- Verify Security Rules allow teachers to read `active_sessions`
- Check browser console for polling errors
- Ensure `startActiveSessionsPolling()` is called

### Debug Mode

**Enable Debug Logging:**

In browser console:
```javascript
window.debugLog = console.log;
```

This enables detailed logging throughout the application.

**Check Service Worker:**
```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers:', registrations);
});
```

**Check localStorage:**
```javascript
// In browser console
console.log('localStorage:', localStorage);
console.log('sessionStorage:', sessionStorage);
```

---

## Updates and Versioning

### Version Numbering

**Service Worker Version**: `sw.js`
- Format: `v2`, `v3`, etc.
- Increment when cache needs refresh

**Application Version**: Track in code comments or separate file
- Format: `v1.0.0`
- Major.Minor.Patch

### Update Process

1. **Development**:
   - Make changes locally
   - Test using `firebase serve`
   - Test on mobile (see [TEST_ON_MOBILE.md](./TEST_ON_MOBILE.md))

2. **Production**:
   - Deploy: `firebase deploy --only hosting`
   - Monitor deployment
   - Test production URL

3. **Post-Deployment**:
   - Verify functionality
   - Check error logs
   - Monitor user feedback

### Breaking Changes

**If database schema changes:**
1. Create migration script in `Utilities/` folder
2. Test migration locally
3. Backup production database
4. Run migration script
5. Update application code
6. Deploy application

**If Security Rules change:**
1. Update rules in Firebase Console
2. Test thoroughly
3. Update application code if needed
4. Deploy

---

## Backup and Recovery

### Database Backups

**Firebase Automatic Backups:**
- Firebase provides automatic backups for Firestore
- Retention varies by plan
- Location: Firebase Console → Firestore → Backups

**Manual Backup:**
- Use utility scripts in `Utilities/` folder to export collections
- Export to Excel or JSON format
- Store backups securely

**Restore from Backup:**
1. Use Firebase Console → Firestore → Backups
2. Select backup point
3. Restore to new database or overwrite (with caution)

### Code Backup

**Git Repository:**
- All code should be in Git repository
- Firebase Hosting keeps deployment history
- Can rollback to previous deployment

**Rollback Deployment:**
1. Firebase Console → Hosting → Deploy history
2. Find previous successful deployment
3. Click "Publish deploy"
4. Verify rollback

### Data Export

**Export All Scores:**
- Use utility script: `Utilities/export-user-profiles-to-excel.js` (adapt for scores)
- Or use Firebase Console → Firestore → Export

**Export Student Progress:**
- Use Teacher Dashboard Excel export feature
- Or create custom utility script

---

## Security Considerations

### Authentication

- **Firebase Auth**: Handles all authentication securely
- **Password Format**: DDMMYY from date of birth (6 numeric digits)
- **Session Management**: Browser-based session management

### Data Protection

- **Firebase Security Rules**: Ensures users can only access their own data
- **HTTPS**: Enforced by Firebase Hosting (SSL certificates)
- **API Keys**: Firebase config keys are safe for client-side use (Security Rules protect data)

### Best Practices

1. **Never commit sensitive data** to Git
2. **Review Security Rules** regularly
3. **Monitor Firebase logs** for suspicious activity
4. **Keep dependencies updated** (Firebase SDK, etc.)
5. **Use Firebase Service Account** for server-side operations only

---

## Performance Optimization

### Database Optimization

**Indexes:**
- Create composite indexes in Firebase Console for frequently queried fields
- Monitor query performance in Firebase Console

**Query Optimization:**
- Use specific filters (user_id, school_id, class, section)
- Limit result sets where possible
- Use Firestore pagination for large datasets

### Frontend Optimization

**Service Worker Caching:**
- Static assets cached for offline use
- Update cache version when assets change

**Code Optimization:**
- Consider minifying JavaScript/CSS for production
- Firebase Hosting can handle compression automatically

**Image Optimization:**
- PWA icons are already optimized (192x192, 512x512)

---

## Support and Documentation

### Internal Documentation

- **Code Comments**: Functions are well-documented in code
- **This Manual**: Maintenance procedures
- **User Manual**: End-user documentation (see [USER_MANUAL.md](./USER_MANUAL.md))
- **Collection Specifications**: See [USER_SCORES_COLLECTION.md](./USER_SCORES_COLLECTION.md) and [ACTIVE_SESSIONS_COLLECTION.md](./ACTIVE_SESSIONS_COLLECTION.md)

### External Resources

- **Firebase Docs**: https://firebase.google.com/docs
- **Firestore Docs**: https://firebase.google.com/docs/firestore
- **Firebase Auth Docs**: https://firebase.google.com/docs/auth
- **PWA Guide**: https://web.dev/progressive-web-apps/

### Contact Information

For technical issues or questions:
- Review this manual first
- Check Firebase Console dashboards
- Review code comments
- Check documentation files

---

## Appendix

### Utility Scripts

**Location**: `Utilities/` folder

Available scripts:
- `export-user-profiles-to-excel.js` - Export user profiles to Excel
- `convert-dob-to-string.js` - Convert date_of_birth to string format
- `remove-email-from-user-profiles.js` - Remove email field from profiles
- `check-dob-formats.js` - Check date_of_birth formats
- `check-user-scores-dob.js` - Check date_of_birth in user_scores

**To Run:**
```bash
node Utilities/script-name.js
```

### Firestore Indexes

**Recommended Composite Indexes:**

1. `user_scores`:
   - `user_id` + `operation` + `variant` + `passed`
   - `school_id` + `class` + `section`
   - `user_id` + `operation` + `variant`

2. `user_profiles`:
   - `school_id` + `class` + `section`
   - `user_id` (automatic)

3. `active_sessions`:
   - `user_id` (automatic, document ID)
   - `operation` + `variant`
   - `last_activity`

**To Create:**
- Firebase Console → Firestore → Indexes
- Or Firebase will prompt you when running queries that need indexes

---

**Version**: 2.0  
**Last Updated**: January 2025  
**Maintained By**: Development Team
