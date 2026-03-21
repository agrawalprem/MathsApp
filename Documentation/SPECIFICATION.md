# Learning Maths in Baby Steps - Specification

## Database and Database Maintenance Functions

The database of this application is maintained in Firestore using the following collections:
- `user_profiles` - Stores user profile information (name, class, school, email, etc.)
- `user_scores` - Stores quiz results and scores
- `schools` - Stores school configuration
- `classes` - Stores class information
- `active_sessions` - Tracks active quiz sessions

Data is maintained in denormalized form (user profile fields are duplicated in `user_scores` for easier querying).

### Administrator Functions

**Adding Users**
- Users are added through an Excel sheet using an upload tool.

**Deleting Users**
- A user may be deleted if he/she so wishes.
- User will be deleted using a database query.

**Modifying Users**
- `user_profiles` and `user_scores` collections will be updated in the following events:
  - Students get promoted to next class
  - A student's section is changed
  - Teacher or Principal changes
  - A student's password is to be reset (normally password will be date of birth in DDMMYY format)
- Users will be modified using a database query.

---

## Index Page (`index.html`)

### Layout: 6 Cards

The index page displays 6 cards in a responsive grid layout. **At any time, only one card can be open** (visible to the user).

1. **Welcome** (Static)
   - Toggle to show/hide content
   - Self-contained in HTML (no external JS files needed)
   - Content: Introduction to the learning method

2. **Registration** (Static)
   - Toggle to show/hide content
   - Self-contained in HTML (no external JS files needed)
   - Content: Contact administrator message

3. **Anonymous User** (Always Available)
   - Always visible and active
   - Functionality: Sign in anonymously

4. **Login** (Always Active)
   - Always visible and active (no inactive/hidden states)
   - Functionality: User code + password login
   - **Special behavior**: If a user is already logged in and clicks Login again, automatically log out the previous user first, then proceed with the new login

5. **Logout** (Always Active)
   - Always visible and active (no inactive/hidden states)
   - Functionality: Sign out current user

6. **Reset Password** (Static)
   - Toggle to show/hide content
   - Self-contained in HTML (no external JS files needed)
   - Content: Contact administrator message

### Card Toggle Behavior

**Key Principle**: Only one card can be open at a time.

- **Initial State**: When the app starts, all cards are closed (content hidden) and there is no logged-in user.
- **Opening a Card**: When a user clicks on any card, that card's content opens (becomes visible).
  - If another card is currently open, it automatically closes first
  - Then the clicked card opens
- **Closing a Card**: When a card is open and the user clicks on the same card, that card closes (content hidden).
- **Switching Cards**: When any card is open and the user clicks on another card:
  - The currently open card closes automatically
  - The clicked card opens
- **Only One Card Open**: At any given time, only one card's content is visible to the user.

**Implementation Note**: The `toggleCard()` function ensures only one card has the `.show` class at any time by removing `.show` from all cards before adding it to the clicked card.

### Authentication State Management

The application uses Firebase Authentication for managing user login state. **No custom state variables are needed** - Firebase Auth provides all necessary state management.

#### Firebase Auth State

**Type**: `auth.currentUser` is either a `User` object or `null`

- **When user is logged in**: 
  - `auth.currentUser` is a `User` object containing:
    - `uid` - Firebase Auth unique identifier
    - `email` - User's email address (or `null` for anonymous users)
    - Other Firebase Auth properties
- **When user is logged out**: 
  - `auth.currentUser` is `null`
- **State Monitoring**: 
  - `onAuthStateChanged(auth, callback)` listener automatically monitors login/logout state
  - Callback is triggered whenever auth state changes (login, logout, token refresh)
  - UI is updated automatically based on auth state

**No separate state variables needed** - Firebase Auth's `auth.currentUser` is the single source of truth for authentication state.

#### User Profile Data (Firestore)

**Storage**: User profile data (name, class, school, etc.) is stored separately from Firebase Auth in two places:

