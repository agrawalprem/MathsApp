# Learning Maths in Baby Steps

A progressive math learning application built with HTML, CSS, and JavaScript, deployed on Firebase Hosting with Firebase Authentication and Firestore database.

## Features

- Multiple math operations: Addition, Subtraction, Multiplication, Division
- Progressive difficulty variants for each operation
- Multi-digit number support with right-to-left input
- Real-time scoring and session tracking
- User authentication via Firebase Authentication
- Score saving across devices with Firestore database
- Secure data access with Firebase Security Rules
- Mobile-responsive design
- Teacher Dashboard for monitoring student progress

## Setup Instructions

### 1. Deploy to Firebase Hosting

1. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Initialize Firebase:**
   ```bash
   firebase init
   ```
   - Select "Hosting"
   - Select your Firebase project (or create a new one)
   - Set public directory to `.` (current directory)
   - Configure as single-page app: Yes

3. **Set Up Firebase:**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication (Email/Password)
   - Create Firestore database
   - Configure Firebase Security Rules
   - Firebase config is already configured in HTML files

4. **Deploy:**
   ```bash
   firebase deploy --only hosting
   ```
   - The app will be available at `https://your-project-id.web.app`

### 2. Testing Locally

1. **Start local server:**
   ```bash
   # Using Firebase CLI (recommended)
   firebase serve
   
   # Or using Python 3
   python -m http.server 8000
   
   # Or using Node.js http-server
   npx http-server
   ```

2. **Open in browser:**
   - Navigate to `http://localhost:5000` (Firebase) or `http://localhost:8000` (Python/Node)
   - **Important:** Always use a local server - don't open HTML files directly (file://) as ES modules and Firebase SDK won't work

3. **Test on mobile:**
   - See [Documentation/TEST_ON_MOBILE.md](./Documentation/TEST_ON_MOBILE.md) for instructions

### 3. Current Functionality

**Authentication:**
- Users log in using 6-digit user code and password (DDMMYY format from date of birth)
- Authentication state is maintained across page refreshes
- User sessions work across devices
- Firebase Authentication handles all authentication securely

**Data Persistence:**
- Scores are automatically saved to Firestore database after each session
- Data is accessed directly from the client using Firebase SDK
- Firebase Security Rules ensure users can only access their own data
- All operations are secure and protected

**Teacher Dashboard:**
- View student progress across all variants
- Filter by school, class, and section
- Real-time active session tracking (polls every 5 seconds)
- Export data to Excel

### 4. Firebase Setup

**Required Collections:**
- `user_profiles` - User information (name, class, school, etc.)
- `user_scores` - Quiz scores and results
- `schools` - School information
- `classes` - Class information (school_id, class, section)
- `active_sessions` - Active quiz sessions (for Teacher Dashboard)

**See Documentation:**
- [USER_SCORES_COLLECTION.md](./Documentation/USER_SCORES_COLLECTION.md) - Score collection structure
- [ACTIVE_SESSIONS_COLLECTION.md](./Documentation/ACTIVE_SESSIONS_COLLECTION.md) - Active sessions structure
- [MAINTENANCE_MANUAL.md](./Documentation/MAINTENANCE_MANUAL.md) - Complete setup and maintenance guide

### 5. File Structure

```
.
├── index.html              # Main login page
├── student-dashboard.html  # Student dashboard
├── teacher-dashboard.html  # Teacher dashboard
├── question.html          # Quiz question page
├── summary.html           # Quiz results page
├── firebase.json          # Firebase Hosting configuration
├── .firebaserc            # Firebase project configuration
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker (PWA)
├── Documentation/          # Project documentation
├── Utilities/             # Utility scripts for data management
└── README.md              # This file
```

## Features Overview

### Math Operations & Variants

- **Addition:** Single-digit, multi-digit with/without carry
- **Subtraction:** Various difficulty levels
- **Multiplication:** Times tables (2-9), sequential and random
- **Division:** Dividing by 1-9

### User Features

- **Authentication:** Secure login via Firebase Authentication
- **Progress Tracking:** Save scores and track progress in Firestore
- **Session Management:** Track correct/wrong answers, timing
- **Multi-device Support:** Access progress from any device
- **Teacher Dashboard:** Monitor student progress in real-time

### Mobile Optimization

- Responsive design for all screen sizes
- Touch-optimized input for multi-digit questions
- Keyboard-aware layout adjustments
- Sticky question area to prevent content jumping

## Troubleshooting

### Authentication Issues

- **Login not working:** Check browser console (F12) for detailed error messages
- **User not found:** Verify user exists in Firebase Authentication and `user_profiles` collection
- **Password issues:** Passwords are in DDMMYY format (from date of birth)

### Database Issues

- **"Failed to save score":** 
  - Verify Firestore database is created
  - Check Firebase Security Rules allow writes
  - Ensure user is logged in
- **Data not appearing:** Check Firestore Console → `user_scores` collection
- **Permission errors:** Verify Firebase Security Rules are configured correctly

### Local Server Issues

- **"Module not found" errors:** Always use a local server (firebase serve, Python http.server, etc.)
- **Firebase SDK errors:** Ensure you're accessing via HTTP (not file://)
- **CORS errors:** Check Firebase config is correct in HTML files

## Documentation

See the [Documentation](./Documentation/) folder for detailed guides:
- [START_LOCAL_SERVER.md](./Documentation/START_LOCAL_SERVER.md) - How to run locally
- [TEST_ON_MOBILE.md](./Documentation/TEST_ON_MOBILE.md) - Testing on mobile devices
- [MAINTENANCE_MANUAL.md](./Documentation/MAINTENANCE_MANUAL.md) - Complete maintenance guide

## Future Enhancements

- [ ] User progress dashboard showing statistics
- [ ] Leaderboards for friendly competition
- [ ] Achievement badges and milestones
- [ ] Practice recommendations based on performance
- [ ] Export progress reports (PDF/CSV)
- [ ] Progress charts and graphs
- [ ] Multiple user profiles (parent/child accounts)

## License

This project is open source and available for educational use.
