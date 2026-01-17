-- ============================================================================
-- DETAILED POLICY VALIDATION
-- This script validates each policy individually and reports any issues
-- ============================================================================

-- ============================================================================
-- EXPECTED POLICIES FOR user_profiles
-- ============================================================================

-- Policy 1: Users can view own profile (SELECT)
SELECT 
    'user_profiles: Users can view own profile' AS policy_check,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END AS status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'user_profiles'
AND policyname = 'Users can view own profile'
AND cmd = 'SELECT';

-- Policy 2: Users can create own profile (INSERT)
SELECT 
    'user_profiles: Users can create own profile' AS policy_check,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END AS status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'user_profiles'
AND policyname = 'Users can create own profile'
AND cmd = 'INSERT';

-- Policy 3: Users can update own profile (UPDATE)
SELECT 
    'user_profiles: Users can update own profile' AS policy_check,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END AS status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'user_profiles'
AND policyname = 'Users can update own profile'
AND cmd = 'UPDATE';

-- Policy 4: Users can delete own profile (DELETE)
SELECT 
    'user_profiles: Users can delete own profile' AS policy_check,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END AS status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'user_profiles'
AND policyname = 'Users can delete own profile'
AND cmd = 'DELETE';

-- Policy 5: Teachers can view their students (SELECT)
SELECT 
    'user_profiles: Teachers can view their students' AS policy_check,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END AS status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'user_profiles'
AND policyname = 'Teachers can view their students'
AND cmd = 'SELECT';

-- ============================================================================
-- EXPECTED POLICIES FOR user_scores
-- ============================================================================

-- Policy 1: Users can view own scores (SELECT)
SELECT 
    'user_scores: Users can view own scores' AS policy_check,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END AS status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'user_scores'
AND policyname = 'Users can view own scores'
AND cmd = 'SELECT';

-- Policy 2: Users can create own scores (INSERT)
SELECT 
    'user_scores: Users can create own scores' AS policy_check,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END AS status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'user_scores'
AND policyname = 'Users can create own scores'
AND cmd = 'INSERT';

-- Policy 3: Users can update own scores (UPDATE)
SELECT 
    'user_scores: Users can update own scores' AS policy_check,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END AS status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'user_scores'
AND policyname = 'Users can update own scores'
AND cmd = 'UPDATE';

-- Policy 4: Users can delete own scores (DELETE)
SELECT 
    'user_scores: Users can delete own scores' AS policy_check,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END AS status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'user_scores'
AND policyname = 'Users can delete own scores'
AND cmd = 'DELETE';

-- Policy 5: Teachers can view their students'' scores (SELECT)
SELECT 
    'user_scores: Teachers can view their students'' scores' AS policy_check,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END AS status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'user_scores'
AND policyname = 'Teachers can view their students'' scores'
AND cmd = 'SELECT';

-- ============================================================================
-- SUMMARY: Count policies by table
-- ============================================================================
SELECT 
    'Policy Summary' AS check_type,
    tablename || ': ' || COUNT(*) || ' policies' AS result
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'user_scores')
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- CHECK FOR UNEXPECTED POLICIES
-- ============================================================================
SELECT 
    'Unexpected Policies' AS check_type,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ PASS: No unexpected policies found'
        ELSE '⚠️  WARNING: Found ' || COUNT(*) || ' unexpected policy/policies: ' || string_agg(tablename || '.' || policyname, ', ')
    END AS result
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'user_scores')
AND policyname NOT IN (
    'Users can view own profile',
    'Users can create own profile',
    'Users can update own profile',
    'Users can delete own profile',
    'Teachers can view their students',
    'Users can view own scores',
    'Users can create own scores',
    'Users can update own scores',
    'Users can delete own scores',
    'Teachers can view their students'' scores'
);

-- ============================================================================
-- FINAL VERDICT
-- ============================================================================
SELECT 
    'Final Verdict' AS check_type,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'user_profiles'
        ) >= 5
        AND (
            SELECT COUNT(*) FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'user_scores'
        ) >= 5
        THEN '✅ PASS: All required policies are present'
        ELSE '❌ FAIL: Missing required policies'
    END AS result;
