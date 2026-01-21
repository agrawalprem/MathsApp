// ============================================================================
// DATABASE MODULE - Supabase Configuration and Database Functions
// ============================================================================
// This module contains:
// - Supabase credentials and configuration
// - Global variables for user state
// - Database query functions
// - Email confirmation helpers
// ============================================================================
// NOTE: Some functions may reference UI functions (updateAuthUI, etc.) which
// are still in index.html. These will be moved to their respective modules later.
// ============================================================================

// ============================================================================
// SUPABASE CONFIGURATION
// ============================================================================

// Supabase configuration - Replace these with your Supabase project credentials
// Get these from: https://app.supabase.com → Your Project → Settings → API
const SUPABASE_URL = 'https://hgromnervuwqmskdenmb.supabase.co'; // e.g., https://xxxxxxxxxxxxx.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhncm9tbmVydnV3cW1za2Rlbm1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNTExMDgsImV4cCI6MjA4MzYyNzEwOH0.AYWM-6xGhVWnn61ctxj6fClW7KLEp98dlmrd3e5IqJ8'; // e.g., eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Site URL for email redirects - Update this with your Netlify site URL
// IMPORTANT: Password reset emails should always redirect to your production URL (Netlify)
// Also update Supabase Dashboard → Authentication → URL Configuration:
//   1. Set "Site URL" to your Netlify URL (e.g., https://premagrawal-maths.netlify.app)
//   2. Add to "Redirect URLs": https://premagrawal-maths.netlify.app/**
const PRODUCTION_URL = 'https://premagrawal-maths.netlify.app';
const SITE_URL = window.location.origin; // Current URL (for local testing)

// For password reset, always use production URL (emails should go to live site, not localhost)
const PASSWORD_RESET_REDIRECT_URL = PRODUCTION_URL;

// ============================================================================
// GLOBAL VARIABLES
// ============================================================================

// Initialize Supabase client
let supabase = null;
let currentUser = null;
let currentUserProfile = null; // Stores user profile with email and other fields
let isLoginMode = true;
let isFetchingProfile = false; // Prevent multiple simultaneous profile fetches


// ============================================================================
// EMAIL CONFIRMATION HELPERS
// ============================================================================

/**
 * REQUIREMENTS:
 * - Check if URL hash contains access_token or type=signup or type=recovery
 * - If found, clean up URL hash after 1 second delay
 * - Remove hash from URL using history.replaceState
 * - No return value
 * 
 * CALLED BY: shared_db.js - initSupabase() (after processing email confirmation or password reset), index.js - DOMContentLoaded listener (when type === 'signup')
 */
function handleEmailConfirmation() {
    if (window.debugLog) window.debugLog('handleEmailConfirmation');
    // Check if this is an email confirmation or password reset callback
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');
    
    if (type === 'signup' && accessToken) {
        // User clicked email confirmation link
        console.log('✅ Email confirmation detected - Supabase will process this automatically');
        // Supabase will automatically process the session from URL hash
        // when detectSessionInUrl: true is set and getSession() is called
    } else if (type === 'recovery' && accessToken) {
        // User clicked password reset link in email
        console.log('✅ Password reset confirmation detected');
        // Show forgot password modal with reset form
        // NOTE: showForgotPasswordModal is still in index.html, will be moved to auth.js later
        if (typeof showForgotPasswordModal === 'function') {
            showForgotPasswordModal();
        }
    }
}

/**
 * REQUIREMENTS:
 * - Check if URL hash contains access_token or type=signup or type=recovery
 * - If found, clean up URL hash after 1 second delay
 * - Remove hash from URL using history.replaceState
 * - No return value
 * 
 * CALLED BY: shared_db.js - initSupabase() (after processing email confirmation or password reset)
 */
function cleanupURLHash() {
    if (window.debugLog) window.debugLog('cleanupURLHash');
    if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');
        
        if (accessToken || type) {
            // Clean up URL hash after 1 second (give Supabase time to process)
            setTimeout(() => {
                const newURL = window.location.pathname + window.location.search;
                window.history.replaceState({}, document.title, newURL);
                console.log('✅ URL hash cleaned up');
            }, 1000);
        }
    }
}

// ============================================================================
// SUPABASE INITIALIZATION
// ============================================================================

