-- ============================================================================
-- TEST RLS POLICIES
-- Run this while logged in as the user to test if policies are working
-- ============================================================================

-- Test 1: Can user see their own profile?
-- Run this query in Supabase SQL Editor (it will use your current auth.uid())
SELECT 
    'Test: View own profile' AS test_name,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PASS: Can see own profile'
        ELSE '❌ FAIL: Cannot see own profile (RLS blocking)'
    END AS result,
    COUNT(*) AS profile_count
FROM public.user_profiles
WHERE user_id = auth.uid();

-- Test 2: Can user see their own scores?
SELECT 
    'Test: View own scores' AS test_name,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ PASS: Can query own scores (even if 0 results)'
        ELSE '❌ FAIL: Cannot query own scores (RLS blocking)'
    END AS result,
    COUNT(*) AS score_count
FROM public.user_scores
WHERE user_id = auth.uid();

-- Test 3: Check what auth.uid() returns
SELECT 
    'Current User ID' AS test_name,
    auth.uid()::text AS user_id,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN '✅ User is authenticated'
        ELSE '❌ User is NOT authenticated'
    END AS auth_status;

-- Test 4: Check if profile exists for current user
SELECT 
    'Profile Check' AS test_name,
    up.*,
    CASE 
        WHEN up.user_id IS NOT NULL THEN '✅ Profile exists'
        ELSE '❌ Profile does not exist'
    END AS status
FROM public.user_profiles up
WHERE up.user_id = auth.uid();

-- Test 5: Try to insert a test score (should work if RLS allows)
-- Uncomment to test:
-- INSERT INTO public.user_scores (user_id, operation, variant, correct_count, wrong_count, passed)
-- VALUES (auth.uid(), 'addition', '1A0', 5, 0, true)
-- RETURNING *;
