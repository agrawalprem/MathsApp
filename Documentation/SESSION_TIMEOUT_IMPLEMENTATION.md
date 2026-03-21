# Session Timeout Implementation Plan

## Overview
Implement a hard 30-minute (configurable) session timeout to prevent data corruption when devices are shared between students. Timeout duration is stored per school in the `schools` table.

## Requirements
1. **Hard timeout** (not inactivity-based) - session ends after X minutes from login
2. **Configurable per school** - stored in `schools.session_timeout_minutes` (5 minutes less than period length)
3. **Default for online students** - 120 minutes when `school_id` is null
4. **Auto sign-out** - redirect to `index.html` when timeout is reached
5. **Timer management** - start on sign-in, clear on sign-out

## Database Changes

### 1. Create/Update `schools` table
```sql
-- Create schools table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.schools (
    school_id TEXT PRIMARY KEY,
    school_name TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    session_timeout_minutes INTEGER DEFAULT 30, -- Default 30 minutes, can be customized per school
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add session_timeout_minutes column if table exists but column doesn't
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'schools' 
        AND column_name = 'session_timeout_minutes'
    ) THEN
        ALTER TABLE public.schools ADD COLUMN session_timeout_minutes INTEGER DEFAULT 30;
    END IF;
END $$;

-- Enable RLS on schools table
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read schools table (to get timeout)
DROP POLICY IF EXISTS "Users can view schools" ON public.schools;
CREATE POLICY "Users can view schools"
    ON public.schools
    FOR SELECT
    TO authenticated
    USING (true);
```

## Code Changes

### 1. Add global variables in `shared_db.js`
- `sessionTimeoutTimer` - stores the timeout timer ID
- `sessionTimeoutMinutes` - stores the timeout duration for current session

### 2. Add function to fetch session timeout
- `fetchSessionTimeout(schoolId)` - fetches timeout from schools table
- Returns timeout in minutes (default: 120 for online students, 30 if school not found)

### 3. Add timeout management functions
- `startSessionTimeout(timeoutMinutes)` - starts the hard timeout timer
- `clearSessionTimeout()` - clears the timeout timer
- `handleSessionTimeout()` - called when timeout is reached, signs out user

### 4. Integrate with authentication flow
- Call `startSessionTimeout()` when user signs in (in `initSupabase()` and `onAuthStateChange`)
- Call `clearSessionTimeout()` when user signs out
- Fetch timeout from schools table when user profile is loaded

## Implementation Steps

1. Create SQL migration file for schools table
2. Add timeout variables to `shared_db.js`
3. Add `fetchSessionTimeout()` function
4. Add `startSessionTimeout()`, `clearSessionTimeout()`, `handleSessionTimeout()` functions
5. Integrate timeout start in `initSupabase()` and `onAuthStateChange`
6. Integrate timeout clear in sign-out handlers
7. Test with different school configurations
