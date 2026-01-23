// ============================================================================
// INDEX PAGE - Authentication Functions
// ============================================================================
// This module handles:
// - Registration form display and submission
// - Login form display and submission
// - Forgot password form display and submission
// - Password reset form submission
// - Anonymous user navigation
// ============================================================================

// CALLED BY: index.html - <button onclick="showAnonymousUser()">Anonymous User</button>
function showAnonymousUser() {
    if (window.debugLog) window.debugLog('showAnonymousUser');
    clearAuthContent();
    const contentArea = document.getElementById('authContentArea');
    contentArea.innerHTML = `
        <div class="auth-form-container">
            <p style="text-align: center; color: #666; margin: 20px 0;">
                You are using the app as an anonymous user. Your progress will not be saved.
            </p>
            <button class="btn" onclick="startAsAnonymous()" style="width: 100%;">Continue as Anonymous</button>
        </div>
    `;
    contentArea.style.display = 'block';
}

// CALLED BY: index.html - <button onclick="showRegistration()">Registration</button>
function showRegistration() {
    if (window.debugLog) window.debugLog('showRegistration');
    clearAuthContent();
    const contentArea = document.getElementById('authContentArea');
    contentArea.style.display = 'block';
    contentArea.innerHTML = `
        <div class="auth-form-container">
            <h3>Registration</h3>
            <form id="registrationForm" class="auth-form" onsubmit="handleRegistration(event)">
                <input type="email" id="regEmail" placeholder="Email" required>
                <input type="text" id="regFirstName" placeholder="First Name" required>
                <input type="text" id="regLastName" placeholder="Last Name">
                <select id="regUserType" required>
                    <option value="">Select User Type</option>
                    <option value="Student">Student</option>
                    <option value="Teacher">Teacher</option>
                </select>
                <select id="regGender" required>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                </select>
                <select id="regSchoolId" required>
                    <option value="">Select School</option>
                </select>
                <input type="number" id="regClass" placeholder="Class" min="1" max="9" required>
                <input type="text" id="regSection" placeholder="Section" value="A" pattern="[A-Z]" minlength="1" maxlength="1" required>
                <input type="number" id="regRollNumber" placeholder="Roll Number" min="1" max="99">
                <input type="password" id="regPassword" placeholder="Password" minlength="6" required>
                <input type="password" id="regPasswordConfirm" placeholder="Confirm Password" minlength="6" required>
                <button type="submit" class="btn">Register</button>
            </form>
            <div id="regError" class="auth-error"></div>
        </div>
    `;
    document.getElementById('regUserType').addEventListener('change', updateSignupFieldsBasedOnUserType);
    // Load schools into dropdown
    loadSchoolsIntoDropdown();
}

function showLogin() {
    if (window.debugLog) window.debugLog('showLogin');
    clearAuthContent();
    const contentArea = document.getElementById('authContentArea');
    contentArea.style.display = 'block';
    contentArea.innerHTML = `
        <div class="auth-form-container">
            <h3>Login</h3>
            <form id="loginForm" class="auth-form" onsubmit="handleLoginForm(event)">
                <input type="email" id="loginEmail" placeholder="Email" required>
                <input type="password" id="loginPassword" placeholder="Password" required>
                <button type="submit" class="btn">Log In</button>
            </form>
            <div id="loginError" class="auth-error"></div>
        </div>
    `;
}

// CALLED BY: index.html - <button onclick="showForgotPassword()">Forgot Password</button>
function showForgotPassword() {
    if (window.debugLog) window.debugLog('showForgotPassword');
    clearAuthContent();
    const contentArea = document.getElementById('authContentArea');
    contentArea.style.display = 'block';
    contentArea.innerHTML = `
        <div class="auth-form-container">
            <h3>Reset Password</h3>
            <div id="forgotPasswordRequest">
                <p style="margin-bottom: 20px; color: #666;">Enter your email address and we'll send you a link to reset your password.</p>
                <form id="forgotPasswordForm" class="auth-form" onsubmit="handleForgotPasswordForm(event)">
                    <input type="email" id="forgotEmail" placeholder="Email" required>
                    <button type="submit" class="btn">Send Reset Link</button>
                </form>
                <div id="forgotError" class="auth-error"></div>
                <div id="forgotSuccess" style="margin-top: 15px; color: #28a745; display: none;"></div>
            </div>
            <div id="forgotPasswordReset" style="display: none;">
                <p style="margin-bottom: 20px; color: #666;">Enter your new password.</p>
                <form id="resetPasswordForm" class="auth-form" onsubmit="handleResetPasswordForm(event)">
                    <input type="password" id="resetNewPassword" placeholder="New Password" minlength="6" required>
                    <input type="password" id="resetConfirmPassword" placeholder="Confirm New Password" minlength="6" required>
                    <button type="submit" class="btn">Update Password</button>
                </form>
                <div id="resetError" class="auth-error"></div>
            </div>
        </div>
    `;
}

