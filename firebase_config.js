// ============================================================================
// FIREBASE CONFIGURATION
// ============================================================================
// This file contains Firebase configuration and initialization
// Firebase project: Maths in Baby Steps
// ============================================================================

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBqCWeT44wwh92OL_8O0-j4IBwLeOaGSmc",
    authDomain: "maths-in-baby-steps.firebaseapp.com",
    projectId: "maths-in-baby-steps",
    storageBucket: "maths-in-baby-steps.firebasestorage.app",
    messagingSenderId: "235467885199",
    appId: "1:235467885199:web:dff119a28e6f897d1dfefa",
    measurementId: "G-XKB7TT32RL"
};

// Site URL for email redirects
const PRODUCTION_URL = 'https://maths-in-baby-steps.web.app';
const SITE_URL = window.location.origin; // Current URL (for local testing)

// For password reset, always use production URL (emails should go to live site, not localhost)
const PASSWORD_RESET_REDIRECT_URL = PRODUCTION_URL;

// Initialize Firebase services
let app = null;
let auth = null;
let db = null;

/**
 * Initialize Firebase App, Authentication, and Firestore
 * CALLED BY: index.html - DOMContentLoaded listener
 */
function initFirebase() {
    if (!window.firebase || !window.firebase.initializeApp) {
        console.error('❌ Firebase SDK not loaded');
        return false;
    }
    
    try {
        // Initialize Firebase App
        app = window.firebase.initializeApp(firebaseConfig);
        
        // Initialize Firebase Authentication
        auth = window.firebase.auth();
        
        // Initialize Firestore Database
        db = window.firebase.firestore();
        
        console.log('✅ Firebase initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Error initializing Firebase:', error);
        return false;
    }
}

// Expose Firebase instances globally
window.initFirebase = initFirebase;
window.firebaseApp = () => app;
window.firebaseAuth = () => auth;
window.firebaseDb = () => db;
