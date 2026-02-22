// ============================================================================
// TEACHER DASHBOARD - JavaScript Logic
// ============================================================================
// NOTE: Supabase and currentUser are initialized by shared_db.js (loaded in teacher-dashboard.html)
// Use the global currentUser from shared_db.js instead of declaring a new one

// Teacher dashboard specific data
let teacherProfile = null;
let students = [];
let studentScores = [];
let allVariants = [];
let currentUserRole = null; // 'Teacher', 'Principal', or 'Administrator'
let availableSchools = []; // Schools user can access
let availableClasses = []; // Classes user can access
let selectedSchoolId = null; // Currently selected school

// Fixed columns in the student progress table (Student, Class, Roll No., User Code, Date of Birth)
const FIXED_COLUMNS_COUNT = 5;
let selectedClass = null; // Currently selected class
let selectedSection = null; // Currently selected section

// Learning sequence for column ordering
const learningSequence = {
    addition: ['1A0', '1A1', '1A2', '1A3', '1A', '1B', '1C', '1D', '1', '1M1', '1M2'],
    subtraction: ['2A', '2B', '2C', '2D', '2', '2M1', '2M2', '2M3'],
    multiplication: ['3A0', '3A1', '3A2S', '3A2', '3A3S', '3A3', '3A', '3B4S', '3B4', '3B5S', '3B5', '3B6S', '3B6', '3B', '3C7S', '3C7', '3C8S', '3C8', '3C9S', '3C9', '3C', '3', '3M1', '3M2'],
    division: ['4A1', '4A2', '4A3', '4A', '4B4', '4B5', '4B6', '4B', '4C7', '4C8', '4C9', '4C', '4', '4M1', '4M2']
};

// Collapse state for operation groups (false = expanded/visible, true = collapsed/hidden)
let collapsedOperations = {
    '1': false,  // Operation 1 (Addition): hide 1A0-1D
    '2': false,  // Operation 2 (Subtraction): hide 2A-2D
    '3': false,  // Operation 3 (Multiplication): hide 3A0-3C
    '4': false   // Operation 4 (Division): hide 4A1-4C9
};

// Identify user role based on email matching schools table
// CALLED BY: teacher-dashboard.js - loadTeacherDashboard() (identifies if user is Teacher/Principal/Administrator)
async function identifyUserRole(profileData, schoolsData) {
    if (window.debugLog) window.debugLog('identifyUserRole');
    
    const userEmail = (currentUser.email || '').toLowerCase().trim();
    
    if (!userEmail) {
        return 'Teacher'; // Default to Teacher if no email
    }
    
    // Check if user email matches administrator_email or principal_email in schools table
    for (const school of schoolsData || []) {
        const adminEmail = (school.administrator_email || '').toLowerCase().trim();
        const principalEmail = (school.principal_email || '').toLowerCase().trim();
        
        // Priority: Administrator > Principal > Teacher
        if (adminEmail && userEmail === adminEmail) {
            return 'Administrator';
        }
        if (principalEmail && userEmail === principalEmail) {
            return 'Principal';
        }
    }
    
    // Default to Teacher if no match
    return 'Teacher';
}

// Fetch available schools based on user role
// CALLED BY: teacher-dashboard.js - loadTeacherDashboard() (gets schools user can access)
async function fetchAvailableSchools(profileData, userRole, schoolsData) {
    if (window.debugLog) window.debugLog('fetchAvailableSchools');
    
    const userEmail = (currentUser.email || '').toLowerCase().trim();
    const schools = [];
    
    if (userRole === 'Teacher') {
        // For teachers: get schools from Classes table where teacher_email matches
        const { data: classesData, error: classesError } = await supabase
            .from('classes')
            .select('school_id')
            .eq('teacher_email', userEmail);
        
        if (classesError) {
            console.warn('⚠️ Error fetching classes for teacher:', classesError);
            return [];
        }
        
        // Extract unique school IDs
        const schoolIds = [...new Set((classesData || []).map(c => c.school_id))];
        
        if (schoolIds.length === 0) {
            return [];
        }
        
        // Fetch school details
        const { data: schoolsData, error: schoolsError } = await supabase
            .from('schools')
            .select('school_id, school_name')
            .in('school_id', schoolIds)
            .order('school_id', { ascending: true });
        
        if (schoolsError) {
            console.warn('⚠️ Error fetching schools:', schoolsError);
            return [];
        }
        
        return (schoolsData || []).map(school => ({
            school_id: school.school_id,
            school_name: school.school_name || `School ${school.school_id}`
        }));
        
    } else if (userRole === 'Principal' || userRole === 'Administrator') {
        // For principals/administrators: get schools where their email matches
        const emailField = userRole === 'Principal' ? 'principal_email' : 'administrator_email';
        
        // Filter schools from provided schoolsData
        const matchingSchools = (schoolsData || []).filter(school => {
            const schoolEmail = (school[emailField] || '').toLowerCase().trim();
            return schoolEmail && userEmail === schoolEmail;
        });
        
        // If we have school_name in the data, use it; otherwise fetch it
        if (matchingSchools.length > 0 && matchingSchools[0].school_name) {
            return matchingSchools.map(school => ({
                school_id: school.school_id,
                school_name: school.school_name || `School ${school.school_id}`
            }));
        }
        
        // Fetch school names if not in provided data
        const schoolIds = matchingSchools.map(s => s.school_id);
        if (schoolIds.length > 0) {
            const { data: schoolsWithNames, error: schoolsError } = await supabase
                .from('schools')
                .select('school_id, school_name')
                .in('school_id', schoolIds)
                .order('school_id', { ascending: true });
            
            if (schoolsError) {
                console.warn('⚠️ Error fetching school names:', schoolsError);
                return matchingSchools.map(school => ({
                    school_id: school.school_id,
                    school_name: `School ${school.school_id}`
                }));
            }
            
            return (schoolsWithNames || []).map(school => ({
                school_id: school.school_id,
                school_name: school.school_name || `School ${school.school_id}`
            }));
        }
        
        return [];
    }
    
    return [];
}

