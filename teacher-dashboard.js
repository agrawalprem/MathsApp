// ============================================================================
// TEACHER DASHBOARD - JavaScript Logic
// ============================================================================

// Supabase configuration (update with your credentials)
const SUPABASE_URL = 'https://hgromnervuwqmskdenmb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhncm9tbmVydnV3cW1za2Rlbm1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNTExMDgsImV4cCI6MjA4MzYyNzEwOH0.AYWM-6xGhVWnn61ctxj6fClW7KLEp98dlmrd3e5IqJ8';
let supabase;

// Current user and data
let currentUser = null;
let teacherProfile = null;
let students = [];
let studentScores = [];
let allVariants = [];

// Learning sequence for column ordering
const learningSequence = {
    addition: ['1A0', '1A1', '1A2', '1A3', '1A', '1B', '1C', '1D', '1', '1M1', '1M2'],
    subtraction: ['2A', '2B', '2C', '2D', '2', '2M1', '2M2', '2M3'],
    multiplication: ['3A0', '3A1', '3A2S', '3A2', '3A3S', '3A3', '3A', '3B4S', '3B4', '3B5S', '3B5', '3B6S', '3B6', '3B', '3C7S', '3C7', '3C8S', '3C8', '3C9S', '3C9', '3C', '3', '3M1', '3M2'],
    division: ['4A1', '4A2', '4A3', '4A', '4B4', '4B5', '4B6', '4B', '4C7', '4C8', '4C9', '4C', '4', '4M1', '4M2']
};

// Initialize Supabase
function initSupabase() {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase initialized');
}

// Check authentication on page load
async function initDashboard() {
    initSupabase();
    
    // Check for existing session
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        currentUser = session.user;
        await loadTeacherDashboard();
    } else {
        // Redirect to login if not authenticated
        window.location.href = 'index.html';
    }
}

// Load teacher dashboard data
async function loadTeacherDashboard() {
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
            throw new Error('Teacher profile not found. Please ensure you are logged in as a teacher.');
        }

        // Verify user is a teacher
        if (profileData.user_type !== 'Teacher') {
            throw new Error('Access denied. This dashboard is only available for teachers.');
        }

        // Verify teacher has class and section assigned
        if (!profileData.class || !profileData.section) {
            throw new Error('Your teacher profile is missing class or section information. Please contact administrator.');
        }

        teacherProfile = profileData;
        document.getElementById('teacherName').textContent = `Welcome, ${profileData.first_name || profileData.email}`;
        console.log(`✅ Teacher profile loaded: Class ${profileData.class}, Section ${profileData.section}`);

        // Fetch all students in teacher's class and section
        let studentsQuery = supabase
            .from('user_profiles')
            .select('*')
            .eq('user_type', 'Student')
            .eq('class', profileData.class)
            .eq('section', profileData.section);

        // If school_id is set, also filter by school_id
        if (profileData.school_id) {
            studentsQuery = studentsQuery.eq('school_id', profileData.school_id);
        }

        const { data: studentsData, error: studentsError } = await studentsQuery;

        if (studentsError) {
            throw new Error(`Error fetching students: ${studentsError.message}`);
        }

        students = (studentsData || []).sort((a, b) => {
            // Sort by roll_number (if available), otherwise by name
            if (a.roll_number && b.roll_number) {
                return (a.roll_number || '').localeCompare(b.roll_number || '');
            }
            const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.email;
            const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim() || b.email;
            return nameA.localeCompare(nameB);
        });

        console.log(`✅ Found ${students.length} students in Class ${profileData.class}-${profileData.section}`);

        if (students.length === 0) {
            showError('No students found. Please assign students to your teacher account.');
            showLoading(false);
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

        // Build flattened variant list for columns
        allVariants = [];
        Object.keys(learningSequence).forEach(operation => {
            learningSequence[operation].forEach(variant => {
                allVariants.push({ operation, variant });
            });
        });

        // Build and display the grid
        buildDashboardGrid();
        
        document.getElementById('studentCount').textContent = students.length;
        document.getElementById('variantCount').textContent = allVariants.length;
        
        showLoading(false);
        document.getElementById('dashboardControls').classList.remove('hidden');
        document.getElementById('dashboardGrid').classList.remove('hidden');

    } catch (error) {
        console.error('❌ Error loading dashboard:', error);
        showError(error.message);
        showLoading(false);
    }
}