1. **`sessionStorage`** (Primary storage for persistence):
   - Key: `'currentUserProfile'`
   - Format: JSON string
   - Contains: `first_name`, `last_name`, `class`, `section`, `roll_number`, `school_id`, `user_type`, `date_of_birth`, etc.
   - Purpose: Persists user profile data across page navigations
   - Lifecycle: Cleared when browser tab closes or user logs out

2. **`window.currentUserProfile`** (Page-specific convenience variable, only on `index.html`):
   - Type: Object (parsed from `sessionStorage`) or `null`
   - Purpose: Convenience variable for immediate display in Logout card after login
   - Set by: Login flow after successful authentication
   - Fallback: If not set, `onAuthStateChanged` callback loads from `sessionStorage.getItem('currentUserProfile')`
   - Cleared by: Logout flow

**Important Distinction**:
- **Firebase Auth** (`auth.currentUser`): Manages authentication state (logged in/out, user identity)
- **Firestore Profile** (`currentUserProfile`): Stores additional user data (name, class, school) fetched from Firestore `user_profiles` collection
- These are **separate systems** - Firebase Auth handles authentication, Firestore stores profile data

**Data Flow**:
1. User logs in → Firebase Auth authenticates → `auth.currentUser` is set
2. App fetches profile from Firestore using `auth.currentUser.uid` or `auth.currentUser.email`
3. Profile stored in `sessionStorage` and `window.currentUserProfile` (on index.html)
4. Other pages load profile from `sessionStorage` when needed

### Login Flow

**Step 1: User Code Entry**
- Display user code input field (6-digit numeric only, pattern: `[0-9]{6}`, `inputmode="numeric"`)
- When user **enters** 6 digits, automatically fetch user details from Firestore `user_profiles` collection
- Display fetched user details:
  - Name: `first_name + " " + last_name`
  - School: School name (not code)
  - Class: `class + " " + section`
  - Roll Number: `roll_number`
  - Email: Stored but not visible to user
- Show message: "If User Details are correct, enter password. If not, Contact your Teacher"
- **Error Handling**:
  - If user code is not found: "User code is not correct. Contact your teacher"
  - If there is an error fetching data: Display appropriate error message

**Step 2: Password Entry**
- Display password input field with the following properties:
  - `type="password"` - Password is **always hidden** (invisible by default, standard HTML behavior)
  - No password visibility toggle is provided
  - Password format: 6-digit numeric only, pattern: `[0-9]{6}`, `inputmode="numeric"`
- **Error Handling**:
  - If password does not match: "Password is not correct. Contact your teacher"
  - If there is an error during login: Display appropriate error message

**Step 3: Authentication**
- If email and password match, authenticate user using Firebase Auth (`signInWithEmailAndPassword`)
- **Auto-logout on new login**: If a user is already logged in, automatically sign out the previous user first, then proceed with new login
- Store user profile in `sessionStorage` as `currentUserProfile` (JSON string)
- Set `window.currentUserProfile` (page-specific variable on index.html) for immediate display
- **Redirect based on user type**:
  - Students (`user_type === 'Student'`): Redirect to `student-dashboard.html`
  - Teachers (`user_type === 'Teacher'`): Redirect to `teacher-dashboard.html`
  - Principals and Administrators: Redirect to `teacher-dashboard.html` (uses same dashboard)

### Logout Flow

**Behavior:**
- Sign out the current user using Firebase Auth (`signOut(auth)`)
- Remove `currentUserProfile` from `sessionStorage`
- Clear `window.currentUserProfile` (if on index.html)
- Redirect to `index.html` with all cards closed (no card content visible)

**Logout Buttons:**
Logout buttons are present on the following pages:
- `index.html` (Logout card - "Sign Out" button)
- `student-dashboard.html` (Logout button in header)
- `teacher-dashboard.html` (Logout button in header)

All logout buttons have the same behavior:
1. Sign out current user via Firebase Auth
2. Clear `sessionStorage` (remove `currentUserProfile`)
3. Redirect to `index.html` with all cards closed

### Anonymous User Flow

**Behavior:**
- Display confirmation message
- After user confirms, sign in anonymously using Firebase Auth (`signInAnonymously`)
- Redirect to `student-dashboard.html`
- No provision for entering user details afterwards
- Automatic logout provisions apply (see below)