// Fetch available classes for selected school
// CALLED BY: teacher-dashboard.js - loadTeacherDashboard(), onSchoolChange() (gets classes for school)
async function fetchAvailableClasses(schoolId, profileData, userRole) {
    if (window.debugLog) window.debugLog('fetchAvailableClasses', `(schoolId=${schoolId})`);
    
    if (!schoolId) return [];
    
    const userEmail = (currentUser.email || '').toLowerCase().trim();
    
    if (userRole === 'Teacher') {
        // For teachers: get classes from Classes table where teacher_email matches
        const { data: classesData, error: classesError } = await supabase
            .from('classes')
            .select('school_id, class, section')
            .eq('school_id', schoolId)
            .eq('teacher_email', userEmail)
            .order('class', { ascending: true })
            .order('section', { ascending: true });
        
        if (classesError) {
            console.warn('⚠️ Error fetching classes:', classesError);
            return [];
        }
        
        return (classesData || []).map(c => ({
            school_id: c.school_id,
            class: c.class,
            section: c.section
        }));
        
    } else if (userRole === 'Principal' || userRole === 'Administrator') {
        // For principals/administrators: get all classes in the selected school
        const { data: classesData, error: classesError } = await supabase
            .from('classes')
            .select('school_id, class, section')
            .eq('school_id', schoolId)
            .order('class', { ascending: true })
            .order('section', { ascending: true });
        
        if (classesError) {
            console.warn('⚠️ Error fetching classes:', classesError);
            return [];
        }
        
        return (classesData || []).map(c => ({
            school_id: c.school_id,
            class: c.class,
            section: c.section
        }));
    }
    
    return [];
}

// Render school and class selector dropdowns
// CALLED BY: teacher-dashboard.js - loadTeacherDashboard() (creates dropdown UI)
function renderSchoolClassSelectors() {
    if (window.debugLog) window.debugLog('renderSchoolClassSelectors');
    
    const selectorContainer = document.getElementById('schoolClassSelectors');
    if (!selectorContainer) return;
    
    selectorContainer.innerHTML = '';
    
    // Show selectors only if multiple schools or classes available
    const showSchoolSelector = availableSchools.length > 1;
    const showClassSelector = availableClasses.length > 1;
    
    if (!showSchoolSelector && !showClassSelector) {
        selectorContainer.classList.add('hidden');
        return;
    }
    
    selectorContainer.classList.remove('hidden');
    
    // Create school selector if needed
    if (showSchoolSelector) {
        const schoolGroup = document.createElement('div');
        schoolGroup.className = 'selector-group';
        
        const schoolLabel = document.createElement('label');
        schoolLabel.className = 'selector-label';
        schoolLabel.textContent = 'Select School:';
        schoolLabel.setAttribute('for', 'schoolSelector');
        
        const schoolSelect = document.createElement('select');
        schoolSelect.id = 'schoolSelector';
        schoolSelect.className = 'selector-dropdown';
        schoolSelect.innerHTML = '<option value="">-- Select School --</option>';
        
        availableSchools.forEach(school => {
            const option = document.createElement('option');
            option.value = school.school_id;
            option.textContent = school.school_name;
            if (selectedSchoolId === school.school_id) {
                option.selected = true;
            }
            schoolSelect.appendChild(option);
        });
        
        schoolSelect.addEventListener('change', async (e) => {
            const schoolId = parseInt(e.target.value);
            await onSchoolChange(schoolId);
        });
        
        schoolGroup.appendChild(schoolLabel);
        schoolGroup.appendChild(schoolSelect);
        selectorContainer.appendChild(schoolGroup);
    }
    
    // Create class selector if needed
    if (showClassSelector) {
        const classGroup = document.createElement('div');
        classGroup.className = 'selector-group';
        
        const classLabel = document.createElement('label');
        classLabel.className = 'selector-label';
        classLabel.textContent = 'Select Class:';
        classLabel.setAttribute('for', 'classSelector');
        
        const classSelect = document.createElement('select');
        classSelect.id = 'classSelector';
        classSelect.className = 'selector-dropdown';
        classSelect.innerHTML = '<option value="">-- Select Class --</option>';
        
        availableClasses.forEach(cls => {
            const option = document.createElement('option');
            const value = `${cls.school_id}_${cls.class}_${cls.section}`;
            option.value = value;
            option.textContent = `Class ${cls.class} - Section ${cls.section}`;
            if (selectedSchoolId === cls.school_id && 
                selectedClass === cls.class && 
                selectedSection === cls.section) {
                option.selected = true;
            }
            classSelect.appendChild(option);
        });
        
        classSelect.addEventListener('change', async (e) => {
            const [schoolId, classNum, section] = e.target.value.split('_');
            await onClassChange(parseInt(schoolId), classNum, section);
        });
        
        classGroup.appendChild(classLabel);
        classGroup.appendChild(classSelect);
        selectorContainer.appendChild(classGroup);
    }
}

