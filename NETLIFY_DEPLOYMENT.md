# Netlify Deployment Guide

This guide will walk you through deploying your Math Learning App to Netlify.

## Prerequisites

✅ Your code is already pushed to GitHub (you've done this!)
✅ Supabase credentials are configured in `index.html`
✅ `netlify.toml` is configured

## Step-by-Step Deployment

### Step 1: Go to Netlify Dashboard

1. Open your browser and go to: **https://app.netlify.com**
2. Sign in with your GitHub account (or create a Netlify account if you don't have one)

### Step 2: Import Your Project

1. In the Netlify dashboard, click the **"Add new site"** button (usually in the top right)
2. Select **"Import an existing project"**
3. Choose **"Deploy with GitHub"** (or GitLab/Bitbucket if your repo is there)
4. Authorize Netlify to access your GitHub repositories if prompted

### Step 3: Select Your Repository

1. Netlify will show a list of your GitHub repositories
2. Find and select **"PremAgrawalMathsApp"** (or whatever you named your repository)
3. Click on it to proceed

### Step 4: Configure Build Settings

Netlify should automatically detect your settings from `netlify.toml`, but verify:

- **Branch to deploy:** `main` (or `master` if that's your default branch)
- **Build command:** Leave empty (no build needed for static HTML)
- **Publish directory:** `.` (current directory, as specified in `netlify.toml`)

**Note:** Since this is a static HTML site, you don't need a build command. Just click **"Deploy site"**

### Step 5: Wait for Deployment

1. Netlify will start deploying your site
2. You'll see a deployment log showing the progress
3. This usually takes 1-2 minutes
4. Once complete, you'll see a success message with your site URL

### Step 6: Get Your Site URL

After deployment, Netlify will provide you with:
- **Site URL:** `https://your-site-name.netlify.app` (random name)
- You can customize this later in Site settings → Change site name

### Step 7: Configure Supabase Redirect URLs

**IMPORTANT:** You need to add your Netlify site URL to Supabase's allowed redirect URLs.

1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication** → **URL Configuration**
4. Under **"Redirect URLs"**, add:
   - `https://your-site-name.netlify.app/**`
   - `https://your-site-name.netlify.app`
5. Click **"Save"**

This ensures email confirmation links work correctly.

### Step 8: Test Your Deployment

1. Visit your Netlify site URL
2. Try to:
   - Sign up for a new account
   - Log in
   - Complete a math session
   - Check if scores are saved

### Step 9: Customize Your Site Name (Optional)

1. In Netlify dashboard, go to **Site settings**
2. Click **"Change site name"**
3. Enter a custom name (e.g., `prem-maths-app`)
4. Your new URL will be: `https://prem-maths-app.netlify.app`

## Automatic Deployments

Once connected, Netlify will automatically:
- ✅ Deploy whenever you push to the `main` branch
- ✅ Show deployment status in the dashboard
- ✅ Provide preview deployments for pull requests

## Troubleshooting

### Deployment Fails

- **Check the build log:** Click on the failed deployment to see error details
- **Verify `netlify.toml`:** Make sure it's in the root directory
- **Check file structure:** Ensure `index.html` is in the root

### Site Shows "Page Not Found"

- **Check publish directory:** Should be `.` (current directory)
- **Verify `index.html` exists:** It should be in the root of your repository

### Authentication Not Working

- **Verify Supabase redirect URLs:** Make sure your Netlify URL is added
- **Check browser console:** Look for any error messages
- **Verify credentials:** Ensure Supabase URL and key are correct in `index.html`

### Email Confirmation Links Don't Work

- **Check Supabase redirect URLs:** Must include your Netlify site URL
- **Format:** `https://your-site.netlify.app/**` (with the `/**` wildcard)

## Quick Reference

- **Netlify Dashboard:** https://app.netlify.com
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Your Site:** `https://your-site-name.netlify.app` (after deployment)

## Next Steps After Deployment

1. ✅ Test user registration and login
2. ✅ Test score saving functionality
3. ✅ Test on mobile devices
4. ✅ Share your site URL with users!

---

**Need Help?** Check the main `README.md` for more troubleshooting tips.