// Build the dashboard grid
function buildDashboardGrid() {
    const tableHead = document.getElementById('tableHead');
    const tableBody = document.getElementById('tableBody');

    // Clear existing content
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';

    // Build header row
    const headerRow = document.createElement('tr');
    const headerColumns = [
        'Student Name', 'Roll #', 'Class', 'Section'
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
        headerRow.appendChild(th);
    });

    tableHead.appendChild(headerRow);

    // Build data rows
    students.forEach(student => {
        const row = document.createElement('tr');
        
        // Student info columns
        const nameCell = document.createElement('td');
        nameCell.textContent = `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.email;
        nameCell.className = 'fixed-column';
        row.appendChild(nameCell);

        const rollCell = document.createElement('td');
        rollCell.textContent = student.roll_number || '';
        rollCell.className = 'fixed-column';
        row.appendChild(rollCell);

        const classCell = document.createElement('td');
        classCell.textContent = student.class || '';
        classCell.className = 'fixed-column';
        row.appendChild(classCell);

        const sectionCell = document.createElement('td');
        sectionCell.textContent = student.section || '';
        sectionCell.className = 'fixed-column';
        row.appendChild(sectionCell);

        // Variant status columns
        allVariants.forEach(({ operation, variant }) => {
            const cell = document.createElement('td');
            const status = getVariantStatus(student.user_id, operation, variant);
            
            if (status === 'pass') {
                cell.textContent = '✓';
                cell.className = 'status-pass';
            } else if (status === 'fail') {
                cell.textContent = '✗';
                cell.className = 'status-fail';
            } else {
                cell.textContent = '';
                cell.className = 'status-empty';
            }
            
            row.appendChild(cell);
        });

        tableBody.appendChild(row);
    });
}

// Get pass/fail status for a variant
function getVariantStatus(userId, operation, variant) {
    const scores = studentScores.filter(s => 
        s.user_id === userId && 
        s.operation === operation && 
        s.variant === variant
    );

    if (scores.length === 0) {
        return null; // Not attempted
    }

    // Check if any score has passed = true
    const hasPassed = scores.some(s => s.passed === true);
    return hasPassed ? 'pass' : 'fail';
}

// Export to Excel
async function exportToExcel() {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Student Progress');

        // Add header row
        const headerRow = ['Student Name', 'Roll #', 'Class', 'Section'];
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
            const row = [
                `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.email,
                student.roll_number || '',
                student.class || '',
                student.section || ''
            ];

            allVariants.forEach(({ operation, variant }) => {
                const status = getVariantStatus(student.user_id, operation, variant);
                row.push(status === 'pass' ? '✓' : status === 'fail' ? '✗' : '');
            });

            const dataRow = worksheet.addRow(row);

            // Style status cells
            allVariants.forEach((_, index) => {
                const cell = dataRow.getCell(5 + index); // Start after fixed columns
                const status = getVariantStatus(student.user_id, allVariants[index].operation, allVariants[index].variant);
                
                if (status === 'pass') {
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
        worksheet.getColumn(1).width = 25; // Name
        worksheet.getColumn(2).width = 10; // Roll #
        worksheet.getColumn(3).width = 10; // Class
        worksheet.getColumn(4).width = 10; // Section
        for (let i = 5; i <= 4 + allVariants.length; i++) {
            worksheet.getColumn(i).width = 8; // Variant columns
        }

        // Freeze header row and first 4 columns
        worksheet.views = [{
            state: 'frozen',
            ySplit: 1,
            xSplit: 4
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
async function handleLogout() {
    if (supabase) {
        await supabase.auth.signOut();
    }
    window.location.href = 'index.html';
}

// Utility functions
function showLoading(show) {
    document.getElementById('loadingMessage').style.display = show ? 'block' : 'none';
}

function showError(message) {
    const errorEl = document.getElementById('errorMessage');
    if (message) {
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
    } else {
        errorEl.classList.add('hidden');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initDashboard);