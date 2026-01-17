-- ============================================================================
-- TEACHER DASHBOARD MIGRATION
-- Add user_type column and implement teacher-student relationship via user_profiles
-- ============================================================================

-- Add user_type column to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS user_type TEXT CHECK (user_type IN ('Student', 'Teacher', 'Admin'));

-- Create index for performance on user_type
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON public.user_profiles(user_type);

-- Create index for class+section lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_class_section ON public.user_profiles(class, section);

-- Create unique partial index to ensure only one teacher per class+section combination
-- This constraint ensures that for each (class, section, school_id) combination,
-- there can be only one user with user_type = 'Teacher'
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_unique_teacher_class 
ON public.user_profiles(class, section, COALESCE(school_id, ''))
WHERE user_type = 'Teacher';

-- ============================================================================
-- RLS POLICIES: Teachers can view their students via class+section matching
-- ============================================================================

-- Teachers can SELECT students in their classes
-- A teacher can see students whose class+section matches their own class+section
DROP POLICY IF EXISTS "Teachers can view their students" ON public.user_profiles;
CREATE POLICY "Teachers can view their students"
    ON public.user_profiles
    FOR SELECT
    USING (
        -- Teacher can see students in their classes (matching class+section)
        (
            user_type = 'Student' AND
            EXISTS (
                SELECT 1 FROM public.user_profiles teacher_profile
                WHERE teacher_profile.user_id = auth.uid()
                AND teacher_profile.user_type = 'Teacher'
                AND teacher_profile.class = user_profiles.class
                AND teacher_profile.section = user_profiles.section
                AND (
                    teacher_profile.school_id IS NULL 
                    OR user_profiles.school_id IS NULL 
                    OR teacher_profile.school_id = user_profiles.school_id
                )
            )
        ) OR
        -- User can always see their own profile
        user_id = auth.uid()
    );

-- Teachers can SELECT scores of their students
DROP POLICY IF EXISTS "Teachers can view their students' scores" ON public.user_scores;
CREATE POLICY "Teachers can view their students' scores"
    ON public.user_scores
    FOR SELECT
    USING (
        -- Teacher can see scores of students in their classes
        user_id IN (
            SELECT up.user_id 
            FROM public.user_profiles up
            INNER JOIN public.user_profiles teacher_profile 
                ON teacher_profile.user_id = auth.uid()
                AND teacher_profile.user_type = 'Teacher'
                AND teacher_profile.class = up.class
                AND teacher_profile.section = up.section
                AND (
                    teacher_profile.school_id IS NULL 
                    OR up.school_id IS NULL 
                    OR teacher_profile.school_id = up.school_id
                )
            WHERE up.user_type = 'Student'
        ) OR
        -- User can always see their own scores
        user_id = auth.uid()
    );

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. user_type can be 'Student', 'Teacher', or 'Admin'
-- 2. Unique constraint ensures only one teacher per (class, section, school_id)
-- 3. A teacher can teach multiple classes (by having multiple profiles or 
--    by updating their class/section - though the unique constraint limits this)
-- 4. When a teacher logs in, their class+section identifies which students they can see
-- 5. Students are identified by user_type = 'Student' and matching class+section
-- ============================================================================
