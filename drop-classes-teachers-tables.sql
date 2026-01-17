-- ============================================================================
-- DROP CLASSES AND TEACHERS TABLES
-- This script safely removes the classes and teachers tables
-- ============================================================================
-- 
-- SAFETY CHECK: Both tables are safe to remove because:
-- 1. classes table: No longer used in code (replaced by user_type in user_profiles)
-- 2. teachers table: Never actually created/used in the codebase
-- 3. No active code references these tables
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop RLS policies (if they exist)
-- ============================================================================

DROP POLICY IF EXISTS "Teachers can view their classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can manage their classes" ON public.classes;

-- ============================================================================
-- STEP 2: Drop indexes (if they exist)
-- ============================================================================

DROP INDEX IF EXISTS public.idx_classes_teacher_id;
DROP INDEX IF EXISTS public.idx_classes_class_section;
DROP INDEX IF EXISTS public.idx_classes_school_id;

-- ============================================================================
-- STEP 3: Drop foreign keys FROM these tables (if any exist)
-- ============================================================================
-- Check for foreign keys that classes/teachers tables have pointing to other tables
-- Example: If classes.teacher_id references auth.users, we need to drop it

-- Drop foreign key from classes.teacher_id (if it exists)
ALTER TABLE public.classes DROP CONSTRAINT IF EXISTS classes_teacher_id_fkey CASCADE;

-- Drop any other foreign keys from classes table
-- (Add more if you find them in STEP 1 verification queries)

-- ============================================================================
-- STEP 4: Drop foreign keys REFERENCING these tables (if any exist)
-- ============================================================================
-- Check if any other tables have foreign keys pointing TO classes or teachers
-- Run this query first to see what needs to be dropped:
/*
SELECT 
    tc.table_name AS referencing_table,
    kcu.column_name AS referencing_column,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name IN ('classes', 'teachers')
    AND tc.table_schema = 'public';
*/

-- If the above query returns any rows, drop those foreign keys:
-- ALTER TABLE public.<table_name> DROP CONSTRAINT IF EXISTS <constraint_name> CASCADE;

-- ============================================================================
-- STEP 5: Drop the tables
-- ============================================================================

DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.teachers CASCADE;

-- ============================================================================
-- VERIFICATION QUERIES (Run after dropping to confirm)
-- ============================================================================

-- Verify tables are dropped (should return no rows):
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('classes', 'teachers');

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. CASCADE automatically drops dependent objects (foreign keys, indexes, etc.)
-- 2. If you encounter errors, run the verification queries in STEP 4 first
-- 3. The classes table functionality is now handled by user_type in user_profiles
-- 4. These tables are not referenced in any active code
-- ============================================================================
