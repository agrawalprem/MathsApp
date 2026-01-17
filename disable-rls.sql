-- ============================================================================
-- DISABLE ROW LEVEL SECURITY (RLS)
-- WARNING: This removes all data access restrictions
-- All authenticated users will be able to see all data
-- ============================================================================

-- Disable RLS on user_profiles
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Disable RLS on user_scores
ALTER TABLE public.user_scores DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies (cleanup)
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Teachers can view their students" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own scores" ON public.user_scores;
DROP POLICY IF EXISTS "Users can create own scores" ON public.user_scores;
DROP POLICY IF EXISTS "Users can update own scores" ON public.user_scores;
DROP POLICY IF EXISTS "Users can delete own scores" ON public.user_scores;
DROP POLICY IF EXISTS "Teachers can view their students' scores" ON public.user_scores;

-- Verify RLS is disabled
SELECT 
    'RLS Status' AS check_type,
    tablename,
    CASE 
        WHEN rowsecurity = false THEN '✅ DISABLED'
        ELSE '❌ STILL ENABLED'
    END AS status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'user_scores');

-- ============================================================================
-- NOTES
-- ============================================================================
-- After running this:
-- 1. All authenticated users can see all profiles and scores
-- 2. Any authenticated user can insert/update/delete any data
-- 3. The dashboard should work without RLS blocking queries
-- 4. To re-enable RLS later, run: enable-rls.sql
-- ============================================================================
