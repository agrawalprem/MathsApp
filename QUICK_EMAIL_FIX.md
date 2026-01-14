# Quick Fix: Email Not Sending

## Most Common Cause: Email Confirmations Disabled

**If emails aren't sending, the most likely reason is that email confirmations are disabled in Supabase.**

### Quick Check (30 seconds):

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to: **Authentication** → **Settings**
4. Scroll to: **"Enable email confirmations"**
5. **Is it ON or OFF?**

### If it's OFF:
- **Option A**: Turn it ON to enable email confirmations
- **Option B**: Leave it OFF - users will be auto-confirmed (no email needed)

### If it's ON but still no emails:

1. **Check Supabase Auth Logs**:
   - Dashboard → **Logs** → **Auth Logs**
   - Look for email sending errors

2. **Check Rate Limits**:
   - Free tier: 3 emails/hour
   - If you've sent 3 in the last hour, wait

3. **Check Spam Folder**:
   - Emails often go to spam with default Supabase email service

4. **Try Different Email**:
   - Some providers block automated emails

## Quick Test:

1. Open browser console (F12)
2. Try signing up
3. Look for console messages starting with 📧
4. Check what Supabase returns

## Still Not Working?

See detailed guide: `SUPABASE_EMAIL_TROUBLESHOOTING.md`