// CALLED BY: index.js - showAnonymousUser(), showRegistration(), showLogin(), showForgotPassword() (clears previous content before showing new form)
function clearAuthContent() {
    if (window.debugLog) window.debugLog('clearAuthContent');
    const contentArea = document.getElementById('authContentArea');
    contentArea.innerHTML = '';
    contentArea.style.display = 'none';
    
    // Hide teaching method information when any button is clicked
    const teachingMethodInfo = document.querySelector('.teaching-method-info');
    if (teachingMethodInfo) {
        teachingMethodInfo.style.display = 'none';
    }
}

// CALLED BY: index.html - <button onclick="startAsAnonymous()">Continue as Anonymous</button> (dynamically inserted by showAnonymousUser())
async function startAsAnonymous() {
    if (window.debugLog) window.debugLog('startAsAnonymous');
    
    // Clear any existing session before starting as anonymous
    if (supabase && currentUser) {
        try {
            await supabase.auth.signOut();
            // Clear active session tracking
            if (typeof window.clearActiveSession === 'function') {
                await window.clearActiveSession();
            }
        } catch (error) {
            // Continue anyway - navigate to dashboard
        }
    }
    
    window.location.href = 'student-dashboard.html';
}

// CALLED BY: index.js - showRegistration() (loads schools into dropdown when registration form is shown)
async function loadSchoolsIntoDropdown() {
    if (window.debugLog) window.debugLog('loadSchoolsIntoDropdown');
    const schoolSelect = document.getElementById('regSchoolId');
    if (!schoolSelect) {
        return;
    }

    // Wait for Supabase to be initialized
    if (!supabase) {
        let attempts = 0;
        while (!supabase && attempts < 10) {
            await new Promise(resolve => setTimeout(resolve, 200));
            attempts++;
        }
        if (!supabase) {
            schoolSelect.innerHTML = '<option value="">Error: Database not available</option>';
            return;
        }
    }

    try {
        // Fetch schools from database
        // Try with school_id and school_name first
        const { data: schools, error } = await supabase
            .from('schools')
            .select('school_id, school_name')
            .order('school_id', { ascending: true });

        if (error) {
            // Fallback: try with all columns to detect actual column names
            const { data: schoolsAlt, error: errorAlt } = await supabase
                .from('schools')
                .select('*')
                .order('school_id', { ascending: true });
            
            if (errorAlt) {
                schoolSelect.innerHTML = '<option value="">Error loading schools</option>';
                return;
            }
            
            // Use alternative column names if available
            schoolSelect.innerHTML = '<option value="">Select School</option>';
            schoolsAlt.forEach(school => {
                const option = document.createElement('option');
                option.value = school.school_id || school.id;
                option.textContent = school.school_name || school.name || `School ${school.school_id || school.id}`;
                schoolSelect.appendChild(option);
            });
            return;
        }

        // Clear existing options (except the first "Select School" option)
        schoolSelect.innerHTML = '<option value="">Select School</option>';

        // Populate dropdown with schools
        if (schools && schools.length > 0) {
            schools.forEach(school => {
                const option = document.createElement('option');
                option.value = school.school_id;
                option.textContent = school.school_name || `School ${school.school_id}`;
                schoolSelect.appendChild(option);
            });
        } else {
            schoolSelect.innerHTML = '<option value="">No schools available</option>';
        }
    } catch (error) {
        schoolSelect.innerHTML = '<option value="">Error loading schools</option>';
    }
}

// CALLED BY: index.js - showRegistration() (adds event listener: document.getElementById('regUserType').addEventListener('change', updateSignupFieldsBasedOnUserType))
function updateSignupFieldsBasedOnUserType() {
    if (window.debugLog) window.debugLog('updateSignupFieldsBasedOnUserType');
    const userType = document.getElementById('regUserType')?.value;
    const rollNumberField = document.getElementById('regRollNumber');
    
    if (!rollNumberField) return;
    
    if (userType === 'Student') {
        rollNumberField.required = true;
        rollNumberField.placeholder = 'Roll Number';
    } else if (userType === 'Teacher') {
        rollNumberField.required = false;
        rollNumberField.placeholder = 'Roll Number (Optional)';
    } else {
        rollNumberField.required = false;
        rollNumberField.placeholder = 'Roll Number';
    }
}