/**
 * REQUIREMENTS:
 * - Create Supabase client with SUPABASE_URL and SUPABASE_ANON_KEY
 * - Set detectSessionInUrl: true to handle email confirmation links
 * - Get current session from Supabase
 * - If session exists:
 *   - Set currentUser to session.user
 *   - Fetch user profile
 *   - Call updateAuthUI() to update UI
 * - If no session:
 *   - Set currentUser to null
 *   - Call updateAuthUI() to show login form
 * - Set up auth state change listener
 * - Handle email confirmation and password reset URLs
 * - Clean up URL hash after processing
 * - No return value
 * 
 * CALLED BY: index.js - tryInitSupabase() (after Supabase library loads)
 */
async function initSupabase() {
    if (window.debugLog) window.debugLog('initSupabase');
    if (!window.supabase || !window.supabase.createClient) {
        console.error('❌ Supabase library not loaded');
        return;
    }
    
    try {
        // Create Supabase client
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                detectSessionInUrl: true, // Automatically detect session from URL hash (for email confirmation)
                persistSession: true, // Persist session in localStorage
                autoRefreshToken: true // Automatically refresh expired tokens
            }
        });
        
        console.log('✅ Supabase client initialized');
        
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
            console.error('❌ Error getting session:', sessionError);
        }
        
        if (session) {
            currentUser = session.user;
            console.log('✅ Existing session found, user:', currentUser.email);
            
            // Fetch user profile
            fetchUserProfile().then(async profile => {
                currentUserProfile = profile;
                if (typeof updateAuthUI === 'function') {
                    await updateAuthUI(true); // true = skip page switch
                }
                // Handle email confirmation or password reset URLs
                handleEmailConfirmation();
                cleanupURLHash();
            }).catch(err => {
                console.warn('⚠️ Could not fetch user profile:', err);
                if (typeof updateAuthUI === 'function') {
                    updateAuthUI(true); // true = skip page switch
                }
                handleEmailConfirmation();
                cleanupURLHash();
            });
        } else {
            currentUser = null;
            console.log('ℹ️ No existing session found');
            if (typeof updateAuthUI === 'function') {
                updateAuthUI(true); // true = skip page switch
            }
            // Still check for email confirmation or password reset URLs (in case user is not logged in)
            handleEmailConfirmation();
            cleanupURLHash();
        }
        
        // Set up auth state change listener
        supabase.auth.onAuthStateChange((event, session) => {
            console.log('🔄 Auth state changed:', event, session ? 'session exists' : 'no session');
            
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                currentUser = session?.user || null;
                console.log('✅ User signed in:', currentUser?.email);
                
                // Fetch user profile
                fetchUserProfile().then(async profile => {
                    currentUserProfile = profile;
                    if (typeof updateAuthUI === 'function') {
                        await updateAuthUI();
                    }
                }).catch(err => {
                    console.warn('⚠️ Could not fetch user profile:', err);
                    if (typeof updateAuthUI === 'function') {
                        updateAuthUI();
                    }
                });
            } else if (event === 'SIGNED_OUT') {
                currentUser = null;
                currentUserProfile = null;
                console.log('✅ User signed out');
                if (typeof updateAuthUI === 'function') {
                    updateAuthUI();
                }
            } else if (event === 'USER_UPDATED') {
                currentUser = session?.user || null;
                console.log('✅ User updated:', currentUser?.email);
                // Refresh profile if user data changed
                fetchUserProfile().then(profile => {
                    currentUserProfile = profile;
                    if (typeof updateAuthUI === 'function') {
                        updateAuthUI();
                    }
                }).catch(err => {
                    console.warn('⚠️ Could not refresh user profile:', err);
                });
            }
        });
        
        console.log('✅ Auth state change listener set up');
    } catch (error) {
        console.error('❌ Error initializing Supabase:', error);
    }
}

// ============================================================================
// USER PROFILE FUNCTIONS
// ============================================================================

/**
 * REQUIREMENTS:
 * - Return early if no currentUser
 * - Query user_profiles table for user_id matching currentUser.id
 * - Return first row (user profile object) or null if not found
 * - Handle errors gracefully (return null)
 * - Cache result in currentUserProfile
 * 
 * CALLED BY: shared_db.js - initSupabase() (when existing session found, on auth state changes), index.js - handleLoginForm() (after successful login), student-dashboard.js - updateAuthUI() (when updating UI for logged-in user)
 */
