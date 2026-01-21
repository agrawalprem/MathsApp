# Global Variables Documentation

This document lists all global variables used across the application, including those exposed via `window` object and module-level variables that are accessed across files.

## Table of Contents
1. [Window-Exposed Variables](#window-exposed-variables)
2. [Module-Level Global Variables](#module-level-global-variables)
3. [Browser API Globals](#browser-api-globals)
4. [External Library Globals](#external-library-globals)

---

## Window-Exposed Variables

These variables are explicitly attached to the `window` object to make them accessible across different HTML pages and JavaScript modules.

### Session & State Management

#### `window.variants`
- **Type:** Object
- **Defined in:** `shared.js` (line 215)
- **Description:** Contains all variant definitions for all operations (addition, subtraction, multiplication, division), including both standard and multi-digit variants.
- **Structure:**
  ```javascript
  {
    addition: { '1A0': {...}, '1A1': {...}, ... },
    subtraction: { '2A': {...}, '2B': {...}, ... },
    multiplication: { '3A0': {...}, ... },
    division: { '4A1': {...}, ... }
  }
  ```
- **Used by:**
  - `student-dashboard.js` - `loadVariantsForOperation()`, `updateOperationCompletionStatus()`
  - `question.js` - `startSession()`, `generateAllQuestions()`, `displayQuestion()`
  - `summary.js` - `showSummary()`

#### `window.currentSession`
- **Type:** Object
- **Defined in:** `shared.js` (line 216)
- **Description:** Stores the current quiz session state, including questions, answers, timing, and results.
- **Structure:**
  ```javascript
  {
    operation: 'addition',
    variant: '1A0',
    questions: [...],
    askedQuestions: Set,
    questionIndex: 0,
    correctCount: 0,
    wrongCount: 0,
    totalTime: 0,
    results: [...],
    passed: boolean (optional)
  }
  ```
- **Used by:**
  - `question.js` - All quiz logic functions
  - `summary.js` - `showSummary()`, `endSession()`

#### `window.passedVariants`
- **Type:** Set
- **Defined in:** `shared_db.js` (lines 403, 475)
- **Description:** Set of variant keys (format: `"operation_variant"`) that the current user has passed.
- **Example:** `Set(["addition_1A0", "subtraction_2A", ...])`
- **Used by:**
  - `student-dashboard.js` - `updateOperationCompletionStatus()`, `loadVariantsForOperation()`
  - `shared_db.js` - `fetchPassedVariants()`

#### `window.failedVariants`
- **Type:** Set
- **Defined in:** `shared_db.js` (line 475)
- **Description:** Set of variant keys (format: `"operation_variant"`) where the user has failed all attempts (at least 3 attempts, all failed).
- **Example:** `Set(["addition_1A", "multiplication_3B", ...])`
- **Used by:**
  - `student-dashboard.js` - `loadVariantsForOperation()`
  - `shared_db.js` - `fetchFailedVariants()`

#### `window.selectedOperation`
- **Type:** String | null
- **Defined in:** `student-dashboard.js` (line 147)
- **Description:** Currently selected operation on the student dashboard ('addition', 'subtraction', 'multiplication', or 'division').
- **Used by:**
  - `student-dashboard.js` - `updateAuthUI()`, `selectOperation()`

#### `window.learningSequence`
- **Type:** Object
- **Defined in:** `student-dashboard.js` (line 181) and `teacher-dashboard.js` (line 18)
- **Description:** Defines the order in which variants should be displayed for each operation.
- **Structure:**
  ```javascript
  {
    addition: ['1A0', '1A1', '1A2', ...],
    subtraction: ['2A', '2B', '2C', ...],
    multiplication: ['3A0', '3A1', ...],
    division: ['4A1', '4A2', ...]
  }
  ```
- **Used by:**
  - `student-dashboard.js` - `loadVariantsForOperation()`
  - `teacher-dashboard.js` - `buildDashboardGrid()`

---

### Function Exports (Window-Exposed Functions)

These functions are exposed globally for use in HTML `onclick` handlers and cross-module access.

#### Authentication Functions (`index.js`)
- `window.showAnonymousUser`
- `window.showRegistration`
- `window.showLogin`
- `window.showForgotPassword`
- `window.startAsAnonymous`
- `window.handleRegistration`
- `window.handleLoginForm`
- `window.handleForgotPasswordForm`
- `window.handleResetPasswordForm`
- `window.updateSignupFieldsBasedOnUserType`

#### Database Functions (`shared_db.js`)
- `window.initSupabase`
- `window.fetchUserProfile`
- `window.saveScore`
- `window.fetchPassedVariants`
- `window.fetchFailedVariants`
- `window.handleEmailConfirmation`

#### Student Dashboard Functions (`student-dashboard.js`)
- `window.updateUserDisplay`
- `window.updateStudentDashboardHeader`
- `window.updateOperationCompletionStatus`
- `window.updateAuthUI`
- `window.selectOperation`
- `window.loadVariantsForOperation`
- `window.launchVariant`
- `window.goBackToRegistration`

#### Question/Quiz Functions (`question.js`)
- `window.startSession`
- `window.continueSession`
- `window.showTerminationModal`
- `window.updateQuestionPageHeader`
- `window.goBackToDashboard`
- `window.handleOnHold`
- `window.handleResume`
- `window.handleTryAgain`
- `window.handleNextQuestion`
- `window.handleNextAssignment`

#### Summary Functions (`summary.js`)
- `window.endSession`
- `window.showSummary`
- `window.resetSession`

---

## Module-Level Global Variables

These variables are declared at the module level (not inside functions) and are accessible within the same file and sometimes across files through imports or shared scope.

### Database Module (`shared_db.js`)

#### `supabase`
- **Type:** SupabaseClient | null
- **Description:** Supabase client instance for database operations.
- **Initialized in:** `initSupabase()` function
- **Used by:** All database query functions

#### `currentUser`
- **Type:** User | null
- **Description:** Current authenticated user object from Supabase Auth.
- **Updated by:** `initSupabase()`, auth state change listener
- **Used by:** All database functions that require authentication

#### `currentUserProfile`
- **Type:** Object | null
- **Description:** User profile data from `user_profiles` table, including name, class, section, roll number, etc.
- **Fetched by:** `fetchUserProfile()`
- **Used by:** Dashboard display functions, header updates

#### `isLoginMode`
- **Type:** Boolean
- **Description:** Tracks whether the UI is in login mode (currently unused, may be legacy).

#### `isFetchingProfile`
- **Type:** Boolean
- **Description:** Prevents multiple simultaneous profile fetches (mutex flag).
- **Used by:** `fetchUserProfile()` to prevent race conditions

### Session Module (`shared.js`)

#### `variants`
- **Type:** Object
- **Description:** Same as `window.variants` (also exposed globally).
- **Defined in:** `shared.js` (line 120)
- **Note:** This is the source object that gets exposed as `window.variants`.

#### `currentSession`
- **Type:** Object
- **Description:** Same as `window.currentSession` (also exposed globally).
- **Defined in:** `shared.js` (line 192)
- **Note:** This is the source object that gets exposed as `window.currentSession`.

#### `timerInterval`
- **Type:** Number | null
- **Description:** Interval ID returned by `setInterval()` for the quiz timer.
- **Used by:** `question.js` - `startTimer()`, `checkAnswer()`, `handleOnHold()`, `handleResume()`

#### `timeElapsed`
- **Type:** Number
- **Description:** Time elapsed for the current question in seconds (incremented every 100ms).
- **Used by:** `question.js` - `startTimer()`, `checkAnswer()`, `handleTryAgain()`
- **Used by:** `summary.js` - `showSummary()`

#### `questionStartTime`
- **Type:** Number
- **Description:** Timestamp (Date.now()) when the current question was displayed.
- **Set by:** `question.js` - `displayQuestion()`
- **Used by:** `question.js` - `checkAnswer()`

#### `answerTimeout`
- **Type:** Number | null
- **Description:** Timeout ID for answer input (currently unused, may be legacy).
- **Defined in:** `shared.js` (line 212)

### Teacher Dashboard Module (`teacher-dashboard.js`)

#### `supabase`
- **Type:** SupabaseClient
- **Description:** Supabase client instance (separate from `shared_db.js` instance).
- **Initialized in:** `initSupabase()` function

#### `currentUser`
- **Type:** User | null
- **Description:** Current authenticated teacher user.

#### `teacherProfile`
- **Type:** Object | null
- **Description:** Teacher's profile data from `user_profiles` table.

#### `students`
- **Type:** Array
- **Description:** Array of student profiles in the teacher's class and section.

#### `studentScores`
- **Type:** Array
- **Description:** Array of all score records for students in the teacher's class.

#### `allVariants`
- **Type:** Array
- **Description:** Flattened array of all variants for building the dashboard grid.
- **Structure:** `[{ operation: 'addition', variant: '1A0' }, ...]`

#### `learningSequence`
- **Type:** Object
- **Description:** Same structure as `window.learningSequence` (defined locally in teacher-dashboard.js).

---

## Browser API Globals

These are standard browser APIs that are used throughout the application.

### `window.location`
- **Type:** Location object
- **Used for:**
  - Navigation: `window.location.href = 'page.html'`
  - URL parsing: `window.location.hash`, `window.location.search`, `window.location.origin`, `window.location.pathname`
  - **Used in:** `index.js`, `shared_db.js`, `student-dashboard.js`, `question.js`, `summary.js`, `teacher-dashboard.js`

### `window.innerWidth` / `window.innerHeight`
- **Type:** Number
- **Description:** Viewport dimensions in pixels.
- **Used in:** `question.js` - Mobile/desktop detection for UI adjustments

### `window.URL`
- **Type:** URL constructor/utility
- **Used for:** Creating and revoking blob URLs for file downloads
- **Used in:** `teacher-dashboard.js` - `exportToExcel()`

### `window.history`
- **Type:** History object
- **Used for:** `window.history.replaceState()` to clean up URL hash
- **Used in:** `shared_db.js` - `cleanupURLHash()`

### `window.sessionStorage`
- **Type:** Storage object
- **Used for:** Storing quiz session data temporarily
- **Used in:** `question.js` - `startSession()`, `summary.js` - `endSession()`
- **Keys used:**
  - `'quizOperation'` - Operation name
  - `'quizVariant'` - Variant key
  - `'quizSessionData'` - Full session object (JSON stringified)

---

## External Library Globals

### `window.supabase`
- **Type:** Supabase library object
- **Source:** Loaded from CDN in `index.html`: `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/dist/umd/supabase.min.js`
- **Description:** Supabase JavaScript client library.
- **Used for:** `window.supabase.createClient()` to create Supabase client instances
- **Used in:** `shared_db.js`, `teacher-dashboard.js`

### `window.speechSynthesis` (Web Speech API)
- **Type:** SpeechSynthesis object
- **Description:** Browser's text-to-speech API.
- **Used in:** `question.js` - `speakQuestionAndAnswer()`

### `ExcelJS` (Teacher Dashboard)
- **Type:** ExcelJS library object
- **Source:** Loaded from CDN in `teacher-dashboard.html`
- **Description:** Library for generating Excel files.
- **Used in:** `teacher-dashboard.js` - `exportToExcel()`

---

## Notes

1. **Module Scope vs Global Scope:**
   - Variables like `currentUser`, `supabase`, `currentSession` are declared at module level but not always exposed to `window`.
   - Some modules (like `shared_db.js`) expose functions to `window` but keep variables module-scoped for encapsulation.

2. **Session Storage:**
   - Quiz session data is stored in `sessionStorage` to persist across page navigations (e.g., from `question.html` to `summary.html`).

3. **State Management:**
   - The application uses a mix of:
     - Global `window` variables for cross-page state (`window.currentSession`, `window.variants`)
     - Module-level variables for module-internal state (`timerInterval`, `timeElapsed`)
     - Session storage for temporary persistence
     - Supabase database for permanent persistence

4. **Naming Conventions:**
   - Variables exposed to `window` are typically camelCase
   - Module-level variables are also camelCase
   - Constants (like `SUPABASE_URL`) are UPPER_SNAKE_CASE

---

## Summary Table

| Variable | Type | Scope | Defined In | Purpose |
|----------|------|-------|------------|---------|
| `window.variants` | Object | Global | `shared.js` | All variant definitions |
| `window.currentSession` | Object | Global | `shared.js` | Current quiz session state |
| `window.passedVariants` | Set | Global | `shared_db.js` | User's passed variants |
| `window.failedVariants` | Set | Global | `shared_db.js` | User's failed variants |
| `window.selectedOperation` | String\|null | Global | `student-dashboard.js` | Selected operation on dashboard |
| `window.learningSequence` | Object | Global | `student-dashboard.js` | Variant display order |
| `supabase` | SupabaseClient | Module | `shared_db.js` | Database client |
| `currentUser` | User\|null | Module | `shared_db.js` | Authenticated user |
| `currentUserProfile` | Object\|null | Module | `shared_db.js` | User profile data |
| `timerInterval` | Number\|null | Module | `shared.js` | Timer interval ID |
| `timeElapsed` | Number | Module | `shared.js` | Current question time |
| `questionStartTime` | Number | Module | `shared.js` | Question start timestamp |

---

*Last Updated: 2026-01-21*
