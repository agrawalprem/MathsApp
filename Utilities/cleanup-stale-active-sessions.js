/**
 * Utility script to clean up stale active sessions from Firestore
 * 
 * This script:
 * - Finds all active_sessions documents
 * - Checks last_activity timestamp
 * - Deletes sessions older than threshold (default: 10 minutes)
 * 
 * Usage:
 *   node Utilities/cleanup-stale-active-sessions.js [thresholdMinutes]
 * 
 * Example:
 *   node Utilities/cleanup-stale-active-sessions.js 10
 */

const admin = require('firebase-admin');
const { loadServiceAccount } = require('./service-account');
const { serviceAccount } = loadServiceAccount();

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

// Get threshold from command line argument or use default (10 minutes)
const thresholdMinutes = parseInt(process.argv[2]) || 10;
const thresholdMs = thresholdMinutes * 60 * 1000;

async function cleanupStaleSessions() {
    console.log(`\n🧹 Starting cleanup of stale active sessions (older than ${thresholdMinutes} minutes)...\n`);
    
    try {
        const activeSessionsRef = db.collection('active_sessions');
        const snapshot = await activeSessionsRef.get();
        
        if (snapshot.empty) {
            console.log('✅ No active sessions found.');
            return;
        }
        
        const now = Date.now();
        let deletedCount = 0;
        let keptCount = 0;
        const errors = [];
        
        console.log(`Found ${snapshot.size} active session(s). Checking each one...\n`);
        
        for (const docSnap of snapshot.docs) {
            const sessionData = docSnap.data();
            const sessionId = docSnap.id;
            const lastActivity = sessionData.last_activity;
            
            if (!lastActivity) {
                // No last_activity timestamp - consider it stale
                console.log(`⚠️  Session ${sessionId}: No last_activity timestamp - deleting`);
                try {
                    await docSnap.ref.delete();
                    deletedCount++;
                } catch (error) {
                    errors.push({ sessionId, error: error.message });
                    console.error(`❌ Error deleting ${sessionId}:`, error.message);
                }
                continue;
            }
            
            // Convert Firestore Timestamp to milliseconds
            const lastActivityMs = lastActivity.toMillis ? lastActivity.toMillis() : lastActivity._seconds * 1000;
            const minutesSinceActivity = (now - lastActivityMs) / (1000 * 60);
            
            if (minutesSinceActivity > thresholdMinutes) {
                console.log(`🗑️  Session ${sessionId}: Last activity ${minutesSinceActivity.toFixed(1)} minutes ago - deleting`);
                try {
                    await docSnap.ref.delete();
                    deletedCount++;
                } catch (error) {
                    errors.push({ sessionId, error: error.message });
                    console.error(`❌ Error deleting ${sessionId}:`, error.message);
                }
            } else {
                keptCount++;
                if (sessionData.user_id) {
                    console.log(`✅ Session ${sessionId} (user: ${sessionData.user_id}): Last activity ${minutesSinceActivity.toFixed(1)} minutes ago - keeping`);
                } else {
                    console.log(`✅ Session ${sessionId}: Last activity ${minutesSinceActivity.toFixed(1)} minutes ago - keeping`);
                }
            }
        }
        
        console.log(`\n📊 Cleanup Summary:`);
        console.log(`   - Total sessions: ${snapshot.size}`);
        console.log(`   - Deleted: ${deletedCount}`);
        console.log(`   - Kept: ${keptCount}`);
        if (errors.length > 0) {
            console.log(`   - Errors: ${errors.length}`);
            errors.forEach(({ sessionId, error }) => {
                console.log(`     - ${sessionId}: ${error}`);
            });
        }
        
        console.log(`\n✅ Cleanup completed!\n`);
        
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        process.exit(1);
    }
}

// Run cleanup
cleanupStaleSessions()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
