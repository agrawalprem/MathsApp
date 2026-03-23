// ============================================================================
// TEACHER DASHBOARD - JavaScript Logic
// ============================================================================
// NOTE: Firebase Auth and Firestore are initialized in teacher-dashboard.html
// Use window.currentUser and window.currentUserProfile set by teacher-dashboard.html

// Teacher dashboard specific data
let teacherProfile = null;
let students = [];
let studentScores = [];
let allVariants = [];
let currentUserRole = null; // 'Teacher', 'Principal', or 'Administrator'
let availableSchools = []; // Schools user can access
let availableClasses = []; // Classes user can access
let selectedSchoolId = null; // Currently selected school

// Fixed columns: 5 student info + 4 activity debug (last/current variant + status) before variant columns
const STUDENT_INFO_COLUMN_COUNT = 5;
const DEBUG_ACTIVITY_COLUMN_COUNT = 4;
const FIXED_COLUMNS_COUNT = STUDENT_INFO_COLUMN_COUNT + DEBUG_ACTIVITY_COLUMN_COUNT;
const VARIANT_COLUMN_START_INDEX = FIXED_COLUMNS_COUNT;
const FIXED_COLUMN_WIDTHS = [
    150, // Student
    60,  // Class
    70,  // Roll No.
    90,  // User Code
    95,  // Date of Birth
    56,  // Last active variant
    52,  // Last status
    56,  // Current active variant
    52   // Current status
];

/** Prior "current" snapshot per student (end of last poll); used for shift-register + targeted score refresh */
let teacherPriorCurrentByUserId = new Map();
let selectedClass = null; // Currently selected class
let selectedSection = null; // Currently selected section
let stickyColumnsResizeHandlerBound = false;
let activeVariantFilter = null; // { operation, variant } or null

// Learning sequence for column ordering
const learningSequence = {
    addition: ['1A0', '1A1', '1A2', '1A3', '1A', '1B', '1C', '1DS', '1D', '1ES', '1E', '1', '1M1', '1M2'],
    subtraction: ['2A', '2B', '2C', '2D', '2', '2M1', '2M2', '2M3'],
    multiplication: ['3A0', '3A1', '3A2S', '3A2', '3A3S', '3A3', '3A', '3B4S', '3B4', '3B5S', '3B5', '3B6S', '3B6', '3B', '3C7S', '3C7', '3C8S', '3C8', '3C9S', '3C9', '3C', '3', '3M1', '3M2'],
    division: ['4A1', '4A2', '4A3', '4A', '4B4', '4B5', '4B6', '4B', '4C7', '4C8', '4C9', '4C', '4', '4M1', '4M2']
};

// Collapse state for operation groups (false = expanded/visible, true = collapsed/hidden)
let collapsedOperations = {
    '1': false,  // Operation 1 (Addition): hide 1A0–1E early drills
    '2': false,  // Operation 2 (Subtraction): hide 2A-2D
    '3': false,  // Operation 3 (Multiplication): hide 3A0-3C
    '4': false   // Operation 4 (Division): hide 4A1-4C9
};

// Identify user role based on email matching schools table in Firestore
// CALLED BY: teacher-dashboard.js - loadTeacherDashboard() (identifies if user is Teacher/Principal/Administrator)
async function identifyUserRole(profileData) {
    if (window.debugLog) window.debugLog('identifyUserRole');
    
    const userEmail = (currentUser.email || '').toLowerCase().trim();
    
    if (!userEmail) {
        return 'Teacher'; // Default to Teacher if no email
    }
    
    try {
        const { collection, getDocs } = await import("https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js");
        
        // Fetch all schools from Firestore
        const schoolsRef = collection(window.firebaseDb, 'schools');
        const schoolsSnapshot = await getDocs(schoolsRef);
        
        // Check if user email matches administrator_email or principal_email in schools
        // Priority: Administrator > Principal > Teacher
        let foundRole = 'Teacher'; // Default
        
        schoolsSnapshot.forEach((doc) => {
            const school = doc.data();
            const adminEmail = (school.administrator_email || '').toLowerCase().trim();
            const principalEmail = (school.principal_email || '').toLowerCase().trim();
            
            if (adminEmail && userEmail === adminEmail) {
                foundRole = 'Administrator';
                return; // Exit forEach early if Administrator found
            }
            if (principalEmail && userEmail === principalEmail && foundRole !== 'Administrator') {
                foundRole = 'Principal';
                // Continue checking in case Administrator is found later
            }
        });
        
        return foundRole;
    } catch (error) {
        console.error('❌ Error identifying user role:', error);
        // Default to Teacher on error
        return 'Teacher';
    }
}