// Handle school selection change
// CALLED BY: teacher-dashboard.js - renderSchoolClassSelectors() (on school dropdown change)
async function onSchoolChange(schoolId) {
    if (window.debugLog) window.debugLog('onSchoolChange', `(schoolId=${schoolId})`);
    
    selectedSchoolId = schoolId;
    selectedClass = null;
    selectedSection = null;
    
    if (!schoolId) {
        availableClasses = [];
        renderSchoolClassSelectors();
        return;
    }
    
    // Fetch classes for selected school
    availableClasses = await fetchAvailableClasses(schoolId, teacherProfile, currentUserRole);
    
    // If only one class, auto-select it
    if (availableClasses.length === 1) {
        const cls = availableClasses[0];
        await onClassChange(cls.school_id, cls.class, cls.section);
    } else {
        renderSchoolClassSelectors();
    }
}

// Handle class selection change
// CALLED BY: teacher-dashboard.js - renderSchoolClassSelectors() (on class dropdown change)
async function onClassChange(schoolId, classNum, section) {
    if (window.debugLog) window.debugLog('onClassChange', `(schoolId=${schoolId}, class=${classNum}, section=${section})`);
    
    selectedSchoolId = schoolId;
    selectedClass = classNum;
    selectedSection = section;
    
    // Load students for selected class
    await loadStudentsForClass(schoolId, classNum, section);
}

// Load students for selected school, class, and section
// CALLED BY: teacher-dashboard.js - onClassChange(), loadTeacherDashboard() (loads students)
async function loadStudentsForClass(schoolId, classNum, section) {
    if (window.debugLog) window.debugLog('loadStudentsForClass', `(schoolId=${schoolId}, class=${classNum}, section=${section})`);
    
    try {
        showLoading(true);
        showError('');
        
        // Build student query
        let studentsQuery = supabase
            .from('user_profiles')
            .select('*')
            .eq('user_type', 'Student')
            .eq('school_id', schoolId)
            .eq('class', classNum)
            .eq('section', section);
        
        const { data: studentsData, error: studentsError } = await studentsQuery;
        
        if (studentsError) {
            throw new Error(`Error fetching students: ${studentsError.message}`);
        }
        
        students = (studentsData || []).sort((a, b) => {
            const rollA = a.roll_number;
            const rollB = b.roll_number;
            const hasRollA = rollA !== null && rollA !== undefined && rollA !== '';
            const hasRollB = rollB !== null && rollB !== undefined && rollB !== '';
            if (hasRollA && hasRollB) {
                return String(rollA).localeCompare(String(rollB), undefined, { numeric: true, sensitivity: 'base' });
            }
            const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.user_code || 'N/A';
            const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim() || b.user_code || 'N/A';
            return nameA.localeCompare(nameB);
        });
        
        console.log(`✅ Found ${students.length} students in School ${schoolId}, Class ${classNum}-${section}`);
        
        if (students.length === 0) {
            showError(`No students found in Class ${classNum}-${section}.`);
            showLoading(false);
            document.getElementById('dashboardControls').classList.add('hidden');
            document.getElementById('dashboardGrid').classList.add('hidden');
            return;
        }
        
        // Fetch scores for all students
        const studentUserIds = students.map(s => s.user_id);
        const { data: scoresData, error: scoresError } = await supabase
            .from('user_scores')
            .select('*')
            .in('user_id', studentUserIds);
        
        if (scoresError) {
            throw new Error(`Error fetching scores: ${scoresError.message}`);
        }
        
        studentScores = scoresData || [];
        console.log(`✅ Found ${studentScores.length} score records`);
        
        // Fetch active sessions for all students
        const { data: activeSessionsData, error: activeSessionsError } = await supabase
            .from('active_sessions')
            .select('*')
            .in('user_id', studentUserIds);
        
        if (activeSessionsError) {
            console.warn('⚠️ Error fetching active sessions:', activeSessionsError);
        }
        
        window.activeSessions = activeSessionsData || [];
        console.log(`✅ Found ${window.activeSessions.length} active sessions`);
        
        // Build and display the grid
        buildDashboardGrid();
        
        document.getElementById('studentCount').textContent = students.length;
        document.getElementById('variantCount').textContent = allVariants.length;
        
        showLoading(false);
        document.getElementById('dashboardControls').classList.remove('hidden');
        document.getElementById('dashboardGrid').classList.remove('hidden');
        
        // Start polling for active sessions updates every 5 seconds
        if (!window.activeSessionsPollInterval) {
            startActiveSessionsPolling();
        }
        
    } catch (error) {
        console.error('❌ Error loading students:', error);
        showError(error.message);
        showLoading(false);
    }
}