### Automatic Logout

Automatic logout occurs in the following conditions:

1. **Browser/Tab Close**: When the browser window or tab is closed
   - `sessionStorage` is automatically cleared by the browser
   - User must log in again when reopening the app

2. **Inactivity Timeout**: After 5 minutes of no user activity
   - Activity includes: mouse movement, keyboard input, clicks, touches, or scrolling
   - Timer resets on any user activity
   - When timeout occurs: User is signed out and redirected to `index.html`

3. **School Period Timeout**: After the school period timeout duration
   - Timeout duration is maintained in `schools` collection, field: `session_timeout_minutes`
   - Default: 30 minutes (if school not found or field not set)
   - When timeout occurs: User is signed out and redirected to `index.html`

**Note**: When a new user logs in while another user is already logged in, the previous user is automatically logged out as part of the login flow (see Login Flow Step 3 above). This is handled automatically - no separate logout action is needed.

---

## Implementation Details

### Files and Functions

**`index.html`** (All logic is self-contained - no external JavaScript files)

- **Static Card Toggle**: `toggleCard(cardId)` - Inline JavaScript (non-module) for Welcome, Registration, Reset Password cards
- **Login Flow**:
  - `window.fetchUserDetails()` - Step 1: Fetches user profile by user code from Firestore
  - `window.loginWithUserCode()` - Step 2: Authenticates user with email/password via Firebase Auth
  - `window.resetLoginForm()` - Resets login form to initial state
- **Anonymous Login**: `window.signInAnonymously()` - Signs in anonymously via Firebase Auth
- **Logout**: `window.handleLogout()` - Signs out current user via Firebase Auth
- **Auth State Monitor**: `onAuthStateChanged(auth, callback)` - Firebase listener that updates UI on auth state changes

**Note**: All functions are defined inline in `index.html` within `<script>` blocks. There is no external `index.js` file - all logic is self-contained in `index.html`.

### Firebase Configuration

**Firebase Instances:**
- Firebase App: `app` (from `initializeApp(firebaseConfig)`)
- Firebase Auth instance: `auth` (from `getAuth(app)`)
  - `auth.currentUser` - Current authenticated user (`User | null`)
- Firestore instance: `db` (from `getFirestore(app)`)

**Firebase Auth State:**
- `auth.currentUser` is the single source of truth for authentication state
- Type: `User | null`
- When logged in: `User` object with `uid`, `email`, etc.
- When logged out: `null`
- No custom state variables needed

### Session Storage

**Usage:**
- `sessionStorage.getItem('currentUserProfile')` - Retrieves user profile data (JSON string)
- `sessionStorage.setItem('currentUserProfile', jsonString)` - Stores user profile data
- `sessionStorage.removeItem('currentUserProfile')` - Removes user profile data on logout

**Purpose:**
- Persists user profile data across page navigations
- Automatically cleared when browser tab closes
- Pages load this data into local variables when needed

**Data Stored:**
- `currentUserProfile` - User profile from Firestore (name, class, school, etc.) as JSON string
- `quizOperation` - Current quiz operation (e.g., "addition")
- `quizVariant` - Current quiz variant (e.g., "1A0")

### CSS Classes

- `.card` - Base card styling
- `.card-content` - Card content container (hidden by default)
- `.card-content.show` - Visible card content (only one card can have this class at a time)
- `.card.inactive` - Not used (cards are always active per specification)
- `.card.active` - Not used (cards are always active per specification)

### Card Structure

Each card follows this HTML structure:
```html
<div class="card" onclick="toggleCard('cardId')">
    <div class="card-header">
        <h2>Card Title</h2>
        <span class="card-toggle" id="cardIdToggle">▼</span>
    </div>
    <div class="card-content" id="cardIdContent">
        <!-- Card content here -->
    </div>
</div>
```

### Card Toggle Logic

