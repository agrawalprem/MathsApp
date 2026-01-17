-- ============================================================================
-- DEBUG DASHBOARD QUERIES
-- Run these to check what data exists and what the queries should return
-- ============================================================================

-- Replace 'YOUR_USER_ID' with your actual user_id from auth.users
-- You can find it by running: SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Check 1: Do you have any scores at all?
SELECT 
    'All Scores' AS check_type,
    COUNT(*) AS total_scores,
    COUNT(DISTINCT operation) AS unique_operations,
    COUNT(DISTINCT variant) AS unique_variants
FROM user_scores
WHERE user_id = '2d7252fb-0dcc-4b19-968b-6b430ac29cd9';

-- Check 2: Do you have any PASSED scores?
SELECT 
    'Passed Scores' AS check_type,
    COUNT(*) AS passed_count,
    string_agg(DISTINCT operation || '_' || variant, ', ') AS passed_variants
FROM user_scores
WHERE user_id = '2d7252fb-0dcc-4b19-968b-6b430ac29cd9'
AND passed = true;

-- Check 3: Do you have any FAILED scores?
SELECT 
    'Failed Scores' AS check_type,
    COUNT(*) AS failed_count,
    string_agg(DISTINCT operation || '_' || variant, ', ') AS failed_variants
FROM user_scores
WHERE user_id = '2d7252fb-0dcc-4b19-968b-6b430ac29cd9'
AND passed = false;

-- Check 4: Show recent scores (last 10)
SELECT 
    'Recent Scores' AS check_type,
    operation,
    variant,
    passed,
    correct_count,
    wrong_count,
    completed_at
FROM user_scores
WHERE user_id = '2d7252fb-0dcc-4b19-968b-6b430ac29cd9'
ORDER BY completed_at DESC
LIMIT 10;

-- Check 5: Check if passed field is actually boolean true/false
SELECT 
    'Passed Field Check' AS check_type,
    passed,
    COUNT(*) AS count,
    pg_typeof(passed) AS data_type
FROM user_scores
WHERE user_id = '2d7252fb-0dcc-4b19-968b-6b430ac29cd9'
GROUP BY passed;