// Check authentication on page load
// CALLED BY: teacher-dashboard.html - DOMContentLoaded listener (initializes dashboard on page load)
async function initDashboard() {
    if (window.debugLog) window.debugLog('initDashboard');
    
    // Wait for Supabase library to load and initialize
    if (!window.supabase || !window.supabase.createClient) {
        // Wait for Supabase library to load
        let attempts = 0;
        while ((!window.supabase || !window.supabase.createClient) && attempts < 10) {
            await new Promise(resolve => setTimeout(resolve, 200));
            attempts++;
        }
        if (!window.supabase || !window.supabase.createClient) {
            throw new Error('Supabase library failed to load');
        }
    }
    
    // Initialize Supabase if not already initialized
    // Use window.supabase or global supabase - check if it exists and has the auth property
    let supabaseClient = typeof supabase !== 'undefined' ? supabase : (typeof window.supabase !== 'undefined' ? window.supabase : null);
    
    if (!supabaseClient || !supabaseClient.auth) {
        if (typeof window.initSupabase === 'function') {
            await window.initSupabase();
        } else {
            // Wait for shared_db.js to expose initSupabase
            let attempts = 0;
            while (typeof window.initSupabase !== 'function' && attempts < 10) {
                await new Promise(resolve => setTimeout(resolve, 200));
                attempts++;
            }
            if (typeof window.initSupabase === 'function') {
                await window.initSupabase();
            } else {
                throw new Error('shared_db.js not loaded or initSupabase not available');
            }
        }
        
        // Wait for supabase to be fully initialized (check for auth property)
        let attempts = 0;
        while (attempts < 20) {
            // Try both global supabase and window.supabase
            supabaseClient = typeof supabase !== 'undefined' ? supabase : (typeof window.supabase !== 'undefined' ? window.supabase : null);
            if (supabaseClient && supabaseClient.auth) {
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
    }
    
    // Verify supabase is now initialized with auth property
    if (!supabaseClient || !supabaseClient.auth) {
        console.error('❌ Supabase initialization failed.');
        console.error('   typeof supabase:', typeof supabase);
        console.error('   supabase value:', supabase);
        console.error('   typeof window.supabase:', typeof window.supabase);
        console.error('   window.supabase value:', window.supabase);
        throw new Error('Supabase initialization failed - auth property not available');
    }
    
    // Use supabaseClient for the rest of this function
    // Check for existing session
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        currentUser = session.user;
        await loadTeacherDashboard();
    } else {
        // Redirect to login if not authenticated
        window.location.href = 'index.html';
    }
}

// Load teacher dashboard data
// CALLED BY: teacher-dashboard.js - initDashboard() (loads dashboard data after authentication check)
async function loadTeacherDashboard() {
    if (window.debugLog) window.debugLog('loadTeacherDashboard');
    try {
        showLoading(true);
        showError('');

        // Fetch teacher's own profile
        const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', currentUser.id)
            .single();

        if (profileError || !profileData) {
            throw new Error('User profile not found. Please ensure you are logged in.');
        }

        // Fetch schools data to check for Principal/Administrator emails
        const { data: schoolsData, error: schoolsError } = await supabase
            .from('schools')
            .select('school_id, school_name, principal_email, administrator_email');

        if (schoolsError) {
            console.warn('⚠️ Error fetching schools data:', schoolsError);
        }

        // Identify user role (Teacher, Principal, or Administrator)
        currentUserRole = await identifyUserRole(profileData, schoolsData || []);
        
        // Verify user has access (must be Teacher, Principal, or Administrator)
        if (profileData.user_type !== 'Teacher' && currentUserRole === 'Teacher') {
            throw new Error('Access denied. This dashboard is only available for teachers, principals, and administrators.');
        }

        teacherProfile = profileData;
        
        console.log(`✅ ${currentUserRole} profile loaded`);

        // Fetch available schools based on role
        availableSchools = await fetchAvailableSchools(profileData, currentUserRole, schoolsData || []);
        
        if (availableSchools.length === 0) {
            throw new Error(`No schools found for your ${currentUserRole.toLowerCase()} account. Please contact administrator.`);
        }
        
        // Auto-select school if only one available
        if (availableSchools.length === 1) {
            selectedSchoolId = availableSchools[0].school_id;
        }
        
        // Fetch available classes
        if (selectedSchoolId) {
            availableClasses = await fetchAvailableClasses(selectedSchoolId, profileData, currentUserRole);
            
            // Auto-select class if only one available
            if (availableClasses.length === 1) {
                const cls = availableClasses[0];
                selectedClass = cls.class;
                selectedSection = cls.section;
            }
        }
        
        // Build flattened variant list for columns
        allVariants = [];
        Object.keys(learningSequence).forEach(operation => {
            learningSequence[operation].forEach(variant => {
                allVariants.push({ operation, variant });
            });
        });

        // Update dashboard title based on role
        const headerTitle = document.querySelector('.header h1');
        if (headerTitle) {
            const roleTitle = currentUserRole === 'Teacher' ? 'Teacher' : 
                             currentUserRole === 'Principal' ? 'Principal' : 
                             'Administrator';
            headerTitle.textContent = `${roleTitle} Dashboard - Student Progress`;
        }
        
        // Update page title
        document.title = `${currentUserRole} Dashboard - Student Progress`;

        // Render school/class selectors
        renderSchoolClassSelectors();
        
        // If school and class are auto-selected, load students immediately
        if (selectedSchoolId && selectedClass && selectedSection) {
            await loadStudentsForClass(selectedSchoolId, selectedClass, selectedSection);
        } else {
            // Show selectors and wait for user selection
            showLoading(false);
            if (availableSchools.length > 1 || availableClasses.length > 1) {
                showError('Please select a school and class to view students.');
            } else {
                showError('No classes found. Please contact administrator.');
            }
        }

    } catch (error) {
        console.error('❌ Error loading dashboard:', error);
        showError(error.message);
        showLoading(false);
    }
}

// Check if a variant should be hidden based on collapse state
// CALLED BY: teacher-dashboard.js - buildDashboardGrid(), updateColumnVisibility() (determines column visibility)
function shouldHideVariant(operation, variant) {
    const opNum = operation === 'addition' ? '1' : 
                  operation === 'subtraction' ? '2' :
                  operation === 'multiplication' ? '3' :
                  operation === 'division' ? '4' : null;
    
    if (!opNum || !collapsedOperations[opNum]) return false;
    
    // Check if variant matches collapse pattern for this operation
    if (opNum === '1') {
        return ['1A0', '1A1', '1A2', '1A3', '1A', '1B', '1C', '1D'].includes(variant);
    } else if (opNum === '2') {
        return ['2A', '2B', '2C', '2D'].includes(variant);
    } else if (opNum === '3') {
        return variant.startsWith('3A') || variant.startsWith('3B') || variant.startsWith('3C');
    } else if (opNum === '4') {
        return variant.startsWith('4A') || variant.startsWith('4B') || variant.startsWith('4C');
    }
    return false;
}

// Build the dashboard grid
// CALLED BY: teacher-dashboard.js - loadTeacherDashboard() (builds the progress table after loading data)
function buildDashboardGrid() {
    if (window.debugLog) window.debugLog('buildDashboardGrid');
    const tableHead = document.getElementById('tableHead');
    const tableBody = document.getElementById('tableBody');

    // Clear existing content
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';

    // Build header row
    const headerRow = document.createElement('tr');
    const headerColumns = [
        'Student', 'Class', 'Roll No.', 'User Code', 'Date of Birth'
    ];
    
    headerColumns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col;
        th.className = 'fixed-column';
        headerRow.appendChild(th);
    });

    // Add variant columns
    allVariants.forEach(({ operation, variant }) => {
        const th = document.createElement('th');
        th.textContent = variant;
        th.title = `${operation} - ${variant}`;
        th.className = 'variant-column';
        th.dataset.operation = operation;
        th.dataset.variant = variant;
        if (shouldHideVariant(operation, variant)) {
            th.classList.add('hidden-column');
        }
        headerRow.appendChild(th);
    });

    tableHead.appendChild(headerRow);

    // Build data rows
    students.forEach(student => {
        const row = document.createElement('tr');
        
        // Student info columns
        const nameCell = document.createElement('td');
        nameCell.textContent = `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.user_code || 'N/A';
        nameCell.className = 'fixed-column';
        row.appendChild(nameCell);

        const classCell = document.createElement('td');
        // Combine class and section (e.g., "5A")
        const classSection = (student.class || '') + (student.section || '');
        classCell.textContent = classSection || '';
        classCell.className = 'fixed-column';
        row.appendChild(classCell);

        const rollCell = document.createElement('td');
        rollCell.textContent = student.roll_number || '';
        rollCell.className = 'fixed-column';
        row.appendChild(rollCell);

        const userCodeCell = document.createElement('td');
        userCodeCell.textContent = student.user_code || 'N/A';
        userCodeCell.className = 'fixed-column';
        row.appendChild(userCodeCell);

        const dobCell = document.createElement('td');
        // Format date of birth for display (YYYY-MM-DD to DD/MM/YYYY)
        if (student.date_of_birth) {
            const dob = new Date(student.date_of_birth);
            // Format as DD/MM/YYYY
            const day = String(dob.getDate()).padStart(2, '0');
            const month = String(dob.getMonth() + 1).padStart(2, '0');
            const year = dob.getFullYear();
            dobCell.textContent = `${day}/${month}/${year}`;
        } else {
            dobCell.textContent = 'N/A';
        }
        dobCell.className = 'fixed-column';
        row.appendChild(dobCell);

        // Variant status columns
        allVariants.forEach(({ operation, variant }) => {
            const cell = document.createElement('td');
            const status = getVariantStatus(student.user_id, operation, variant);
            
            if (status && typeof status === 'object' && status.type === 'active') {
                // Active session - show question number with color
                cell.textContent = status.questionNo || '0';
                cell.className = status.isCorrect === true ? 'status-active-correct' : 
                                 status.isCorrect === false ? 'status-active-wrong' : 
                                 'status-active-unknown';
            } else if (status && status.type === 'pass') {
                // Display minimum average_time for passed variants
                if (status.minTime != null) {
                    cell.textContent = `${status.minTime.toFixed(1)}s`;
                } else {
                    cell.textContent = '✓';
                }
                cell.className = 'status-pass';
            } else if (status && status.type === 'fail') {
                // Display attempt count for failed variants
                const count = status.attemptCount || 0;
                cell.textContent = count > 0 ? `${count}` : '✗';
                cell.className = 'status-fail';
            } else {
                cell.textContent = '';
                cell.className = 'status-empty';
            }
            
            cell.className += ' variant-column';
            cell.dataset.operation = operation;
            cell.dataset.variant = variant;
            if (shouldHideVariant(operation, variant)) {
                cell.classList.add('hidden-column');
            }
            
            row.appendChild(cell);
        });

        tableBody.appendChild(row);
    });
}

// Get pass/fail status for a variant (or active session info)
// CALLED BY: teacher-dashboard.js - buildDashboardGrid() (gets status for each variant cell in the table)
function getVariantStatus(userId, operation, variant) {
    if (window.debugLog) window.debugLog('getVariantStatus', `(${operation}, ${variant})`);
    
    try {
        // FIRST: Check for active session - active sessions take priority over completed scores
        // because they show what the student is currently working on
        const activeSessions = window.activeSessions || [];
        const activeSession = activeSessions.find(s => 
            s && s.user_id === userId && 
            s.operation === operation && 
            s.variant === variant
        );
        
        if (activeSession) {
            // Return active session info (sky blue background, colored text)
            // This shows even if there are completed scores, because student is actively working
            return {
                type: 'active',
                questionNo: activeSession.last_question_no_completed,
                isCorrect: activeSession.last_question_correct_wrong
            };
        }
        
        // SECOND: Only if no active session, check completed scores
        // Ensure studentScores is defined and is an array
        if (!studentScores || !Array.isArray(studentScores)) {
            console.warn('⚠️ studentScores is not defined or not an array, using empty array');
            studentScores = [];
        }
        
        const scores = studentScores.filter(s => 
            s && s.user_id === userId && 
            s.operation === operation && 
            s.variant === variant
        );

        if (scores.length > 0) {
            // Data is committed to database - show pass/fail status
            // Check if any score has passed = true
            const hasPassed = scores.some(s => s.passed === true || s.passed === 'true' || s.passed === 1 || s.passed === '1');
            
            if (hasPassed) {
                // Find minimum average_time from all passed attempts
                const passedScores = scores.filter(s => 
                    s.passed === true || s.passed === 'true' || s.passed === 1 || s.passed === '1'
                );
                const averageTimes = passedScores
                    .map(s => s.average_time)
                    .filter(t => t != null && !isNaN(t))
                    .map(t => parseFloat(t));
                const minTime = averageTimes.length > 0 ? Math.min(...averageTimes) : null;
                return {
                    type: 'pass',
                    minTime: minTime
                };
            } else {
                // Count failed attempts
                const failedScores = scores.filter(s => 
                    s.passed === false || s.passed === 'false' || s.passed === 0 || s.passed === '0'
                );
                return {
                    type: 'fail',
                    attemptCount: failedScores.length
                };
            }
        }
        
        return null; // Not attempted (no active session and no completed scores)
    } catch (error) {
        console.error('❌ Error in getVariantStatus:', error);
        return null;
    }
}

// Export to Excel
// CALLED BY: teacher-dashboard.html - <button onclick="exportToExcel()">Export to Excel</button>
async function exportToExcel() {
    if (window.debugLog) window.debugLog('exportToExcel');
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Student Progress');

        // Add header row
        const headerRow = ['Student', 'Class', 'Roll No.', 'User Code', 'Date of Birth'];
        allVariants.forEach(({ operation, variant }) => {
            headerRow.push(variant);
        });
        worksheet.addRow(headerRow);

        // Style header row
        const headerCellStyle = {
            font: { bold: true, size: 12 },
            fill: {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4472C4' }
            },
            color: { argb: 'FFFFFFFF' },
            alignment: { horizontal: 'center', vertical: 'middle' },
            border: {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            }
        };

        worksheet.getRow(1).eachCell((cell, colNumber) => {
            cell.style = headerCellStyle;
        });

        // Add data rows
        students.forEach(student => {
            // Format date of birth for export
            let dobFormatted = 'N/A';
            if (student.date_of_birth) {
                const dob = new Date(student.date_of_birth);
                const day = String(dob.getDate()).padStart(2, '0');
                const month = String(dob.getMonth() + 1).padStart(2, '0');
                const year = dob.getFullYear();
                dobFormatted = `${day}/${month}/${year}`;
            }
            
            const row = [
                `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.user_code || 'N/A',
                (student.class || '') + (student.section || ''), // Combined class+section
                student.roll_number || '',
                student.user_code || 'N/A',
                dobFormatted
            ];

            allVariants.forEach(({ operation, variant }) => {
                const status = getVariantStatus(student.user_id, operation, variant);
                if (status && typeof status === 'object' && status.type === 'active') {
                    row.push(`Q${status.questionNo}${status.isCorrect ? '✓' : '✗'}`);
                } else if (status && typeof status === 'object' && status.type === 'pass') {
                    // Export minimum average_time for passed variants
                    if (status.minTime != null) {
                        row.push(`${status.minTime.toFixed(1)}s`);
                    } else {
                        row.push('✓');
                    }
                } else if (status && typeof status === 'object' && status.type === 'fail') {
                    // Export attempt count for failed variants
                    const count = status.attemptCount || 0;
                    row.push(count > 0 ? `${count}` : '✗');
                } else {
                    row.push('');
                }
            });

            const dataRow = worksheet.addRow(row);

            // Style status cells
            allVariants.forEach((_, index) => {
                const cell = dataRow.getCell(6 + index); // Start after fixed columns (Student, Class, Roll No., User Code, Date of Birth)
                const status = getVariantStatus(student.user_id, allVariants[index].operation, allVariants[index].variant);
                
                if (status && typeof status === 'object' && status.type === 'active') {
                    // Active session - green for correct, red for wrong
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: status.isCorrect === true ? 'FF90EE90' : 'FFFFB6C6' }
                    };
                } else if (status === 'pass') {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FF90EE90' }
                    };
                } else if (status === 'fail') {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFFFB6C6' }
                    };
                }

                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        });

        // Set column widths
        worksheet.getColumn(1).width = 25; // Student
        worksheet.getColumn(2).width = 10; // Class
        worksheet.getColumn(3).width = 12; // Roll No.
        worksheet.getColumn(4).width = 15; // User Code
        worksheet.getColumn(5).width = 15; // Date of Birth
        for (let i = 6; i <= 5 + allVariants.length; i++) {
            worksheet.getColumn(i).width = 8; // Variant columns
        }

        // Freeze header row and first 5 columns
        worksheet.views = [{
            state: 'frozen',
            ySplit: 1,
            xSplit: 5
        }];

        // Generate Excel file and download
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Student_Progress_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        console.log('✅ Excel file exported successfully');
    } catch (error) {
        console.error('❌ Error exporting to Excel:', error);
        alert('Error exporting to Excel: ' + error.message);
    }
}

