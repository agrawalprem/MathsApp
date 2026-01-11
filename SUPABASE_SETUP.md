# Supabase Setup Instructions

Follow these steps to set up Supabase for your math learning app.

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click **"New Project"**
4. Fill in:
   - **Name:** `PremAgrawalMathsApp` (or your preferred name)
   - **Database Password:** Create a strong password (save it securely)
   - **Region:** Choose closest to your users
   - **Pricing Plan:** Free tier is sufficient
5. Click **"Create new project"**
6. Wait 2-3 minutes for project to be created

## Step 2: Get Your API Credentials

1. In your Supabase project dashboard, go to **Settings** (gear icon in sidebar)
2. Click **API** in the settings menu
3. You'll see two important values:
   - **Project URL** (e.g., `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (a long JWT token starting with `eyJ...`)

**⚠️ Important:** Keep these credentials secure!

## Step 3: Create Database Table

1. In your Supabase dashboard, go to **SQL Editor** (in the left sidebar)
2. Click **"New query"**
3. Copy and paste this SQL:

```sql
-- Create user_scores table
CREATE TABLE IF NOT EXISTS user_scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation TEXT NOT NULL,
  variant TEXT NOT NULL,
  correct_count INTEGER NOT NULL DEFAULT 0,
  wrong_count INTEGER NOT NULL DEFAULT 0,
  total_time DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  session_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_scores_user_id ON user_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_user_scores_operation ON user_scores(operation);
CREATE INDEX IF NOT EXISTS idx_user_scores_variant ON user_scores(variant);
CREATE INDEX IF NOT EXISTS idx_user_scores_completed_at ON user_scores(completed_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE user_scores ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own scores
CREATE POLICY "Users can view their own scores"
  ON user_scores
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own scores
CREATE POLICY "Users can insert their own scores"
  ON user_scores
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own scores
CREATE POLICY "Users can update their own scores"
  ON user_scores
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own scores
CREATE POLICY "Users can delete their own scores"
  ON user_scores
  FOR DELETE
  USING (auth.uid() = user_id);
```

4. Click **"Run"** or press `Ctrl+Enter` (or `Cmd+Enter` on Mac)
5. You should see "Success. No rows returned"

## Step 4: Configure Authentication Settings

1. Go to **Authentication** → **Providers** in the sidebar
2. **Email** provider should already be enabled (default)
3. Optionally configure:
   - **Email templates** - Customize confirmation emails
   - **Email confirmation** - Enable/disable email verification
   - **Password requirements** - Adjust complexity rules

**For testing:** You can disable email confirmation:
- Go to **Authentication** → **Settings**
- Under **User Signups**, toggle **"Enable email confirmations"** OFF
- This allows immediate login without email verification

## Step 5: Add Credentials to Your App

1. Open `index.html` in your code editor
2. Find these lines near the top of the script section (around line 1752):
   ```javascript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL';
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
   ```

3. Replace them with your actual credentials:
   ```javascript
   const SUPABASE_URL = 'https://xxxxxxxxxxxxx.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
   ```

**⚠️ Security Note:** Since this is client-side code, the anon key is safe to expose. Row Level Security (RLS) policies ensure users can only access their own data.

## Step 6: Test Your Setup

1. Deploy your app to Netlify (or test locally)
2. Open your app in a browser
3. Try signing up with a test email
4. Complete a math session
5. Check your Supabase dashboard → **Table Editor** → **user_scores**
   - You should see your session data saved!

## Step 7: Verify Data is Saved

1. In Supabase dashboard, go to **Table Editor**
2. Click on **user_scores** table
3. You should see your test session data
4. Try logging out and logging back in - your progress should persist

## Troubleshooting

### "Supabase credentials not configured" error
- Make sure you've replaced `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY` with actual values
- Check for typos in the URL or key

### "Failed to save score" error
- Check browser console (F12) for detailed error messages
- Verify the `user_scores` table exists in Supabase
- Check that RLS policies are created correctly
- Ensure user is logged in

### Authentication not working
- Check that Email provider is enabled in Supabase
- If email confirmation is enabled, check your email (including spam)
- Try disabling email confirmation for testing

### Table not found error
- Make sure you ran the SQL script in Step 3
- Check the Table Editor to verify the table exists

## Next Steps

Once everything is working:
- ✅ Users can sign up and log in
- ✅ Scores are saved automatically after each session
- ✅ Progress persists across devices
- ✅ Data is secure with Row Level Security

You can now:
- View user progress in the Supabase dashboard
- Add more features like leaderboards
- Export data for analysis
- Set up backup policies

## Security Notes

- **Anon key is public** - This is safe because RLS policies restrict data access
- **Row Level Security** - Users can only see/modify their own scores
- **Secure passwords** - Supabase handles password hashing automatically
- **HTTPS only** - Always use HTTPS in production

Your app is now fully functional with authentication and database!
