-- ============================================================================
-- RE-ENABLE ROW LEVEL SECURITY (RLS)
-- This restores RLS and all policies
-- ============================================================================

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_scores ENABLE ROW LEVEL SECURITY;

-- Re-create all policies from supabase-schema.sql and supabase-teacher-migration.sql
-- Run those migration files to restore policies, or manually create them here

-- ============================================================================
-- To fully restore, run:
-- 1. supabase-schema.sql (for base policies)
-- 2. supabase-teacher-migration.sql (for teacher policies)
-- ============================================================================