// Handle logout
// CALLED BY: teacher-dashboard.html - <button onclick="handleLogout()">Logout</button>
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

// Utility functions
// CALLED BY: teacher-dashboard.js - loadTeacherDashboard() (shows/hides loading message)
function showLoading(show) {
    if (window.debugLog) window.debugLog('showLoading', `(show=${show})`);
    document.getElementById('loadingMessage').style.display = show ? 'block' : 'none';
}

// CALLED BY: teacher-dashboard.js - loadTeacherDashboard() (displays error messages), teacher-dashboard.js - buildDashboardGrid() (displays errors)
function showError(message) {
    if (window.debugLog) window.debugLog('showError');
    const errorEl = document.getElementById('errorMessage');
    if (message) {
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
    } else {
        errorEl.classList.add('hidden');
    }
}

// Poll active sessions every 5 seconds
// CALLED BY: teacher-dashboard.js - loadTeacherDashboard() (starts polling after initial load)
let activeSessionsPollInterval = null;

function startActiveSessionsPolling() {
    if (window.debugLog) window.debugLog('startActiveSessionsPolling');
    // Clear any existing interval
    if (activeSessionsPollInterval) {
        clearInterval(activeSessionsPollInterval);
    }
    
    // Poll every 5 seconds
    activeSessionsPollInterval = setInterval(async () => {
        if (!supabase || !teacherProfile) return;
        
        try {
            // Get student user IDs
            const studentUserIds = students.map(s => s.user_id);
            if (studentUserIds.length === 0) return;
            
            // Fetch active sessions
            const { data: activeSessionsData, error: activeSessionsError } = await supabase
                .from('active_sessions')
                .select('*')
                .in('user_id', studentUserIds);
            
            if (activeSessionsError) {
                console.warn('⚠️ Error polling active sessions:', activeSessionsError);
                return;
            }
            
            // Update global active sessions
            const oldActiveSessions = window.activeSessions || [];
            window.activeSessions = activeSessionsData || [];
            
            // Check if any cells need updating
            const hasChanges = JSON.stringify(oldActiveSessions) !== JSON.stringify(window.activeSessions);
            
            if (hasChanges) {
                // Detect which active sessions disappeared (completed variants)
                const oldSessionKeys = new Set(oldActiveSessions.map(s => `${s.user_id}_${s.operation}_${s.variant}`));
                const newSessionKeys = new Set(activeSessionsData.map(s => `${s.user_id}_${s.operation}_${s.variant}`));
                
                // Find sessions that disappeared (were in old, not in new)
                const disappearedSessions = oldActiveSessions.filter(s => {
                    const key = `${s.user_id}_${s.operation}_${s.variant}`;
                    return !newSessionKeys.has(key);
                });
                
                // If any sessions disappeared, refresh scores for those students
                if (disappearedSessions.length > 0) {
                    const userIdsToRefresh = [...new Set(disappearedSessions.map(s => s.user_id))];
                    console.log(`🔄 Active sessions disappeared for ${userIdsToRefresh.length} student(s), refreshing scores...`);
                    await refreshScoresForStudents(userIdsToRefresh);
                }
                
                // Update all cells (will show green/red for completed variants)
                updateActiveSessionCells();
            }
        } catch (error) {
            console.error('❌ Error in active sessions polling:', error);
        }
    }, 5000); // 5 seconds
}