**For static cards (Welcome, Registration, Reset Password):**
- Toggle icon changes: `▼` (closed) ↔ `▲` (open)
- Content visibility: `display: none` (closed) ↔ `display: block` (open)
- Only one card's content can have `.show` class at a time
- Clicking a card closes any open card first, then opens the clicked card

**For dynamic cards (Login, Logout, Anonymous User):**
- Same toggle behavior applies
- No active/inactive state management needed
- Cards are always visible and functional

---

## Notes

- All static card content is self-contained within `index.html` (no external JavaScript files required)
- Firebase SDK is loaded as ES modules (`type="module"`)
- User profile data is denormalized in `user_scores` collection for efficient querying
- Password field uses standard HTML `type="password"` (always hidden, no visibility toggle)
- Login and Logout cards are always active - no need to hide or disable them based on auth state
- `auth.currentUser` is the single source of truth for authentication state (no custom state variables)

---

## What is there and Where?

There are 5 pages in this App:

- Welcome (Index) Page
- Student Dashboard
- Questions
- Summary
- Teacher Dashboard

One might imagine that once the App starts, all the pages are there, although he sees only one at a time. But that is not the case. At any time, there is only one page, the one he sees. There are no other pages. So, what happens to the data in other pages, or how are those pages created when required? The following is my understanding (AI agent to confirm or correct).

### Database

At present there are 5 collections in Firestore:
- `user_profiles` - User profile information
- `user_scores` - Quiz results and scores
- `schools` - School configuration
- `classes` - Class information
- `active_sessions` - Active quiz sessions

They are always available and data in them is fetched whenever required. They are also updated by the App.

### Host Server

Production copy of the App's code is stored in the host server (Firebase Hosting) and can be fetched when necessary.

### Cache

A copy of the App's code is also stored in the client. This is supposed to be updated, triggered by change in version of Service Worker. This has been causing a lot of confusion and for the present, cache has been disabled.

### Global Variables (Window Object)

The application uses minimal global variables. Functions are exposed on the `window` object for inline event handlers:

- `window.fetchUserDetails` - Login Step 1 function
- `window.loginWithUserCode` - Login Step 2 function
- `window.resetLoginForm` - Form reset function
- `window.signInAnonymously` - Anonymous sign-in function
- `window.handleLogout` - Logout function

**Page-Specific Variables** (only on `index.html`):
- `window.currentUserProfile` - Convenience variable used to display user info in the Logout card. Set after successful login for immediate use. The `onAuthStateChanged` callback loads from `sessionStorage.getItem('currentUserProfile')` as a fallback (e.g., after page refresh), so `sessionStorage` is the source of truth. Cleared on logout.

**Module-Scoped Variables** (only in `index.html` module script):
- `loginUserProfile` - Temporary variable used only during the login flow (Step 1 to Step 2). Not exposed globally.

### Browser Storage

The application uses browser-provided storage services to persist data across page navigations. These are not defined in any file - they are built-in browser APIs available to all web pages.

#### sessionStorage

**What it is:**
- `sessionStorage` is a browser API that provides temporary storage for data
- Similar to global variables, but data persists when navigating between pages
- Data is automatically cleared when the browser tab is closed
- Data is only available within the same browser tab (not shared across tabs)

**How it works:**
- **Store data**: `sessionStorage.setItem('key', 'value')`
- **Retrieve data**: `sessionStorage.getItem('key')`
- **Remove data**: `sessionStorage.removeItem('key')`
- **Clear all data**: `sessionStorage.clear()`

**Usage in this application:**

1. **User Profile Storage** (`currentUserProfile`)
   - **Stored in**: `index.html` after successful login
   - **Retrieved in**: `student-dashboard.html`, `teacher-dashboard.html` when pages load
   - **Removed in**: `index.html` on logout, `student-dashboard.html` on logout, `teacher-dashboard.html` on logout
   - **Purpose**: Keeps user profile data (name, class, school, etc.) available when navigating from login page to dashboard pages

2. **Quiz Session Data** (`quizOperation`, `quizVariant`)
   - **Stored in**: When starting a quiz (from dashboard)
   - **Retrieved in**: `question.html` to know which operation/variant is being tested
   - **Purpose**: Passes quiz configuration from dashboard to question page