async function fetchUserProfile() {
    if (window.debugLog) window.debugLog('fetchUserProfile');
    if (!currentUser || !supabase) {
        console.warn('⚠️ fetchUserProfile: No currentUser or supabase client');
        return null;
    }
    
    // Prevent multiple simultaneous fetches
    if (isFetchingProfile) {
        console.log('⏳ Profile fetch already in progress, waiting...');
        // Wait for existing fetch to complete
        while (isFetchingProfile) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return currentUserProfile; // Return cached result
    }
    
    isFetchingProfile = true;
    
    try {
        console.log('📥 Fetching user profile for user:', currentUser.id);
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', currentUser.id)
            .single();
        
        if (error) {
            if (error.code === 'PGRST116') {
                // No rows returned (user profile doesn't exist)
                console.warn('⚠️ User profile not found in database for user:', currentUser.id);
                return null;
            }
            throw error;
        }
        
        console.log('✅ User profile fetched:', data);
        currentUserProfile = data;
        return data;
    } catch (error) {
        console.error('❌ Error fetching user profile:', error);
        return null;
    } finally {
        isFetchingProfile = false;
    }
}

// ============================================================================
// SCORE SAVING FUNCTIONS
// ============================================================================

/**
 * REQUIREMENTS:
 * - Return early if no currentUser
 * - Insert score into scores table with:
 *   - user_id: currentUser.id
 *   - variant_key: variantKey (e.g., "addition_1A")
 *   - score: score (0-100)
 *   - passed: passed (boolean, optional - defaults to score >= 70 if not provided)
 *   - timestamp: current timestamp
 * - Return inserted row or null if error
 * - Handle errors gracefully (log and return null)
 * 
 * CALLED BY: summary.html - DOMContentLoaded listener (after quiz session ends and summary page loads)
 */
