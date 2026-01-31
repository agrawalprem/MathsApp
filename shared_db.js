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
//   1. Set "Site URL" to your Netlify URL (e.g., https://mathsbaby.netlify.app)
//   2. Add to "Redirect URLs": https://mathsbaby.netlify.app/**
const PRODUCTION_URL = 'https://mathsbaby.netlify.app';
const SITE_URL = window.location.origin; // Current URL (for local testing)

// For password reset, always use production URL (emails should go to live site, not localhost)
const PASSWORD_RESET_REDIRECT_URL = PRODUCTION_URL;

// ============================================================================
// GLOBAL VARIABLES
// ============================================================================

// Initialize Supabase client (use var to allow redeclaration if script loads multiple times)
// Check if already declared to avoid redeclaration error
if (typeof supabase === 'undefined') {
    var supabase = null;
}

var currentUser = null;
var currentUserProfile = null; // Stores user profile with email and other fields
var isLoginMode = true;
var isFetchingProfile = false; // Prevent multiple simultaneous profile fetches

// Session timeout management
var sessionTimeoutTimer = null; // Stores the timeout timer ID
var sessionTimeoutMinutes = null; // Stores the timeout duration for current session

// Inactivity timeout management (5 minutes)
var inactivityTimer = null; // Stores the inactivity timeout timer ID
var inactivityTimeoutMinutes = 5; // 5 minutes of inactivity before logout
var activityEventListeners = []; // Stores event listeners for cleanup


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
                persistSession: true, // Persist session in localStorage (users stay logged in across page reloads)
                autoRefreshToken: true // Automatically refresh expired tokens (30-minute hard timeout still works via JavaScript timer)
            }
        });
        
        console.log('✅ Supabase client initialized');
        
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
            console.error('❌ Error getting session:', sessionError);
        }
        
        if (session) {
            // Check if this session is from a password recovery token
            const isRecoveryFlow = window.location.hash?.includes('type=recovery') || 
                                   window.location.search?.includes('type=recovery');
            
            if (isRecoveryFlow) {
                console.log('🔑 Password recovery session detected - skipping normal login flow');
                currentUser = session.user;
                // Don't fetch profile or update UI - password reset form is already shown
                // Just keep user authenticated for password reset
                handleEmailConfirmation();
                cleanupURLHash();
            } else {
                currentUser = session.user;
                console.log('✅ Existing session found, user:', currentUser.email);
                
                // Fetch user profile
                fetchUserProfile().then(async profile => {
                    currentUserProfile = profile;
                    if (typeof updateAuthUI === 'function') {
                        await updateAuthUI(true); // true = skip page switch
                    }
                    // Start session timeout based on school configuration
                    if (profile) {
                        const timeoutMinutes = await fetchSessionTimeout(profile.school_id);
                        startSessionTimeout(timeoutMinutes);
                    }
                    // Start inactivity tracking (5-minute timeout)
                    startInactivityTracking();
                    // Handle email confirmation or password reset URLs
                    handleEmailConfirmation();
                    cleanupURLHash();
                }).catch(err => {
                    console.warn('⚠️ Could not fetch user profile:', err);
                    if (typeof updateAuthUI === 'function') {
                        updateAuthUI(true); // true = skip page switch
                    }
                    // Start session timeout with default (30 minutes) if profile fetch fails
                    startSessionTimeout(30);
                    // Start inactivity tracking (5-minute timeout)
                    startInactivityTracking();
                    handleEmailConfirmation();
                    cleanupURLHash();
                });
            }
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
            
            // Check if this is a password recovery flow
            const isRecoveryFlow = window.location.hash?.includes('type=recovery') || 
                                   window.location.search?.includes('type=recovery');
            
            // Handle password recovery event - user is authenticated but we don't want to show logged-in UI
            if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && isRecoveryFlow)) {
                console.log('🔑 Password recovery detected - user authenticated for password reset only');
                currentUser = session?.user || null;
                // Don't fetch profile or update UI - just keep user authenticated for password reset
                // The password reset form is already shown by index.js
                return; // Exit early, don't process as normal login
            }
            
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                
                currentUser = session?.user || null;
                console.log('✅ User signed in:', currentUser?.email);
                
                // Fetch user profile
                fetchUserProfile().then(async profile => {
                    currentUserProfile = profile;
                    if (typeof updateAuthUI === 'function') {
                        await updateAuthUI();
                    }
                    // Start session timeout based on school configuration
                    if (profile) {
                        const timeoutMinutes = await fetchSessionTimeout(profile.school_id);
                        startSessionTimeout(timeoutMinutes);
                    }
                    // Start inactivity tracking (5-minute timeout)
                    startInactivityTracking();
                }).catch(err => {
                    console.warn('⚠️ Could not fetch user profile:', err);
                    if (typeof updateAuthUI === 'function') {
                        updateAuthUI();
                    }
                    // Start session timeout with default (30 minutes) if profile fetch fails
                    startSessionTimeout(30);
                    // Start inactivity tracking (5-minute timeout)
                    startInactivityTracking();
                });
            } else if (event === 'SIGNED_OUT') {
                currentUser = null;
                currentUserProfile = null;
                console.log('✅ User signed out');
                // Clear session timeout
                clearSessionTimeout();
                // Stop inactivity tracking
                stopInactivityTracking();
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
        
        // Set up browser close handler (only once, regardless of auth state)
        setupBrowserCloseHandler();
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
        
        // Retry logic for transient errors (like 406)
        let lastError = null;
        const maxRetries = 3;
        const retryDelay = 500; // 500ms between retries
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', currentUser.id)
                .single();
            
            if (!error) {
                // Success - profile found
                console.log('✅ User profile fetched:', data);
                currentUserProfile = data;
                return data;
            }
            
            // Handle specific error codes
            if (error.code === 'PGRST116') {
                // No rows returned (user profile doesn't exist)
                // Only log warning on first attempt to avoid spam
                if (attempt === 1) {
                    console.warn('⚠️ User profile not found in database for user:', currentUser.id);
                }
                return null;
            }
            
            // Check if it's a 406 or other HTTP error that might be transient
            const isTransientError = error.status === 406 || error.status === 429 || 
                                   (error.status >= 500 && error.status < 600);
            
            if (isTransientError && attempt < maxRetries) {
                // Transient error - retry after delay
                lastError = error;
                console.log(`⏳ Profile fetch attempt ${attempt} failed (${error.status || error.code}), retrying...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
                continue;
            }
            
            // Non-transient error or max retries reached
            throw error;
        }
        
        // If we get here, all retries failed
        throw lastError || new Error('Failed to fetch user profile after retries');
        
    } catch (error) {
        // Only log error if it's not a "not found" error (already logged above)
        if (error.code !== 'PGRST116') {
            console.error('❌ Error fetching user profile:', error);
        }
        return null;
    } finally {
        isFetchingProfile = false;
    }
}

// ============================================================================
// ACTIVE SESSION TRACKING FUNCTIONS
// ============================================================================

/**
 * REQUIREMENTS:
 * - Update or insert active session record after each question completion
 * - Set user_id, operation, variant, last_question_no_completed, last_question_correct_wrong, total_questions
 * - Update last_activity timestamp
 * - Handle errors gracefully (log but don't interrupt student flow)
 * 
 * CALLED BY: question.js - checkAnswer() (after each question is answered)
 */
async function updateActiveSession(operation, variant, questionNo, isCorrect, totalQuestions) {
    if (window.debugLog) window.debugLog('updateActiveSession');
    if (!currentUser || !supabase) {
        return; // Silently fail if not logged in
    }
    
    try {
        const { error } = await supabase
            .from('active_sessions')
            .upsert({
                user_id: currentUser.id,
                operation: operation,
                variant: variant,
                last_question_no_completed: questionNo,
                last_question_correct_wrong: isCorrect,
                total_questions: totalQuestions,
                last_activity: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            });
        
        if (error) {
            console.error('❌ Error updating active session:', error);
        }
    } catch (error) {
        console.error('❌ Error updating active session:', error);
    }
}

/**
 * REQUIREMENTS:
 * - Delete active session record when student completes session or logs out
 * - Handle errors gracefully
 * 
 * CALLED BY: summary.js - endSession() (when session completes), logout handlers (when user logs out)
 */
async function clearActiveSession() {
    if (window.debugLog) window.debugLog('clearActiveSession');
    if (!currentUser || !supabase) {
        return; // Silently fail if not logged in
    }
    
    try {
        const { error } = await supabase
            .from('active_sessions')
            .delete()
            .eq('user_id', currentUser.id);
        
        if (error) {
            console.error('❌ Error clearing active session:', error);
        }
    } catch (error) {
        console.error('❌ Error clearing active session:', error);
    }
}

// Expose functions globally
window.updateActiveSession = updateActiveSession;
window.clearActiveSession = clearActiveSession;

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
        
        // Get session data from window.currentSession if available (set by summary page)
        const session = window.currentSession || null;
        const correctCount = session?.correctCount || 0;
        const wrongCount = session?.wrongCount || 0;
        const totalQuestions = correctCount + wrongCount;
        const totalTime = Math.round((session?.totalTime || 0) * 10) / 10;
        const averageTime = correctCount > 0 ? Math.round((totalTime / correctCount) * 10) / 10 : 0;
        
        console.log('💾 Saving score:', { 
            variantKey, 
            operation, 
            variant, 
            correctCount,
            wrongCount,
            totalQuestions,
            totalTime,
            averageTime,
            passed: passedValue
        });
        
        const { data, error } = await supabase
            .from('user_scores')
            .insert([{
                user_id: currentUser.id,
                operation: operation,
                variant: variant,
                correct_count: correctCount,
                wrong_count: wrongCount,
                total_questions: totalQuestions,
                total_time: totalTime,
                average_time: averageTime,
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
 * - Fetch all scores for current user and directly update variant cards and operation cards
 * - Process data and update UI during processing (no intermediate result object)
 * - Priority logic: Pass (Priority 1) > Fail (Priority 2) > No Attempt (Priority 3)
 * - Failed status requires attemptCount >= 1 (not >= 3)
 * - Operation status: Pass if all variants in operation have pass status
 * - Handle errors gracefully
 * 
 * CALLED BY: student-dashboard.js - updateAuthUI() (when dashboard loads)
 */
async function fetchAndUpdateVariantStatuses() {
    if (window.debugLog) window.debugLog('fetchAndUpdateVariantStatuses');
    if (!currentUser || !supabase) {
        console.warn('⚠️ fetchAndUpdateVariantStatuses: No currentUser or supabase client');
        return;
    }
    
    try {
        console.log('📥 Fetching all variant statuses for user:', currentUser.id);
        
        // Fetch all scores from database
        const { data, error } = await supabase
            .from('user_scores')
            .select('operation, variant, passed, average_time')
            .eq('user_id', currentUser.id)
            .order('operation', { ascending: true })
            .order('variant', { ascending: true })
            .order('completed_at', { ascending: false });
        
        if (error) {
            console.error('❌ Error fetching variant statuses:', error);
            return;
        }
        
        // Group scores by variant_key
        const variantData = {};
        if (data && data.length > 0) {
            data.forEach(row => {
                    const variantKey = `${row.operation}_${row.variant}`;
                if (!variantData[variantKey]) {
                    variantData[variantKey] = {
                        passedScores: [],
                        failedCount: 0
                    };
                }
                
                const isPassed = row.passed === true || row.passed === 'true' || row.passed === 1 || row.passed === '1';
                if (isPassed && row.average_time != null && !isNaN(row.average_time)) {
                    variantData[variantKey].passedScores.push(parseFloat(row.average_time));
                } else if (!isPassed) {
                    variantData[variantKey].failedCount++;
                }
            });
        }
        
        // Get variants object from shared.js
        const variantsObj = window.variants || {};
        const operations = ['addition', 'subtraction', 'multiplication', 'division'];
        const learningSequence = window.learningSequence || {};
        
        // Track which operation to show initially (first one where not all variants passed)
        let firstIncompleteOperation = null;
        
        // Process each operation
        operations.forEach(operation => {
            const opsVariants = variantsObj[operation];
            if (!opsVariants) return;
            
            const sequence = learningSequence[operation] || [];
            const variantKeys = Object.keys(opsVariants);
            const sortedKeys = variantKeys.sort((a, b) => {
                const indexA = sequence.indexOf(a);
                const indexB = sequence.indexOf(b);
                if (indexA !== -1 && indexB !== -1) {
                    return indexA - indexB;
        }
                if (indexA !== -1) return -1;
                if (indexB !== -1) return 1;
                return 0;
            });
            

            // Get container for this operation
            const containerId = `variantsContainer${operation.charAt(0).toUpperCase() + operation.slice(1)}`;
            const container = document.getElementById(containerId);
            if (!container) {
                console.warn(`⚠️ Container ${containerId} not found`);
                return;
            }
            
            // Track if all variants passed for this operation
            let allVariantsPassed = true;
            
            // Process each variant and update existing card
            sortedKeys.forEach(variantKey => {
                const variant = opsVariants[variantKey];
                const variantKeyFull = `${operation}_${variantKey}`;
                const data = variantData[variantKeyFull];
            
                // Determine status with priority logic
                let status = 'none';
                let minTime = null;
                let attemptCount = 0;
                
                if (data) {
                    // Priority 1: Pass (if any attempt passed)
                    if (data.passedScores.length > 0) {
                        status = 'passed';
                        minTime = Math.min(...data.passedScores);
                    }
                    // Priority 2: Fail (if all attempts failed AND attemptCount >= 1)
                    else if (data.failedCount >= 1) {
                        status = 'failed';
                        attemptCount = data.failedCount;
                    }
                    // Priority 3: No Attempt (otherwise)
                }
                
                // Track operation completion
                if (status !== 'passed') {
                    allVariantsPassed = false;
                }

                // Find existing card by data attributes
                const card = container.querySelector(`[data-variant="${variantKey}"]`);
                if (!card) {
                    console.warn(`⚠️ Card not found for variant ${variantKey} in ${containerId}`);
                    return;
                }
                
                // Update status text
                const statusElement = card.querySelector('.variant-status');
                if (statusElement) {
                    let statusText = 'Not started';
                    if (status === 'passed') {
                        if (minTime != null) {
                            statusText = `✓ ${minTime.toFixed(1)}s`;
                        } else {
                            statusText = '✓ Passed';
                        }
                    } else if (status === 'failed') {
                        statusText = `✗ ${attemptCount} attempt${attemptCount !== 1 ? 's' : ''}`;
                    }
                    statusElement.textContent = statusText;
                }
                
                // Update CSS classes
                card.classList.remove('passed', 'failed');
                if (status === 'passed') {
                    card.classList.add('passed');
                } else if (status === 'failed') {
                    card.classList.add('failed');
                }
                
                // Ensure click handler is set
                if (!card.onclick) {
                    card.onclick = () => {
                        if (typeof window.launchVariant === 'function') {
                            window.launchVariant(operation, variantKey);
                        } else {
                            // Fallback: navigate directly
                            sessionStorage.setItem('quizOperation', operation);
                            sessionStorage.setItem('quizVariant', variantKey);
                            window.location.href = 'question.html';
                        }
                    };
                }
            });
            
            // Update operation card completion status
            const operationCards = document.querySelectorAll('.operation-card');
            operationCards.forEach(card => {
                const onclickAttr = card.getAttribute('onclick');
                if (onclickAttr && onclickAttr.includes(`selectOperation('${operation}')`)) {
                    if (allVariantsPassed && variantKeys.length > 0) {
                        card.classList.add('completed');
                    } else {
                        card.classList.remove('completed');
                    }
                }
            });
            
            // Track first incomplete operation for initial display
            if (!allVariantsPassed && firstIncompleteOperation === null) {
                firstIncompleteOperation = operation;
    }
        });
        
        // Show the first incomplete operation container, or addition if all passed
        // Only set visible operation on first run (when window.selectedOperation is not set)
        // After that, respect user's selection
        if (!window.selectedOperation) {
            const operationToShow = firstIncompleteOperation || 'addition';
            window.selectedOperation = operationToShow;
            
            // Show/hide containers
            operations.forEach(operation => {
                const containerId = `variantsContainer${operation.charAt(0).toUpperCase() + operation.slice(1)}`;
                const container = document.getElementById(containerId);
                if (container) {
                    if (operation === operationToShow) {
                        container.classList.remove('hidden');
                    } else {
                        container.classList.add('hidden');
                    }
                }
            });
            
            // Update operation card selection
            document.querySelectorAll('.operation-card').forEach(card => {
                card.classList.remove('selected');
                const onclickAttr = card.getAttribute('onclick');
                if (onclickAttr && onclickAttr.includes(`selectOperation('${operationToShow}')`)) {
                    card.classList.add('selected');
                }
            });
        }
        
        console.log('✅ Variant statuses updated and UI refreshed');
    } catch (error) {
        console.error('❌ Error in fetchAndUpdateVariantStatuses:', error);
    }
}

// ============================================================================
// SESSION TIMEOUT MANAGEMENT
// ============================================================================

/**
 * REQUIREMENTS:
 * - Fetch session_timeout_minutes from schools table based on school_id
 * - If school_id is null (online student), return 120 minutes (default for online)
 * - If school not found, return 30 minutes (default)
 * - Return timeout in minutes (integer)
 * 
 * CALLED BY: shared_db.js - startSessionTimeout() (when user signs in)
 */
async function fetchSessionTimeout(schoolId) {
    if (window.debugLog) window.debugLog('fetchSessionTimeout', `(schoolId=${schoolId})`);
    
    // Online students (no school_id) get 120 minutes default
    if (!schoolId) {
        console.log('ℹ️ Online student detected, using 120-minute timeout');
        return 120;
    }
    
    if (!supabase) {
        console.warn('⚠️ fetchSessionTimeout: No supabase client, using 30-minute default');
        return 30;
    }
    
    try {
        const { data, error } = await supabase
            .from('schools')
            .select('session_timeout_minutes')
            .eq('school_id', schoolId)
            .single();
        
        if (error) {
            if (error.code === 'PGRST116') {
                // School not found, use default 30 minutes
                console.warn(`⚠️ School ${schoolId} not found, using 30-minute default timeout`);
                return 30;
            }
            throw error;
        }
        
        const timeout = data?.session_timeout_minutes || 30;
        console.log(`✅ Session timeout fetched: ${timeout} minutes for school ${schoolId}`);
        return timeout;
    } catch (error) {
        console.error('❌ Error fetching session timeout:', error);
        // Return default 30 minutes on error
        return 30;
    }
}

/**
 * REQUIREMENTS:
 * - Clear any existing session timeout timer
 * - Start a new hard timeout timer for the specified duration
 * - When timeout is reached, call handleSessionTimeout()
 * - Store timer ID in sessionTimeoutTimer
 * - No return value
 * 
 * CALLED BY: shared_db.js - initSupabase() (when session found), shared_db.js - onAuthStateChange (when user signs in)
 */
function startSessionTimeout(timeoutMinutes) {
    if (window.debugLog) window.debugLog('startSessionTimeout', `(${timeoutMinutes} minutes)`);
    
    // Clear any existing timeout
    clearSessionTimeout();
    
    if (!timeoutMinutes || timeoutMinutes <= 0) {
        console.warn('⚠️ Invalid timeout minutes, using 30-minute default');
        timeoutMinutes = 30;
    }
    
    sessionTimeoutMinutes = timeoutMinutes;
    const timeoutMs = timeoutMinutes * 60 * 1000; // Convert minutes to milliseconds
    
    console.log(`⏱️ Starting session timeout: ${timeoutMinutes} minutes (${timeoutMs}ms)`);
    
    sessionTimeoutTimer = setTimeout(() => {
        handleSessionTimeout();
    }, timeoutMs);
}

/**
 * REQUIREMENTS:
 * - Clear the session timeout timer if it exists
 * - Set sessionTimeoutTimer to null
 * - No return value
 * 
 * CALLED BY: shared_db.js - startSessionTimeout() (before starting new timer), shared_db.js - onAuthStateChange (when user signs out), teacher-dashboard.js - handleLogout()
 */
function clearSessionTimeout() {
    if (window.debugLog) window.debugLog('clearSessionTimeout');
    
    if (sessionTimeoutTimer) {
        clearTimeout(sessionTimeoutTimer);
        sessionTimeoutTimer = null;
        sessionTimeoutMinutes = null;
        console.log('✅ Session timeout cleared');
    }
}

/**
 * REQUIREMENTS:
 * - Called when session timeout is reached
 * - Sign out the user via supabase.auth.signOut()
 * - Clear session timeout timer
 * - Redirect to index.html with a message
 * - No return value
 * 
 * CALLED BY: shared_db.js - startSessionTimeout() (when timeout is reached)
 */
async function handleSessionTimeout() {
    if (window.debugLog) window.debugLog('handleSessionTimeout');
    
    console.log('⏰ Session timeout reached - signing out user');
    
    // Clear the timer
    clearSessionTimeout();
    
    // Stop inactivity tracking
    stopInactivityTracking();
    
    // Sign out the user
    if (supabase) {
        try {
            await supabase.auth.signOut();
            console.log('✅ User signed out due to session timeout');
        } catch (error) {
            console.error('❌ Error signing out on timeout:', error);
        }
    }
    
    // Clear user state
    currentUser = null;
    currentUserProfile = null;
    
    // Redirect to index page with timeout message
    const currentPath = window.location.pathname;
    if (!currentPath.includes('index.html')) {
        window.location.href = 'index.html?timeout=1';
    }
}

// ============================================================================
// INACTIVITY TIMEOUT MANAGEMENT (5 MINUTES)
// ============================================================================

/**
 * REQUIREMENTS:
 * - Reset the inactivity timer on any user activity
 * - Clear existing timer and start a new 5-minute countdown
 * - No return value
 * 
 * CALLED BY: Activity event listeners (mousemove, keydown, click, touchstart, scroll)
 */
function resetInactivityTimer() {
    if (window.debugLog) window.debugLog('resetInactivityTimer');
    
    // Only reset if user is logged in
    if (!currentUser) {
        return;
    }
    
    // Clear existing timer
    clearInactivityTimer();
    
    // Start new 5-minute timer
    const timeoutMs = inactivityTimeoutMinutes * 60 * 1000; // 5 minutes in milliseconds
    inactivityTimer = setTimeout(() => {
        handleInactivityTimeout();
    }, timeoutMs);
}

/**
 * REQUIREMENTS:
 * - Clear the inactivity timer if it exists
 * - Set inactivityTimer to null
 * - No return value
 * 
 * CALLED BY: shared_db.js - resetInactivityTimer() (before starting new timer), shared_db.js - stopInactivityTracking() (when user logs out), shared_db.js - onAuthStateChange (when user signs out)
 */
function clearInactivityTimer() {
    if (window.debugLog) window.debugLog('clearInactivityTimer');
    
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
    }
}

/**
 * REQUIREMENTS:
 * - Called when 5 minutes of inactivity is detected
 * - Sign out the user via supabase.auth.signOut()
 * - Clear inactivity timer
 * - Redirect to index.html with inactivity message
 * - No return value
 * 
 * CALLED BY: shared_db.js - resetInactivityTimer() (when timeout is reached)
 */
async function handleInactivityTimeout() {
    if (window.debugLog) window.debugLog('handleInactivityTimeout');
    
    console.log('⏰ Inactivity timeout reached (5 minutes) - signing out user');
    
    // Clear the timer
    clearInactivityTimer();
    
    // Sign out the user
    if (supabase) {
        try {
            await supabase.auth.signOut();
            console.log('✅ User signed out due to inactivity timeout');
        } catch (error) {
            console.error('❌ Error signing out on inactivity timeout:', error);
        }
    }
    
    // Clear user state
    currentUser = null;
    currentUserProfile = null;
    
    // Redirect to index page with inactivity message
    const currentPath = window.location.pathname;
    if (!currentPath.includes('index.html')) {
        window.location.href = 'index.html?inactivity=1';
    }
}

/**
 * REQUIREMENTS:
 * - Set up activity event listeners to track user activity
 * - Listen for: mousemove, keydown, click, touchstart, scroll
 * - Reset inactivity timer on any activity
 * - Store listeners in activityEventListeners array for cleanup
 * - No return value
 * 
 * CALLED BY: shared_db.js - startInactivityTracking() (when user logs in)
 */
function setupActivityListeners() {
    if (window.debugLog) window.debugLog('setupActivityListeners');
    
    // Remove existing listeners if any
    removeActivityListeners();
    
    // List of events to track
    const activityEvents = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll', 'mousedown'];
    
    // Create throttled reset function (only reset once per second to avoid excessive timer resets)
    let lastResetTime = 0;
    const throttleMs = 1000; // Reset timer at most once per second
    
    const throttledReset = () => {
        const now = Date.now();
        if (now - lastResetTime >= throttleMs) {
            resetInactivityTimer();
            lastResetTime = now;
        }
    };
    
    // Add event listeners
    activityEvents.forEach(eventType => {
        const listener = throttledReset;
        document.addEventListener(eventType, listener, { passive: true });
        activityEventListeners.push({ type: eventType, listener: listener });
    });
    
    console.log('✅ Activity listeners set up for inactivity tracking');
}

/**
 * REQUIREMENTS:
 * - Remove all activity event listeners
 * - Clear activityEventListeners array
 * - No return value
 * 
 * CALLED BY: shared_db.js - stopInactivityTracking() (when user logs out), shared_db.js - setupActivityListeners() (before adding new listeners)
 */
function removeActivityListeners() {
    if (window.debugLog) window.debugLog('removeActivityListeners');
    
    activityEventListeners.forEach(({ type, listener }) => {
        document.removeEventListener(type, listener);
    });
    activityEventListeners = [];
}

/**
 * REQUIREMENTS:
 * - Start inactivity tracking for logged-in user
 * - Set up activity event listeners
 * - Start the 5-minute inactivity timer
 * - No return value
 * 
 * CALLED BY: shared_db.js - initSupabase() (when user signs in), shared_db.js - onAuthStateChange (when user signs in)
 */
function startInactivityTracking() {
    if (window.debugLog) window.debugLog('startInactivityTracking');
    
    // Only start if user is logged in
    if (!currentUser) {
        return;
    }
    
    // Set up activity listeners
    setupActivityListeners();
    
    // Start the inactivity timer
    resetInactivityTimer();
    
    console.log('✅ Inactivity tracking started (5-minute timeout)');
}

/**
 * REQUIREMENTS:
 * - Stop inactivity tracking when user logs out
 * - Remove activity event listeners
 * - Clear inactivity timer
 * - No return value
 * 
 * CALLED BY: shared_db.js - onAuthStateChange (when user signs out), logout handlers
 */
function stopInactivityTracking() {
    if (window.debugLog) window.debugLog('stopInactivityTracking');
    
    // Remove event listeners
    removeActivityListeners();
    
    // Clear timer
    clearInactivityTimer();
    
    console.log('✅ Inactivity tracking stopped');
}

// ============================================================================
// BROWSER CLOSE HANDLER
// ============================================================================

/**
 * REQUIREMENTS:
 * - Handle browser/tab close event
 * - Sign out user when browser is closed
 * - Clear active session and timeouts
 * - Use synchronous operations where possible for reliability
 * - No return value
 * 
 * CALLED BY: Browser beforeunload/unload events
 */
function handleBrowserClose() {
    if (window.debugLog) window.debugLog('handleBrowserClose');
    
    // Only logout if user is logged in
    if (!currentUser || !supabase) {
        return;
    }
    
    console.log('🔒 Browser closing - signing out user');
    
    try {
        // Clear active session tracking (synchronous if possible)
        if (typeof window.clearActiveSession === 'function') {
            // Try to clear synchronously, but don't await
            window.clearActiveSession().catch(err => {
                console.error('Error clearing active session on browser close:', err);
            });
        }
        
        // Clear session timeout (synchronous)
        if (typeof window.clearSessionTimeout === 'function') {
            window.clearSessionTimeout();
        }
        
        // Stop inactivity tracking (synchronous)
        stopInactivityTracking();
        
        // Sign out the user (use sendBeacon for reliability if available)
        // Note: Supabase signOut is async, but we can't reliably await in unload
        // The session will be cleared on the server side when token expires
        if (supabase && supabase.auth) {
            // Attempt to sign out (may not complete, but we try)
            supabase.auth.signOut().catch(err => {
                console.error('Error signing out on browser close:', err);
            });
        }
        
        console.log('✅ Browser close handler executed');
    } catch (error) {
        console.error('❌ Error in browser close handler:', error);
    }
}

/**
 * REQUIREMENTS:
 * - Set up browser close event listeners
 * - Listen for beforeunload and unload events
 * - Call handleBrowserClose() when browser/tab is closed
 * - No return value
 * 
 * CALLED BY: shared_db.js - initSupabase() (after setting up auth state listener)
 */
function setupBrowserCloseHandler() {
    if (window.debugLog) window.debugLog('setupBrowserCloseHandler');
    
    // Remove existing listeners if any (to avoid duplicates)
    if (window._browserCloseHandler) {
        window.removeEventListener('beforeunload', window._browserCloseHandler);
        window.removeEventListener('unload', window._browserCloseHandler);
        window.removeEventListener('pagehide', window._browserCloseHandler);
    }
    
    // Create handler function
    window._browserCloseHandler = (event) => {
        // Only handle if user is logged in
        if (!currentUser || !supabase) {
            return;
        }
        
        // Call logout handler
        handleBrowserClose();
    };
    
    // Add event listeners
    // Use pagehide for better mobile browser support
    window.addEventListener('pagehide', window._browserCloseHandler);
    window.addEventListener('beforeunload', window._browserCloseHandler);
    window.addEventListener('unload', window._browserCloseHandler);
    
    console.log('✅ Browser close handler set up');
}

// ============================================================================
// EXPOSE FUNCTIONS GLOBALLY
// ============================================================================

// Expose functions globally for use by other modules
window.initSupabase = initSupabase;
window.fetchUserProfile = fetchUserProfile;
window.saveScore = saveScore;
window.fetchAndUpdateVariantStatuses = fetchAndUpdateVariantStatuses;
window.handleEmailConfirmation = handleEmailConfirmation;
window.clearSessionTimeout = clearSessionTimeout; // Expose for logout handlers
window.startInactivityTracking = startInactivityTracking; // Expose for manual start if needed
window.stopInactivityTracking = stopInactivityTracking; // Expose for logout handlers