// Refresh scores for specific students
// CALLED BY: teacher-dashboard.js - startActiveSessionsPolling() (when active sessions disappear)
async function refreshScoresForStudents(userIds) {
    if (window.debugLog) window.debugLog('refreshScoresForStudents', `(${userIds.length} students)`);
    if (!supabase || userIds.length === 0) return;
    
    try {
        // Fetch latest scores for these students
        const { data: scoresData, error: scoresError } = await supabase
            .from('user_scores')
            .select('*')
            .in('user_id', userIds);
        
        if (scoresError) {
            console.warn('⚠️ Error refreshing scores:', scoresError);
            return;
        }
        
        // Update studentScores array: remove old scores for these students, add new ones
        const newScores = scoresData || [];
        studentScores = studentScores.filter(s => !userIds.includes(s.user_id));
        studentScores.push(...newScores);
        
        console.log(`✅ Refreshed scores for ${userIds.length} student(s), found ${newScores.length} new score records`);
    } catch (error) {
        console.error('❌ Error refreshing scores:', error);
    }
}

// Update only cells that have active sessions (efficient DOM update)
// CALLED BY: teacher-dashboard.js - startActiveSessionsPolling() (when active sessions change)
function updateActiveSessionCells() {
    if (window.debugLog) window.debugLog('updateActiveSessionCells');
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) return;
    
    const rows = tableBody.querySelectorAll('tr');
    const activeSessions = window.activeSessions || [];
    
    rows.forEach((row, rowIndex) => {
        if (rowIndex >= students.length) return;
        const student = students[rowIndex];
        
        // Get variant cells (skip first FIXED_COLUMNS_COUNT fixed columns: Student, Class, Roll No., User Code, Date of Birth)
        const cells = row.querySelectorAll('td');
        allVariants.forEach(({ operation, variant }, variantIndex) => {
            const cellIndex = FIXED_COLUMNS_COUNT + variantIndex; // Skip fixed columns before variant columns
            const cell = cells[cellIndex];
            if (!cell) return;
            
            const status = getVariantStatus(student.user_id, operation, variant);
            
            // Update cell content and class (preserve variant-column class)
            const baseClass = 'variant-column';
            
            // Skip if column is hidden
            if (shouldHideVariant(operation, variant)) {
                return;
            }
            if (status && typeof status === 'object' && status.type === 'active') {
                cell.textContent = status.questionNo || '0';
                cell.className = baseClass + ' ' + (status.isCorrect === true ? 'status-active-correct' : 
                                 status.isCorrect === false ? 'status-active-wrong' : 
                                 'status-active-unknown');
            } else if (status && typeof status === 'object' && status.type === 'pass') {
                // Display minimum average_time for passed variants
                if (status.minTime != null) {
                    cell.textContent = `${status.minTime.toFixed(1)}s`;
                } else {
                    cell.textContent = '✓';
                }
                cell.className = baseClass + ' status-pass';
            } else if (status && typeof status === 'object' && status.type === 'fail') {
                // Display attempt count for failed variants
                const count = status.attemptCount || 0;
                cell.textContent = count > 0 ? `${count}` : '✗';
                cell.className = baseClass + ' status-fail';
            } else {
                cell.textContent = '';
                cell.className = baseClass + ' status-empty';
            }
            
            // Ensure dataset attributes are set (operation and variant already declared in forEach)
            cell.dataset.operation = operation;
            cell.dataset.variant = variant;
            
            // Update visibility based on collapse state
            if (shouldHideVariant(operation, variant)) {
                cell.classList.add('hidden-column');
            } else {
                cell.classList.remove('hidden-column');
            }
        });
    });
}

