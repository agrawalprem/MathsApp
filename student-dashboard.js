// ============================================================================
// STUDENT DASHBOARD - Dashboard-specific Functions
// ============================================================================
// This module handles:
// - User display updates
// - Operation selection and variant loading
// - Dashboard UI updates
// - Variant launching
// ============================================================================

// REQUIREMENTS: Fetch data from the database to display user name, Class and section, and Roll number in user's dashboard.
// CALLED BY: student-dashboard.js - updateStudentDashboardHeader() (updates user info display)
function updateUserDisplay(profile) {
    if (window.debugLog) window.debugLog('updateUserDisplay');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const userClassDisplay = document.getElementById('userClassDisplay');
    const userRollDisplay = document.getElementById('userRollDisplay');
    
    if (profile) {
        const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
        if (userNameDisplay) {
            userNameDisplay.textContent = `Name: ${fullName || 'N/A'}`;
        }
        if (userClassDisplay) {
            userClassDisplay.textContent = `Class: ${profile.class && profile.section ? `${profile.class}${profile.section}` : 'N/A'}`;
        }
        if (userRollDisplay) {
            userRollDisplay.textContent = `Roll Number: ${profile.roll_number || 'N/A'}`;
        }
    } else if (currentUser) {
        // Anonymous users have currentUser but no profile
        // Check if user is anonymous (no email, or is_anonymous flag if available)
        const isAnonymous = !currentUser.email || (currentUser.is_anonymous === true);
        
        if (userNameDisplay) {
            if (isAnonymous) {
                userNameDisplay.textContent = 'Name: Anonymous User';
            } else {
                userNameDisplay.textContent = `Name: ${currentUser.email || 'N/A'}`;
            }
        }
        if (userClassDisplay) {
            userClassDisplay.textContent = `Class: N/A`;
        }
        if (userRollDisplay) {
            userRollDisplay.textContent = `Roll Number: N/A`;
        }
    }
}

// CALLED BY: student-dashboard.js - updateAuthUI() (updates header when user logs in), student-dashboard.html - DOMContentLoaded listener (initializes header on page load)
function updateStudentDashboardHeader() {
    if (window.debugLog) window.debugLog('updateStudentDashboardHeader');
    if (currentUserProfile) {
        updateUserDisplay(currentUserProfile);
    } else if (currentUser) {
        updateUserDisplay(null);
    }
}


async function updateAuthUI(skipPageSwitch = false) {
    if (window.debugLog) window.debugLog('updateAuthUI', `(skipPageSwitch=${skipPageSwitch})`);
    const studentDashboard = document.getElementById('studentDashboard');

    if (currentUser && supabase) {
        if (studentDashboard) {
            studentDashboard.style.display = 'block';
            studentDashboard.style.visibility = 'visible';
            
            // Try to load cached profile from sessionStorage for immediate display
            // This prevents showing empty name while waiting for database query
            if (!currentUserProfile) {
                try {
                    const cachedProfile = sessionStorage.getItem('quizUserProfile');
                    if (cachedProfile) {
                        const profile = JSON.parse(cachedProfile);
                        // Only use cached profile if it matches current user
                        if (profile && profile.user_id === currentUser.id) {
                            currentUserProfile = profile;
                            console.log('✅ Using cached profile for immediate display');
                        }
                    }
                } catch (e) {
                    console.warn('Unable to load cached profile:', e);
                }
            }
            
            updateStudentDashboardHeader();
        }
        
        try {
            if (!currentUserProfile && currentUser) {
                currentUserProfile = await fetchUserProfile();
            }

            // Cache profile for use in question page headers
            try {
                sessionStorage.setItem('quizUserProfile', JSON.stringify(currentUserProfile || {}));
            } catch (e) {
                console.warn('Unable to cache user profile for quiz header', e);
            }
            
            // Show/hide Teacher Dashboard button based on user type
            const teacherDashboardBtn = document.getElementById('teacherDashboardBtn');
            if (teacherDashboardBtn) {
                if (currentUserProfile && currentUserProfile.user_type === 'Teacher') {
                    teacherDashboardBtn.classList.remove('hidden');
                } else {
                    teacherDashboardBtn.classList.add('hidden');
                }
            }
            
            // Fetch all variant statuses and update UI directly
            await fetchAndUpdateVariantStatuses();
        } catch (err) {
            console.error('Error fetching user data:', err);
        }
        
        updateStudentDashboardHeader();
    } else {
        // No currentUser - redirect to welcome page
        // This ensures we always have a currentUser after the welcome page
        const isOnStudentDashboard = window.location.pathname.includes('student-dashboard.html');
        if (isOnStudentDashboard) {
            console.log('⚠️ No currentUser on student-dashboard.html - redirecting to welcome page');
            window.location.href = 'index.html';
            return;
        }
        
        // On other pages (index.html, etc.) - clear everything
        currentUserProfile = null;
        
        // Hide Teacher Dashboard button when logged out
        const teacherDashboardBtn = document.getElementById('teacherDashboardBtn');
        if (teacherDashboardBtn) {
            teacherDashboardBtn.classList.add('hidden');
        }
        
        // Clear all variant containers
        const operations = ['Addition', 'Subtraction', 'Multiplication', 'Division'];
        operations.forEach(op => {
            const container = document.getElementById(`variantsContainer${op}`);
            if (container) {
                container.innerHTML = '';
                container.classList.add('hidden');
            }
        });
        
        document.querySelectorAll('.variant-card').forEach(card => {
            card.classList.remove('passed', 'failed');
        });
        
        document.querySelectorAll('.operation-card').forEach(card => {
            card.classList.remove('completed', 'selected');
        });
        
        window.selectedOperation = null;
    }
}