// Render school and class selector dropdowns
// CALLED BY: teacher-dashboard.js - loadTeacherDashboard() (creates dropdown UI)
function renderSchoolClassSelectors() {
    if (window.debugLog) window.debugLog('renderSchoolClassSelectors');
    
    const selectorContainer = document.getElementById('schoolClassSelectors');
    if (!selectorContainer) return;
    
    selectorContainer.innerHTML = '';
    
    // Always show school selector (even if only one school)
    // Show class selector if school is selected and classes are available
    const showSchoolSelector = availableSchools.length > 0;
    const showClassSelector = selectedSchoolId && availableClasses.length > 0;
    
    if (!showSchoolSelector) {
        selectorContainer.classList.add('hidden');
        return;
    }
    
    selectorContainer.classList.remove('hidden');
    
    // Create school selector (always show if schools available)
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
    
    // Create class selector (show if school is selected and classes available)
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
            // Ensure class and section are strings for consistent handling
            const classStr = String(cls.class || '');
            const sectionStr = String(cls.section || '');
            const value = `${cls.school_id}_${classStr}_${sectionStr}`;
            option.value = value;
            option.textContent = `Class ${classStr}${sectionStr}`;
            // Compare as strings to ensure type matching
            if (selectedSchoolId === cls.school_id && 
                String(selectedClass) === classStr && 
                String(selectedSection) === sectionStr) {
                option.selected = true;
            }
            classSelect.appendChild(option);
        });
        
        classSelect.addEventListener('change', async (e) => {
            const [schoolId, classNum, section] = e.target.value.split('_');
            // Convert classNum to string to match Firestore (class can be number or string)
            await onClassChange(parseInt(schoolId), String(classNum), String(section));
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

// Check authentication on page load
// CALLED BY: teacher-dashboard.html - Firebase auth state change (initializes dashboard when user is authenticated)
async function initDashboard() {
    if (window.debugLog) window.debugLog('initDashboard');
    
    // Wait for Firebase to be initialized (set by teacher-dashboard.html)
    if (!window.firebaseAuth || !window.firebaseDb) {
        // Wait for Firebase to be ready
        let attempts = 0;
        while ((!window.firebaseAuth || !window.firebaseDb) && attempts < 20) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        if (!window.firebaseAuth || !window.firebaseDb) {
            throw new Error('Firebase not initialized');
        }
    }
    
    // currentUser and currentUserProfile should be set by teacher-dashboard.html
    if (window.currentUser && window.currentUserProfile) {
        currentUser = window.currentUser;
        teacherProfile = window.currentUserProfile;
        await loadTeacherDashboard();
    } else {
        console.warn('⚠️ No current user or profile found');
        window.location.href = 'index.html';
    }
}

// Expose initDashboard globally so it can be called from teacher-dashboard.html
window.initDashboard = initDashboard;

// Load teacher dashboard data
// CALLED BY: teacher-dashboard.js - initDashboard() (loads dashboard data after authentication check)
async function loadTeacherDashboard() {
    if (window.debugLog) window.debugLog('loadTeacherDashboard');
    try {
        showLoading(true);
        showError('');

        // teacherProfile is already set from window.currentUserProfile
        const profileData = teacherProfile;
        
        if (!profileData) {
            throw new Error('User profile not found. Please ensure you are logged in.');
        }

        // Identify user role (Teacher, Principal, or Administrator)
        currentUserRole = await identifyUserRole(profileData);
        
        console.log(`✅ ${currentUserRole} profile loaded`);

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
            headerTitle.textContent = `${currentUserRole} Dashboard - Student Progress`;
        }
        
        // Update page title
        document.title = `${currentUserRole} Dashboard - Student Progress`;

        // Fetch available schools based on user role
        availableSchools = await fetchAvailableSchools(profileData, currentUserRole);
        
        if (availableSchools.length === 0) {
            showError('No schools assigned. Please contact administrator.');
            showLoading(false);
            return;
        }
        
        // Always show school selector (even if only one school)
        // If only one school, auto-select it but still show the selector
        if (availableSchools.length === 1) {
            selectedSchoolId = availableSchools[0].school_id;
            availableClasses = await fetchAvailableClasses(selectedSchoolId, profileData, currentUserRole);
        } else {
            // Multiple schools - wait for user to select
            availableClasses = [];
        }
        
        // Render school and class selectors (always show both)
        renderSchoolClassSelectors();
        
        // If school is selected and classes are available
        if (selectedSchoolId && availableClasses.length > 0) {
            // If only one class, auto-select it
            if (availableClasses.length === 1) {
                const cls = availableClasses[0];
                await onClassChange(cls.school_id, cls.class, cls.section);
            } else {
                // Multiple classes - show selector and wait for selection
                showLoading(false);
            }
        } else if (selectedSchoolId && availableClasses.length === 0) {
            // School selected but no classes found
            showLoading(false);
        } else {
            // No school selected yet - wait for selection
            showLoading(false);
        }

    } catch (error) {
        console.error('❌ Error loading dashboard:', error);
        showError(error.message);
        showLoading(false);
    }
}

// Fetch available schools from Firestore based on user role
async function resolveSchoolNameFromClasses(schoolId) {
    if (!schoolId && schoolId !== 0) return null;
    try {
        const { collection, query, where, getDocs, limit } = await import("https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js");
        const classesRef = collection(window.firebaseDb, 'classes');

        // Try with both number and string types because Firestore is type-sensitive.
        const schoolIdNum = Number(schoolId);
        const tried = new Set();
        const candidates = [];
        if (!Number.isNaN(schoolIdNum)) candidates.push(schoolIdNum);
        candidates.push(String(schoolId));

        for (const candidate of candidates) {
            const key = `${typeof candidate}:${String(candidate)}`;
            if (tried.has(key)) continue;
            tried.add(key);

            const q = query(classesRef, where('school_id', '==', candidate), limit(1));
            const snap = await getDocs(q);
            if (!snap.empty) {
                const classDoc = snap.docs[0].data() || {};
                if (classDoc.school_name) {
                    return String(classDoc.school_name);
                }
            }
        }
    } catch (error) {
        console.warn('⚠️ Could not resolve school name from classes:', error?.message || error);
    }
    return null;
}

async function fetchAvailableSchools(profileData, userRole) {
    if (window.debugLog) window.debugLog('fetchAvailableSchools', `(userRole=${userRole})`);
    
    try {
        const { collection, query, where, getDocs } = await import("https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js");
        const userEmail = (currentUser.email || '').toLowerCase().trim();
        const schools = [];
        
        if (userRole === 'Teacher') {
            // For teachers: get school from their profile
            if (profileData.school_id) {
                const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js");
                let schoolName = null;
                
                // Try multiple approaches to find the school document
                // 1. Try school_id as document ID (string)
                let schoolDocRef = doc(window.firebaseDb, 'schools', String(profileData.school_id));
                let schoolDoc = await getDoc(schoolDocRef);
                if (schoolDoc.exists()) {
                    const data = schoolDoc.data();
                    schoolName = data.school_name;
                }
                
                // 2. Try school_id as document ID (number, if stored as number)
                if (!schoolName && !isNaN(profileData.school_id)) {
                    schoolDocRef = doc(window.firebaseDb, 'schools', String(Number(profileData.school_id)));
                    schoolDoc = await getDoc(schoolDocRef);
                    if (schoolDoc.exists()) {
                        const data = schoolDoc.data();
                        schoolName = data.school_name;
                    }
                }
                
                // 3. Try querying by school_id field (handle both string and number)
                if (!schoolName) {
                    const schoolsRef = collection(window.firebaseDb, 'schools');
                    // Try as string
                    let schoolQuery = query(schoolsRef, where('school_id', '==', String(profileData.school_id)));
                    let schoolSnapshot = await getDocs(schoolQuery);
                    if (!schoolSnapshot.empty) {
                        schoolSnapshot.forEach((doc) => {
                            const data = doc.data();
                            if (data.school_name) {
                                schoolName = data.school_name;
                            }
                        });
                    }
                    
                    // Try as number if school_id is numeric
                    if (!schoolName && !isNaN(profileData.school_id)) {
                        schoolQuery = query(schoolsRef, where('school_id', '==', Number(profileData.school_id)));
                        schoolSnapshot = await getDocs(schoolQuery);
                        if (!schoolSnapshot.empty) {
                            schoolSnapshot.forEach((doc) => {
                                const data = doc.data();
                                if (data.school_name) {
                                    schoolName = data.school_name;
                                }
                            });
                        }
                    }
                }
                
                schools.push({
                    school_id: profileData.school_id,
                    school_name: schoolName || `School ${profileData.school_id}`
                });
            }
        } else if (userRole === 'Principal') {
            // For principals: get schools where principal_email matches
            const schoolsRef = collection(window.firebaseDb, 'schools');
            const schoolsSnapshot = await getDocs(schoolsRef);
            
            schoolsSnapshot.forEach((doc) => {
                const data = doc.data();
                const principalEmail = (data.principal_email || '').toLowerCase().trim();
                if (principalEmail && userEmail === principalEmail) {
                    schools.push({
                        school_id: data.school_id,
                        school_name: data.school_name || `School ${data.school_id}`
                    });
                }
            });
        } else if (userRole === 'Administrator') {
            // For administrators: get schools where administrator_email matches
            // (In future, could return all schools if admin has access to all)
            const schoolsRef = collection(window.firebaseDb, 'schools');
            const schoolsSnapshot = await getDocs(schoolsRef);
            
            schoolsSnapshot.forEach((doc) => {
                const data = doc.data();
                const adminEmail = (data.administrator_email || '').toLowerCase().trim();
                if (adminEmail && userEmail === adminEmail) {
                    schools.push({
                        school_id: data.school_id,
                        school_name: data.school_name || `School ${data.school_id}`
                    });
                }
            });
        }
        
        // Fill missing names using classes collection fallback.
        for (const school of schools) {
            const hasRealName = school.school_name && !String(school.school_name).startsWith('School ');
            if (!hasRealName) {
                const fallbackName = await resolveSchoolNameFromClasses(school.school_id);
                if (fallbackName) {
                    school.school_name = fallbackName;
                }
            }
        }

        // Sort by school_id
        schools.sort((a, b) => {
            return String(a.school_id).localeCompare(String(b.school_id), undefined, { numeric: true });
        });
        
        return schools;
    } catch (error) {
        console.error('❌ Error fetching schools:', error);
        return [];
    }
}

// Fetch available classes from Firestore for a school
async function fetchAvailableClasses(schoolId, profileData, userRole) {
    if (window.debugLog) window.debugLog('fetchAvailableClasses', `(schoolId=${schoolId})`);
    
    if (!schoolId) return [];
    
    try {
        const { collection, query, where, getDocs } = await import("https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js");
        
        // Get unique class/section combinations from students in this school
        const profilesRef = collection(window.firebaseDb, 'user_profiles');
        const studentsQuery = query(profilesRef, 
            where('user_type', '==', 'Student'),
            where('school_id', '==', schoolId)
        );
        const studentsSnapshot = await getDocs(studentsQuery);
        
        const classMap = new Map();
        studentsSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.class != null && data.section != null) {
                // Ensure class and section are strings for consistent handling
                const classStr = String(data.class);
                const sectionStr = String(data.section);
                const key = `${classStr}_${sectionStr}`;
                if (!classMap.has(key)) {
                    classMap.set(key, {
                        school_id: schoolId,
                        class: classStr,
                        section: sectionStr
                    });
                }
            }
        });
        
        const classes = Array.from(classMap.values());
        // Sort by class then section
        classes.sort((a, b) => {
            if (a.class !== b.class) {
                return String(a.class).localeCompare(String(b.class), undefined, { numeric: true });
            }
            return String(a.section).localeCompare(String(b.section));
        });
        
        return classes;
    } catch (error) {
        console.error('❌ Error fetching classes:', error);
        return [];
    }
}

