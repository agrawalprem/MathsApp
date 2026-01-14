# Supabase Email Not Sending - Troubleshooting Guide

If you're not receiving confirmation emails from Supabase, follow these steps:

## Step 1: Check Supabase Email Settings

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**
3. **Go to Authentication → Settings**
4. **Check "Enable email confirmations"**:
   - ✅ Should be **ENABLED** if you want email confirmation
   - ❌ If **DISABLED**, users are auto-confirmed (no email sent)

## Step 2: Check Email Provider Settings

1. **In Supabase Dashboard**: Authentication → Settings
2. **Scroll to "SMTP Settings"**
3. **Check if SMTP is configured**:
   - **If using default Supabase email service** (free tier):
     - Limited to 3 emails per hour per project
     - May have delivery delays
     - Emails might go to spam
   - **If using custom SMTP** (recommended for production):
     - Configure with your email provider (Gmail, SendGrid, etc.)
     - More reliable delivery

## Step 3: Check Email Templates

1. **In Supabase Dashboard**: Authentication → Email Templates
2. **Verify "Confirm signup" template exists**
3. **Check the template content** - it should include:
   - `{{ .ConfirmationURL }}` - the confirmation link
   - Proper email formatting

## Step 4: Check Spam Folder

- **Check your spam/junk folder**
- **Check "Promotions" tab** (Gmail)
- **Add Supabase emails to contacts** if found in spam

## Step 5: Check Supabase Logs

1. **In Supabase Dashboard**: Go to **Logs** → **Auth Logs**
2. **Look for email sending attempts**
3. **Check for errors** like:
   - "Rate limit exceeded"
   - "SMTP error"
   - "Email delivery failed"

## Step 6: Test with Different Email

- Try signing up with a **different email address**
- Some email providers block automated emails more aggressively
- Gmail, Outlook, Yahoo usually work best

## Step 7: Check Rate Limits

**Supabase Free Tier Limits:**
- 3 emails per hour per project (default email service)
- If you've sent 3 emails in the last hour, you'll need to wait

**Solution**: Upgrade to Pro plan or configure custom SMTP

## Step 8: Configure Custom SMTP (Recommended)

For reliable email delivery, configure custom SMTP:

1. **In Supabase Dashboard**: Authentication → Settings → SMTP Settings
2. **Enable "Use custom SMTP server"**
3. **Configure with your email provider**:

   **Example - Gmail:**
   - Host: `smtp.gmail.com`
   - Port: `587`
   - Username: `your-email@gmail.com`
   - Password: `your-app-password` (not regular password!)
   - Sender email: `your-email@gmail.com`
   - Sender name: `Your App Name`

   **Note**: Gmail requires an "App Password" (not your regular password)
   - Enable 2FA first
   - Generate App Password: https://myaccount.google.com/apppasswords

## Step 9: Disable Email Confirmation (Quick Fix)

If you want to skip email confirmation for testing:

1. **In Supabase Dashboard**: Authentication → Settings
2. **Disable "Enable email confirmations"**
3. **Save changes**
4. Users will be automatically confirmed after signup

**⚠️ Warning**: This is less secure but useful for testing

## Step 10: Verify Redirect URLs

Even if emails aren't sending, make sure redirect URLs are correct:

1. **In Supabase Dashboard**: Authentication → URL Configuration
2. **Redirect URLs should include**:
   - `https://your-site.netlify.app/**`
   - `https://your-site.netlify.app`

## Common Issues & Solutions

### Issue: "Rate limit exceeded"
**Solution**: Wait 1 hour or configure custom SMTP

### Issue: Emails go to spam
**Solution**: 
- Configure custom SMTP with verified domain
- Add SPF/DKIM records to your domain
- Ask users to check spam folder

### Issue: No emails at all
**Solution**:
- Check if email confirmation is enabled
- Check Supabase Auth logs
- Verify email address is valid
- Try different email provider

### Issue: Email confirmation link doesn't work
**Solution**:
- Verify redirect URLs in Supabase dashboard
- Check that link includes `access_token` in URL hash
- Ensure your site URL matches the redirect URL

## Testing Email Delivery

1. **Sign up with a test account**
2. **Check browser console** (F12) for any errors
3. **Check Supabase Auth logs** for email sending status
4. **Wait 1-2 minutes** (emails may be delayed)
5. **Check spam folder**

## Quick Diagnostic Checklist

- [ ] Email confirmations enabled in Supabase?
- [ ] Checked spam folder?
- [ ] Checked Supabase Auth logs?
- [ ] Tried different email address?
- [ ] Within rate limits (3/hour on free tier)?
- [ ] SMTP configured (if needed)?
- [ ] Redirect URLs configured correctly?

---

**Still not working?** Check the browser console (F12) when signing up to see what Supabase returns. The code will log any errors.