**Why it's important:**
- When a user logs in on `index.html` and navigates to `student-dashboard.html`, the user profile data is still available because it's stored in `sessionStorage`
- Without `sessionStorage`, the application would need to fetch user profile data from Firestore on every page, which is slower and requires more database queries
- Data is automatically cleared when the tab closes, providing security (no persistent login data)

**Important Notes:**
- `sessionStorage` is not a file or variable defined in the codebase - it's a browser feature
- Data stored in `sessionStorage` is specific to the browser tab (each tab has its own storage)
- Data is lost when the browser tab is closed (unlike `localStorage` which persists until manually cleared)

---

## Function Reference: `index.html`

All authentication logic for the index page is contained within `index.html` as inline JavaScript. There is **no external JavaScript file** - all logic is self-contained in `index.html`.

### Functions in `index.html`

#### 1. `toggleCard(cardId)`

- **Purpose**: Toggles visibility of static card content (Welcome, Registration, Reset Password cards)
- **Location**: Inline `<script>` block (non-module)
- **Called by**: `onclick="toggleCard('welcome')"`, `onclick="toggleCard('registration')"`, `onclick="toggleCard('resetPassword')"`
- **Call frequency**: User-initiated (clicking static cards)
- **Behavior**: 
  - If card is closed: Opens it (adds `.show` class, changes toggle icon to `▲`)
  - If card is open: Closes it (removes `.show` class, changes toggle icon to `▼`)
  - **Ensures only one card's content is visible at a time**: Removes `.show` class from all cards before adding it to the clicked card

#### 2. `window.fetchUserDetails()`

- **Purpose**: Step 1 of login flow - Fetches user profile from Firestore by user code
- **Location**: Module script block (`<script type="module">`)
- **Called by**: 
  - `onclick="fetchUserDetails()"` (Continue button)
  - `onkeypress="if(event.key === 'Enter') fetchUserDetails()"` (Enter key in user code field)
- **Call frequency**: Once per login attempt (user-initiated)
- **Behavior**:
  - Validates 6-digit user code format
  - Queries Firestore `user_profiles` collection by `user_code`
  - Displays user details (name, school, class, section, roll number)
  - Stores profile in `loginUserProfile` variable for Step 2
  - Shows error if user code not found

#### 3. `window.loginWithUserCode()`

- **Purpose**: Step 2 of login flow - Authenticates user with email/password via Firebase Auth
- **Location**: Module script block (`<script type="module">`)
- **Called by**: 
  - `onclick="loginWithUserCode()"` (Log In button)
  - `onkeypress="if(event.key === 'Enter') loginWithUserCode()"` (Enter key in password field)
- **Call frequency**: Once per login attempt (user-initiated)
- **Behavior**:
  - Validates password is entered
  - Checks if `loginUserProfile` exists (user completed Step 1)
  - Extracts email from profile
  - **Auto-logout**: If `auth.currentUser` is not null (user already logged in), automatically calls `signOut(auth)` first
  - Calls Firebase `signInWithEmailAndPassword(auth, email, password)`
  - Stores user profile in `sessionStorage` as `currentUserProfile`
  - Sets `window.currentUserProfile` for immediate display
  - Redirects to `student-dashboard.html` or `teacher-dashboard.html` based on `user_type`
  - Shows error messages for wrong password, user not found, etc.

#### 4. `window.resetLoginForm()`

- **Purpose**: Resets login form to initial state (clears fields, hides user details, clears errors)
- **Location**: Module script block (`<script type="module">`)
- **Called by**: 
  - `onclick="resetLoginForm()"` (Reset button)
  - `onAuthStateChanged` callback when user logs out (automatic)
- **Call frequency**: 
  - User-initiated (clicking Reset button)
  - Automatic (when auth state changes to logged out)
- **Behavior**:
  - Clears `loginUserProfile` variable
  - Hides user details display
  - Clears user code and password input fields
  - Hides and clears error/success messages

#### 5. `window.signInAnonymously()`