// Load students for selected class
async function loadStudentsForClass(schoolId, classNum, section) {
    if (window.debugLog) window.debugLog('loadStudentsForClass', `(schoolId=${schoolId}, class=${classNum}, section=${section})`);
    
    try {
        showLoading(true);
        showError('');
        
        const { collection, query, where, getDocs } = await import("https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js");
        
        // Fetch students from this school, class, and section
        // Firestore stores: school_id as number, class as number, section as string
        const sectionStr = String(section);
        const schoolIdNum = Number(schoolId);
        const classNumValue = Number(classNum);
        
        const profilesRef = collection(window.firebaseDb, 'user_profiles');
        
        // Query with number types (matching how data is stored in Firestore)
        const q = query(profilesRef, 
            where('user_type', '==', 'Student'),
            where('school_id', '==', schoolIdNum),
            where('class', '==', classNumValue),
            where('section', '==', sectionStr)
        );
        const querySnapshot = await getDocs(q);
        
        students = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Store both user_code (document ID) and user_id (Firebase Auth UID) for matching
            students.push({ 
                user_code: doc.id,  // Document ID is user_code
                user_id: data.user_id || null,  // Firebase Auth UID from profile
                ...data 
            });
        });
        
        // Sort students by roll number or name
        students.sort((a, b) => {
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
        
        console.log(`✅ Found ${students.length} students in School ${schoolId}, Class ${classNum}${section}`);
        
        if (students.length === 0) {
            showError(`No students found in Class ${classNum}${section}.`);
            showLoading(false);
            document.getElementById('dashboardControls').classList.add('hidden');
            document.getElementById('dashboardGrid').classList.add('hidden');
            return;
        }
        
        // Fetch scores for all students
        // Use denormalized fields (school_id, class, section) for efficient querying
        // This is more reliable than matching by email
        // Note: user_scores may store these as strings (from summary.html), so try both
        const scoresRef = collection(window.firebaseDb, 'user_scores');
        
        // First try with number types (matching user_profiles)
        let scoresQuery = query(scoresRef, 
            where('school_id', '==', schoolIdNum),
            where('class', '==', classNumValue),
            where('section', '==', sectionStr)
        );
        let scoresSnapshot = await getDocs(scoresQuery);
        
        // If no results, try with string types (in case user_scores stores as strings)
        if (scoresSnapshot.empty) {
            const schoolIdStr = String(schoolId);
            const classStr = String(classNum);
            scoresQuery = query(scoresRef, 
                where('school_id', '==', schoolIdStr),
                where('class', '==', classStr),
                where('section', '==', sectionStr)
            );
            scoresSnapshot = await getDocs(scoresQuery);
        }
        
        // Build map of user_id -> student for quick lookup
        const studentMap = new Map();
        students.forEach(student => {
            if (student.user_id) {
                studentMap.set(student.user_id, student);
            }
        });
        
        studentScores = [];
        scoresSnapshot.forEach((doc) => {
            const scoreData = doc.data();

            // Match by user_code first (primary identifier).
            // IMPORTANT: Normalize types because Firestore may store user_code as string or number.
            const scoreUserCode = (scoreData.user_code === null || scoreData.user_code === undefined)
                ? null
                : String(scoreData.user_code).trim();

            const studentByCode = scoreUserCode
                ? students.find(s => String(s.user_code || '').trim() === scoreUserCode)
                : null;

            if (studentByCode) {
                studentScores.push({
                    id: doc.id,
                    ...scoreData,
                    user_id: studentByCode.user_id || studentByCode.user_code
                });
            } else {
                // Fallback: try matching by user_id (Firebase Auth UID) if user_code doesn't match
                const student = scoreData.user_id ? studentMap.get(scoreData.user_id) : null;
                if (student) {
                    studentScores.push({
                        id: doc.id,
                        ...scoreData,
                        user_id: student.user_id
                    });
                }
            }
        });
        
        console.log(`✅ Found ${studentScores.length} score records`);

        teacherPriorCurrentByUserId.clear();
        await fetchActiveSessionsForCurrentStudents();
        
        // Build and display the grid
        buildDashboardGrid();
        
        // studentCount is updated by buildDashboardGrid() to support filter mode.
        document.getElementById('variantCount').textContent = allVariants.length;
        
        showLoading(false);
        document.getElementById('dashboardControls').classList.remove('hidden');
        document.getElementById('dashboardGrid').classList.remove('hidden');
        
        // Start polling for active sessions
        startActiveSessionsPolling();
        
    } catch (error) {
        console.error('❌ Error loading students:', error);
        showError(error.message);
        showLoading(false);
    }
}

