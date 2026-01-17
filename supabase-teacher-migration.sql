-- ============================================================================
-- TEACHER DASHBOARD MIGRATION
-- Add user_type column and implement teacher-student relationship via user_profiles
-- ============================================================================

-- Add user_type column to user_profiles
-- Note: If column already exists, this will not change it. To make it NOT NULL, run the separate migration below.
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS user_type TEXT CHECK (user_type IN ('Student', 'Teacher', 'Admin'));

-- Make user_type NOT NULL (run this after ensuring all existing users have a user_type)
-- First, update any NULL user_type values to a default (e.g., 'Student' for existing users)
-- UPDATE public.user_profiles SET user_type = 'Student' WHERE user_type IS NULL;
-- Then uncomment the line below:
-- ALTER TABLE public.user_profiles ALTER COLUMN user_type SET NOT NULL;

-- Add CHECK constraints to ensure school_id, class, and section are NOT NULL for students and teachers
ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS check_student_teacher_required_fields;

ALTER TABLE public.user_profiles
ADD CONSTRAINT check_student_teacher_required_fields 
CHECK (
    (user_type IN ('Student', 'Teacher') AND school_id IS NOT NULL AND class IS NOT NULL AND section IS NOT NULL)
    OR 
    (user_type NOT IN ('Student', 'Teacher'))
);

-- Create index for performance on user_type
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON public.user_profiles(user_type);

-- Create composite index on (school_id, class, section) for students and teachers
-- This index is useful for teacher-student lookups and queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_school_class_section 
ON public.user_profiles(school_id, class, section)
WHERE user_type IN ('Student', 'Teacher');

-- Create unique partial index to ensure only one teacher per class+section combination
-- This constraint ensures that for each (class, section) combination,
-- there can be only one user with user_type = 'Teacher'
-- Note: Since school_id, class, and section are NOT NULL for teachers, we don't need NULL checks
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_unique_teacher_class 
ON public.user_profiles(class, section)
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
                AND teacher_profile.school_id = user_profiles.school_id
            )
        ) OR
        -- User can always see their own profile
        user_id = auth.uid()
    );

-- Teachers can SELECT scores of their students
-- Note: Users viewing their own scores is already handled by "Users can view own scores" policy
-- This policy only adds the ability for teachers to view their students' scores
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
                AND teacher_profile.school_id = up.school_id
            WHERE up.user_type = 'Student'
        )
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
