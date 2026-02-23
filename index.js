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
// Expose immediately - critical for mobile browsers
window.showAnonymousUser = showAnonymousUser;

// CALLED BY: index.html - <button onclick="showRegistration()">Registration</button>
function showRegistration() {
    clearAuthContent();
    const contentArea = document.getElementById('authContentArea');
    contentArea.style.display = 'block';
    contentArea.innerHTML = `
        <div class="auth-form-container">
            <h3>Registration for Online Students</h3>
            <p style="font-size: 0.9em; color: #666; margin-bottom: 15px;">(School students registration will be done in batch upload)</p>
            <form id="registrationForm" class="auth-form" onsubmit="handleRegistration(event)">
                <p class="registration-info">Students, whose school is not registered, may join as Online Students. To get your Class, Section and Roll Number, please contact Prem Agrawal at agrawal.prem@gmail.com, or +91 98228 47682 (WhatsApp).</p>
                <div>
                    <input type="email" id="regEmail" placeholder="Email" required>
                    <div id="regEmailError" class="field-error" style="display: none;"></div>
                </div>
                <div>
                    <label for="regUserCode" style="display: block; margin-top: 10px; margin-bottom: 5px; color: #666; font-size: 14px;">User Code:</label>
                    <input type="text" id="regUserCode" placeholder="User Code" readonly style="background-color: #f5f5f5; cursor: not-allowed;">
                </div>
                <input type="text" id="regFirstName" placeholder="First Name" required>
                <input type="text" id="regLastName" placeholder="Last Name">
                <label for="regDateOfBirth" style="display: block; margin-top: 10px; margin-bottom: 5px; color: #666; font-size: 14px;">Date of Birth</label>
                <input type="date" id="regDateOfBirth" required>
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
                <div class="password-input-wrapper">
                    <input type="text" id="regPassword" placeholder="Password" minlength="6" required>
                    <button type="button" class="password-toggle" onclick="togglePasswordVisibility('regPassword', this)" aria-label="Hide password">🙈</button>
                </div>
                <div class="password-input-wrapper">
                    <input type="text" id="regPasswordConfirm" placeholder="Confirm Password" minlength="6" required>
                    <button type="button" class="password-toggle" onclick="togglePasswordVisibility('regPasswordConfirm', this)" aria-label="Hide password">🙈</button>
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
            emailInput.addEventListener('input', function() {
                var errorEl = document.getElementById('regError');
                var emailErrorEl = document.getElementById('regEmailError');
                if (errorEl && errorEl.textContent && errorEl.textContent.indexOf('This email id is used by') !== -1) {
                    errorEl.textContent = '';
                    errorEl.style.color = '';
                }
                if (emailErrorEl && emailErrorEl.textContent && emailErrorEl.textContent.indexOf('This email id is used by') !== -1) {
                    emailErrorEl.textContent = '';
                    emailErrorEl.style.display = 'none';
                }
                emailInput.setCustomValidity('');
                emailInput.style.borderColor = '';
            });
    }
    
    var regUserTypeEl = document.getElementById('regUserType');
    if (regUserTypeEl) {
        regUserTypeEl.addEventListener('change', updateSignupFieldsBasedOnUserType);
    }
    // Load schools into dropdown
    loadSchoolsIntoDropdown().then(function() {
        // After schools load, add listener for school selection changes
        var schoolSelect = document.getElementById('regSchoolId');
        if (schoolSelect) {
            schoolSelect.addEventListener('change', updateSignupFieldsBasedOnUserType);
        }
    }).catch(function(err) {
        console.error('Error loading schools:', err);
    });
    // Generate and display user code
    generateAndDisplayUserCode();
}

// Store user email for step 2 of login
let loginUserEmail = null;
let loginUserProfile = null;

function showLogin() {
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
                        <input type="text" id="loginPassword" placeholder="Password" required>
                        <button type="button" class="password-toggle" onclick="togglePasswordVisibility('loginPassword', this)" aria-label="Hide password">🙈</button>
                    </div>
                    <button type="submit" class="btn">Log In</button>
                    <button type="button" class="btn" style="background: #6c757d; margin-top: 10px;" onclick="showLogin()">Back</button>
                </form>
                <div id="loginErrorStep2" class="auth-error"></div>
            </div>
        </div>
    `;
}
// Expose immediately - critical for mobile browsers
window.showLogin = showLogin;