// Simplified function to load all students for a school
async function loadAllStudentsForSchool(schoolId) {
    try {
        showLoading(true);
        
        // Import Firestore functions
        const { collection, query, where, getDocs } = await import("https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js");
        
        // Fetch all students from this school
        const profilesRef = collection(window.firebaseDb, 'user_profiles');
        const q = query(profilesRef, 
            where('user_type', '==', 'Student'),
            where('school_id', '==', schoolId)
        );
        const querySnapshot = await getDocs(q);
        
        students = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Store both user_code (document ID) and user_id (Firebase Auth UID) for matching
            students.push({ 
                user_code: doc.id,  // Document ID is user_code
                user_id: data.user_id || null,  // Firebase Auth UID from profile
                ...data 
            });
        });
        
        // Sort students by roll number or name
        students.sort((a, b) => {
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
        
        console.log(`✅ Found ${students.length} students in School ${schoolId}`);
        
        if (students.length === 0) {
            showError(`No students found in your school.`);
            showLoading(false);
            document.getElementById('dashboardControls').classList.add('hidden');
            document.getElementById('dashboardGrid').classList.add('hidden');
            return;
        }
        
        // Fetch scores for all students
        // Use denormalized fields (school_id) for efficient querying
        // This is more reliable than matching by email
        const scoresRef = collection(window.firebaseDb, 'user_scores');
        
        // Try both string and number for school_id (must match how it's stored in user_scores)
        let scoresQuery = query(scoresRef, where('school_id', '==', schoolIdStr));
        let scoresSnapshot = await getDocs(scoresQuery);
        
        // If no results and schoolId can be converted to number, try with number
        if (scoresSnapshot.empty && !isNaN(schoolIdNum)) {
            scoresQuery = query(scoresRef, where('school_id', '==', schoolIdNum));
            scoresSnapshot = await getDocs(scoresQuery);
        }
        
        // Build map of user_id -> student for quick lookup
        const studentMap = new Map();
        students.forEach(student => {
            if (student.user_id) {
                studentMap.set(student.user_id, student);
            }
        });
        
        studentScores = [];
        scoresSnapshot.forEach((doc) => {
            const scoreData = doc.data();
            // Match by user_code first (primary identifier - visually meaningful, easier to debug)
            const studentByCode = scoreData.user_code ? students.find(s => s.user_code === scoreData.user_code) : null;
            if (studentByCode) {
                studentScores.push({ 
                    id: doc.id, 
                    ...scoreData,
                    user_id: studentByCode.user_id || studentByCode.user_code
                });
            } else {
                // Fallback: try matching by user_id (Firebase Auth UID) if user_code doesn't match
                const student = scoreData.user_id ? studentMap.get(scoreData.user_id) : null;
                if (student) {
                    studentScores.push({ 
                        id: doc.id, 
                        ...scoreData,
                        user_id: student.user_id
                    });
                }
            }
        });
        
        console.log(`✅ Found ${studentScores.length} score records`);

        teacherPriorCurrentByUserId.clear();
        await fetchActiveSessionsForCurrentStudents();
        
        // Build and display the grid
        buildDashboardGrid();
        
        // studentCount is updated by buildDashboardGrid() to support filter mode.
        document.getElementById('variantCount').textContent = allVariants.length;
        
        showLoading(false);
        document.getElementById('dashboardControls').classList.remove('hidden');
        document.getElementById('dashboardGrid').classList.remove('hidden');

        startActiveSessionsPolling();
        
    } catch (error) {
        console.error('❌ Error loading students:', error);
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
        return ['1A0', '1A1', '1A2', '1A3', '1A', '1B', '1C', '1DS', '1D', '1ES', '1E'].includes(variant);
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
    const gridWrapper = document.querySelector('#dashboardGrid .grid-wrapper');
    const prevScrollLeft = gridWrapper ? gridWrapper.scrollLeft : 0;
    const prevScrollTop = gridWrapper ? gridWrapper.scrollTop : 0;

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

    const debugHeaders = ['Last var', 'Last Δ', 'Curr var', 'Curr Δ'];
    debugHeaders.forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        th.className = 'fixed-column debug-column';
        th.title = 'Activity debug (toggle with toolbar). Last Δ / Curr Δ match yellow active cell (question no.).';
        headerRow.appendChild(th);
    });

    // Add variant columns
    allVariants.forEach(({ operation, variant }) => {
        const th = document.createElement('th');
        th.textContent = variant;
        th.title = `${operation} - ${variant}\nClick to show only Active/Fail students for this variant. Click again to show all students.`;
        th.className = 'variant-column';
        th.dataset.operation = operation;
        th.dataset.variant = variant;
        th.classList.add('variant-filterable');
        if (activeVariantFilter &&
            activeVariantFilter.operation === operation &&
            activeVariantFilter.variant === variant) {
            th.classList.add('variant-filter-active');
        }
        // Prevent focus-scroll jumps when clicking header cells in a horizontally scrolled grid.
        th.addEventListener('mousedown', (e) => e.preventDefault());
        th.addEventListener('click', (e) => {
            e.preventDefault();
            toggleVariantStudentFilter(operation, variant);
        });
        if (shouldHideVariant(operation, variant)) {
            th.classList.add('hidden-column');
        }
        headerRow.appendChild(th);
    });

    tableHead.appendChild(headerRow);

    // Optional variant filter: only students with Active/Fail status for selected variant.
    const displayedStudents = activeVariantFilter
        ? students.filter((student) =>
            shouldIncludeStudentForVariantFilter(student, activeVariantFilter.operation, activeVariantFilter.variant))
        : students;

    // Build data rows
    displayedStudents.forEach(student => {
        const row = document.createElement('tr');
        if (student.user_id != null && student.user_id !== '') {
            row.setAttribute('data-user-id', String(student.user_id));
        }
        
        // Student info columns
        const nameCell = document.createElement('td');
        nameCell.textContent = `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.user_code || 'N/A';
        nameCell.className = 'fixed-column';
        row.appendChild(nameCell);

        const classCell = document.createElement('td');
        // Combine class and section (e.g., "5A") - ensure both are strings
        const classStr = String(student.class || '');
        const sectionStr = String(student.section || '');
        const classSection = classStr + sectionStr;
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
        // Format date of birth for display - handle Firestore Timestamp, Date object, or string
        if (student.date_of_birth) {
            let dob;
            // Check if it's a Firestore Timestamp
            if (student.date_of_birth.toDate && typeof student.date_of_birth.toDate === 'function') {
                dob = student.date_of_birth.toDate();
            } else if (student.date_of_birth instanceof Date) {
                dob = student.date_of_birth;
            } else if (typeof student.date_of_birth === 'string') {
                dob = new Date(student.date_of_birth);
            } else if (student.date_of_birth.seconds) {
                // Firestore Timestamp with seconds property
                dob = new Date(student.date_of_birth.seconds * 1000);
            } else {
                dob = new Date(student.date_of_birth);
            }
            
            // Check if date is valid
            if (!isNaN(dob.getTime())) {
                // Format as DD/MM/YYYY
                const day = String(dob.getDate()).padStart(2, '0');
                const month = String(dob.getMonth() + 1).padStart(2, '0');
                const year = dob.getFullYear();
                dobCell.textContent = `${day}/${month}/${year}`;
            } else {
                dobCell.textContent = 'N/A';
            }
        } else {
            dobCell.textContent = 'N/A';
        }
        dobCell.className = 'fixed-column';
        row.appendChild(dobCell);

        for (let d = 0; d < DEBUG_ACTIVITY_COLUMN_COUNT; d++) {
            const dbg = document.createElement('td');
            dbg.className = 'fixed-column debug-column';
            dbg.textContent = '—';
            row.appendChild(dbg);
        }

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

    if (displayedStudents.length === 0) {
        const emptyRow = document.createElement('tr');
        const emptyCell = document.createElement('td');
        emptyCell.colSpan = FIXED_COLUMNS_COUNT + allVariants.length;
        emptyCell.className = 'status-empty';
        emptyCell.style.textAlign = 'left';
        emptyCell.style.padding = '10px';
        emptyCell.textContent = activeVariantFilter
            ? `No students are Active/Fail for ${activeVariantFilter.variant}. Click the highlighted header again to show all students.`
            : 'No students found.';
        emptyRow.appendChild(emptyCell);
        tableBody.appendChild(emptyRow);
    }

    const studentCountEl = document.getElementById('studentCount');
    if (studentCountEl) {
        studentCountEl.textContent = activeVariantFilter
            ? `${displayedStudents.length}/${students.length}`
            : `${students.length}`;
    }

    // Compute and apply sticky offsets so fixed columns do not overlap while scrolling.
    applyStickyFixedColumnLayout();

    // Restore scroll position after re-render to avoid horizontal "random shift" effect.
    if (gridWrapper) {
        window.requestAnimationFrame(() => {
            gridWrapper.scrollLeft = prevScrollLeft;
            gridWrapper.scrollTop = prevScrollTop;
        });
    }
}

function shouldIncludeStudentForVariantFilter(student, operation, variant) {
    const status = getVariantStatus(student?.user_id, operation, variant);
    if (!status || typeof status !== 'object') return false;
    return status.type === 'active' || status.type === 'fail';
}

function toggleVariantStudentFilter(operation, variant) {
    if (activeVariantFilter &&
        activeVariantFilter.operation === operation &&
        activeVariantFilter.variant === variant) {
        activeVariantFilter = null;
    } else {
        activeVariantFilter = { operation, variant };
    }
    buildDashboardGrid();
    runActiveSessionsPollTick();
}

function applyStickyFixedColumnLayout() {
    const table = document.getElementById('progressTable');
    if (!table || !table.tHead || !table.tHead.rows || !table.tHead.rows[0]) return;

    const headerRow = table.tHead.rows[0];
    const debugHidden = table.classList.contains('hide-debug-activity-columns');
    const fixedCount = Math.min(
        debugHidden ? STUDENT_INFO_COLUMN_COUNT : FIXED_COLUMNS_COUNT,
        headerRow.cells.length
    );
    if (fixedCount <= 0) return;

    // Clear previous inline sizing/offsets before measuring.
    Array.from(table.rows).forEach((row) => {
        for (let i = 0; i < fixedCount; i++) {
            const cell = row.cells[i];
            if (!cell) continue;
            cell.style.left = '';
            cell.style.minWidth = '';
            cell.style.width = '';
            cell.style.maxWidth = '';
        }
    });

    const widths = [];
    const leftOffsets = [];
    let runningLeft = 0;

    for (let i = 0; i < fixedCount; i++) {
        const width = FIXED_COLUMN_WIDTHS[i] || 100;
        widths.push(width);
        leftOffsets.push(runningLeft);
        runningLeft += width;
    }

    // Apply to every row cell (thead + tbody) for the fixed columns.
    Array.from(table.rows).forEach((row) => {
        for (let i = 0; i < fixedCount; i++) {
            const cell = row.cells[i];
            if (!cell) continue;

            cell.style.left = `${leftOffsets[i]}px`;
            cell.style.minWidth = `${widths[i]}px`;
            cell.style.width = `${widths[i]}px`;
            cell.style.maxWidth = `${widths[i]}px`;

            // Keep headers above body sticky cells.
            if (cell.tagName === 'TH') {
                cell.style.zIndex = String(140 - i);
            } else {
                cell.style.zIndex = String(20 - i);
            }
        }
    });

    // Recalculate on resize once per page load.
    if (!stickyColumnsResizeHandlerBound) {
        window.addEventListener('resize', () => {
            window.requestAnimationFrame(() => applyStickyFixedColumnLayout());
        });
        stickyColumnsResizeHandlerBound = true;
    }
}

// Get pass/fail status for a variant (or active session info)
// CALLED BY: teacher-dashboard.js - buildDashboardGrid() (gets status for each variant cell in the table)
function getVariantStatus(userId, operation, variant) {
    if (window.debugLog) window.debugLog('getVariantStatus', `(${operation}, ${variant})`);
    
    try {
        // FIRST: Check for active session - active sessions take priority over completed scores
        // because they show what the student is currently working on
        const activeSessions = window.activeSessions || [];
        // Normalize user_id to string for comparison (Firestore stores as string from Firebase Auth UID)
        const activeSession = activeSessions.find(s => 
            s && 
            String(s.user_id || '') === String(userId || '') && 
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
        
        const uid = String(userId || '');
        const scores = studentScores.filter(s =>
            s && String(s.user_id || '') === uid &&
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

/** Pass/fail/empty from studentScores only (ignores active_sessions). */
function getScoresOnlyVariantStatus(userId, operation, variant) {
    if (!studentScores || !Array.isArray(studentScores)) return null;
    const uid = String(userId || '');
    const scores = studentScores.filter(s =>
        s && String(s.user_id || '') === uid &&
        s.operation === operation &&
        s.variant === variant
    );
    if (scores.length === 0) return null;
    const hasPassed = scores.some(s => s.passed === true || s.passed === 'true' || s.passed === 1 || s.passed === '1');
    if (hasPassed) {
        const passedScores = scores.filter(s =>
            s.passed === true || s.passed === 'true' || s.passed === 1 || s.passed === '1'
        );
        const averageTimes = passedScores
            .map(s => s.average_time)
            .filter(t => t != null && !isNaN(t))
            .map(t => parseFloat(t));
        const minTime = averageTimes.length > 0 ? Math.min(...averageTimes) : null;
        return { type: 'pass', minTime };
    }
    const failedScores = scores.filter(s =>
        s.passed === false || s.passed === 'false' || s.passed === 0 || s.passed === '0'
    );
    return { type: 'fail', attemptCount: failedScores.length };
}

function formatActiveSessionStatusText(session) {
    if (!session) return '—';
    const q = session.last_question_no_completed != null ? String(session.last_question_no_completed) : '0';
    return q;
}

function findActiveSessionForUser(activeSessions, userId) {
    const uid = String(userId || '');
    return (activeSessions || []).find(s => s && String(s.user_id || '') === uid) || null;
}

function paintVariantDataCell(cell, status) {
    const baseClass = 'variant-column';
    if (!cell) return;
    const op = cell.dataset.operation;
    const vr = cell.dataset.variant;
    if (!status) {
        cell.textContent = '';
        cell.className = `${baseClass} status-empty`;
    } else if (status.type === 'pass') {
        cell.textContent = status.minTime != null ? `${status.minTime.toFixed(1)}s` : '✓';
        cell.className = `${baseClass} status-pass`;
    } else if (status.type === 'fail') {
        const count = status.attemptCount || 0;
        cell.textContent = count > 0 ? `${count}` : '✗';
        cell.className = `${baseClass} status-fail`;
    }
    if (op && vr) {
        cell.dataset.operation = op;
        cell.dataset.variant = vr;
        if (shouldHideVariant(op, vr)) cell.classList.add('hidden-column');
        else cell.classList.remove('hidden-column');
    }
}

function paintActiveVariantCell(cell, session) {
    if (!cell || !session) return;
    const baseClass = 'variant-column';
    const op = cell.dataset.operation;
    const vr = cell.dataset.variant;
    const q = session.last_question_no_completed != null ? String(session.last_question_no_completed) : '0';
    const isCorrect = session.last_question_correct_wrong;
    cell.textContent = q;
    cell.className = baseClass + ' ' + (isCorrect === true ? 'status-active-correct' :
        isCorrect === false ? 'status-active-wrong' : 'status-active-unknown');
    if (op && vr) {
        cell.dataset.operation = op;
        cell.dataset.variant = vr;
        if (shouldHideVariant(op, vr)) cell.classList.add('hidden-column');
        else cell.classList.remove('hidden-column');
    }
}

function findVariantCellInRow(row, operation, variant) {
    if (!row) return null;
    return row.querySelector(`td.variant-column[data-operation="${operation}"][data-variant="${variant}"]`);
}

async function fetchAndMergeScoresForUserVariant(userId, operation, variant) {
    if (!window.firebaseDb || !userId || !operation || !variant) return;
    try {
        const { collection, query, where, getDocsFromServer } = await import("https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js");
        const scoresRef = collection(window.firebaseDb, 'user_scores');
        const uid = String(userId);
        const student = students.find(s => String(s.user_id || '') === uid);
        const userCode = student && student.user_code != null ? String(student.user_code).trim() : '';
        if (!userCode) {
            console.warn(`⚠️ fetchAndMergeScoresForUserVariant: missing user_code for user_id=${uid}`);
            return;
        }
        const scoresQuery = query(scoresRef, where('user_code', '==', userCode));
        const snap = await getDocsFromServer(scoresQuery);
        snap.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.operation !== operation || data.variant !== variant) return;
            // Normalize identity to current student UID so grid lookups stay stable.
            const incoming = { id: docSnap.id, ...data, user_id: uid };
            const idx = studentScores.findIndex(s => s.id === docSnap.id);
            if (idx >= 0) studentScores[idx] = incoming;
            else studentScores.push(incoming);
        });
    } catch (e) {
        console.warn('⚠️ fetchAndMergeScoresForUserVariant:', e);
    }
}

async function fetchActiveSessionsForCurrentStudents() {
    if (!window.firebaseDb || students.length === 0) {
        window.activeSessions = [];
        return [];
    }
    const studentUserIds = students
        .map(s => s.user_id)
        .filter(id => id != null && id !== '')
        .map(id => String(id));
    if (studentUserIds.length === 0) {
        window.activeSessions = [];
        return [];
    }
    const { collection, query, where, getDocs } = await import("https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js");
    const activeSessions = [];
    const batchSize = 10;
    for (let i = 0; i < studentUserIds.length; i += batchSize) {
        const batch = studentUserIds.slice(i, i + batchSize);
        try {
            const activeSessionsRef = collection(window.firebaseDb, 'active_sessions');
            const activeSessionsQuery = query(activeSessionsRef, where('user_id', 'in', batch));
            const activeSessionsSnapshot = await getDocs(activeSessionsQuery);
            activeSessionsSnapshot.forEach((doc) => {
                activeSessions.push(doc.data());
            });
        } catch (error) {
            console.warn('⚠️ Error fetching active sessions batch:', error);
        }
    }
    window.activeSessions = activeSessions;
    return activeSessions;
}

async function runActiveSessionsPollTick() {
    if (!window.firebaseDb || !teacherProfile || students.length === 0) return;
    try {
        const activeSessions = await fetchActiveSessionsForCurrentStudents();
        const tableBody = document.getElementById('tableBody');
        if (!tableBody) return;

        for (const student of students) {
            const uid = String(student.user_id || '');
            if (!uid) continue;

            const row = tableBody.querySelector(`tr[data-user-id="${uid}"]`);
            const prior = teacherPriorCurrentByUserId.get(uid) || { variant: '', operation: '', statusText: '—' };

            const lastVar = prior.variant ? prior.variant : '—';
            const lastStat = prior.statusText || '—';

            const sess = findActiveSessionForUser(activeSessions, uid);
            const newVar = sess?.variant || '';
            const newOp = sess?.operation || '';
            const curVarDisp = newVar || '—';
            const curStatDisp = sess ? formatActiveSessionStatusText(sess) : '—';

            if (row && row.cells.length >= VARIANT_COLUMN_START_INDEX) {
                row.cells[STUDENT_INFO_COLUMN_COUNT].textContent = lastVar;
                row.cells[STUDENT_INFO_COLUMN_COUNT + 1].textContent = lastStat;
                row.cells[STUDENT_INFO_COLUMN_COUNT + 2].textContent = curVarDisp;
                row.cells[STUDENT_INFO_COLUMN_COUNT + 3].textContent = curStatDisp;
            }

            const prevV = prior.variant;
            const prevOp = prior.operation;

            if (row) {
                if (!sess && prevV && prevOp) {
                    await fetchAndMergeScoresForUserVariant(uid, prevOp, prevV);
                    const cell = findVariantCellInRow(row, prevOp, prevV);
                    if (cell) paintVariantDataCell(cell, getScoresOnlyVariantStatus(uid, prevOp, prevV));
                } else if (sess && prevV && newVar && prevV !== newVar && prevOp) {
                    await fetchAndMergeScoresForUserVariant(uid, prevOp, prevV);
                    const oldCell = findVariantCellInRow(row, prevOp, prevV);
                    if (oldCell) paintVariantDataCell(oldCell, getScoresOnlyVariantStatus(uid, prevOp, prevV));
                    const newCell = findVariantCellInRow(row, newOp, newVar);
                    if (newCell) paintActiveVariantCell(newCell, sess);
                } else if (sess && newVar && newOp && (!prevV || prevV === newVar)) {
                    const newCell = findVariantCellInRow(row, newOp, newVar);
                    if (newCell) paintActiveVariantCell(newCell, sess);
                }
            }

            teacherPriorCurrentByUserId.set(uid, {
                variant: newVar,
                operation: newOp,
                statusText: curStatDisp
            });
        }
    } catch (error) {
        console.error('❌ runActiveSessionsPollTick:', error);
    }
}

function toggleDebugActivityColumns() {
    const table = document.getElementById('progressTable');
    const btn = document.getElementById('toggleDebugActivityColsBtn');
    if (!table) return;
    table.classList.toggle('hide-debug-activity-columns');
    const hidden = table.classList.contains('hide-debug-activity-columns');
    if (btn) {
        const showLabel = 'Show activity columns';
        const hideLabel = 'Hide activity columns';
        btn.textContent = '';
        btn.setAttribute('aria-label', hidden ? showLabel : hideLabel);
        btn.setAttribute('title', hidden ? showLabel : hideLabel);
    }
    applyStickyFixedColumnLayout();
}

window.toggleDebugActivityColumns = toggleDebugActivityColumns;

// Export to Excel
// CALLED BY: teacher-dashboard.html - <button onclick="exportToExcel()">Export to Excel</button>
async function exportToExcel() {
    if (window.debugLog) window.debugLog('exportToExcel');
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Student Progress');

        // Add header row (5 student cols + 4 activity debug + variants)
        const headerRow = [
            'Student', 'Class', 'Roll No.', 'User Code', 'Date of Birth',
            'Last var', 'Last Δ', 'Curr var', 'Curr Δ'
        ];
        allVariants.forEach(({ variant }) => {
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
            // Format date of birth for export - handle Firestore Timestamp, Date object, or string
            let dobFormatted = 'N/A';
            if (student.date_of_birth) {
                let dob;
                // Check if it's a Firestore Timestamp
                if (student.date_of_birth.toDate && typeof student.date_of_birth.toDate === 'function') {
                    dob = student.date_of_birth.toDate();
                } else if (student.date_of_birth instanceof Date) {
                    dob = student.date_of_birth;
                } else if (typeof student.date_of_birth === 'string') {
                    dob = new Date(student.date_of_birth);
                } else if (student.date_of_birth.seconds) {
                    // Firestore Timestamp with seconds property
                    dob = new Date(student.date_of_birth.seconds * 1000);
                } else {
                    dob = new Date(student.date_of_birth);
                }
                
                // Check if date is valid
                if (!isNaN(dob.getTime())) {
                    const day = String(dob.getDate()).padStart(2, '0');
                    const month = String(dob.getMonth() + 1).padStart(2, '0');
                    const year = dob.getFullYear();
                    dobFormatted = `${day}/${month}/${year}`;
                }
            }
            
            const row = [
                `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.user_code || 'N/A',
                String(student.class || '') + String(student.section || ''), // Combined class+section
                student.roll_number || '',
                student.user_code || 'N/A',
                dobFormatted
            ];

            const tableBodyEl = document.getElementById('tableBody');
            const uid = String(student.user_id || '');
            const tr = tableBodyEl && uid ? tableBodyEl.querySelector(`tr[data-user-id="${uid}"]`) : null;
            if (tr && tr.cells.length >= VARIANT_COLUMN_START_INDEX) {
                row.push(
                    tr.cells[STUDENT_INFO_COLUMN_COUNT].textContent,
                    tr.cells[STUDENT_INFO_COLUMN_COUNT + 1].textContent,
                    tr.cells[STUDENT_INFO_COLUMN_COUNT + 2].textContent,
                    tr.cells[STUDENT_INFO_COLUMN_COUNT + 3].textContent
                );
            } else {
                row.push('—', '—', '—', '—');
            }

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

            // Style variant columns (1-based: columns 10+)
            const variantStartCol = STUDENT_INFO_COLUMN_COUNT + DEBUG_ACTIVITY_COLUMN_COUNT + 1;
            allVariants.forEach((_, index) => {
                const cell = dataRow.getCell(variantStartCol + index);
                const status = getVariantStatus(student.user_id, allVariants[index].operation, allVariants[index].variant);

                if (status && typeof status === 'object' && status.type === 'active') {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: status.isCorrect === true ? 'FF90EE90' : 'FFFFB6C6' }
                    };
                } else if (status && typeof status === 'object' && status.type === 'pass') {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FF90EE90' }
                    };
                } else if (status && typeof status === 'object' && status.type === 'fail') {
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
        worksheet.getColumn(6).width = 10;
        worksheet.getColumn(7).width = 8;
        worksheet.getColumn(8).width = 10;
        worksheet.getColumn(9).width = 8;
        const variantStartCol = STUDENT_INFO_COLUMN_COUNT + DEBUG_ACTIVITY_COLUMN_COUNT + 1;
        for (let i = 0; i < allVariants.length; i++) {
            worksheet.getColumn(variantStartCol + i).width = 8;
        }

        worksheet.views = [{
            state: 'frozen',
            ySplit: 1,
            xSplit: FIXED_COLUMNS_COUNT
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
    // Sign out using Firebase
    if (window.firebaseSignOut && window.firebaseAuth) {
        await window.firebaseSignOut(window.firebaseAuth);
    }
    sessionStorage.removeItem('currentUserProfile');
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
    if (activeSessionsPollInterval) {
        clearInterval(activeSessionsPollInterval);
    }
    // Immediate tick so grid + debug columns sync without waiting 5s
    runActiveSessionsPollTick();
    activeSessionsPollInterval = setInterval(() => {
        runActiveSessionsPollTick();
    }, 5000);
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

// Note: initDashboard is called from teacher-dashboard.html Firebase auth state change callback
// Button event listeners are set up in teacher-dashboard.html