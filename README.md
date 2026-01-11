# Learning Maths in Baby Steps

A progressive math learning application built with HTML, CSS, and JavaScript, deployed on Netlify with user authentication and data persistence.

## Features

- Multiple math operations: Addition, Subtraction, Multiplication, Division
- Progressive difficulty variants for each operation
- Multi-digit number support with right-to-left input
- Real-time scoring and session tracking
- User authentication via Supabase Authentication
- Score saving across devices with Supabase database
- Secure data access with Row Level Security (RLS)
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

3. **Set Up Supabase:**
   - Follow the detailed instructions in `SUPABASE_SETUP.md`
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Run the SQL schema from `supabase-schema.sql`
   - Get your API credentials and add them to `index.html`

4. **Configure Site Settings:**
   - Site URL should be automatically configured
   - The app will be available at `https://your-site-name.netlify.app`

### 2. Testing Locally

1. **Open the app:**
   - Simply open `index.html` in a browser, or
   - Use a local server:
     ```bash
     # Using Python 3
     python -m http.server 8000
     
     # Using Node.js http-server
     npx http-server
     ```

2. **Configure Supabase credentials:**
   - Before testing, make sure you've added your Supabase URL and Anon Key to `index.html`
   - See `SUPABASE_SETUP.md` for detailed instructions

### 3. Current Functionality

**Authentication:**
- Users can sign up and log in using Supabase Authentication
- Authentication state is maintained across page refreshes
- User sessions work across devices
- Email confirmation can be enabled/disabled in Supabase dashboard

**Data Persistence:**
- Scores are automatically saved to Supabase database after each session
- Data is accessed directly from the client using Supabase JS library
- Row Level Security (RLS) ensures users can only access their own data
- All operations are secure and protected

### 4. Supabase Setup (Required)

**Follow the detailed guide:** See `SUPABASE_SETUP.md` for complete step-by-step instructions.

**Quick summary:**
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `supabase-schema.sql` in the SQL Editor
3. Get your API credentials (URL and Anon Key)
4. Add credentials to `index.html` (replace `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY`)
5. Test authentication and score saving

**Files to reference:**
- `SUPABASE_SETUP.md` - Complete setup guide
- `supabase-schema.sql` - Database schema to run
- `index.html` - Add your credentials here (line ~1753)

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

- **"Supabase credentials not configured":** Make sure you've replaced `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY` in `index.html`
- **Login/Signup not working:** Check browser console (F12) for detailed error messages
- **Email confirmation:** Check Supabase dashboard → Authentication → Settings to configure email settings

### Database Issues

- **"Failed to save score":** 
  - Verify the `user_scores` table exists in Supabase
  - Check that RLS policies are created (run `supabase-schema.sql`)
  - Ensure user is logged in
- **Data not appearing:** Check Supabase dashboard → Table Editor → user_scores
- **Permission errors:** Verify Row Level Security policies are enabled and correct

## Future Enhancements

- [ ] User progress dashboard showing statistics
- [ ] Leaderboards for friendly competition
- [ ] Achievement badges and milestones
- [ ] Practice recommendations based on performance
- [ ] Export progress reports (PDF/CSV)
- [ ] Progress charts and graphs
- [ ] Multiple user profiles (parent/child accounts)

## License

This project is open source and available for educational use.
