# Learning Maths in Baby Steps

A progressive math learning application built with HTML, CSS, and JavaScript, deployed on Netlify with user authentication and data persistence.

## Features

- Multiple math operations: Addition, Subtraction, Multiplication, Division
- Progressive difficulty variants for each operation
- Multi-digit number support with right-to-left input
- Real-time scoring and session tracking
- User authentication via Netlify Identity
- Score saving across devices (ready for Supabase integration)
- Mobile-responsive design

## Setup Instructions

### 1. Deploy to Netlify

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Connect to Netlify:**
   - Go to [Netlify](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect to your GitHub repository
   - Netlify will automatically detect the `netlify.toml` configuration

3. **Enable Netlify Identity:**
   - In your Netlify site dashboard, go to **Identity** → **Enable Identity**
   - Enable **Git Gateway** for user authentication
   - Go to **Identity** → **Settings and usage** → **Registration preferences**
   - Set registration to **Open** (or configure as needed)
   - Optionally, set up email confirmation if desired

4. **Configure Site Settings:**
   - Site URL should be automatically configured
   - The app will be available at `https://your-site-name.netlify.app`

### 2. Testing Locally (Optional)

To test Netlify Functions locally:

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Run local development server:**
   ```bash
   netlify dev
   ```

   This will:
   - Start a local server (usually on `http://localhost:8888`)
   - Enable Netlify Functions to run locally
   - Proxy Netlify Identity requests

### 3. Current Functionality

**Authentication:**
- Users can sign up and log in using Netlify Identity
- Authentication state is maintained across page refreshes
- User sessions work across devices

**Data Persistence:**
- Currently using placeholder functions that return success responses
- Functions are structured and ready for Supabase integration
- Score saving is called automatically when sessions end (if user is logged in)

### 4. Next Steps: Adding Supabase (When Ready)

When you're ready to add real database functionality:

1. **Create a Supabase project:**
   - Go to [Supabase](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Create the database table:**
   ```sql
   CREATE TABLE user_scores (
     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     user_id TEXT NOT NULL,
     operation TEXT NOT NULL,
     variant TEXT NOT NULL,
     session_data JSONB NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   CREATE INDEX idx_user_scores_user_id ON user_scores(user_id);
   CREATE INDEX idx_user_scores_operation ON user_scores(operation);
   ```

3. **Install Supabase in Netlify Functions:**
   - Create `netlify/functions/package.json`:
   ```json
   {
     "dependencies": {
       "@supabase/supabase-js": "^2.0.0"
     }
   }
   ```

4. **Add Environment Variables in Netlify:**
   - Go to Site settings → Environment variables
   - Add:
     - `SUPABASE_URL`: Your Supabase project URL
     - `SUPABASE_ANON_KEY`: Your Supabase anon key

5. **Update Functions:**
   - Uncomment the Supabase code in:
     - `netlify/functions/save-score.js`
     - `netlify/functions/get-scores.js`
     - `netlify/functions/get-user-progress.js`
   - Remove the placeholder return statements

### 5. File Structure

```
.
├── index.html              # Main application file
├── netlify.toml            # Netlify configuration
├── netlify/
│   └── functions/
│       ├── save-score.js          # Save user session scores
│       ├── get-scores.js          # Retrieve user scores
│       └── get-user-progress.js   # Get overall user progress
└── README.md               # This file
```

## Features Overview

### Math Operations & Variants

- **Addition:** Single-digit, multi-digit with/without carry
- **Subtraction:** Various difficulty levels
- **Multiplication:** Times tables (2-9), sequential and random
- **Division:** Dividing by 1-9

### User Features

- **Authentication:** Secure login/signup via Netlify Identity
- **Progress Tracking:** Save scores and progress (ready for database)
- **Session Management:** Track correct/wrong answers, timing
- **Multi-device Support:** Access progress from any device (when database is added)

### Mobile Optimization

- Responsive design for all screen sizes
- Touch-optimized input for multi-digit questions
- Keyboard-aware layout adjustments
- Sticky question area to prevent content jumping

## Troubleshooting

### Authentication Issues

- **Identity not working:** Ensure Identity is enabled in Netlify dashboard
- **Git Gateway not working:** Enable Git Gateway in Identity settings
- **Email confirmation:** Check Identity → Settings → Email templates

### Functions Not Working

- **Functions return 401:** Check that Identity is properly configured
- **CORS errors:** Functions include CORS headers, but check browser console
- **Local testing:** Use `netlify dev` for local function testing

## Future Enhancements

- [ ] Add Supabase database integration
- [ ] User progress dashboard
- [ ] Leaderboards
- [ ] Achievement badges
- [ ] Practice recommendations based on performance
- [ ] Export progress reports

## License

This project is open source and available for educational use.
