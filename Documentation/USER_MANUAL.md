# Learning Maths in Baby Steps - User Manual

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [For Students](#for-students)
4. [For Teachers](#for-teachers)
5. [Troubleshooting](#troubleshooting)

---

## Introduction

**Learning Maths in Baby Steps** is a Progressive Web Application (PWA) designed to help students learn arithmetic fundamentals through structured practice. The application covers four main operations: Addition, Subtraction, Multiplication, and Division, with 58 progressive variants that build from basic to advanced concepts.

### Key Features
- **Progressive Learning**: 58 variants organized in a structured learning sequence
- **Real-time Progress Tracking**: Students can see their pass/fail status for each variant
- **Teacher Dashboard**: Teachers can monitor all students' progress in real-time
- **Mobile-Friendly**: Works on smartphones, tablets, and desktop computers
- **Offline Capable**: Can be installed as a PWA for offline use
- **Session Management**: Automatic session timeout for security

---

## Getting Started

### Accessing the Application

1. **Open your web browser** (Chrome, Firefox, Safari, or Edge recommended)
2. **Navigate to** the application URL provided by your school
3. The login page will appear automatically

### First-Time Registration

1. Click the **"Registration"** button on the login page
2. Fill in the registration form:
   - **Email**: Your email address (will be used for login)
   - **Password**: Create a strong password (minimum 8 characters)
   - **Confirm Password**: Re-enter your password
   - **User Type**: Select "Student" or "Teacher"
   - **First Name**: Your first name
   - **Last Name**: Your last name
   - **Gender**: Select your gender
   - **School**: Select your school from the dropdown (if applicable)
   - **Class**: Enter your class (e.g., "5")
   - **Section**: Enter your section (e.g., "A")
   - **Roll Number**: Enter your roll number (for students only)
3. Click **"Register"**
4. **Check your email** for a confirmation link
5. Click the confirmation link in the email to activate your account
6. Return to the login page and log in with your email and password

### Logging In

1. Enter your **email address**
2. Enter your **password**
3. Click **"Login"**
4. You will be redirected to your dashboard (Student Dashboard or Teacher Dashboard)

### Installing as a PWA (Mobile/Tablet)

1. Open the application in your mobile browser
2. Look for an **"Install"** or **"Add to Home Screen"** prompt
3. Tap **"Install"** or **"Add"**
4. The app will be installed on your device and can be opened like a native app
5. You can use the app even when offline (after initial load)

### Forgot Password

1. Click **"Forgot Password?"** on the login page
2. Enter your email address
3. Click **"Send Reset Link"**
4. Check your email for a password reset link
5. Click the link and enter your new password
6. Return to the login page and log in with your new password

---

## For Students

### Student Dashboard Overview

After logging in, you will see the **Student Dashboard** with:
- Your name, class, and roll number at the top
- Four operation cards: **Addition (+), Subtraction (−), Multiplication (×), Division (÷)**
- A logout button

### Selecting an Operation

1. Click on one of the four operation cards (Addition, Subtraction, Multiplication, or Division)
2. The variant cards for that operation will appear below

### Understanding Variant Cards

Each variant card shows:
- **Variant Name**: The name of the variant (e.g., "1A0: Adding 0")
- **Status**: One of the following:
  - **"Not started"**: You haven't attempted this variant yet
  - **"✓ [time]s"**: You passed this variant (shows your best time)
  - **"✓ Passed"**: You passed this variant (no time recorded)
  - **"✗ [number] attempts"**: You failed this variant (shows number of failed attempts)

**Card Colors:**
- **White/Gray**: Not started
- **Green**: Passed
- **Red**: Failed

### Starting a Quiz

1. Select an operation (click on +, −, ×, or ÷)
2. Click on a variant card to start that quiz
3. The question page will load

### Taking a Quiz

#### Single-Digit Variants

1. A question will appear at the top (e.g., "5 + 3 = ?")
2. **Enter your answer** in the input box
3. Press **Enter** or wait for auto-submit (after 0.2 seconds)
4. You will see immediate feedback:
   - **Green background**: Correct answer
   - **Red text with correct answer**: Wrong answer
5. The next question will appear automatically
6. Continue until all questions are completed

#### Multi-Digit Variants

1. A multi-digit problem will appear in a vertical format:
   ```
   12345
   + 67890
   --------
   [Your answer]
   ```
2. **Enter digits from right to left** (units first, then tens, hundreds, etc.)
3. The cursor stays on the left side as you type
4. Digits will appear to the right of the cursor
5. Press **Enter** when complete or wait for auto-submit
6. If wrong, the correct answer will appear below your answer
7. Click **"Try Again"** to retry the same question, **"Next Question"** to continue, or **"Next Assignment"** to move to the next variant

### Quiz Rules

- **Single-Digit Variants**:
  - You must answer **90% or more correctly**
  - You must have **10% or fewer wrong answers**
  - Your **average time per correct answer must be less than 6 seconds**
  - If you meet all three criteria, you **PASS**
  - Otherwise, you **FAIL**

- **Multi-Digit Variants**:
  - You must answer **100% correctly** (all questions correct, zero wrong)
  - There is **no time limit**
  - If you meet the criteria, you **PASS**
  - Otherwise, you **FAIL**

### Viewing Your Results

After completing a quiz:
1. You will see a **Summary Page** with:
   - Operation and variant name
   - Total questions answered
   - Number of correct answers
   - Number of wrong answers
   - Total time taken
   - Average time per correct answer
   - **PASS** or **FAIL** status (in green or red)
   - Detailed list of all questions with your answers

2. Click **"Go Back"** to return to the dashboard

### Progress Tracking

- **Green cards** indicate variants you have passed
- **Red cards** indicate variants you have failed (after 3 failed attempts)
- **White/Gray cards** indicate variants you haven't started or haven't failed enough times yet
- Your progress is saved automatically and visible to your teacher

### Session Timeout

- Your session will automatically log out after a period of inactivity (typically 30-120 minutes, depending on your school's settings)
- If you see a timeout message, simply log in again
- Always click **"Logout"** when you're done to end your session securely

---

## For Teachers

### Teacher Dashboard Overview

After logging in as a teacher, you will see the **Teacher Dashboard** with:
- A header showing "Teacher Dashboard - Student Progress"
- A table/grid showing:
  - **Rows**: Each student in your class
  - **Columns**: Each variant (58 variants total)
  - **Cells**: Status for each student-variant combination

### Understanding the Dashboard Grid

**Column Headers:**
- First three columns: **Student**, **Class**, **Roll No.**
- Remaining columns: Variant codes (e.g., "1A0", "1A1", "3C9", etc.)

**Cell Status Indicators:**

1. **Empty Cell**: Student hasn't attempted this variant
2. **Number (e.g., "5")**: Student is actively working on this variant
   - **Green number**: Last question was correct
   - **Red number**: Last question was wrong
   - **Blue background**: Active session indicator
3. **Time (e.g., "3.5s")**: Student passed this variant (shows best time)
   - **Green background**: Passed status
4. **Number (e.g., "3")**: Student failed this variant (shows number of failed attempts)
   - **Red background**: Failed status
5. **Checkmark (✓)**: Student passed this variant (no time recorded)

### Collapsing/Expanding Operations

- Click the **"▼ 1"**, **"▼ 2"**, **"▼ 3"**, or **"▼ 4"** buttons to collapse/expand operation groups
- **Collapsed**: Hides basic variants (e.g., 1A0-1D, 2A-2D, 3A0-3C, 4A1-4C9)
- **Expanded**: Shows all variants

### Exporting to Excel

1. Click the **"Export to Excel"** button
2. An Excel file will be downloaded with:
   - All student data
   - All variant statuses
   - Color-coded cells (green for pass, red for fail, colored for active)
3. Open the file in Microsoft Excel or Google Sheets

### Real-Time Updates

- The dashboard **automatically polls every 5-10 seconds** to show:
  - Active sessions (students currently taking quizzes) - see [ACTIVE_SESSIONS_COLLECTION.md](./ACTIVE_SESSIONS_COLLECTION.md)
  - Newly completed assignments
  - Progress updates (question numbers for active sessions)
  - Updated pass/fail statuses
- You don't need to refresh the page manually

### Navigating Between Dashboards

- Click **"Student Dashboard"** to switch to student view (if you also have a student account)
- Click **"Log Out"** to end your session

### Monitoring Student Progress

**To check a specific student's progress:**
1. Find the student's row in the table
2. Scroll horizontally to see all variants
3. Look for:
   - **Green cells**: Variants the student has passed
   - **Red cells**: Variants the student has failed
   - **Numbers with colored background**: Active quiz sessions

**To check progress across variants:**
1. Scroll vertically to see all students
2. Look at a specific variant column
3. See which students have passed (green), failed (red), or are working on it (numbers)

---

## Troubleshooting

### Login Issues

**Problem**: "Invalid login credentials"
- **Solution**: Check that your email and password are correct. Use "Forgot Password?" if needed.

**Problem**: "Email not confirmed"
- **Solution**: Check your email inbox (and spam folder) for the confirmation link. Click it to activate your account.

**Problem**: "User not found"
- **Solution**: Make sure you've registered first. Contact your administrator if you believe you should have an account.

### Quiz Issues

**Problem**: Keyboard doesn't appear on mobile
- **Solution**: Tap the answer input field. If it still doesn't appear, try refreshing the page.

**Problem**: Answer disappears too quickly
- **Solution**: This is normal behavior. The answer is submitted automatically after 0.2 seconds to ensure it's recorded.

**Problem**: Can't see the correct answer after wrong answer
- **Solution**: For multi-digit variants, the correct answer appears below your answer. For single-digit variants, it appears in the question details on the summary page.

**Problem**: Quiz doesn't advance to next question
- **Solution**: Make sure you've entered an answer and pressed Enter, or wait for auto-submit. For multi-digit variants, click "Next Question" or "Try Again" button.

### Dashboard Issues

**Problem**: Variant cards don't show pass/fail status
- **Solution**: Refresh the page. Your status is saved in the database and will appear after refresh.

**Problem**: Teacher dashboard doesn't show student updates
- **Solution**: The dashboard updates automatically every 5 seconds. Wait a few seconds or refresh the page.

**Problem**: Can't see all variants in teacher dashboard
- **Solution**: Scroll horizontally. The table is wide. You can also collapse operation groups using the buttons.

### General Issues

**Problem**: Page doesn't load
- **Solution**: 
  - Check your internet connection
  - Try refreshing the page (Ctrl+R or Cmd+R)
  - Clear your browser cache
  - Try a different browser

**Problem**: Session times out too quickly
- **Solution**: This is set by your school administrator. Contact them if you need a longer session time.

**Problem**: Can't install as PWA
- **Solution**: 
  - Make sure you're using a supported browser (Chrome, Edge, Safari)
  - Make sure you're accessing the app over HTTPS
  - Look for the install prompt in your browser's address bar

**Problem**: App doesn't work offline
- **Solution**: 
  - Make sure you've installed it as a PWA
  - Make sure you've visited the app at least once while online
  - Some features require internet connection (login, saving scores)

### Getting Help

If you continue to experience issues:
1. **Contact your teacher** (for students) or **school administrator** (for teachers)
2. **Check browser console** for error messages (Press F12, go to Console tab)
3. **Take a screenshot** of any error messages
4. **Note the steps** that led to the problem

---

## Tips for Success

### For Students

1. **Practice regularly**: Consistent practice is key to improvement
2. **Start with easier variants**: Work through variants in order (1A0, 1A1, etc.)
3. **Focus on accuracy first**: Speed will come with practice
4. **Review wrong answers**: Check the summary page to see what you got wrong
5. **Take breaks**: Don't rush through too many variants at once
6. **Use the correct input method**: 
   - Single-digit: Type the full answer
   - Multi-digit: Enter digits from right to left (units first)

### For Teachers

1. **Monitor active sessions**: Check for students currently taking quizzes
2. **Export regularly**: Export to Excel for record-keeping
3. **Use collapse feature**: Hide basic variants to focus on advanced progress
4. **Check failed variants**: Red cells indicate students who need extra help
5. **Review pass times**: Green cells with times show student performance

---

## Glossary

- **Variant**: A specific type of math problem (e.g., "Adding 0", "Table of 2")
- **Operation**: One of the four math operations (Addition, Subtraction, Multiplication, Division)
- **Pass**: Successfully completed a variant according to the criteria
- **Fail**: Did not meet the pass criteria for a variant
- **Active Session**: A quiz that is currently in progress
- **PWA**: Progressive Web App - can be installed on devices like a native app
- **Session Timeout**: Automatic logout after a period of inactivity

---

**Version**: 1.0  
**Last Updated**: January 2024  
**For Support**: Contact your school administrator
