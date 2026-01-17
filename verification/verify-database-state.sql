-- ============================================================================
-- DATABASE VERIFICATION SCRIPT
-- Verify that classes and teachers tables are dropped and everything is working
-- ============================================================================

-- ============================================================================
-- STEP 1: Verify tables are dropped
-- ============================================================================

SELECT 
    'Tables Check' AS check_type,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ PASS: classes and teachers tables are dropped'
        ELSE '❌ FAIL: Tables still exist: ' || string_agg(table_name, ', ')
    END AS result
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('classes', 'teachers');

-- ============================================================================
-- STEP 2: Verify user_profiles table structure
-- ============================================================================

-- Check if user_type column exists
SELECT 
    'user_type Column' AS check_type,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PASS: user_type column exists'
        ELSE '❌ FAIL: user_type column missing'
    END AS result
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_profiles'
AND column_name = 'user_type';

-- Check if required columns exist (school_id, class, section)
SELECT 
    'Required Columns' AS check_type,
    CASE 
        WHEN COUNT(*) = 3 THEN '✅ PASS: All required columns exist (school_id, class, section)'
        ELSE '❌ FAIL: Missing columns. Found: ' || string_agg(column_name, ', ')
    END AS result
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_profiles'
AND column_name IN ('school_id', 'class', 'section');

-- ============================================================================
-- STEP 3: Verify constraints
-- ============================================================================

-- Check if check_student_teacher_required_fields constraint exists
SELECT 
    'CHECK Constraint' AS check_type,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PASS: check_student_teacher_required_fields constraint exists'
        ELSE '❌ FAIL: CHECK constraint missing'
    END AS result
FROM information_schema.table_constraints
WHERE table_schema = 'public'
AND table_name = 'user_profiles'
AND constraint_name = 'check_student_teacher_required_fields';

-- ============================================================================
-- STEP 4: Verify indexes
-- ============================================================================

-- Check for user_type index
SELECT 
    'user_type Index' AS check_type,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PASS: idx_user_profiles_user_type index exists'
        ELSE '❌ FAIL: user_type index missing'
    END AS result
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'user_profiles'
AND indexname = 'idx_user_profiles_user_type';

-- Check for composite index
SELECT 
    'Composite Index' AS check_type,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PASS: idx_user_profiles_school_class_section index exists'
        ELSE '❌ FAIL: Composite index missing'
    END AS result
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'user_profiles'
AND indexname = 'idx_user_profiles_school_class_section';

-- Check for unique teacher index
SELECT 
    'Unique Teacher Index' AS check_type,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PASS: idx_user_profiles_unique_teacher_class index exists'
        ELSE '❌ FAIL: Unique teacher index missing'
    END AS result
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'user_profiles'
AND indexname = 'idx_user_profiles_unique_teacher_class';

-- ============================================================================
-- STEP 5: Verify RLS policies
-- ============================================================================

-- Check for teacher-student RLS policies
SELECT 
    'RLS Policies' AS check_type,
    CASE 
        WHEN COUNT(*) >= 2 THEN '✅ PASS: Teacher-student RLS policies exist (' || COUNT(*) || ' found)'
        ELSE '❌ FAIL: Missing RLS policies. Found: ' || COUNT(*)::text
    END AS result
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('user_profiles', 'user_scores')
AND policyname IN ('Teachers can view their students', 'Teachers can view their students'' scores');

-- ============================================================================
-- STEP 6: Check for orphaned foreign keys
-- ============================================================================

-- Check if any foreign keys reference the dropped tables
SELECT 
    'Foreign Keys Check' AS check_type,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ PASS: No foreign keys reference classes or teachers tables'
        ELSE '❌ FAIL: Found foreign keys referencing dropped tables: ' || string_agg(tc.table_name || '.' || kcu.column_name, ', ')
    END AS result
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name IN ('classes', 'teachers')
    AND tc.table_schema = 'public';

-- ============================================================================
-- STEP 7: Sample data verification (optional - only if you have test data)
-- ============================================================================

-- Check if there are any teachers in user_profiles
SELECT 
    'Teachers Data' AS check_type,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PASS: Found ' || COUNT(*) || ' teacher(s) in user_profiles'
        ELSE '⚠️  WARNING: No teachers found (this is OK if you haven''t created any yet)'
    END AS result
FROM public.user_profiles
WHERE user_type = 'Teacher';

-- Check if there are any students in user_profiles
SELECT 
    'Students Data' AS check_type,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PASS: Found ' || COUNT(*) || ' student(s) in user_profiles'
        ELSE '⚠️  WARNING: No students found (this is OK if you haven''t created any yet)'
    END AS result
FROM public.user_profiles
WHERE user_type = 'Student';

-- Check for teachers/students with missing required fields
SELECT 
    'Data Integrity' AS check_type,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ PASS: All teachers and students have required fields (school_id, class, section)'
        ELSE '❌ FAIL: Found ' || COUNT(*) || ' teacher/student(s) with missing required fields'
    END AS result
FROM public.user_profiles
WHERE user_type IN ('Student', 'Teacher')
AND (school_id IS NULL OR class IS NULL OR section IS NULL);

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Run all queries above and check results
-- All checks should show ✅ PASS or ⚠️ WARNING (warnings are OK for empty data)
-- If any show ❌ FAIL, investigate and fix the issue
-- ============================================================================
