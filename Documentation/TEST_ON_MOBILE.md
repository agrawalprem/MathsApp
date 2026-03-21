# Testing the App on Mobile Devices

## Overview

Even though the service worker is disabled for development (no PWA features), you can still test the app on mobile devices using your computer's local server. The app will work perfectly in the mobile browser.

## Prerequisites

1. **Both devices on same network**: Your computer and mobile device must be connected to the same Wi-Fi network
2. **Local server running**: Start the server on your computer (see [START_LOCAL_SERVER.md](./START_LOCAL_SERVER.md))
3. **Firewall**: Windows Firewall may need to allow connections (usually prompts automatically)

## Steps

### Step 1: Find Your Computer's IP Address

**On Windows (PowerShell):**
```powershell
ipconfig
```

Look for **IPv4 Address** under your active network adapter (usually Wi-Fi or Ethernet). Example: `192.168.1.100`

**Alternative (Command Prompt):**
```cmd
ipconfig | findstr IPv4
```

### Step 2: Start Local Server

**Using Firebase (Recommended):**
```powershell
firebase serve
```

**Or using Python:**
```powershell
python -m http.server 8000
```

**Note the port number** from the terminal output:
- Firebase: Usually `5000`
- Python: Usually `8000` (or whatever you specified)

### Step 3: Access from Mobile Device

1. **On your mobile device**, open a web browser (Chrome, Safari, etc.)

2. **Enter the URL** using your computer's IP address:
   ```
   http://192.168.1.100:5000
   ```
   (Replace `192.168.1.100` with your actual IP and `5000` with your actual port)

3. **The app should load** and work normally!

### Step 4: Test Features

- ✅ Login with user code and password
- ✅ Navigate between pages
- ✅ Take quizzes
- ✅ View teacher dashboard
- ✅ All Firebase features (Firestore, Auth)

## Troubleshooting

### "Can't connect" or "Site can't be reached"

1. **Check IP address**: Make sure you're using the correct IP address
2. **Check port**: Verify the port number matches what's shown in terminal
3. **Check network**: Ensure both devices are on the same Wi-Fi network
4. **Check firewall**: Windows Firewall may be blocking connections
   - Go to Windows Defender Firewall → Allow an app through firewall
   - Allow your browser or Python/Node.js through firewall

### "Connection refused"

1. **Check server is running**: Make sure the server is still running on your computer
2. **Check port**: The port might have changed - check terminal output
3. **Try different port**: If port 5000 doesn't work, try 8000 or 8080

### Mobile browser shows "Not Secure" warning

- This is normal for local HTTP connections
- Click "Advanced" → "Proceed anyway" (or similar)
- The app will work fine - it's just a warning about non-HTTPS

## Alternative: Use Firebase Hosting (Production URL)

If local network testing is problematic, you can deploy to Firebase Hosting and test on mobile using the hosted URL:

1. **Deploy to Firebase:**
   ```powershell
   firebase deploy --only hosting
   ```

2. **Access on mobile:**
   ```
   https://maths-in-baby-steps.web.app
   ```
   (Or your custom domain if configured)

3. **Benefits:**
   - ✅ Works from anywhere (not just same network)
   - ✅ HTTPS (secure connection)
   - ✅ Can test PWA features if service worker is enabled
   - ✅ Real production environment

## Notes

- **Service Worker**: Disabled in development, so PWA features (install prompt, offline) won't work
- **Cache**: Disabled for development, so you'll always get fresh code
- **Performance**: May be slightly slower than localhost due to network latency
- **Hot Reload**: Changes require manual refresh on mobile (unlike localhost)

## Quick Reference

**Find IP:**
```powershell
ipconfig | findstr IPv4
```

**Start Server:**
```powershell
firebase serve
# or
python -m http.server 8000
```

**Mobile URL Format:**
```
http://[YOUR_IP]:[PORT]
```

**Example:**
```
http://192.168.1.100:5000
```