// Toggle operation group collapse/expand
// CALLED BY: teacher-dashboard.html - toggle buttons onclick
function toggleOperation(opNum) {
    if (window.debugLog) window.debugLog('toggleOperation', `(${opNum})`);
    // Toggle collapse state
    collapsedOperations[opNum] = !collapsedOperations[opNum];
    
    // Update button text and icon
    const button = document.querySelector(`.btn-toggle[data-operation="${opNum}"]`);
    if (button) {
        button.textContent = collapsedOperations[opNum] ? `▶ ${opNum}` : `▼ ${opNum}`;
    }
    
    // Update column visibility
    updateColumnVisibility();
}

// Update column visibility based on collapse state
// CALLED BY: teacher-dashboard.js - toggleOperation() (when button is clicked)
function updateColumnVisibility() {
    if (window.debugLog) window.debugLog('updateColumnVisibility');
    const tableHead = document.getElementById('tableHead');
    const tableBody = document.getElementById('tableBody');
    
    if (!tableHead || !tableBody) return;
    
    // Update header cells
    const headerCells = tableHead.querySelectorAll('th.variant-column');
    headerCells.forEach(th => {
        const operation = th.dataset.operation;
        const variant = th.dataset.variant;
        if (shouldHideVariant(operation, variant)) {
            th.classList.add('hidden-column');
        } else {
            th.classList.remove('hidden-column');
        }
    });
    
    // Update data cells
    const dataRows = tableBody.querySelectorAll('tr');
    dataRows.forEach(row => {
        const cells = row.querySelectorAll('td.variant-column');
        cells.forEach(cell => {
            const operation = cell.dataset.operation;
            const variant = cell.dataset.variant;
            if (shouldHideVariant(operation, variant)) {
                cell.classList.add('hidden-column');
            } else {
                cell.classList.remove('hidden-column');
            }
        });
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
    
    // Set up student dashboard button event listener
    const studentDashboardBtn = document.getElementById('studentDashboardBtn');
    if (studentDashboardBtn) {
        studentDashboardBtn.addEventListener('click', () => {
            window.location.href = 'student-dashboard.html';
        });
    }
    
    // Set up logout button event listener
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});