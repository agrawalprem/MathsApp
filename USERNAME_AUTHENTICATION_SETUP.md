# Username Authentication Setup Guide

## Overview
The app has been updated to use **Student ID (username)** instead of email for authentication. This makes it easier for children to log in.

## How It Works
- **Kids enter:** Short Student ID (8 characters, e.g., "ABC12345")
- **System uses:** Internal email `student_id@premmaths.local` for Supabase authentication
- **Kids see:** Only their Student ID everywhere (never see the email)

## Database Setup

### Step 1: Run the SQL Migration
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run the SQL from `supabase-user-profiles.sql`
3. This creates the `user_profiles` table with all student fields

### Step 2: Verify the Table
Check that `user_profiles` table exists with these columns:
- `id` (UUID, primary key)
- `user_id` (UUID, links to auth.users)
- `student_id` (TEXT, 8 characters, unique)
- `email` (TEXT, internal email: student_id@premmaths.local)
- `first_name` (TEXT)
- `last_name` (TEXT, nullable)
- `gender` (Gender enum)
- `school_id` (SMALLINT)
- `class` (SMALLINT)
- `section` (TEXT)
- `roll_number` (SMALLINT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## What Changed in the Code

### 1. Authentication Modal
- **Login:** Student ID + Password fields
- **Signup:** All student information fields:
  - Student ID (8 characters)
  - First Name
  - Last Name
  - Gender (dropdown)
  - School ID
  - Class
  - Section
  - Roll Number
  - Password
  - Confirm Password

### 2. Authentication Logic
- **Login:** Converts Student ID → `student_id@premmaths.local` for Supabase
- **Signup:** 
  - Creates Supabase user with internal email
  - Creates entry in `user_profiles` table with all student info
- **Display:** Shows Student ID instead of email everywhere

### 3. User Profile Storage
- All student information is stored in `user_profiles` table
- Linked to Supabase `auth.users` via `user_id`
- Profile is fetched automatically after login

## Testing

### Test Signup
1. Click "Sign Up"
2. Fill in all fields:
   - Student ID: Exactly 8 characters (e.g., "STU12345")
   - First Name: Required
   - Last Name: Optional
   - Gender: Select from dropdown
   - School ID: Number
   - Class: Number (1-12)
   - Section: Text (e.g., "A")
   - Roll Number: Number
   - Password: At least 6 characters
   - Confirm Password: Must match
3. Submit
4. Check Supabase:
   - `auth.users` table: Should have user with email `STU12345@premmaths.local`
   - `user_profiles` table: Should have profile with all student info

### Test Login
1. Click "Log In"
2. Enter Student ID (same as used in signup)
3. Enter Password
4. Should log in successfully
5. Should see Student ID displayed in header (not email)

## Important Notes

### Student ID Requirements
- **Must be exactly 8 characters**
- Can contain letters and numbers
- Must be unique (enforced by database)

### Password Requirements
- **Minimum 6 characters**
- No other restrictions

### Email Confirmation
- If email confirmation is **enabled** in Supabase:
  - Users will receive confirmation email (to internal email)
  - They need to click the link to activate account
- If email confirmation is **disabled**:
  - Users are auto-logged in after signup
  - No email needed

### Internal Email Format
- Format: `{student_id}@premmaths.local`
- Example: `STU12345@premmaths.local`
- This email is **never shown to users**
- Only used internally for Supabase authentication


## Troubleshooting

### "Student ID must be exactly 8 characters"
- Make sure Student ID is exactly 8 characters
- Check for extra spaces (trimmed automatically)

### "Passwords do not match"
- Password and Confirm Password must be identical

### "Error creating user profile"
- Check that `user_profiles` table exists
- Check that all required fields are provided
- Check that all required fields are provided (school_id, class, section are required for students)

### User can't log in
- Verify Student ID is correct (8 characters)
- Check that user exists in `auth.users` table
- Check that internal email format is correct: `student_id@premmaths.local`

### Student ID not showing after login
- Check that `user_profiles` entry exists for the user
- Check browser console for errors
- Verify `fetchUserProfile()` is working

## Database Relationships

```
auth.users (Supabase)
  ↓ (user_id)
user_profiles
  - user_type: 'Student' or 'Teacher'
  - school_id, class, section: Required for students and teachers
  - Unique constraint: Only one teacher per (class, section) combination
```

**Important:** For students and teachers, `school_id`, `class`, and `section` are required fields and must be provided during signup.

## Next Steps

1. ✅ Run `supabase-user-profiles.sql` in Supabase
2. ✅ Test signup with a test student
3. ✅ Test login with the test student
4. ✅ Verify data appears in both `auth.users` and `user_profiles` tables
5. ✅ Verify Student ID displays correctly in UI

---

**All changes are complete!** The app now uses Student ID authentication instead of email.
