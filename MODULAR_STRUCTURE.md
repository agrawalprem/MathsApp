# Modular File Structure for Index.html Refactoring

This document outlines the planned modular breakdown of `index.html` into separate files.

## File Structure

```
├── index.html (main file - HTML structure, includes all modules)
├── shared.css (common styles)
├── shared.js (variants, constants, session state)
├── db.js (Supabase initialization, database queries)
├── auth.css (authentication modal styles)
├── auth.js (login, signup, password reset)
├── header.css (header navigation styles)
├── header.js (user display, logout)
├── dashboard.css (dashboard styles)
├── dashboard.js (operation selection, variant loading, progress)
├── quiz.css (question/answer styles)
├── quiz.js (question generation, answer checking, session flow)
├── summary.css (summary/results styles)
├── summary.js (score calculation, summary display)
└── session.js (session termination, cleanup)
```

## Loading Order in index.html

```html
<!-- CSS Files (load first) -->
<link rel="stylesheet" href="shared.css">
<link rel="stylesheet" href="auth.css">
<link rel="stylesheet" href="header.css">
<link rel="stylesheet" href="dashboard.css">
<link rel="stylesheet" href="quiz.css">
<link rel="stylesheet" href="summary.css">

<!-- JavaScript Files (order matters - dependencies first) -->
<script src="shared.js"></script>
<script src="db.js"></script>
<script src="auth.js"></script>
<script src="header.js"></script>
<script src="dashboard.js"></script>
<script src="quiz.js"></script>
<script src="summary.js"></script>
<script src="session.js"></script>
```

## Module Responsibilities

### shared.js
- `multiDigitVariants` object
- `variants` object
- Merging logic for variants
- `currentSession` state object
- `timerInterval`, `timeElapsed`, `questionStartTime`, `answerTimeout`

### db.js
- `SITE_URL`, `PASSWORD_RESET_REDIRECT_URL` constants
- `supabase` client initialization
- `currentUser`, `currentUserProfile` globals
- `isLoginMode` flag
- Supabase initialization (`initSupabase`)
- Database query functions (`fetchUserProfile`, `fetchPassedVariants`, `fetchFailedVariants`, `saveScore`)

### auth.js
- Authentication functions (`handleAuth`, `handleInlineLogin`, `handleLogout`)
- Modal management (`showLoginModal`, `showSignupModal`, `closeAuthModal`, `showForgotPasswordModal`, `closeForgotPasswordModal`)
- Form handling (`toggleAuthMode`, `updateSignupFieldsBasedOnUserType`)
- Email confirmation (`handleEmailConfirmation`, `cleanupEmailConfirmationUrl`)

### header.js
- `updateUserDisplay` function
- User info display logic

### dashboard.js
- `selectOperation` function
- `launchVariant` function
- `loadVariantsForOperation` function
- `updateOperationCompletionStatus` function
- `updateAuthUI` function (main UI update logic)

### quiz.js
- `startSession` function
- `generateAllQuestions` function
- `askNextQuestion` function
- `displayQuestion` function
- `setupNormalInput`, `setupRightToLeftInput` functions
- `startTimer` function
- `checkAnswer` function
- Helper functions (`hasNoCarry`, `hasBorrow`, `hasCarry`)

### summary.js
- `showSummary` function
- Summary display logic

### session.js
- `showTerminationModal` function
- `continueSession` function
- `endSession` function
- `resetSession` function

## Notes

1. All files share global scope - variables and functions are accessible across modules
2. Order of script loading is important - `shared.js` and `db.js` must load first
3. CSS can be fully extracted, HTML structure remains in `index.html`
4. Each module is self-contained but may depend on globals from earlier modules