// CALLED BY: index.html - <form onsubmit="handleRegistration(event)"> (dynamically inserted by showRegistration())
async function handleRegistration(event) {
    if (window.debugLog) window.debugLog('handleRegistration');
    event.preventDefault();
    const errorEl = document.getElementById('regError');
    errorEl.textContent = '';
    
    const email = document.getElementById('regEmail').value.trim();
    const firstName = document.getElementById('regFirstName').value.trim();
    const lastName = document.getElementById('regLastName').value.trim();
    const userType = document.getElementById('regUserType').value;
    const gender = document.getElementById('regGender').value;
    const schoolIdSelect = document.getElementById('regSchoolId');
    const schoolId = schoolIdSelect ? schoolIdSelect.value.trim() : null;
    
    if (!schoolId) {
        errorEl.textContent = 'Please select a school';
        return;
    }
    const classNum = document.getElementById('regClass').value.trim();
    const section = document.getElementById('regSection').value.trim();
    const rollNumber = document.getElementById('regRollNumber').value ? document.getElementById('regRollNumber').value.trim() : null;
    const password = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;

    if (password !== passwordConfirm) {
        errorEl.textContent = 'Passwords do not match';
        return;
    }

    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    user_type: userType
                }
            }
        });

        if (error) throw error;

        // Check if user was created
        if (!data.user || !data.user.id) {
            throw new Error('User creation failed: No user ID returned');
        }

        const userId = data.user.id;

        // Check if profile already exists (might be created by database trigger)
        const { data: existingProfile, error: checkError } = await supabase
            .from('user_profiles')
            .select('user_id')
            .eq('user_id', userId)
            .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw new Error(`Error checking profile: ${checkError.message}`);
        }

        // Only insert if profile doesn't exist
        if (!existingProfile) {
            const { error: profileError } = await supabase
                .from('user_profiles')
                .insert([{
                    user_id: userId,
                    email: email,
                    first_name: firstName,
                    last_name: lastName || null,
                    user_type: userType,
                    gender: gender,
                    school_id: schoolId,
                    class: classNum,
                    section: section,
                    roll_number: rollNumber
                }]);

            if (profileError) {
                if (profileError.code === '23503') { // Foreign key violation
                    throw new Error(`Database constraint error: ${profileError.message}`);
                }
                throw profileError;
            }

            // Verify profile was created
            const { data: verifyProfile, error: verifyError } = await supabase
                .from('user_profiles')
                .select('user_id')
                .eq('user_id', userId)
                .single();

            if (verifyError || !verifyProfile) {
                throw new Error('Profile creation failed: Profile not found after insertion');
            }
        } else {
            // Profile already exists, update it instead
            const { error: updateError } = await supabase
                .from('user_profiles')
                .update({
                    email: email,
                    first_name: firstName,
                    last_name: lastName || null,
                    user_type: userType,
                    gender: gender,
                    school_id: schoolId,
                    class: classNum,
                    section: section,
                    roll_number: rollNumber
                })
                .eq('user_id', userId);

            if (updateError) {
                throw updateError;
            }
        }

        errorEl.textContent = '';
        errorEl.style.color = '#28a745';
        errorEl.textContent = 'Registration successful!';
        
        setTimeout(() => {
            showLogin();
        }, 2000);
    } catch (error) {
        errorEl.textContent = error.message || 'Registration failed';
    }
}

// CALLED BY: index.html - <form onsubmit="handleLoginForm(event)"> (dynamically inserted by showLogin())
async function handleLoginForm(event) {
    if (window.debugLog) window.debugLog('handleLoginForm');
    event.preventDefault();
    const errorEl = document.getElementById('loginError');
    errorEl.textContent = '';

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        await fetchUserProfile();
        
        if (currentUserProfile && currentUserProfile.user_type === 'Teacher') {
            window.location.href = 'teacher-dashboard.html';
        } else {
            // Navigate to student dashboard
            window.location.href = 'student-dashboard.html';
        }
    } catch (error) {
        errorEl.textContent = error.message || 'Login failed';
    }
}

