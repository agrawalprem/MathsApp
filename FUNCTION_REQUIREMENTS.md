# Function Requirements Documentation

This document contains the requirements for all JavaScript functions in the application, written in reverse engineering format (requirements derived from code).

## Table of Contents
- [Database Module (db.js)](#database-module-dbjs)
- [Authentication Module (auth.js)](#authentication-module-authjs)
- [Header Module (header.js)](#header-module-headerjs)
- [Dashboard Module (dashboard.js)](#dashboard-module-dashboardjs)
- [Quiz Module (quiz.js)](#quiz-module-quizjs)
- [Summary Module (summary.js)](#summary-module-summaryjs)

---

## Database Module (db.js)

### `handleEmailConfirmation()`
**Requirements:**
- Check URL hash parameters for email confirmation or password reset tokens
- If type is 'signup' and access_token exists, log confirmation (Supabase processes automatically)
- If type is 'recovery' and access_token exists, show forgot password modal
- No return value

**Called From:**
- index.html (on page load, checks for email confirmation in URL)

### `cleanupEmailConfirmationUrl()`
**Requirements:**
- Check if URL hash contains access_token or type=signup or type=recovery
- If found, clean up URL hash after 1 second delay
- Remove hash from URL using history.replaceState
- No return value

**Called From:**
- initSupabase() (after processing email confirmation or password reset)

### `initSupabase()`
**Requirements:**
- Validate that Supabase library is loaded
- Validate Supabase URL and Anon Key are configured
- Validate URL format (must start with https:// and contain .supabase.co)
- Validate key format (must start with "eyJ")
- Create Supabase client with auth configuration (persistSession, autoRefreshToken, detectSessionInUrl)
- Check for existing session on page load
- Handle password reset links from URL
- Set up auth state change listener (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED)
- Call testDatabaseConnection() after initialization
- Handle errors gracefully with console logging

**Called From:**
- index.html (on page load, after Supabase library loads)

### `testDatabaseConnection()`
**Requirements:**
- Test Supabase connection by querying user_scores table
- Use count query with head: true for efficiency
- Handle errors gracefully (table may not exist)
- Log success or warnings to console
- No return value

**Called From:**
- initSupabase() (after Supabase client is created)

### `fetchUserProfile()`
**Requirements:**
- Prevent multiple simultaneous fetches using isFetchingProfile flag
- Return cached profile if already available
- Return null if no currentUser or supabase
- Query user_profiles table for current user's profile
- Add 10 second timeout to prevent hanging
- Handle errors gracefully (profile may not exist)
- Return profile data object or null

**Called From:**
- initSupabase() (when existing session found on page load)
- handleAuth() in auth.js (after successful login/signup)
- handleInlineLogin() in dashboard.js (after successful login)
- updateAuthUI() in dashboard.js (when updating UI for logged-in user)

### `fetchPassedVariants()`
**Requirements:**
- Clear passedVariants Set if no currentUser
- Query user_scores table for records where passed = true
- Add 5 second timeout to prevent hanging
- Store results as "operation_variant" keys in window.passedVariants Set
- Handle errors gracefully and continue without data
- No return value

**Called From:**
- handleInlineLogin() in dashboard.js (after successful login)
- updateAuthUI() in dashboard.js (when updating UI for logged-in user)
- selectOperation() in dashboard.js (when selecting an operation)
- endSession() in summary.js (after saving score)
- resetSession() in summary.js (when returning to dashboard)

### `fetchFailedVariants()`
**Requirements:**
- Clear failedVariants Set if no currentUser
- Query user_scores table for records where passed = false
- Add 5 second timeout to prevent hanging
- Store results as "operation_variant" keys in window.failedVariants Set
- Only mark as failed if not also in passedVariants (safety check)
- Handle errors gracefully and continue without data
- No return value

**Called From:**
- handleInlineLogin() in dashboard.js (after successful login)
- updateAuthUI() in dashboard.js (when updating UI for logged-in user)
- selectOperation() in dashboard.js (when selecting an operation)
- endSession() in summary.js (after saving score)
- resetSession() in summary.js (when returning to dashboard)

### `saveScore()`
**Requirements:**
- Return false if no currentUser or supabase
- Return false if currentSession is undefined or null
- Calculate average time per correct answer
- Create sessionData object with all session information
- Insert session data into user_scores table
- Return true on success, false on error
- Log errors to console

**Called From:**
- endSession() in summary.js (when session ends and user is logged in)

### `getUserScores(operation = null, variant = null)`
**Requirements:**
- Return null if no currentUser or supabase
- Query user_scores table for current user
- Filter by operation if provided
- Filter by variant if provided
- Order by completed_at descending
- Return array of score records or null on error

**Called From:**
- Not currently called in codebase (available for future use)

### `getUserProgress()`
**Requirements:**
- Return null if no currentUser or supabase
- Query all scores for current user
- Calculate total sessions, total questions, correct answers, wrong answers
- Build Set of completed variants (operation_variant format)
- Return progress object with statistics or null on error

**Called From:**
- Not currently called in codebase (available for future use)

---

## Authentication Module (auth.js)

### `showLoginModal()`
**Requirements:**
- Set isLoginMode to true
- Update modal title to "Log In"
- Update submit button text to "Log In"
- Show login fields, hide signup fields
- Set required attributes on login fields only
- Clear form fields
- Show forgot password link
- Display modal (flex)

**Called From:**
- toggleAuthMode() (when switching from signup to login)
- handleResetPassword() (after password reset, to show login)
- Referenced in index.html (but not directly called, uses toggleAuthMode)

### `showSignupModal()`
**Requirements:**
- Set isLoginMode to false
- Update modal title to "Sign Up"
- Update submit button text to "Sign Up"
- Show signup fields, hide login fields
- Set required attributes on signup fields only
- Clear all form fields
- Call updateSignupFieldsBasedOnUserType()
- Hide forgot password link
- Display modal (flex)

**Called From:**
- toggleAuthMode() (when switching from login to signup)
- index.html onclick="showSignupModal()" (user clicks Sign Up link)
- closeForgotPasswordModal() followed by showSignupModal() (back to login link)

### `updateSignupFieldsBasedOnUserType()`
**Requirements:**
- Get selected user type from signupUserType field
- If Student: make roll number required, show field
- If Teacher or Admin: make roll number optional, show field
- Update placeholder text based on user type
- No return value

**Called From:**
- showSignupModal() (when signup modal is displayed)
- index.html addEventListener('change') on signupUserType field (when user changes user type)

### `closeAuthModal()`
**Requirements:**
- Hide auth modal (display: none)
- Clear auth error message
- Reset auth form
- No return value

**Called From:**
- showForgotPasswordModal() (to close auth modal before showing forgot password modal)
- handleAuth() (after successful login/signup, to close modal)
- index.html onclick="closeAuthModal()" (user clicks X button to close modal)

### `showForgotPasswordModal()`
**Requirements:**
- Close auth modal if open
- Reset forgot password forms (show request form, hide reset form)
- Clear error and success messages
- Check URL for password reset token (type=recovery)
- If reset token found, show reset form instead of request form
- Display modal (flex)

**Called From:**
- handleEmailConfirmation() in db.js (when password reset token detected in URL)
- initSupabase() in db.js (when password reset token detected on page load)
- index.html onclick="showForgotPasswordModal()" (user clicks Forgot Password link)

### `closeForgotPasswordModal()`
**Requirements:**
- Hide forgot password modal (display: none)
- No return value

**Called From:**
- handleResetPassword() (after password reset, to close modal)
- index.html onclick="closeForgotPasswordModal()" (user clicks X button to close modal)

### `toggleAuthMode(event)`
**Requirements:**
- Prevent default event behavior
- If currently in login mode, show signup modal
- If currently in signup mode, show login modal
- No return value

**Called From:**
- index.html onclick="toggleAuthMode(event)" (user clicks link to switch between login/signup)

### `showAuthError(message)`
**Requirements:**
- Display error message in authError element
- Set error text color to red (#dc3545)
- No return value

**Called From:**
- handleAuth() (when authentication fails or times out)

### `handleForgotPassword(event)`
**Requirements:**
- Prevent default form submission
- Get email from forgotPasswordEmail field
- Validate email is provided
- Disable submit button and show "Sending..." text
- Call supabase.auth.resetPasswordForEmail with production URL redirect
- Show success message if email sent
- Hide form on success
- Show error message on failure
- Re-enable button in finally block
- Return false to prevent form submission

**Called From:**
- index.html onsubmit="handleForgotPassword(event)" (when user submits forgot password form)

### `handleResetPassword(event)`
**Requirements:**
- Prevent default form submission
- Get new password and confirm password
- Validate password is at least 6 characters
- Validate passwords match
- Verify user has valid session (from reset token)
- Call supabase.auth.updateUser to update password
- Sign out user after password update (they were only authenticated via recovery token)
- Clean up URL hash
- Close modal and show login after 2 seconds
- Show error message on failure
- Re-enable button in finally block
- Return false to prevent form submission

**Called From:**
- index.html onsubmit="handleResetPassword(event)" (when user submits password reset form)

### `handleAuth(event)`
**Requirements:**
- Prevent default form submission
- Clear previous errors
- Add loading class to form
- Disable submit button
- Set 30 second safety timeout
- If login mode:
  - Get email and password from authEmail and authPassword fields
  - Call supabase.auth.signInWithPassword
  - Fetch user profile after successful login
- If signup mode:
  - Collect all form data (email, name, user type, gender, school, class, section, roll number, password)
  - Validate all required fields
  - Validate password length (min 6 characters)
  - Validate passwords match
  - Call supabase.auth.signUp with email redirect URL
  - Handle "already registered" error by attempting sign in and creating profile if missing
  - Create user profile in user_profiles table if user has session
  - Show appropriate success message based on email confirmation requirement
- Update UI based on result (success/error)
- Clear safety timeout in finally block
- Handle all errors with user-friendly messages

**Called From:**
- index.html onsubmit="handleAuth(event)" (when user submits auth form)

### `handleLogout()`
**Requirements:**
- Call supabase.auth.signOut() if supabase and currentUser exist
- Clear currentUser and currentUserProfile
- Clear inline login form fields
- Call updateAuthUI() to update interface
- Handle errors gracefully

**Called From:**
- index.html onclick="handleLogout()" (user clicks Log Out button)

---

## Header Module (header.js)

### `updateUserDisplay(profile)`
**Requirements:**
- Get userDisplay element, return early if not found
- If profile provided:
  - Build display string from: full name (first + last), class+section, roll number
  - Join parts with spaces
  - Show userDisplay element
- If no profile:
  - Display "Logged in as: {email}" using currentUser email
  - Show userDisplay element
- No return value

**Called From:**
- handleInlineLogin() in dashboard.js (after fetching user profile)
- updateAuthUI() in dashboard.js (when updating UI for logged-in user)

---

## Dashboard Module (dashboard.js)

### `updateOperationCompletionStatus()`
**Requirements:**
- Return early if no currentUser
- Iterate through all operations (addition, subtraction, multiplication, division)
- For each operation, check if all variants are in passedVariants Set
- Add 'completed' class to operation card if all variants passed
- Remove 'completed' class otherwise
- No return value

**Called From:**
- handleInlineLogin() (after variants are loaded)
- updateAuthUI() (when updating UI for logged-in user)
- selectOperation() (when selecting an operation and variants are loaded)
- endSession() in summary.js (after saving score and refreshing variants)
- resetSession() in summary.js (when returning to dashboard)

### `handleInlineLogin(event)`
**Requirements:**
- Prevent default event if provided
- Get email and password from inline form
- Validate email is provided
- Disable login button and show "Logging in..." text
- Call supabase.auth.signInWithPassword
- Update currentUser immediately
- Hide login button, show logout button
- Show success message briefly
- Show dashboard immediately
- Fetch user profile in background
- Fetch passed and failed variants in background
- Update operation completion status after variants loaded
- Reset button state in finally block
- Return false to prevent form submission

**Called From:**
- index.html onsubmit="return handleInlineLogin(event);" (when user submits inline login form)

### `updateAuthUI()`
**Requirements:**
- If user is logged in:
  - Show dashboard immediately
  - Fetch user profile (if not cached)
  - Fetch passed and failed variants sequentially
  - Update operation completion status
  - Refresh variant cards if operation is selected
  - Hide login button, show logout button
  - Disable email/password fields
  - Hide signup link
  - Hide guest notice
  - Update user display
  - Clear variants container
  - Clear selected operation after delay
  - Show operations grid
- If user is logged out:
  - Show login button, hide logout button
  - Enable email/password fields
  - Show signup link
  - Clear user display
  - Clear passed/failed variants Sets
  - Remove visual indicators from variant and operation cards
  - Show dashboard with login form
  - Show guest notice
  - Show operations grid
  - Clear variants container
- No return value

**Called From:**
- initSupabase() in db.js (when existing session found or no session)
- Auth state change listener in db.js (on SIGNED_IN, SIGNED_OUT, USER_UPDATED events)
- handleAuth() in auth.js (after successful login/signup)
- handleLogout() in auth.js (after logout)
- handleResetPassword() in auth.js (after password reset)

### `selectOperation(operation)`
**Requirements:**
- Remove 'selected' class from all operation cards
- Add 'selected' class to clicked card (if event available)
- Set window.selectedOperation to operation
- If user is logged in:
  - Fetch latest passed/failed variants
  - Update operation completion status
  - Load variants for operation
- If user is not logged in:
  - Load variants without status
- No return value

**Called From:**
- index.html onclick="selectOperation('addition')" (and similar for other operations)

### `loadVariantsForOperation(operation)`
**Requirements:**
- Get variantsContainer element, return early if not found
- Show "Loading variants..." message
- Get variants for operation from variants object
- Get learning sequence for operation from window.learningSequence
- Sort variants by learning sequence (prioritize sequenced variants)
- For each variant:
  - Check if variant is passed or failed
  - Create variant card with appropriate class (passed/failed)
  - Set onclick to launchVariant
  - Display variant name and status
  - Append to container
- Log loaded variant count
- No return value

**Called From:**
- selectOperation() (when user selects an operation)
- updateAuthUI() (when refreshing variant cards for selected operation)
- endSession() in summary.js (after saving score, to refresh variant cards)
- resetSession() in summary.js (when returning to dashboard, to refresh variant cards)

### `launchVariant(operation, variant)`
**Requirements:**
- Hide dashboard section
- Clear variants container
- Call startSession(operation, variant) to begin quiz
- Handle error if startSession not found
- No return value

**Called From:**
- loadVariantsForOperation() (when user clicks on a variant card)

---

## Quiz Module (quiz.js)

### `hasNoCarry(first, second)`
**Requirements:**
- Convert both numbers to strings
- Pad shorter number with leading zeros
- Check each digit position from right to left
- Return true if no digit position has sum >= 10 (no carry)
- Return false if any position has sum >= 10 (has carry)

**Called From:**
- generateAllQuestions() (for addition variants with noCarry flag)

### `hasBorrow(first, second)`
**Requirements:**
- Convert both numbers to strings
- Pad shorter number with leading zeros
- Check each digit position from right to left
- Return true if any position requires borrow (firstDigit < secondDigit)
- Return false if no borrow needed

**Called From:**
- generateAllQuestions() (for subtraction variants with hasBorrow flag)

### `hasCarry(first, second)`
**Requirements:**
- Convert both numbers to strings
- Pad shorter number with leading zeros
- Check each digit position from right to left
- Return true if any position has sum >= 10 (has carry)
- Return false if no carry

**Called From:**
- generateAllQuestions() (for addition variants with hasCarry flag)

### `startSession(operation, variant)`
**Requirements:**
- Validate operation and variant are provided
- Initialize currentSession object with:
  - operation, variant
  - empty questions array
  - empty askedQuestions Set
  - questionIndex: 0
  - correctCount: 0, wrongCount: 0
  - totalTime: 0
  - empty results array
- Call generateAllQuestions(operation, variant)
- Show question section, hide summary section
- Call askNextQuestion() to start quiz

**Called From:**
- launchVariant() in dashboard.js
- Referenced in index.html onclick="continueSession()" (but continueSession calls askNextQuestion, not startSession)

### `generateAllQuestions(operation, variant)`
**Requirements:**
- Get variant configuration from variants object
- Generate questions based on operation type:
  - **Addition:**
    - Handle noCarry: generate first number, construct second digit-by-digit to avoid carry
    - Handle hasCarry: generate random pairs until carry is found
    - Handle 'same': generate all pairs where first = second
    - Handle excludeSame: skip pairs where first = second
    - Default: generate all combinations from ranges
  - **Subtraction:**
    - Handle noBorrow: generate first number, construct second digit-by-digit to avoid borrow
    - Handle hasBorrow: generate numbers with borrow requirement
    - Handle hasBorrowFromZero: generate first number with at least 2 zeros
    - Default: generate all combinations from ranges
  - **Multiplication:**
    - Handle onePerSecond: generate one first number, one question per second number (0-9)
    - Handle noZero/hasZero: filter first number by zero requirement
    - Handle sequential: generate in order (0-9 for second number)
    - Handle maxQuestions: generate limited random questions
    - Default: generate all combinations
  - **Division:**
    - Handle onePerSecond: generate one base first number, adjust for each second number (1-9)
    - Handle noZero/hasZero: filter/adjust first number by zero requirement
    - Handle maxQuestions: generate limited random questions
    - Default: generate all combinations
- Shuffle questions (except sequential variants)
- Store questions in currentSession.questions array
- No return value

### `askNextQuestion()`
**Requirements:**
- Check if 50 questions asked and more questions available → show termination modal
- Check if all questions completed → call endSession()
- Get current question from questions array
- Check if question already asked (safety check)
- Mark question as asked in askedQuestions Set
- Call displayQuestion(question)
- Call startTimer()
- No return value

**Called From:**
- startSession() (to begin quiz)
- checkAnswer() (after each answer, to move to next question)
- continueSession() (to continue after 50 questions)
- askNextQuestion() (recursively, when skipping already-asked questions)

### `displayQuestion(question)`
**Requirements:**
- Get operation and variant configuration
- Determine operation symbol (+, -, ×, ÷)
- Check if variant is multi-digit (rightToLeft flag)
- If multi-digit:
  - Hide regular question lines
  - Table will be shown by setupRightToLeftInput
- If standard:
  - Show regular question lines
  - Display first number in line1
  - Display operation and second number in line2
- Calculate required digits for answer
- Call setupRightToLeftInput() for multi-digit variants
- Call setupNormalInput() for standard variants
- Reset timeElapsed and questionStartTime
- Scroll question area to top on mobile
- No return value

**Called From:**
- askNextQuestion() (to display the current question)

### `setupNormalInput(question, requiredDigits)`
**Requirements:**
- Hide answerDisplay and multidigitTable
- Show answerInput field
- Clear input value
- Enable input field
- Reset background color to white
- Remove previous event listeners by cloning input element
- Add input event listener:
  - Check if input length >= requiredDigits
  - Parse and call checkAnswer() when complete
- Focus input after DOM update
- Select text on desktop (not mobile)
- Handle focus event to minimize scroll jump on mobile
- No return value

**Called From:**
- displayQuestion() (for standard variants that don't use multi-digit table)

### `setupRightToLeftInput(question, requiredDigits)`
**Requirements:**
- Hide answerInput and answerDisplay
- Show multidigitTable
- Convert question numbers to digit arrays
- Create 6-column table with 4 rows:
  - Row 1: First number (right-aligned)
  - Row 2: Operation symbol and second number (right-aligned)
  - Row 3: Answer input cells (focusable, tabindex=0)
  - Row 4: Correct answer display (initially empty)
- Store question data and cells in table object
- Set initial cursor position:
  - Division: 5th cell from left (index 4)
  - Other operations: rightmost cell (index 5)
- Add keydown handler for input cells:
  - Handle digits (0-9): place in calculated position, move focus
  - Handle Backspace/Delete: remove last digit
  - Handle Arrow keys: navigate between cells
  - Block other single character input
- Add click/touch handlers for mobile
- Add focus handler for proper scrolling
- Focus initial cell after DOM update (multiple attempts for mobile)
- No return value

**Called From:**
- displayQuestion() (for multi-digit variants that use right-to-left input table)

### `startTimer()`
**Requirements:**
- Clear existing timer interval
- Get variant configuration
- Hide timer element (always hidden)
- If variant has noTimeLimit:
  - Track time but don't display
  - Update timeElapsed every 100ms
- If variant has time limit:
  - Track time
  - Check if time >= 6 seconds
  - If timeout, call checkAnswer() with null answer
- No return value

**Called From:**
- askNextQuestion() (when a new question is displayed)

### `speakQuestionAndAnswer(question, correctAnswer)`
**Requirements:**
- Return Promise that resolves when speech completes
- Check if speechSynthesis is available
- Convert operation to word (plus, minus, times, divided by)
- Create speech utterance with text: "{first} {opWord} {second} equals {answer}"
- Set speech rate to 0.9, pitch to 1
- Resolve promise on utterance end or error
- Return immediately resolved promise if speech not supported

**Called From:**
- checkAnswer() (for standard variants when answer is wrong, to speak the correct answer)

**Called From:**
- checkAnswer() (for standard variants when answer is wrong, to speak the correct answer)

### `checkAnswer(question, userAnswer)`
**Requirements:**
- Clear timer interval
- Calculate time taken
- Determine if answer is correct (userAnswer === question.answer)
- Update currentSession.totalTime
- Increment correctCount or wrongCount
- If wrong:
  - Show correct answer (in table row 4 for multi-digit, line4 for standard)
- Record result in currentSession.results array
- Disable all input methods (normal input, answerDisplay, table cells)
- If wrong or no answer:
  - For multi-digit: wait 6 seconds, then move to next question
  - For standard: speak question and answer, wait 0.5s, then move to next question
- If correct:
  - Make input light green for standard variants (not multi-digit)
  - Wait 0.25 seconds, then move to next question
- No return value

**Called From:**
- setupNormalInput() (when user enters answer in normal input field)
- setupRightToLeftInput() (when user enters all digits in multidigit table)
- startTimer() (when time limit exceeded, with null answer)

### `showTerminationModal()`
**Requirements:**
- Display modal element (flex)
- No return value

**Called From:**
- askNextQuestion() (when 50 questions have been asked and more questions available)

**Called From:**
- askNextQuestion() (when 50 questions have been asked and more questions available)

### `continueSession()`
**Requirements:**
- Hide modal
- Increment currentSession.questionIndex
- Call askNextQuestion() to continue
- No return value

**Called From:**
- index.html onclick="continueSession()" (user clicks Continue button in termination modal)

**Called From:**
- index.html onclick="continueSession()" (user clicks Continue button in termination modal)

---

## Summary Module (summary.js)

### `endSession()`
**Requirements:**
- Hide termination modal if visible
- Clear timer interval
- Hide question section
- Show summary section
- Call showSummary() to display results
- If user is logged in:
  - Call saveScore() to save session data
  - Refresh passed and failed variants after save
  - Update operation completion status
  - Refresh variant cards if operation is selected and dashboard visible
- Log all actions to console
- No return value

**Called From:**
- askNextQuestion() in quiz.js (when all questions are completed)
- index.html onclick="endSession()" (user clicks End Session button)

### `showSummary()`
**Requirements:**
- Get session statistics (correct, wrong, total, time, average time)
- Get variant name and operation name
- Calculate wrong percentage
- Build stats HTML with all session information
- Display stats in summaryStats element
- Determine pass/fail:
  - Multi-digit variants: 100% correct required (no time limit)
  - Standard variants: wrong ≤ 10% AND average time ≤ 6 seconds
- Display PASS or FAIL with appropriate styling
- Store pass/fail result in currentSession.passed
- Build question details HTML with all results
- Display question details in questionDetails element
- No return value

**Called From:**
- endSession() (to display results after session ends)

### `resetSession()`
**Requirements:**
- Hide summary section
- If user is logged in:
  - Show dashboard
  - Refresh passed and failed variants
  - Update operation completion status
  - Refresh variant cards if operation is selected
- If user is not logged in:
  - Hide dashboard
- Re-enable answerInput
- Clear timer interval
- Note: Does NOT log out user (preserves session)
- No return value

**Called From:**
- index.html onclick="resetSession()" (user clicks Go Back button in summary)

---

## Notes

- All functions that interact with Supabase are async and should handle errors gracefully
- Functions that update UI should check if elements exist before manipulating them
- Functions that depend on global state (currentUser, currentSession, etc.) should validate state before proceeding
- Mobile-specific behavior is handled in several functions (focus, scrolling, keyboard)
- Multi-digit variants have special handling for input (right-to-left or left-to-right for division)
- All database operations include timeout protection to prevent hanging
