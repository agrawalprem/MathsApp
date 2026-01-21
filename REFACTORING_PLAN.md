# Index.html Refactoring Plan

## Goal
Break down the monolithic `index.html` (4442 lines) into modular files organized by functionality.

## File Structure

### 1. Shared/Common Files
- `shared.css` - Common styles (body, container, buttons, modals)
- `shared.js` - Variants definitions, constants, common utilities

### 2. Database/Server Files  
- `db.js` - Supabase initialization, database queries, API calls

### 3. User Management (Authentication)
- `auth.css` - Authentication modal styles
- `auth.html` - Authentication modal HTML (inline in main file or separate)
- `auth.js` - Login, signup, password reset functions

### 4. User Header
- `header.css` - Header, navigation styles
- `header.js` - User display, logout functionality

### 5. User Dashboard
- `dashboard.css` - Dashboard, variant cards, progress display styles
- `dashboard.js` - Operation selection, variant loading, progress tracking

### 6. Question/Answer Page (Quiz)
- `quiz.css` - Question display, answer input, timer styles
- `quiz.js` - Question generation, answer checking, session management

### 7. Assignment Summary
- `summary.css` - Summary section styles
- `summary.js` - Score calculation, summary display

### 8. Session End
- `session.js` - Session termination, cleanup, state reset

## Loading Order in index.html

```html
<!-- CSS Files -->
<link rel="stylesheet" href="shared.css">
<link rel="stylesheet" href="auth.css">
<link rel="stylesheet" href="header.css">
<link rel="stylesheet" href="dashboard.css">
<link rel="stylesheet" href="quiz.css">
<link rel="stylesheet" href="summary.css">

<!-- JavaScript Files (order matters!) -->
<script src="shared.js"></script>
<script src="db.js"></script>
<script src="auth.js"></script>
<script src="header.js"></script>
<script src="dashboard.js"></script>
<script src="quiz.js"></script>
<script src="summary.js"></script>
<script src="session.js"></script>
```

## Global Variables (in shared.js)
- `variants` - All variant definitions
- `multiDigitVariants` - Multi-digit variant definitions
- `currentSession` - Current session state
- `timerInterval`, `timeElapsed`, `questionStartTime`, `answerTimeout`

## Global Variables (in db.js)
- `supabase` - Supabase client
- `SITE_URL` - Site URL constant
- `currentUser` - Current authenticated user
- `currentUserProfile` - Current user profile

## Notes
- Keep all global variables accessible across modules
- Functions should be in appropriate modules based on responsibility
- HTML structure remains in index.html but can be organized with comments
- CSS can be fully extracted to separate files