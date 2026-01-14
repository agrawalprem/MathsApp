# How to Add Your Supabase Credentials

## Quick Steps:

1. **Get Your Credentials:**
   - Go to https://app.supabase.com
   - Select your project
   - Click **Settings** (gear icon) → **API**
   - Copy:
     - **Project URL** (e.g., `https://xxxxxxxxxxxxx.supabase.co`)
     - **anon/public key** (long token starting with `eyJ...`)

2. **Update index.html:**
   - Open `index.html` in your editor
   - Find lines **1754-1755** (around the Supabase configuration section)
   - Replace:
     ```javascript
     const SUPABASE_URL = 'YOUR_SUPABASE_URL';
     const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
     ```
   - With your actual credentials:
     ```javascript
     const SUPABASE_URL = 'https://your-project-id.supabase.co';
     const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-key-here';
     ```

3. **Save and Test:**
   - Save the file
   - Open in browser
   - Open browser console (F12)
   - Look for:
     - ✅ "Supabase client initialized successfully" = Good!
     - ❌ "Supabase credentials not configured" = Still need to add credentials
     - ❌ "Invalid Supabase URL format" = Check your URL
     - ❌ "Invalid Supabase Anon Key format" = Check your key

## Example:

```javascript
// Before (placeholder):
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// After (your actual credentials):
const SUPABASE_URL = 'https://abcdefghijklmnop.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.abcdefghijklmnopqrstuvwxyz1234567890';
```

## Security Note:

The anon key is safe to expose in client-side code. Supabase uses Row Level Security (RLS) to protect your data. Users can only access their own data based on the RLS policies you set up.

## Troubleshooting:

- **"Supabase library not loaded"**: Check your internet connection
- **"Invalid URL format"**: Make sure URL starts with `https://` and ends with `.supabase.co`
- **"Invalid key format"**: Key should start with `eyJ` (it's a JWT token)
- **"user_scores table not found"**: Run the SQL from `supabase-schema.sql` in Supabase SQL Editor