- **Purpose**: Signs in user anonymously using Firebase Auth (no email/password required)
- **Location**: Module script block (`<script type="module">`)
- **Called by**: `onclick="signInAnonymously()"` (Continue as Anonymous User button)
- **Call frequency**: User-initiated (clicking anonymous user button)
- **Behavior**:
  - Calls Firebase `signInAnonymously(auth)`
  - Shows success message
  - Redirects to `student-dashboard.html` after 500ms delay
  - Shows error message if sign-in fails

#### 6. `window.handleLogout()`

- **Purpose**: Signs out current user from Firebase Auth
- **Location**: Module script block (`<script type="module">`)
- **Called by**: `onclick="handleLogout()"` (Sign Out button in Logout card on index.html)
- **Call frequency**: User-initiated (clicking Sign Out button)
- **Behavior**:
  - Calls Firebase `signOut(auth)`
  - Removes `currentUserProfile` from `sessionStorage`
  - Clears `window.currentUserProfile` (page-specific variable)
  - Shows success message
  - Shows error message if sign-out fails
  - Note: `onAuthStateChanged` listener automatically resets login form after logout

#### 7. `onAuthStateChanged` Callback

- **Purpose**: Monitors Firebase Auth state changes and updates UI accordingly
- **Location**: Module script block (`<script type="module">`)
- **Called by**: Firebase automatically whenever auth state changes (login, logout, token refresh)
- **Call frequency**: Automatic (triggered by Firebase on auth state changes)
- **Behavior**:
  - **When user signs in** (`auth.currentUser` is a `User` object):
    - Updates Login/Logout card visibility (hides Login card, shows Logout card)
    - Displays user info in Logout card (email, name, user type)
      - First checks `window.currentUserProfile` (set during login flow for immediate display)
      - If not available, loads from `sessionStorage.getItem('currentUserProfile')` (persists across page refreshes)
      - Parses JSON and displays name and user type
    - Handles anonymous users (shows "Anonymous User" instead of email)
  - **When user signs out** (`auth.currentUser` is `null`):
    - Updates Login/Logout card visibility (shows Login card, hides Logout card)
    - Clears `window.currentUserProfile` (page-specific variable)
    - Calls `resetLoginForm()` to reset login form

### Module-Level Variables

#### `loginUserProfile`
- **Type**: Object (user profile data) or `null`
- **Scope**: Module script block (not exposed globally)
- **Purpose**: Stores user profile fetched in Step 1, used in Step 2 for authentication
- **Set by**: `window.fetchUserDetails()` (after successful user code lookup)
- **Cleared by**: `window.resetLoginForm()` and when login completes

### Consolidation Status

**All logic is consolidated in `index.html`**. The current architecture is optimal: all authentication logic is self-contained in `index.html` as inline JavaScript, making it easy to understand and maintain. There is no external `index.js` file.

---

## Technical Summary

### Authentication State

- **Source of Truth**: `auth.currentUser` (Firebase Auth)
  - Type: `User | null`
  - When logged in: `User` object
  - When logged out: `null`
- **No Custom State Variables**: Firebase Auth manages all authentication state

### User Profile Data

- **Storage**: `sessionStorage.getItem('currentUserProfile')` (JSON string)
- **Page Variable**: `window.currentUserProfile` (only on index.html, convenience variable)
- **Source**: Firestore `user_profiles` collection
- **Separate from Auth**: Profile data is separate from Firebase Auth state

### Card Behavior

- **Only One Card Open**: At any time, only one card's content is visible
- **Toggle Logic**: Clicking a card closes any open card first, then opens the clicked card
- **Login/Logout Cards**: Always active, no inactive states

### Password Visibility

- **Always Hidden**: Password field uses `type="password"` (standard HTML behavior)
- **No Toggle**: No password visibility toggle is provided

### Redirect Logic

- **Students**: `student-dashboard.html`
- **Teachers/Principals/Administrators**: `teacher-dashboard.html`

### Logout Buttons

- **Locations**: `index.html`, `student-dashboard.html`, `teacher-dashboard.html`
- **Behavior**: Sign out, clear storage, redirect to `index.html` with all cards closed
