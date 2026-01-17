-- ============================================================================
-- SUPABASE DATABASE SCHEMA
-- PremAgrawal Maths App - Complete Database Setup
-- ============================================================================
-- This file contains:
-- 1. Table definitions
-- 2. Row Level Security (RLS) policies
-- 3. Indexes for performance
-- 4. Foreign key constraints
-- ============================================================================

-- ============================================================================
-- TABLE: user_profiles
-- ============================================================================
-- Stores user profile information linked to auth.users
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    gender TEXT,
    school_id TEXT,
    class TEXT,
    section TEXT,
    roll_number TEXT,
    user_type TEXT NOT NULL CHECK (user_type IN ('Student', 'Teacher', 'Admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Constraint: school_id, class, and section must be NOT NULL for students and teachers
    CONSTRAINT check_student_teacher_required_fields 
    CHECK (
        (user_type IN ('Student', 'Teacher') AND school_id IS NOT NULL AND class IS NOT NULL AND section IS NOT NULL)
        OR 
        (user_type NOT IN ('Student', 'Teacher'))
    )
);

-- ============================================================================
-- TABLE: user_scores
-- ============================================================================
-- Stores session scores for each user's practice sessions
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    operation TEXT NOT NULL,
    variant TEXT NOT NULL,
    correct_count INTEGER DEFAULT 0,
    wrong_count INTEGER DEFAULT 0,
    total_time INTEGER DEFAULT 0, -- in seconds
    average_time NUMERIC(10, 1) DEFAULT 0, -- average time per correct answer
    total_questions INTEGER DEFAULT 0,
    session_data JSONB, -- stores detailed question results
    passed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Enable RLS on both tables
-- ============================================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_scores ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: user_profiles
-- ============================================================================

-- Policy 1: Users can SELECT their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile"
    ON public.user_profiles
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy 2: Users can INSERT their own profile
DROP POLICY IF EXISTS "Users can create own profile" ON public.user_profiles;
CREATE POLICY "Users can create own profile"
    ON public.user_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can UPDATE their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
    ON public.user_profiles
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can DELETE their own profile (optional - usually handled by CASCADE)
DROP POLICY IF EXISTS "Users can delete own profile" ON public.user_profiles;
CREATE POLICY "Users can delete own profile"
    ON public.user_profiles
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES: user_scores
-- ============================================================================

-- Policy 1: Users can SELECT their own scores
DROP POLICY IF EXISTS "Users can view own scores" ON public.user_scores;
CREATE POLICY "Users can view own scores"
    ON public.user_scores
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy 2: Users can INSERT their own scores
DROP POLICY IF EXISTS "Users can create own scores" ON public.user_scores;
CREATE POLICY "Users can create own scores"
    ON public.user_scores
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can UPDATE their own scores (if needed for corrections)
DROP POLICY IF EXISTS "Users can update own scores" ON public.user_scores;
CREATE POLICY "Users can update own scores"
    ON public.user_scores
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can DELETE their own scores (if needed)
DROP POLICY IF EXISTS "Users can delete own scores" ON public.user_scores;
CREATE POLICY "Users can delete own scores"
    ON public.user_scores
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- user_profiles indexes
-- Index on user_id (already unique, but explicit for joins)
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);

-- Index on email (if needed for lookups)
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

-- Index on user_type (for filtering by user type)
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON public.user_profiles(user_type);

-- Composite index on (school_id, class, section) for students and teachers
-- This index is useful for teacher-student lookups and queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_school_class_section 
ON public.user_profiles(school_id, class, section)
WHERE user_type IN ('Student', 'Teacher');

-- Unique partial index: only one teacher per (class, section)
-- This ensures that for each class+section combination, there is only one teacher
-- Note: Since school_id, class, and section are NOT NULL for teachers, we don't need NULL checks
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_unique_teacher_class 
ON public.user_profiles(class, section)
WHERE user_type = 'Teacher';

-- user_scores indexes
-- Index on user_id (for filtering by user)
CREATE INDEX IF NOT EXISTS idx_user_scores_user_id ON public.user_scores(user_id);

-- Index on user_id + passed (for fetching passed/failed variants)
CREATE INDEX IF NOT EXISTS idx_user_scores_user_id_passed ON public.user_scores(user_id, passed);

-- Index on user_id + operation (for filtering by operation)
CREATE INDEX IF NOT EXISTS idx_user_scores_user_id_operation ON public.user_scores(user_id, operation);

-- Index on user_id + operation + variant (for specific variant lookups)
CREATE INDEX IF NOT EXISTS idx_user_scores_user_id_operation_variant ON public.user_scores(user_id, operation, variant);

-- Index on completed_at (for ordering by date)
CREATE INDEX IF NOT EXISTS idx_user_scores_completed_at ON public.user_scores(completed_at DESC);

-- Composite index for common query pattern: user_id + passed + operation + variant
CREATE INDEX IF NOT EXISTS idx_user_scores_user_passed_op_var ON public.user_scores(user_id, passed, operation, variant);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on user_profiles
DROP TRIGGER IF EXISTS set_updated_at_user_profiles ON public.user_profiles;
CREATE TRIGGER set_updated_at_user_profiles
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
-- Grant necessary permissions to authenticated users
-- ============================================================================

-- Grant SELECT, INSERT, UPDATE, DELETE on user_profiles to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_scores TO authenticated;

-- Grant usage on sequences (if using SERIAL, but we're using UUID)
-- Not needed for UUID primary keys, but kept for reference

-- ============================================================================
-- VERIFICATION QUERIES (OPTIONAL - Run these to verify setup)
-- ============================================================================
-- Uncomment and run these queries in Supabase SQL editor to verify:

-- Check if tables exist:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('user_profiles', 'user_scores');

-- Check if RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('user_profiles', 'user_scores');

-- Check policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE schemaname = 'public' AND tablename IN ('user_profiles', 'user_scores');

-- Check indexes:
-- SELECT tablename, indexname, indexdef 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' AND tablename IN ('user_profiles', 'user_scores')
-- ORDER BY tablename, indexname;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. All policies use auth.uid() to ensure users can only access their own data
-- 2. Foreign key constraints ensure data integrity with CASCADE delete
-- 3. Indexes are optimized for common query patterns:
--    - Fetching user's own scores
--    - Filtering by passed/failed status
--    - Filtering by operation/variant
--    - Ordering by completion date
-- 4. JSONB column (session_data) can store flexible session data
-- 5. Timestamps are automatically managed (created_at, updated_at)
-- ============================================================================