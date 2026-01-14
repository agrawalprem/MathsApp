# Updating Your Existing Netlify Project

Since you already have a Netlify project, here's how to update it with your latest code.

## Option 1: Connect to GitHub (Recommended - Automatic Deployments)

If your Netlify project isn't connected to GitHub yet, connect it for automatic deployments:

### Steps:

1. **Go to Netlify Dashboard**
   - Visit: https://app.netlify.com
   - Find your existing project and click on it

2. **Connect to Git**
   - Go to **Site settings** → **Build & deploy** → **Continuous Deployment**
   - Click **"Link to Git provider"** or **"Connect to Git"**
   - Select **GitHub** (or your Git provider)
   - Authorize Netlify if prompted

3. **Select Your Repository**
   - Choose **"PremAgrawalMathsApp"** from the list
   - Select the branch: **`main`** (or `master`)

4. **Configure Build Settings**
   - **Build command:** Leave empty (no build needed)
   - **Publish directory:** `.` (current directory)
   - Click **"Save"**

5. **Trigger Deployment**
   - Netlify will automatically deploy your latest code
   - Or click **"Trigger deploy"** → **"Deploy site"** to deploy immediately

## Option 2: Manual Deploy (If Already Connected)

If your project is already connected to GitHub:

1. **Go to your project in Netlify Dashboard**
2. Click on **"Deploys"** tab
3. Click **"Trigger deploy"** → **"Deploy site"**
4. Netlify will pull the latest code from your GitHub repository

## Option 3: Manual File Upload (Quick Test)

If you just want to test quickly without Git:

1. **Go to your project in Netlify Dashboard**
2. Go to **"Deploys"** tab
3. Click **"Trigger deploy"** → **"Deploy manually"**
4. Drag and drop your project folder (or zip it first)
5. Click **"Deploy"**

**Note:** Manual uploads won't auto-update. Use Option 1 or 2 for automatic deployments.

## Verify Your Deployment

After deployment:

1. **Check the deploy log** for any errors
2. **Visit your site URL** to test
3. **Test authentication:**
   - Try signing up
   - Check if email confirmation works
   - Test login

## Update Supabase Redirect URLs

**IMPORTANT:** Make sure your Netlify site URL is in Supabase's allowed redirect URLs:

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication** → **URL Configuration**
4. Under **"Redirect URLs"**, add:
   - `https://your-netlify-site.netlify.app/**`
   - `https://your-netlify-site.netlify.app`
5. Click **"Save"**

## Check Current Configuration

To see your current Netlify settings:

1. **Site settings** → **Build & deploy**
   - Check if Git is connected
   - Verify build settings match `netlify.toml`

2. **Site settings** → **General**
   - Note your site URL
   - Check site name

## Troubleshooting

### "Build failed" Error
- Check the deploy log for specific errors
- Verify `netlify.toml` is in the root directory
- Ensure `index.html` exists in the root

### Changes Not Appearing
- Clear browser cache (Ctrl+F5 or Cmd+Shift+R)
- Check if the latest commit was deployed
- Verify you're looking at the correct site URL

### Authentication Issues
- Verify Supabase redirect URLs include your Netlify URL
- Check browser console (F12) for errors
- Ensure Supabase credentials are correct in `index.html`

---

**Quick Action:** If your project is already connected to GitHub, just push your latest changes and Netlify will auto-deploy!

```bash
git add .
git commit -m "Update for Netlify deployment"
git push
```