// CALLED BY: index.html - <button onclick="showForgotPassword()">Forgot Password</button>
function showForgotPassword() {
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
                        <input type="text" id="resetNewPassword" placeholder="New Password" minlength="6" required>
                        <button type="button" class="password-toggle" onclick="togglePasswordVisibility('resetNewPassword', this)" aria-label="Hide password">🙈</button>
                    </div>
                    <div class="password-input-wrapper">
                        <input type="text" id="resetConfirmPassword" placeholder="Confirm New Password" minlength="6" required>
                        <button type="button" class="password-toggle" onclick="togglePasswordVisibility('resetConfirmPassword', this)" aria-label="Hide password">🙈</button>
                    </div>
                    <button type="submit" class="btn">Update Password</button>
                </form>
                <div id="resetError" class="auth-error"></div>
            </div>
        </div>
    `;
}

// CALLED BY: index.js - showAnonymousUser(), showRegistration(), showLogin(), showForgotPassword() (clears previous content before showing new form)
function clearAuthContent() {
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
    
    // Sign in anonymously to create a Supabase auth user with is_anonymous = true
    // This allows anonymous users to save scores and see variant statuses
    if (supabase) {
        try {
            const { data, error } = await supabase.auth.signInAnonymously();
            if (error) {
                console.error('Error signing in anonymously:', error);
                // Continue anyway - navigate to dashboard without auth
            } else {
                console.log('✅ Anonymous user signed in:', data.user?.id);
                // Set currentUser immediately (auth state change listener will also fire)
                currentUser = data.user;
                // Note: currentUserProfile will be null for anonymous users (no entry in user_profiles)
            }
        } catch (error) {
            console.error('Error signing in anonymously:', error);
            // Continue anyway - navigate to dashboard
        }
    }
    
    window.location.href = 'student-dashboard.html';
}

// CALLED BY: index.js - showRegistration() (loads schools into dropdown when registration form is shown)
async function loadSchoolsIntoDropdown() {
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
            // Ensure school_id 1000 (Online) exists in dropdown
            const onlineSchoolExists = Array.from(schoolSelect.options).some(opt => opt.value === '1000');
            if (!onlineSchoolExists) {
                const onlineOption = document.createElement('option');
                onlineOption.value = '1000';
                onlineOption.textContent = 'Online';
                schoolSelect.appendChild(onlineOption);
            }
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
        }
        
        // Ensure school_id 1000 (Online) exists in dropdown
        const onlineSchoolExists = Array.from(schoolSelect.options).some(opt => opt.value === '1000');
        if (!onlineSchoolExists) {
            const onlineOption = document.createElement('option');
            onlineOption.value = '1000';
            onlineOption.textContent = 'Online';
            schoolSelect.appendChild(onlineOption);
        }
    } catch (error) {
        schoolSelect.innerHTML = '<option value="">Error loading schools</option>';
    }
}

// CALLED BY: index.js - showRegistration() (generates and displays next user code)
async function generateAndDisplayUserCode() {
    const userCodeField = document.getElementById('regUserCode');
    if (!userCodeField) return;
    
    try {
        // Wait for Supabase to be initialized
        if (!supabase) {
            let attempts = 0;
            while (!supabase && attempts < 10) {
                await new Promise(resolve => setTimeout(resolve, 200));
                attempts++;
            }
            if (!supabase) {
                userCodeField.value = 'Loading...';
                return;
            }
        }
        
        // Find max user_code and increment
        const { data: maxCodeData, error: maxError } = await supabase
            .from('user_profiles')
            .select('user_code')
            .not('user_code', 'is', null)
            .order('user_code', { ascending: false })
            .limit(1)
            .single();
        
        let nextUserCode = '100000'; // Default starting code
        
        if (!maxError && maxCodeData && maxCodeData.user_code) {
            const maxCode = parseInt(maxCodeData.user_code) || 99999;
            nextUserCode = String(maxCode + 1).padStart(6, '0');
        }
        
        userCodeField.value = nextUserCode;
    } catch (error) {
        console.error('Error generating user code:', error);
        userCodeField.value = 'Error';
    }
}

// CALLED BY: index.js - showRegistration() (adds event listener: document.getElementById('regUserType').addEventListener('change', updateSignupFieldsBasedOnUserType))
function updateSignupFieldsBasedOnUserType() {
    const userType = document.getElementById('regUserType')?.value;
    const schoolIdSelect = document.getElementById('regSchoolId');
    const schoolId = schoolIdSelect ? schoolIdSelect.value.trim() : null;
    const rollNumberField = document.getElementById('regRollNumber');
    
    if (!rollNumberField) return;
    
    // Check if online user (school_id = 1000)
    const isOnlineUser = schoolId === '1000';
    
    if (userType === 'Student') {
        if (isOnlineUser) {
            // Online students: system generates roll number
            rollNumberField.required = false;
            rollNumberField.placeholder = 'Roll Number (Auto-generated for online)';
            rollNumberField.readOnly = true;
            rollNumberField.style.backgroundColor = '#f5f5f5';
            rollNumberField.style.cursor = 'not-allowed';
            // Generate roll number for online user
            generateRollNumberForOnlineUser();
        } else {
            // School students: manual entry required
            rollNumberField.required = true;
            rollNumberField.placeholder = 'Roll Number';
            rollNumberField.readOnly = false;
            rollNumberField.style.backgroundColor = '';
            rollNumberField.style.cursor = '';
        }
    } else if (userType === 'Teacher') {
        rollNumberField.required = false;
        rollNumberField.placeholder = 'Roll Number (Optional)';
        rollNumberField.readOnly = false;
        rollNumberField.style.backgroundColor = '';
        rollNumberField.style.cursor = '';
    } else {
        rollNumberField.required = false;
        rollNumberField.placeholder = 'Roll Number';
        rollNumberField.readOnly = false;
        rollNumberField.style.backgroundColor = '';
        rollNumberField.style.cursor = '';
    }
}

// CALLED BY: index.js - updateSignupFieldsBasedOnUserType() (generates roll number for online users)
async function generateRollNumberForOnlineUser() {
    const rollNumberField = document.getElementById('regRollNumber');
    if (!rollNumberField) return;
    
    try {
        // Wait for Supabase to be initialized
        if (!supabase) {
            let attempts = 0;
            while (!supabase && attempts < 10) {
                await new Promise(resolve => setTimeout(resolve, 200));
                attempts++;
            }
            if (!supabase) {
                rollNumberField.value = '';
                return;
            }
        }
        
        // Find max roll_number for online users (school_id = 1000)
        const { data: maxRollData, error: maxError } = await supabase
            .from('user_profiles')
            .select('roll_number')
            .eq('school_id', 1000)
            .not('roll_number', 'is', null)
            .order('roll_number', { ascending: false })
            .limit(1)
            .single();
        
        let nextRollNumber = 1; // Default starting roll number
        
        if (!maxError && maxRollData && maxRollData.roll_number) {
            const maxRoll = parseInt(maxRollData.roll_number) || 0;
            nextRollNumber = maxRoll + 1;
        }
        
        rollNumberField.value = nextRollNumber;
    } catch (error) {
        console.error('Error generating roll number:', error);
        rollNumberField.value = '';
    }
}

// CALLED BY: index.js - showRegistration() (adds event listener: emailInput.addEventListener('blur', checkEmailExists))
async function checkEmailExists(event) {
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

// CALLED BY: index.html - <form onsubmit="handleRegistration(event)"> (dynamically inserted by showRegistration())
async function handleRegistration(event) {
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
            // Use user code from form field (pre-generated and displayed)
            const userCodeField = document.getElementById('regUserCode');
            let userCode = userCodeField ? userCodeField.value.trim() : null;
            
            // Validate user code format
            if (!userCode || !/^\d{6}$/.test(userCode)) {
                // Fallback: Generate user_code if form field is invalid
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
                        // Start from 100000 if no existing codes
                        userCode = '100000';
                    }
                } catch (codeError) {
                    console.warn('Error generating user code, starting from 100000:', codeError);
                    userCode = '100000';
                }
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

// CALLED BY: index.js - showLogin() (Step 1: User Code lookup)
async function handleLoginStep1(event) {
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

// CALLED BY: index.js - showLogin() (Step 2: Password entry)
async function handleLoginForm(event) {
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

// CALLED BY: index.html - <form onsubmit="handleForgotPasswordForm(event)"> (dynamically inserted by showForgotPassword())
async function handleForgotPasswordForm(event) {
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

// CALLED BY: index.html - <button onclick="toggleWelcome()">Welcome</button>
function toggleWelcome() {
    const welcomeContent = document.getElementById('welcomeContent');
    if (welcomeContent) {
        welcomeContent.classList.toggle('hidden');
    }
}
// Expose immediately - critical for mobile browsers
window.toggleWelcome = toggleWelcome;

// CALLED BY: Password toggle buttons (onclick="togglePasswordVisibility(...)")
function togglePasswordVisibility(inputId, button) {
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

// Expose functions globally
// CALLED BY: index.html - All onclick and onsubmit handlers access these via window object
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

// Initialize on page load
// CALLED BY: index.html - Automatically executed when DOMContentLoaded event fires
window.addEventListener('DOMContentLoaded', function() {
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
        if (window.supabase && window.supabase.createClient) {
            initSupabase(); // CALLED BY: index.js - tryInitSupabase() (calls shared_db.js function)
        } else if (attempts < 5) {
            setTimeout(() => { tryInitSupabase(attempts + 1); }, 1000);
        } else {
            console.error('Supabase library failed to load');
        }
    }
    
    // Initialize Supabase normally - it will process recovery token, but we'll handle it specially
    tryInitSupabase();
});