async function saveScore(variantKey, score, passed = null) {
    if (window.debugLog) window.debugLog('saveScore');
    if (!currentUser || !supabase) {
        console.warn('⚠️ saveScore: No currentUser or supabase client, score not saved');
        return null;
    }
    
    try {
        // Use provided passed value, or calculate from score if not provided
        const passedValue = passed !== null ? passed : (score >= 70);
        
        // Split variantKey into operation and variant (e.g., "addition_1A0" -> operation: "addition", variant: "1A0")
        const [operation, variant] = variantKey.split('_');
        if (!operation || !variant) {
            throw new Error(`Invalid variantKey format: ${variantKey}. Expected format: "operation_variant"`);
        }
        
        console.log('💾 Saving score:', { variantKey, operation, variant, score, passed: passedValue });
        
        const { data, error } = await supabase
            .from('user_scores')
            .insert([{
                user_id: currentUser.id,
                operation: operation,
                variant: variant,
                score: score,
                passed: passedValue,
                completed_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        console.log('✅ Score saved:', data);
        return data;
    } catch (error) {
        console.error('❌ Error saving score:', error);
        return null;
    }
}

// ============================================================================
// VARIANT PROGRESS FUNCTIONS
// ============================================================================

/**
 * REQUIREMENTS:
 * - Return early if no currentUser
 * - Query scores table for user_id matching currentUser.id
 * - Filter for passed: true
 * - Extract variant_key from each row
 * - Add each variant_key to window.passedVariants Set
 * - Log count of passed variants
 * - Handle errors gracefully (log and continue)
 * - No return value
 * 
 * CALLED BY: student-dashboard.js - updateAuthUI() (when updating UI for logged-in user), student-dashboard.js - selectOperation() (when selecting an operation), summary.js - endSession() (after saving score)
 */
async function fetchPassedVariants() {
    if (window.debugLog) window.debugLog('fetchPassedVariants');
    if (!currentUser || !supabase) {
        console.warn('⚠️ fetchPassedVariants: No currentUser or supabase client');
        // NOTE: passedVariants is still in index.html, will be moved to dashboard.js later
        if (window.passedVariants) {
            window.passedVariants.clear();
        }
        return;
    }
    
    try {
        console.log('📥 Fetching passed variants for user:', currentUser.id);
        // Fetch all scores and filter in JavaScript to avoid boolean query issues
        // Table has 'operation' and 'variant' as separate columns, not 'variant_key'
        const { data, error } = await supabase
            .from('user_scores')
            .select('operation, variant, passed')
            .eq('user_id', currentUser.id);
        
        if (error) {
            console.error('❌ Supabase query error details:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            throw error;
        }
        
        // Clear existing passed variants
        if (window.passedVariants) {
            window.passedVariants.clear();
        } else {
            window.passedVariants = new Set();
        }
        
        // Filter for passed = true in JavaScript (handles boolean, string, or number)
        if (data && data.length > 0) {
            data.forEach(row => {
                // Check if passed is true (handle boolean true, string 'true', or number 1)
                const isPassed = row.passed === true || row.passed === 'true' || row.passed === 1 || row.passed === '1';
                if (isPassed) {
                    // Construct variant_key from operation and variant (e.g., "addition_1A0")
                    const variantKey = `${row.operation}_${row.variant}`;
                    window.passedVariants.add(variantKey);
                }
            });
            console.log('✅ Passed variants fetched:', window.passedVariants.size, 'variants');
        } else {
            console.log('ℹ️ No passed variants found');
        }
    } catch (error) {
        console.error('❌ Error fetching passed variants:', error);
        // Clear passed variants on error
        if (window.passedVariants) {
            window.passedVariants.clear();
        }
    }
}

/**
 * REQUIREMENTS:
 * - Return early if no currentUser
 * - Query scores table for user_id matching currentUser.id
 * - Group by variant_key
 * - For each variant, check if ALL attempts have passed: false
 * - If all attempts failed, add variant_key to window.failedVariants Set
 * - Log count of failed variants
 * - Handle errors gracefully (log and continue)
 * - No return value
 * 
 * CALLED BY: student-dashboard.js - updateAuthUI() (when updating UI for logged-in user), student-dashboard.js - selectOperation() (when selecting an operation), summary.js - endSession() (after saving score)
 */
async function fetchFailedVariants() {
    if (window.debugLog) window.debugLog('fetchFailedVariants');
    if (!currentUser || !supabase) {
        console.warn('⚠️ fetchFailedVariants: No currentUser or supabase client');
        // NOTE: failedVariants and passedVariants are still in index.html, will be moved to dashboard.js later
        if (window.failedVariants) {
            window.failedVariants.clear();
        }
        return;
    }
    
    try {
        console.log('📥 Fetching failed variants for user:', currentUser.id);
        // Table has 'operation' and 'variant' as separate columns, not 'variant_key'
        const { data, error } = await supabase
            .from('user_scores')
            .select('operation, variant, passed')
            .eq('user_id', currentUser.id);
        
        if (error) {
            console.error('❌ Supabase query error details:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            throw error;
        }
        
        // Clear existing failed variants
        if (window.failedVariants) {
            window.failedVariants.clear();
        } else {
            window.failedVariants = new Set();
        }
        
        if (data && data.length > 0) {
            // Group by variant_key (constructed from operation and variant)
            const variantGroups = {};
            data.forEach(row => {
                // Construct variant_key from operation and variant (e.g., "addition_1A0")
                const variantKey = `${row.operation}_${row.variant}`;
                if (!variantGroups[variantKey]) {
                    variantGroups[variantKey] = [];
                }
                variantGroups[variantKey].push(row.passed);
            });
            
            // Check each variant: if ALL attempts failed (all passed === false), add to failedVariants
            Object.keys(variantGroups).forEach(variantKey => {
                const attempts = variantGroups[variantKey];
                const allFailed = attempts.every(passed => passed === false || passed === 'false' || passed === 0 || passed === '0');
                if (allFailed && attempts.length >= 3) {
                    // Only mark as failed if user has attempted at least 3 times and all failed
                    window.failedVariants.add(variantKey);
                }
            });
            
            console.log('✅ Failed variants fetched:', window.failedVariants.size, 'variants');
        } else {
            console.log('ℹ️ No failed variants found');
        }
    } catch (error) {
        console.error('❌ Error fetching failed variants:', error);
        // Clear failed variants on error
        if (window.failedVariants) {
            window.failedVariants.clear();
        }
    }
}

// ============================================================================
// EXPOSE FUNCTIONS GLOBALLY
// ============================================================================

// Expose functions globally for use by other modules
window.initSupabase = initSupabase;
window.fetchUserProfile = fetchUserProfile;
window.saveScore = saveScore;
window.fetchPassedVariants = fetchPassedVariants;
window.fetchFailedVariants = fetchFailedVariants;
window.handleEmailConfirmation = handleEmailConfirmation;
