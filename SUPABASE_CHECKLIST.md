# Supabase Configuration Checklist

Before proceeding further, verify these settings in your Supabase dashboard.

## 🔐 Authentication Settings

### 1. Email Confirmations
**Location:** Authentication → Settings

- [ ] **"Enable email confirmations"** - Check if it's ON or OFF
  - **ON** = Users must confirm email before logging in (emails will be sent)
  - **OFF** = Users are auto-confirmed (no emails sent, can login immediately)
  
  **For your case:** If emails aren't sending, check this first!

### 2. Site URL
**Location:** Authentication → URL Configuration

- [ ] **"Site URL"** should be set to: `https://your-netlify-site.netlify.app`
- [ ] This is the base URL for your application

### 3. Redirect URLs (Allowlist)
**Location:** Authentication → URL Configuration → Redirect URLs

- [ ] Must include:
  - `https://your-netlify-site.netlify.app`
  - `https://your-netlify-site.netlify.app/**`
  
- [ ] **Important:** The `/**` wildcard allows all paths on your site

### 4. Email Templates
**Location:** Authentication → Email Templates

- [ ] **"Confirm signup"** template exists
- [ ] Template contains: `{{ .ConfirmationURL }}` (the confirmation link)
- [ ] Email formatting looks correct

### 5. SMTP Settings (Optional but Recommended)
**Location:** Authentication → Settings → SMTP Settings

- [ ] Check if using **Default Supabase email service** or **Custom SMTP**
  - **Default:** Limited to 3 emails/hour (free tier)
  - **Custom:** More reliable, unlimited (requires setup)

## 🗄️ Database Tables

### 6. Verify Tables Exist
**Location:** Table Editor

- [ ] **`user_scores`** table exists
  - Columns: `id`, `user_id`, `operation`, `variant`, `correct_count`, `wrong_count`, `total_time`, `total_questions`, `session_data`, `completed_at`, `created_at`
  
- [ ] **`cities`** table exists
  - Columns: `country`, `state`, `city` (composite primary key)
  
- [ ] **`schools`** table exists
  - Columns: `school_id`, `school_name`, `city`, `state`, `country`, `created_at`

### 7. Row Level Security (RLS)
**Location:** Table Editor → Select table → Click "Policies" tab

- [ ] **`user_scores`** table has RLS enabled
- [ ] Policy exists for users to **INSERT** their own scores
- [ ] Policy exists for users to **SELECT** their own scores
- [ ] Policy exists for users to **UPDATE** their own scores (if needed)

## 🔑 API Credentials

### 8. Verify Credentials in Code
**Location:** `index.html` (around line 1754-1755)

- [ ] **SUPABASE_URL** matches your project URL
  - Format: `https://xxxxxxxxxxxxx.supabase.co`
  - Found in: Supabase Dashboard → Settings → API → Project URL
  
- [ ] **SUPABASE_ANON_KEY** matches your anon/public key
  - Format: Starts with `eyJhbGci...`
  - Found in: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`

## 📊 Logs & Monitoring

### 9. Check Auth Logs
**Location:** Logs → Auth Logs

- [ ] Check for any signup attempts
- [ ] Look for email sending errors
- [ ] Check for rate limit messages
- [ ] Verify redirect URL errors (if any)

### 10. Check Database Logs
**Location:** Logs → Postgres Logs

- [ ] Check for any database errors
- [ ] Verify RLS policy violations (if any)

## 🧪 Quick Test Checklist

### 11. Test Signup Flow
- [ ] Try signing up with a test email
- [ ] Check browser console (F12) for any errors
- [ ] Check Supabase Auth Logs for signup attempt
- [ ] Check if email was sent (if confirmations enabled)
- [ ] Check spam folder if email expected

### 12. Test Login Flow
- [ ] Try logging in with existing account
- [ ] Check browser console for errors
- [ ] Verify user session is created

### 13. Test Score Saving
- [ ] Complete a math session while logged in
- [ ] Check browser console for save errors
- [ ] Verify data appears in `user_scores` table in Supabase

## ⚠️ Common Issues to Check

### Issue: Emails Not Sending
- [ ] Email confirmations enabled?
- [ ] Rate limit exceeded? (3/hour on free tier)
- [ ] Check spam folder
- [ ] SMTP configured? (if using custom)

### Issue: Email Confirmation Links Don't Work
- [ ] Redirect URLs configured correctly?
- [ ] Site URL matches Netlify URL?
- [ ] Link includes `access_token` in URL hash?

### Issue: Database Errors
- [ ] Tables exist?
- [ ] RLS policies correct?
- [ ] User is logged in?
- [ ] Check Postgres logs for errors

### Issue: Authentication Errors
- [ ] API credentials correct in `index.html`?
- [ ] Supabase project active (not paused)?
- [ ] Check Auth logs for specific errors

## 📝 Quick Reference

**Supabase Dashboard:** https://supabase.com/dashboard

**Key Locations:**
- Authentication Settings: Dashboard → Authentication → Settings
- URL Configuration: Dashboard → Authentication → URL Configuration
- Tables: Dashboard → Table Editor
- RLS Policies: Table Editor → Select table → Policies tab
- Logs: Dashboard → Logs
- API Keys: Dashboard → Settings → API

---

## ✅ Priority Checks (Do These First)

1. **Email Confirmations** - ON or OFF? (This explains why emails aren't sending)
2. **Redirect URLs** - Includes your Netlify URL?
3. **Tables Exist** - `user_scores`, `cities`, `schools`?
4. **RLS Enabled** - On `user_scores` table?
5. **API Credentials** - Match in `index.html`?

---

**After checking these, you'll know exactly what needs to be fixed!**
