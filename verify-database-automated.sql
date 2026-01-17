-- ============================================================================
-- AUTOMATED DATABASE VERIFICATION
-- Run this script to automatically check all database components
-- ============================================================================

-- ============================================================================
-- 1. TABLES CHECK
-- ============================================================================
SELECT 
    'Tables Check' AS check_type,
    CASE 
        WHEN COUNT(*) = 2 THEN '✅ PASS: Both tables exist (user_profiles, user_scores)'
        ELSE '❌ FAIL: Missing tables. Found: ' || string_agg(table_name, ', ')
    END AS result
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'user_scores');

-- ============================================================================
-- 2. RLS ENABLED CHECK
-- ============================================================================
SELECT 
    'RLS Enabled' AS check_type,
    CASE 
        WHEN COUNT(*) = 2 THEN '✅ PASS: RLS enabled on both tables'
        ELSE '❌ FAIL: RLS not enabled on all tables'
    END AS result
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'user_scores')
AND rowsecurity = true;

-- ============================================================================
-- 3. POLICIES COUNT CHECK
-- ============================================================================
SELECT 
    'Policies Count' AS check_type,
    CASE 
        WHEN COUNT(*) >= 9 THEN '✅ PASS: All policies exist (' || COUNT(*) || ' found)'
        ELSE '❌ FAIL: Missing policies. Found: ' || COUNT(*)::text
    END AS result
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'user_scores');

-- ============================================================================
-- 4. INDEXES COUNT CHECK
-- ============================================================================
SELECT 
    'Indexes Count' AS check_type,
    CASE 
        WHEN COUNT(*) >= 11 THEN '✅ PASS: All indexes exist (' || COUNT(*) || ' found)'
        ELSE '❌ FAIL: Missing indexes. Found: ' || COUNT(*)::text
    END AS result
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'user_scores');

-- ============================================================================
-- 5. user_type COLUMN CHECK
-- ============================================================================
SELECT 
    'user_type Column' AS check_type,
    CASE 
        WHEN COUNT(*) > 0 THEN 
            CASE 
                WHEN (SELECT is_nullable FROM information_schema.columns 
                      WHERE table_schema = 'public' 
                      AND table_name = 'user_profiles' 
                      AND column_name = 'user_type') = 'NO' 
                THEN '✅ PASS: user_type exists and is NOT NULL'
                ELSE '⚠️  WARNING: user_type exists but is nullable (consider making it NOT NULL)'
            END
        ELSE '❌ FAIL: user_type column missing'
    END AS result
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_profiles'
AND column_name = 'user_type';

-- ============================================================================
-- 6. CHECK CONSTRAINT CHECK
-- ============================================================================
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
-- 7. UNIQUE TEACHER INDEX CHECK
-- ============================================================================
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
-- 8. TRIGGER CHECK
-- ============================================================================
SELECT 
    'Updated_at Trigger' AS check_type,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PASS: set_updated_at_user_profiles trigger exists'
        ELSE '❌ FAIL: Trigger missing'
    END AS result
FROM pg_trigger
WHERE tgname = 'set_updated_at_user_profiles';

-- ============================================================================
-- 9. FUNCTION CHECK
-- ============================================================================
SELECT 
    'Updated_at Function' AS check_type,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PASS: handle_updated_at() function exists'
        ELSE '❌ FAIL: Function missing'
    END AS result
FROM pg_proc
WHERE proname = 'handle_updated_at'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- ============================================================================
-- 10. DATA INTEGRITY CHECK (if data exists)
-- ============================================================================
SELECT 
    'Data Integrity' AS check_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM public.user_profiles WHERE user_type IN ('Student', 'Teacher') AND (school_id IS NULL OR class IS NULL OR section IS NULL)) = 0 
        THEN '✅ PASS: All students and teachers have required fields'
        ELSE '❌ FAIL: Found students/teachers with missing required fields (school_id, class, or section)'
    END AS result;

-- ============================================================================
-- SUMMARY: Policy count by table
-- ============================================================================
SELECT 
    'Policy Count' AS check_type,
    tablename || ': ' || COUNT(*) || ' policies' AS result
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'user_scores')
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- NOTE: For detailed policy validation, run verify-policies-detailed.sql
-- ============================================================================
