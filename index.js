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

// CRITICAL: Use function declarations (not expressions) so they're hoisted
// This ensures functions are available even if assignment to window fails

// CALLED BY: index.html - <button onclick="showAnonymousUser()">Anonymous User</button>
// Expose to window immediately so onclick handlers can access it
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
// Expose immediately after definition
window.showAnonymousUser = showAnonymousUser;

// CALLED BY: index.html - <button onclick="showRegistration()">Registration</button>
// Expose to window immediately so onclick handlers can access it
function showRegistration() {
    if (window.debugLog) window.debugLog('showRegistration');
    clearAuthContent();
    const contentArea = document.getElementById('authContentArea');
    contentArea.style.display = 'block';
    contentArea.innerHTML = `
        <div class="auth-form-container">
            <h3>Registration</h3>
            <form id="registrationForm" class="auth-form" onsubmit="handleRegistration(event)">
                <p class="registration-info">Students, whose school is not registered, may join as Online Students. To get your Class, Section and Roll Number, please contact Prem Agrawal at agrawal.prem@gmail.com, or +91 98228 47682 (WhatsApp).</p>
                <div>
                    <input type="email" id="regEmail" placeholder="Email" required>
                    <div id="regEmailError" class="field-error" style="display: none;"></div>
                </div>
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
                <input type="date" id="regDateOfBirth" placeholder="Date of Birth" required>
                <select id="regSchoolId" required>
                    <option value="">Select School</option>
                </select>
                <input type="number" id="regClass" placeholder="Class" min="1" max="9" required>
                <input type="text" id="regSection" placeholder="Section" value="A" pattern="[A-Z]" minlength="1" maxlength="1" required>
                <input type="number" id="regRollNumber" placeholder="Roll Number" min="1" max="99">
                <div class="password-input-wrapper">
                    <input type="password" id="regPassword" placeholder="Password" minlength="6" required>
                    <button type="button" class="password-toggle" onclick="togglePasswordVisibility('regPassword', this)" aria-label="Show password">👁️</button>
                </div>
                <div class="password-input-wrapper">
                    <input type="password" id="regPasswordConfirm" placeholder="Confirm Password" minlength="6" required>
                    <button type="button" class="password-toggle" onclick="togglePasswordVisibility('regPasswordConfirm', this)" aria-label="Show password">👁️</button>
                </div>
                <button type="submit" class="btn">Register</button>
            </form>
            <div id="regError" class="auth-error"></div>
        </div>
    `;
    // Attach event listeners immediately after creating the form
    const emailInput = document.getElementById('regEmail');
    if (emailInput) {
        emailInput.addEventListener('blur', checkEmailExists);
            // Clear error when user starts typing
            emailInput.addEventListener('input', () => {
                const errorEl = document.getElementById('regError');
                const emailErrorEl = document.getElementById('regEmailError');
                if (errorEl && errorEl.textContent.includes('This email id is used by')) {
                    errorEl.textContent = '';
                    errorEl.style.color = '';
                }
                if (emailErrorEl && emailErrorEl.textContent.includes('This email id is used by')) {
                    emailErrorEl.textContent = '';
                    emailErrorEl.style.display = 'none';
                }
                emailInput.setCustomValidity('');
                emailInput.style.borderColor = '';
            });
    }
    
    document.getElementById('regUserType').addEventListener('change', updateSignupFieldsBasedOnUserType);
    // Load schools into dropdown
    loadSchoolsIntoDropdown();
}
// Expose immediately after definition
window.showRegistration = showRegistration;

// Store user email for step 2 of login
let loginUserEmail = null;
let loginUserProfile = null;

