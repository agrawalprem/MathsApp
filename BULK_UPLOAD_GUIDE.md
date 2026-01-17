# Bulk Upload Students Guide

## Overview
Instead of having each student register individually, you can bulk upload all students at once using the admin panel.

## Password Options

### 1. Auto-Generate Passwords (Recommended)
- **How it works:** System generates a random 8-character password for each student
- **Pros:** Secure, unique passwords
- **Cons:** Need to distribute passwords to students
- **Use case:** When you can share passwords securely with students/parents

### 2. Default Password
- **How it works:** All students get the same password you specify
- **Pros:** Easy to remember, simple distribution
- **Cons:** Less secure, all students know each other's passwords
- **Use case:** Temporary passwords that students must change on first login

### 3. Student ID as Password
- **How it works:** Each student's password is their Student ID
- **Pros:** Easy to remember, no distribution needed
- **Cons:** Less secure, predictable
- **Use case:** Quick setup, students can change password later

## How to Use

### Step 1: Prepare Your Data
1. Open `bulk-upload-students.html` in your browser
2. Click "Download CSV Template" to get the format
3. Fill in your student data:
   ```
   student_id,first_name,last_name,gender,school_id,class,section,roll_number
   20000001,John,Doe,Male,2000,9,A,1
   20000002,Jane,Smith,Female,2000,9,A,2
   ```

### Step 2: Choose Password Option
- Select one of the three password options
- If using "Default Password", enter the password

### Step 3: Upload
1. Paste your CSV data into the text area, OR
2. Click "Choose File" and select your CSV file
3. Click "Upload Students"

### Step 4: Download Passwords (if auto-generated)
- If you chose "Auto-generate" or "Student ID as password"
- Click "Download Password File (CSV)" to get a file with all passwords
- Share this file securely with students/parents

## CSV Format

**Required columns (in order):**
1. `student_id` - Exactly 8 characters (e.g., "20000001")
2. `first_name` - Student's first name
3. `last_name` - Student's last name (can be empty)
4. `gender` - "Male", "Female", or "Other"
5. `school_id` - School ID number (required for students)
6. `class` - Class number (1-12, required for students)
7. `section` - Section letter/number (e.g., "A", "1", required for students)
8. `roll_number` - Roll number

**Example:**
```csv
student_id,first_name,last_name,gender,school_id,class,section,roll_number
20000001,John,Doe,Male,2000,9,A,1
20000002,Jane,Smith,Female,2000,9,A,2
20000003,Bob,Johnson,Male,2000,9,B,1
```

## Important Notes

### Prerequisites
- **Required fields:** `school_id`, `class`, and `section` must be provided for all students
- **Student IDs must be unique:** Each student_id can only be used once
- **Student IDs must be 8 characters:** Exactly 8 characters, no more, no less

### Security Considerations
- **Service Role Key Required:** The bulk upload uses Supabase Admin API which requires the service role key (not the anon key)
- **Update the key:** In `bulk-upload-students.html`, replace the anon key with your service role key for admin operations
- **Keep it secure:** Don't commit the service role key to version control

### After Upload
- Students can immediately log in with their Student ID and password
- If email confirmation is enabled, it's automatically confirmed
- Students can change their password after first login (if you implement that feature)

## Troubleshooting

### "Missing required columns"
- Check that your CSV has all 8 required columns
- Column names must match exactly (case-sensitive)

### "student_id must be exactly 8 characters"
- Verify all student IDs are exactly 8 characters
- Remove any extra spaces

### "Foreign key constraint violation" or "Missing required fields"
- Ensure `school_id`, `class`, and `section` are provided for all students
- These fields are required and cannot be NULL for students

### "User already exists"
- Student ID is already registered
- Check if student was already uploaded
- Use a different student_id or delete the existing user first

## Service Role Key Setup

To use the bulk upload feature, you need to update `bulk-upload-students.html`:

1. Go to Supabase Dashboard → Settings → API
2. Copy the **Service Role Key** (not the anon key)
3. In `bulk-upload-students.html`, find:
   ```javascript
   const SUPABASE_ANON_KEY = 'your-anon-key';
   ```
4. Replace with:
   ```javascript
   const SUPABASE_SERVICE_ROLE_KEY = 'your-service-role-key';
   ```
5. Update the code to use service role key for admin operations

**⚠️ WARNING:** Service role key has full admin access. Keep it secure and never commit it to version control!

## Alternative: Server-Side Script

For better security, consider creating a server-side script (Node.js, Python, etc.) that:
- Runs on your server (not in browser)
- Uses service role key securely
- Can be called via API or command line
- Better for large-scale uploads

---

**Ready to upload?** Open `bulk-upload-students.html` and follow the steps!
