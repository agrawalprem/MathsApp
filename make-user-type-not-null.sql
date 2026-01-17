-- ============================================================================
-- MAKE user_type NOT NULL
-- Run this after ensuring all existing users have a user_type value
-- ============================================================================

-- Step 1: Check for NULL user_type values
SELECT COUNT(*) as null_user_type_count
FROM public.user_profiles
WHERE user_type IS NULL;

-- Step 2: If there are NULL values, update them to a default
-- Choose appropriate default based on your data:
-- - If most are students: UPDATE public.user_profiles SET user_type = 'Student' WHERE user_type IS NULL;
-- - If you know which are teachers: UPDATE public.user_profiles SET user_type = 'Teacher' WHERE user_type IS NULL AND ...;
-- - Or set individually based on other criteria

-- Step 3: After all NULL values are updated, make the column NOT NULL
ALTER TABLE public.user_profiles 
ALTER COLUMN user_type SET NOT NULL;

-- Step 4: Verify
SELECT 
    'user_type NOT NULL constraint' AS check_type,
    CASE 
        WHEN is_nullable = 'NO' THEN '✅ PASS: user_type is NOT NULL'
        ELSE '❌ FAIL: user_type is still nullable'
    END AS result
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_profiles'
AND column_name = 'user_type';