// CALLED BY: student-dashboard.html - <div class="operation-card" onclick="selectOperation('addition')"> (and similar for other operations)
function selectOperation(operation) {
    if (window.debugLog) window.debugLog('selectOperation', `(${operation})`);
    
    if (!operation) {
        console.warn('⚠️ selectOperation called without operation parameter');
        return;
    }
    
    // Set selected operation
    window.selectedOperation = operation;
    
    // Update selected operation card styling
    document.querySelectorAll('.operation-card').forEach(card => {
        card.classList.remove('selected');
        const onclickAttr = card.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes(`selectOperation('${operation}')`)) {
            card.classList.add('selected');
        }
    });
    
    // Show/hide appropriate variant container (all containers already populated)
    // First, hide ALL containers
    const operations = ['addition', 'subtraction', 'multiplication', 'division'];
    operations.forEach(op => {
        const containerId = `variantsContainer${op.charAt(0).toUpperCase() + op.slice(1)}`;
        const container = document.getElementById(containerId);
        if (container) {
            container.classList.add('hidden');
        }
    });
    
    // Then, show only the selected operation's container
    const selectedContainerId = `variantsContainer${operation.charAt(0).toUpperCase() + operation.slice(1)}`;
    const selectedContainer = document.getElementById(selectedContainerId);
    if (selectedContainer) {
        selectedContainer.classList.remove('hidden');
    } else {
        console.warn(`⚠️ Container not found: ${selectedContainerId}`);
    }
}


// CALLED BY: shared_db.js - fetchAndUpdateVariantStatuses() (card.onclick = () => launchVariant(operation, variantKey))
function launchVariant(operation, variant) {
    if (window.debugLog) window.debugLog('launchVariant', `(${operation}, ${variant})`);
    sessionStorage.setItem('quizOperation', operation);
    sessionStorage.setItem('quizVariant', variant);
    window.location.href = 'question.html';
}

// Handle logout
// CALLED BY: student-dashboard.html - <button onclick="handleLogout()">Logout</button>
async function handleLogout() {
    if (window.debugLog) window.debugLog('handleLogout');
    // Clear active session tracking
    if (typeof window.clearActiveSession === 'function') {
        await window.clearActiveSession();
    }
    // Clear session timeout
    if (typeof window.clearSessionTimeout === 'function') {
        window.clearSessionTimeout();
    }
    // Stop inactivity tracking
    if (typeof window.stopInactivityTracking === 'function') {
        window.stopInactivityTracking();
    }
    if (supabase) {
        await supabase.auth.signOut();
    }
    window.location.href = 'index.html';
}

// Expose functions globally
// CALLED BY: student-dashboard.html - All onclick handlers and DOMContentLoaded listener access these via window object
window.updateUserDisplay = updateUserDisplay;
window.updateStudentDashboardHeader = updateStudentDashboardHeader;
window.updateAuthUI = updateAuthUI;
window.selectOperation = selectOperation;
window.launchVariant = launchVariant;
window.handleLogout = handleLogout;