// CALLED BY: index.html - <form onsubmit="handleForgotPasswordForm(event)"> (dynamically inserted by showForgotPassword())
async function handleForgotPasswordForm(event) {
    if (window.debugLog) window.debugLog('handleForgotPasswordForm');
    event.preventDefault();
    const errorEl = document.getElementById('forgotError');
    const successEl = document.getElementById('forgotSuccess');
    errorEl.textContent = '';
    successEl.style.display = 'none';

    const email = document.getElementById('forgotEmail').value.trim();

    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}${window.location.pathname}?type=recovery`
        });

        if (error) throw error;

        successEl.textContent = 'Password reset link sent to your email!';
        successEl.style.display = 'block';
    } catch (error) {
        errorEl.textContent = error.message || 'Failed to send reset link';
    }
}

// CALLED BY: index.html - <form onsubmit="handleResetPasswordForm(event)"> (dynamically inserted by showForgotPassword())
async function handleResetPasswordForm(event) {
    if (window.debugLog) window.debugLog('handleResetPasswordForm');
    event.preventDefault();
    const errorEl = document.getElementById('resetError');
    errorEl.textContent = '';

    const newPassword = document.getElementById('resetNewPassword').value;
    const confirmPassword = document.getElementById('resetConfirmPassword').value;

    if (newPassword !== confirmPassword) {
        errorEl.textContent = 'Passwords do not match';
        return;
    }

    try {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;

        errorEl.style.color = '#28a745';
        errorEl.textContent = 'Password updated successfully!';
        
        // Sign out the user after password reset (they were only authenticated for the reset)
        await supabase.auth.signOut();
        
        // Clean up URL hash/query params
        window.history.replaceState({}, document.title, window.location.pathname);
        
        setTimeout(() => {
            showLogin();
        }, 2000);
    } catch (error) {
        errorEl.textContent = error.message || 'Failed to update password';
    }
}

// Expose functions globally
// CALLED BY: index.html - All onclick and onsubmit handlers access these via window object
window.showAnonymousUser = showAnonymousUser;
window.showRegistration = showRegistration;
window.showLogin = showLogin;
window.showForgotPassword = showForgotPassword;
window.startAsAnonymous = startAsAnonymous;
window.handleRegistration = handleRegistration;
window.handleLoginForm = handleLoginForm;
window.handleForgotPasswordForm = handleForgotPasswordForm;
window.handleResetPasswordForm = handleResetPasswordForm;
window.updateSignupFieldsBasedOnUserType = updateSignupFieldsBasedOnUserType;

// Initialize on page load
// CALLED BY: index.html - Automatically executed when DOMContentLoaded event fires
window.addEventListener('DOMContentLoaded', () => {
    if (window.debugLog) window.debugLog('DOMContentLoaded(index.js)');
    let type = null;
    let accessToken = null;
    
    if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        type = hashParams.get('type') || type;
        accessToken = hashParams.get('access_token') || accessToken;
    }
    
    if (window.location.search) {
        const queryParams = new URLSearchParams(window.location.search);
        type = queryParams.get('type') || type;
        accessToken = queryParams.get('access_token') || accessToken;
    }
    
    if (type === 'recovery' && accessToken) {
        showForgotPassword();
        const forgotPasswordRequest = document.getElementById('forgotPasswordRequest');
        const forgotPasswordReset = document.getElementById('forgotPasswordReset');
        if (forgotPasswordRequest) {
            forgotPasswordRequest.style.display = 'none';
        }
        if (forgotPasswordReset) {
            forgotPasswordReset.style.display = 'block';
        }
    }
    
    if (type === 'signup') {
        if (typeof handleEmailConfirmation === 'function') {
            handleEmailConfirmation(); // CALLED BY: index.js - DOMContentLoaded listener (calls shared_db.js function)
        }
    }
    
    // CALLED BY: index.js - DOMContentLoaded listener (internal function to retry Supabase initialization)
    function tryInitSupabase(attempts = 0) {
        if (window.debugLog) window.debugLog('tryInitSupabase', `(attempts=${attempts})`);
        if (window.supabase && window.supabase.createClient) {
            initSupabase(); // CALLED BY: index.js - tryInitSupabase() (calls shared_db.js function)
        } else if (attempts < 5) {
            setTimeout(() => tryInitSupabase(attempts + 1), 1000);
        } else {
            console.error('❌ Supabase library failed to load');
        }
    }
    
    // Initialize Supabase normally - it will process recovery token, but we'll handle it specially
    tryInitSupabase();
});