// CALLED BY: index.html - <button onclick="showLogin()">Login</button>
// Expose to window immediately so onclick handlers can access it
function showLogin() {
    if (window.debugLog) window.debugLog('showLogin');
    clearAuthContent();
    // Reset login state
    loginUserEmail = null;
    loginUserProfile = null;
    
    const contentArea = document.getElementById('authContentArea');
    contentArea.style.display = 'block';
    contentArea.innerHTML = `
        <div class="auth-form-container">
            <h3>Login</h3>
            <div id="loginStep1">
                <form id="loginFormStep1" class="auth-form" onsubmit="handleLoginStep1(event)">
                    <input type="text" id="loginUserCode" placeholder="User Code (6 digits)" maxlength="6" pattern="[0-9]{6}" required>
                    <button type="submit" class="btn">Continue</button>
                </form>
                <div id="loginError" class="auth-error"></div>
            </div>
            <div id="loginStep2" style="display: none;">
                <div id="loginUserDetails" style="margin-bottom: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px;">
                    <p style="margin: 5px 0;"><strong>School:</strong> <span id="loginSchool"></span></p>
                    <p style="margin: 5px 0;"><strong>Class:</strong> <span id="loginClass"></span></p>
                    <p style="margin: 5px 0;"><strong>Section:</strong> <span id="loginSection"></span></p>
                    <p style="margin: 5px 0;"><strong>Roll Number:</strong> <span id="loginRollNumber"></span></p>
                    <p style="margin: 5px 0;"><strong>Name:</strong> <span id="loginName"></span></p>
                </div>
                <form id="loginFormStep2" class="auth-form" onsubmit="handleLoginForm(event)">
                    <div class="password-input-wrapper">
                        <input type="password" id="loginPassword" placeholder="Password" required>
                        <button type="button" class="password-toggle" onclick="togglePasswordVisibility('loginPassword', this)" aria-label="Show password">👁️</button>
                    </div>
                    <button type="submit" class="btn">Log In</button>
                    <button type="button" class="btn" style="background: #6c757d; margin-top: 10px;" onclick="showLogin()">Back</button>
                </form>
                <div id="loginErrorStep2" class="auth-error"></div>
            </div>
        </div>
    `;
}
// CRITICAL: Expose immediately after definition - wrap in try-catch to prevent errors from blocking
try {
    window.showLogin = showLogin;
    if (typeof window.showLogin !== 'function') {
        console.error('❌ Failed to expose showLogin to window');
    }
} catch (e) {
    console.error('❌ Error exposing showLogin:', e);
    // Fallback: try direct assignment
    window.showLogin = showLogin;
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
                    <div class="password-input-wrapper">
                        <input type="password" id="resetNewPassword" placeholder="New Password" minlength="6" required>
                        <button type="button" class="password-toggle" onclick="togglePasswordVisibility('resetNewPassword', this)" aria-label="Show password">👁️</button>
                    </div>
                    <div class="password-input-wrapper">
                        <input type="password" id="resetConfirmPassword" placeholder="Confirm New Password" minlength="6" required>
                        <button type="button" class="password-toggle" onclick="togglePasswordVisibility('resetConfirmPassword', this)" aria-label="Show password">👁️</button>
                    </div>
                    <button type="submit" class="btn">Update Password</button>
                </form>
                <div id="resetError" class="auth-error"></div>
            </div>
        </div>
    `;
}
// Expose immediately after definition
window.showForgotPassword = showForgotPassword;

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
// Expose immediately after definition
window.startAsAnonymous = startAsAnonymous;

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
// Expose immediately after definition
window.updateSignupFieldsBasedOnUserType = updateSignupFieldsBasedOnUserType;

// CALLED BY: index.js - showRegistration() (adds event listener: emailInput.addEventListener('blur', checkEmailExists))
async function checkEmailExists(event) {
    if (window.debugLog) window.debugLog('checkEmailExists');
    const emailInput = event.target;
    const email = emailInput.value.trim();
    const errorEl = document.getElementById('regError');
    const emailErrorEl = document.getElementById('regEmailError');
    
    // Clear previous errors
    if (errorEl) {
        errorEl.textContent = '';
        errorEl.style.color = '';
    }
    if (emailErrorEl) {
        emailErrorEl.textContent = '';
        emailErrorEl.style.display = 'none';
    }
    
    // If email is empty, don't check
    if (!email) {
        return;
    }
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        // Invalid email format - let HTML5 validation handle this
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
            return;
        }
    }
    
    // Note: Duplicate email check removed - Supabase Auth already prevents duplicate emails during signUp
    // If email already exists, Supabase will return an error which we handle in handleRegistration()
    
    // Clear any previous error states since we're not checking anymore
    emailInput.setCustomValidity('');
    emailInput.style.borderColor = '';
    if (emailErrorEl) {
        emailErrorEl.style.display = 'none';
    }
}
// Expose immediately after definition
window.checkEmailExists = checkEmailExists;

// CALLED BY: index.html - <form onsubmit="handleRegistration(event)"> (dynamically inserted by showRegistration())
async function handleRegistration(event) {
    if (window.debugLog) window.debugLog('handleRegistration');
    event.preventDefault();
    const errorEl = document.getElementById('regError');
    const emailInput = document.getElementById('regEmail');
    errorEl.textContent = '';
    
    // Check if email field has custom validity error (email already exists)
    if (emailInput && !emailInput.validity.valid) {
        emailInput.focus();
        emailInput.reportValidity(); // Show browser's validation message
        return;
    }
    
    const email = emailInput.value.trim();
    const firstName = document.getElementById('regFirstName').value.trim();
    const lastName = document.getElementById('regLastName').value.trim();
    const userType = document.getElementById('regUserType').value;
    const gender = document.getElementById('regGender').value;
    const dateOfBirth = document.getElementById('regDateOfBirth').value;
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

    // Final check: verify email doesn't already exist
    // Note: Duplicate email check removed - Supabase Auth already prevents duplicate emails during signUp
    // If email already exists, Supabase will return an error which we handle below

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
            .select('user_id, user_code')
            .eq('user_id', userId)
            .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw new Error(`Error checking profile: ${checkError.message}`);
        }

        // Only insert if profile doesn't exist
        if (!existingProfile) {
            // Generate user_code: Get next value from sequence or find max + 1
            let userCode = null;
            try {
                // Try to use sequence first (if it exists)
                const { data: seqData, error: seqError } = await supabase.rpc('get_next_user_code');
                if (!seqError && seqData) {
                    userCode = String(seqData).padStart(6, '0');
                } else {
                    // Fallback: Find max user_code and increment
                    const { data: maxCodeData, error: maxError } = await supabase
                        .from('user_profiles')
                        .select('user_code')
                        .not('user_code', 'is', null)
                        .order('user_code', { ascending: false })
                        .limit(1)
                        .single();
                    
                    if (!maxError && maxCodeData && maxCodeData.user_code) {
                        const maxCode = parseInt(maxCodeData.user_code) || 99999;
                        userCode = String(maxCode + 1).padStart(6, '0');
                    } else {
                        // Start from 100000 if no existing codes
                        userCode = '100000';
                    }
                }
            } catch (codeError) {
                console.warn('Error generating user code, starting from 100000:', codeError);
                userCode = '100000';
            }
            
            const { error: profileError } = await supabase
                .from('user_profiles')
                .insert([{
                    user_id: userId,
                    first_name: firstName,
                    last_name: lastName || null,
                    user_type: userType,
                    gender: gender,
                    date_of_birth: dateOfBirth || null,
                    user_code: userCode,
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
            // Note: Don't update user_code if it already exists (preserve existing code)
            const updateData = {
                first_name: firstName,
                last_name: lastName || null,
                user_type: userType,
                gender: gender,
                date_of_birth: dateOfBirth || null,
                school_id: schoolId,
                class: classNum,
                section: section,
                roll_number: rollNumber
            };
            
            // Only generate user_code if it doesn't exist
            if (!existingProfile.user_code) {
                let userCode = null;
                try {
                    // Find max user_code and increment
                    const { data: maxCodeData, error: maxError } = await supabase
                        .from('user_profiles')
                        .select('user_code')
                        .not('user_code', 'is', null)
                        .order('user_code', { ascending: false })
                        .limit(1)
                        .single();
                    
                    if (!maxError && maxCodeData && maxCodeData.user_code) {
                        const maxCode = parseInt(maxCodeData.user_code) || 99999;
                        userCode = String(maxCode + 1).padStart(6, '0');
                    } else {
                        userCode = '100000';
                    }
                    updateData.user_code = userCode;
                } catch (codeError) {
                    console.warn('Error generating user code for existing profile:', codeError);
                }
            }
            
            const { error: updateError } = await supabase
                .from('user_profiles')
                .update(updateData)
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
// Expose immediately after definition
window.handleRegistration = handleRegistration;

// CALLED BY: index.js - showLogin() (Step 1: User Code lookup)
async function handleLoginStep1(event) {
    if (window.debugLog) window.debugLog('handleLoginStep1');
    event.preventDefault();
    const errorEl = document.getElementById('loginError');
    errorEl.textContent = '';

    const userCode = document.getElementById('loginUserCode').value.trim();

    // Validate user code format
    if (!/^\d{6}$/.test(userCode)) {
        errorEl.textContent = 'Please enter a valid 6-digit user code';
        return;
    }

    try {
        // Wait for Supabase to be initialized
        if (!supabase) {
            let attempts = 0;
            while (!supabase && attempts < 10) {
                await new Promise(resolve => setTimeout(resolve, 200));
                attempts++;
            }
            if (!supabase) {
                errorEl.textContent = 'System not ready. Please try again.';
                return;
            }
        }

        // Fetch user profile by user_code
        const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*, schools(school_name)')
            .eq('user_code', userCode)
            .single();

        if (profileError || !profileData) {
            errorEl.textContent = 'User Code not Found';
            return;
        }

        // Get email from auth.users via RPC function (email is not in user_profiles)
        const { data: userEmail, error: emailError } = await supabase.rpc('get_user_email_by_code', {
            p_user_code: userCode
        });

        if (emailError || !userEmail) {
            errorEl.textContent = 'User email not found. Please contact administrator.';
            return;
        }

        // Store user email and profile for step 2
        loginUserEmail = userEmail;
        loginUserProfile = profileData;

        // Display user details
        document.getElementById('loginSchool').textContent = profileData.schools?.school_name || profileData.school || 'N/A';
        document.getElementById('loginClass').textContent = profileData.class || 'N/A';
        document.getElementById('loginSection').textContent = profileData.section || 'N/A';
        document.getElementById('loginRollNumber').textContent = profileData.roll_number || 'N/A';
        const fullName = [profileData.first_name, profileData.last_name].filter(Boolean).join(' ') || 'N/A';
        document.getElementById('loginName').textContent = fullName;

        // Show step 2, hide step 1
        document.getElementById('loginStep1').style.display = 'none';
        document.getElementById('loginStep2').style.display = 'block';
        document.getElementById('loginPassword').focus();
    } catch (error) {
        errorEl.textContent = 'User Code not Found';
    }
}
// Expose immediately after definition
window.handleLoginStep1 = handleLoginStep1;

// CALLED BY: index.js - showLogin() (Step 2: Password entry)
async function handleLoginForm(event) {
    if (window.debugLog) window.debugLog('handleLoginForm');
    event.preventDefault();
    const errorEl = document.getElementById('loginErrorStep2');
    errorEl.textContent = '';

    if (!loginUserEmail) {
        errorEl.textContent = 'Please start over. User code session expired.';
        showLogin();
        return;
    }

    const password = document.getElementById('loginPassword').value;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: loginUserEmail,
            password: password
        });

        if (error) {
            if (error.message.includes('password') || error.message.includes('Invalid')) {
                errorEl.textContent = 'Wrong Password';
            } else {
                errorEl.textContent = error.message || 'Login failed';
            }
            return;
        }

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
// Expose immediately after definition
window.handleLoginForm = handleLoginForm;

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
// Expose immediately after definition
window.handleForgotPasswordForm = handleForgotPasswordForm;

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
// Expose immediately after definition
window.handleResetPasswordForm = handleResetPasswordForm;

// CALLED BY: index.html - <button onclick="toggleWelcome()">Welcome</button>
// Expose to window immediately so onclick handlers can access it
function toggleWelcome() {
    if (window.debugLog) window.debugLog('toggleWelcome');
    const welcomeContent = document.getElementById('welcomeContent');
    if (welcomeContent) {
        welcomeContent.classList.toggle('hidden');
    }
}
// Expose immediately after definition
window.toggleWelcome = toggleWelcome;

// CALLED BY: Password toggle buttons (onclick="togglePasswordVisibility(...)")
function togglePasswordVisibility(inputId, button) {
    if (window.debugLog) window.debugLog('togglePasswordVisibility', `(${inputId})`);
    const passwordInput = document.getElementById(inputId);
    if (!passwordInput) return;
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        button.textContent = '🙈';
        button.setAttribute('aria-label', 'Hide password');
    } else {
        passwordInput.type = 'password';
        button.textContent = '👁️';
        button.setAttribute('aria-label', 'Show password');
    }
}
// Expose immediately after definition
window.togglePasswordVisibility = togglePasswordVisibility;

// Expose functions globally IMMEDIATELY (backup - functions already exposed above)
// CALLED BY: index.html - All onclick and onsubmit handlers access these via window object
// Wrap in try-catch to ensure functions are exposed even if there are errors elsewhere
try {
    window.showAnonymousUser = showAnonymousUser;
    window.showRegistration = showRegistration;
    window.showLogin = showLogin;
    window.showForgotPassword = showForgotPassword;
    window.toggleWelcome = toggleWelcome;
    window.togglePasswordVisibility = togglePasswordVisibility;
    window.startAsAnonymous = startAsAnonymous;
    window.handleRegistration = handleRegistration;
    window.handleLoginStep1 = handleLoginStep1;
    window.handleLoginForm = handleLoginForm;
    window.handleForgotPasswordForm = handleForgotPasswordForm;
    window.handleResetPasswordForm = handleResetPasswordForm;
    window.updateSignupFieldsBasedOnUserType = updateSignupFieldsBasedOnUserType;
    window.checkEmailExists = checkEmailExists;
    console.log('✅ Functions exposed to window');
} catch (e) {
    console.error('❌ Error exposing functions to window:', e);
    // Fallback: try to expose at least the critical functions
    if (typeof showLogin === 'function') window.showLogin = showLogin;
    if (typeof showRegistration === 'function') window.showRegistration = showRegistration;
    if (typeof showAnonymousUser === 'function') window.showAnonymousUser = showAnonymousUser;
    if (typeof toggleWelcome === 'function') window.toggleWelcome = toggleWelcome;
}

// Debug: Verify functions are available (check in console)
console.log('✅ Auth functions loaded:', {
    showAnonymousUser: typeof window.showAnonymousUser,
    showRegistration: typeof window.showRegistration,
    showLogin: typeof window.showLogin,
    showForgotPassword: typeof window.showForgotPassword,
    toggleWelcome: typeof window.toggleWelcome
});

// Immediate verification - check if functions are actually callable
if (typeof window.showLogin !== 'function') {
    console.error('❌ CRITICAL: showLogin is not a function! Script may have errors above this line.');
}

// Initialize on page load
// CALLED BY: index.html - Automatically executed when DOMContentLoaded event fires
window.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOMContentLoaded fired - index.js');
    if (window.debugLog) window.debugLog('DOMContentLoaded(index.js)');
    
    // Debug: Check if buttons exist
    const buttons = {
        welcome: document.querySelector('button[onclick="toggleWelcome()"]'),
        anonymous: document.querySelector('button[onclick="showAnonymousUser()"]'),
        registration: document.querySelector('button[onclick="showRegistration()"]'),
        login: document.querySelector('button[onclick="showLogin()"]'),
        forgotPassword: document.querySelector('button[onclick="showForgotPassword()"]')
    };
    console.log('✅ Buttons found:', Object.keys(buttons).filter(key => buttons[key] !== null));
    
    // Compatibility fix for devices where onclick doesn't work properly in PWA mode
    // This is a fallback that works on ALL devices (including Panasonic P110)
    // It adds explicit event listeners without removing onclick (so both work)
    const attachCompatHandlers = (selector, handler) => {
        const btn = document.querySelector(selector);
        if (btn && !btn.dataset.compatHandlerAttached) {
            // Add touch event listeners as fallback (onclick still works for newer devices)
            btn.addEventListener('touchend', (e) => {
                // Only trigger if onclick didn't fire (for compatibility)
                setTimeout(() => {
                    if (typeof handler === 'function') {
                        handler();
                    }
                }, 0);
            }, { passive: true });
            
            btn.dataset.compatHandlerAttached = 'true';
        }
    };
    
    // Attach compatibility handlers for all auth buttons (works on all devices)
    attachCompatHandlers('button[onclick="toggleWelcome()"]', window.toggleWelcome);
    attachCompatHandlers('button[onclick="showAnonymousUser()"]', window.showAnonymousUser);
    attachCompatHandlers('button[onclick="showRegistration()"]', window.showRegistration);
    attachCompatHandlers('button[onclick="showLogin()"]', window.showLogin);
    attachCompatHandlers('button[onclick="showForgotPassword()"]', window.showForgotPassword);
    
    console.log('✅ Compatibility handlers attached for all devices');
    
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
