# CSS Requirements Documentation

This document contains the requirements for all CSS rules and stylesheets in the application, written in reverse engineering format (requirements derived from code).

## Table of Contents
- [Shared CSS (shared.css)](#shared-css-sharedcss)
- [Authentication CSS (auth.css)](#authentication-css-authcss)
- [Header CSS (header.css)](#header-css-headercss)
- [Dashboard CSS (dashboard.css)](#dashboard-css-dashboardcss)
- [Quiz CSS (quiz.css)](#quiz-css-quizcss)
- [Summary CSS (summary.css)](#summary-css-summarycss)
- [Teacher Dashboard CSS (teacher-dashboard.css)](#teacher-dashboard-css-teacher-dashboardcss)

---

## Shared CSS (shared.css)

### Global Reset (`*`)
**Requirements:**
- Reset all margins to 0
- Reset all padding to 0
- Set box-sizing to border-box for all elements
- Apply to all elements using universal selector

**Used By:**
- All HTML elements (universal selector)

### Body Styles (`body`)
**Requirements:**
- Set font family to 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif
- Apply gradient background (135deg, #667eea to #764ba2)
- Set minimum height to 100vh and 100dvh (dynamic viewport height for mobile)
- Use flexbox layout with center justification
- Align items to flex-start for better mobile behavior
- Add 20px padding
- Hide horizontal overflow
- Enable smooth scrolling on iOS (-webkit-overflow-scrolling: touch)

**Used By:**
- index.html `<body>` element

### Container Styles (`.container`)
**Requirements:**
- White background
- 20px border radius
- 40px padding
- Box shadow (0 20px 60px rgba(0, 0, 0, 0.3))
- Maximum width 600px
- Full width (100%)
- Auto margins for centering
- Relative positioning to prevent shift when keyboard appears

**Used By:**
- index.html `<div class="container">`

### Common Button Styles (`.btn`)
**Requirements:**
- Gradient background (135deg, #667eea to #764ba2)
- White text color
- No border
- 12px vertical, 30px horizontal padding
- 8px border radius
- 16px font size
- Pointer cursor
- Transform transition (0.2s)
- Full width (100%)
- 600 font weight

**Used By:**
- index.html: All buttons with `class="btn"` (login, logout, submit, continue, end session, go back buttons)
- All modal buttons

### Button Hover (`.btn:hover`)
**Requirements:**
- Translate button up 2px on hover
- Smooth transition effect

### Button Disabled (`.btn:disabled`)
**Requirements:**
- 60% opacity
- Not-allowed cursor
- No transform (prevent hover effect)

### Utility Classes (`.hidden`)
**Requirements:**
- Display: none
- Used to hide elements without removing from DOM

**Used By:**
- JavaScript functions add/remove this class to show/hide elements:
  - `updateAuthUI()` in dashboard.js (login/logout buttons, dashboard section, guest notice)
  - `startSession()` in quiz.js (summary section)
  - `displayQuestion()` in quiz.js (question lines, answerInput, answerDisplay, multidigitTable)
  - `setupNormalInput()` in quiz.js (answerDisplay, multidigitTable)
  - `setupRightToLeftInput()` in quiz.js (answerInput, answerDisplay)
  - `endSession()` in summary.js (question section)
  - `resetSession()` in summary.js (summary section)
  - `updateUserDisplay()` in header.js (userDisplay element)
  - Various functions in dashboard.js (operation cards, variant cards, login/logout buttons)
- index.html: Elements with `class="hidden"` initially (dashboardSection, questionSection, summarySection, etc.)

### Remove Spinner Arrows (`input[type=number]::-webkit-outer-spin-button`, `input[type=number]::-webkit-inner-spin-button`)
**Requirements:**
- Remove webkit spinner buttons
- Set appearance to none
- Zero margin

**Used By:**
- All number input fields:
  - index.html: `#answerInput`, `#signupSchoolId`, `#signupClass`, `#signupRollNumber`

### Number Input Styling (`input[type=number]`)
**Requirements:**
- Remove Firefox spinner (textfield appearance)
- Remove all spinner arrows across browsers

**Used By:**
- All number input fields:
  - index.html: `#answerInput`, `#signupSchoolId`, `#signupClass`, `#signupRollNumber`

### Mobile Styles - Tablet and Below (`@media (max-width: 768px)`)
**Requirements:**
- Body: align items to flex-start, 10px padding, use -webkit-fill-available for min-height
- Container: zero top margin, 20px vertical and 15px horizontal padding

### Mobile Styles - Small Devices (`@media (max-width: 480px)`)
**Requirements:**
- Body: 5px padding
- Container: 15px vertical and 10px horizontal padding, 15px border radius

---

## Authentication CSS (auth.css)

### Modal Styles (`.modal`)
**Requirements:**
- Hidden by default (display: none)
- Fixed positioning covering full viewport
- Semi-transparent black background (rgba(0, 0, 0, 0.5))
- Z-index 1000
- Flexbox with center alignment

**Used By:**
- index.html: `#modal` (termination modal)
- `showTerminationModal()` in quiz.js (displays modal)
- `continueSession()` in quiz.js (hides modal)

### Modal Content (`.modal-content`)
**Requirements:**
- White background
- 30px padding
- 15px border radius
- Center text alignment
- Maximum width 400px
- 90% width

### Modal Content Heading (`.modal-content h3`)
**Requirements:**
- 20px bottom margin
- Dark gray color (#333)

### Modal Buttons (`.modal-buttons`)
**Requirements:**
- Flexbox layout
- 15px gap between buttons
- 20px top margin

### Modal Buttons - Individual (`.modal-buttons button`)
**Requirements:**
- Flex: 1 (equal width buttons)

### Authentication Modal (`#authModal`)
**Requirements:**
- Hidden by default (display: none)
- Fixed positioning covering full viewport
- Semi-transparent black background
- Z-index 2000 (higher than regular modal)
- Flexbox with center alignment

**Used By:**
- index.html: `#authModal`
- `showLoginModal()` in auth.js (displays modal)
- `showSignupModal()` in auth.js (displays modal)
- `closeAuthModal()` in auth.js (hides modal)
- `handleAuth()` in auth.js (hides modal after successful auth)

### Auth Modal Content (`.auth-modal-content`)
**Requirements:**
- White background
- 30px padding
- 15px border radius
- Center text alignment
- Maximum width 400px
- 90% width
- Relative positioning

### Auth Modal Heading (`.auth-modal-content h3`)
**Requirements:**
- 20px bottom margin
- Dark gray color (#333)

### Authentication Form (`.auth-form`)
**Requirements:**
- Flexbox column layout
- 15px gap between form elements
- 20px bottom margin

**Used By:**
- index.html: `#authForm`
- `handleAuth()` in auth.js (adds/removes 'loading' class)

### Auth Form Inputs and Selects (`.auth-form input`, `.auth-form select`)
**Requirements:**
- 12px padding
- 2px solid #ddd border
- 8px border radius
- 16px font size
- White background
- Border color transition (0.3s ease)

### Auth Form Focus States (`.auth-form input:focus`, `.auth-form select:focus`)
**Requirements:**
- Remove default outline
- Change border color to #667eea
- Add box shadow (0 0 0 3px rgba(102, 126, 234, 0.1))

### Auth Form Select Styling (`.auth-form select`)
**Requirements:**
- Pointer cursor
- Remove default appearance
- Custom dropdown arrow (SVG background image)
- Arrow positioned right 12px, center vertical
- 40px right padding for arrow space

### Auth Error (`.auth-error`)
**Requirements:**
- Red color (#dc3545)
- 14px font size
- 10px top margin
- Minimum height 20px (prevent layout shift)

**Used By:**
- index.html: `#authError`, `#forgotPasswordError`, `#resetPasswordError`
- `showAuthError()` in auth.js (displays error messages)
- `handleForgotPassword()` in auth.js (displays errors)
- `handleResetPassword()` in auth.js (displays errors)

### Authentication Section (`.auth-section`)
**Requirements:**
- Center text alignment
- 20px bottom margin
- 15px padding
- Light gray background (#f8f9fa)
- 8px border radius

### Auth Status (`.auth-status`)
**Requirements:**
- 10px bottom margin

### Auth Status - Logged In (`.auth-status.logged-in`)
**Requirements:**
- Green color (#28a745)

### Auth Status - Logged Out (`.auth-status.logged-out`)
**Requirements:**
- Red color (#dc3545)

### Auth Buttons Container (`.auth-buttons`)
**Requirements:**
- Flexbox layout
- 10px gap
- Center justification
- Wrap on smaller screens

### Auth Buttons - Individual (`.auth-buttons button`)
**Requirements:**
- 8px vertical, 20px horizontal padding
- 14px font size

### Auth Buttons - Secondary (`.auth-buttons .btn-secondary`)
**Requirements:**
- Gray background (#6c757d)

### Auth Buttons - Secondary Hover (`.auth-buttons .btn-secondary:hover`)
**Requirements:**
- Darker gray background (#5a6268)

### Loading State (`.loading`)
**Requirements:**
- 60% opacity
- Disable pointer events

**Used By:**
- `handleAuth()` in auth.js (adds to `#authForm` during authentication) (prevent interaction while loading)

---

## Header CSS (header.css)

### Login Section (`.login-section`)
**Requirements:**
- 20px bottom margin
- 15px padding
- Light gray background (#f8f9fa)
- 10px border radius

**Used By:**
- index.html: `#loginSection`

### Login Form (`.login-form`)
**Requirements:**
- Flexbox layout
- 10px gap between elements
- Center vertical alignment
- Wrap on smaller screens

### Login Form Input (`.login-form input`)
**Requirements:**
- 10px padding
- 2px solid #ddd border
- 8px border radius
- 14px font size

### Login Form Input Focus (`.login-form input:focus`)
**Requirements:**
- Remove default outline
- Change border color to #667eea

### Login Error (`.login-error`)
**Requirements:**
- Red color (#dc3545)
- 12px font size
- 8px top margin
- Minimum height 16px

### User Display (`.user-display`)
**Requirements:**
- Green color (#28a745)
- 14px font size
- 8px top margin
- 500 font weight

**Used By:**
- index.html: `#userDisplay`
- `updateUserDisplay()` in header.js (displays user information)

---

## Dashboard CSS (dashboard.css)

### Operations Grid (`.operations-grid`)
**Requirements:**
- CSS Grid layout
- 4 equal columns (repeat(4, 1fr))
- 15px gap between cards
- 20px bottom margin

**Used By:**
- index.html: `<div class="operations-grid">`

### Operation Card (`.operation-card`)
**Requirements:**
- White background
- 2px solid #ddd border
- 10px border radius
- 20px padding
- Pointer cursor
- Smooth transitions (all 0.3s ease)
- Center text alignment

### Operation Card Hover (`.operation-card:hover`)
**Requirements:**
- Translate up 3px
- Box shadow (0 4px 8px rgba(0, 0, 0, 0.15))
- Border color changes to #667eea

### Operation Card Selected (`.operation-card.selected`)
**Requirements:**
- Border color #667eea
- Light blue background (#f0f4ff)

**Used By:**
- `selectOperation()` in dashboard.js (adds 'selected' class to clicked operation card)

### Operation Card Completed (`.operation-card.completed`)
**Requirements:**
- Light green background (#d4edda)
- Green border (#28a745)
- Dark green text (#155724)

**Used By:**
- `updateOperationCompletionStatus()` in dashboard.js (adds 'completed' class when all variants passed)

### Operation Card Completed Hover (`.operation-card.completed:hover`)
**Requirements:**
- Darker green background (#c3e6cb)

### Operation Symbol (`.operation-symbol`)
**Requirements:**
- 32px font size
- Bold font weight
- Purple color (#667eea)
- 5px bottom margin

### Operation Name (`.operation-name`)
**Requirements:**
- 14px font size
- Dark gray color (#333)
- 500 font weight

### Variants Container (`.variants-container`)
**Requirements:**
- CSS Grid layout
- Auto-fill columns with minimum 200px width
- 12px gap between cards
- 20px top margin

**Used By:**
- index.html: `#variantsContainer`
- `loadVariantsForOperation()` in dashboard.js (populates with variant cards)

### Variant Card (`.variant-card`)
**Requirements:**
- White background
- 2px solid #ddd border
- 10px border radius
- 20px padding
- Pointer cursor
- Smooth transitions (all 0.3s ease)
- Center text alignment

**Used By:**
- `loadVariantsForOperation()` in dashboard.js (creates variant cards dynamically)
- Cards can have 'passed' or 'failed' classes added

### Variant Card Hover (`.variant-card:hover`)
**Requirements:**
- Translate up 3px
- Box shadow (0 4px 8px rgba(0, 0, 0, 0.15))
- Border color changes to #667eea

### Variant Card Passed (`.variant-card.passed`)
**Requirements:**
- Light green background (#d4edda)
- Green border (#28a745)
- Dark green text (#155724)

**Used By:**
- `loadVariantsForOperation()` in dashboard.js (adds 'passed' class to cards for passed variants)

### Variant Card Passed Hover (`.variant-card.passed:hover`)
**Requirements:**
- Darker green background (#c3e6cb)

### Variant Card Failed (`.variant-card.failed`)
**Requirements:**
- Light red background (#f8d7da)
- Red border (#dc3545)
- Dark red text (#721c24)

**Used By:**
- `loadVariantsForOperation()` in dashboard.js (adds 'failed' class to cards for failed variants)

### Variant Card Failed Hover (`.variant-card.failed:hover`)
**Requirements:**
- Darker red background (#f5c6cb)

### Variant Name (`.variant-name`)
**Requirements:**
- 16px font size
- 500 font weight
- 5px bottom margin

### Variant Status (`.variant-status`)
**Requirements:**
- 12px font size
- Gray color (#666)

### Variant Card Passed - Status (`.variant-card.passed .variant-status`)
**Requirements:**
- Dark green color (#155724)
- 600 font weight

### Variant Card Failed - Status (`.variant-card.failed .variant-status`)
**Requirements:**
- Dark red color (#721c24)
- 600 font weight

### Guest Notice (`.guest-notice`)
**Requirements:**
- Center text alignment
- 15px padding
- Yellow background (#fff3cd)
- 2px solid yellow border (#ffc107)
- 8px border radius
- 20px bottom margin
- Brown text color (#856404)
- 14px font size

**Used By:**
- index.html: `#guestNotice`
- `updateAuthUI()` in dashboard.js (shows/hides based on login status)

### Dashboard Section (`.dashboard-section`)
**Requirements:**
- 30px bottom margin

### Header Styles (`.header`)
**Requirements:**
- Center text alignment
- 30px bottom margin

### Header Heading (`.header h1`)
**Requirements:**
- Dark gray color (#333)
- 10px bottom margin

### Setup Section (`.setup-section`)
**Requirements:**
- 30px bottom margin

### Setup Section Label (`.setup-section label`)
**Requirements:**
- Block display
- 8px bottom margin
- Gray color (#555)
- 600 font weight

### Setup Section Select (`.setup-section select`)
**Requirements:**
- Full width (100%)
- 12px padding
- 2px solid #ddd border
- 8px border radius
- 16px font size
- 15px bottom margin

---

## Quiz CSS (quiz.css)

### Question Container (`.question-container`)
**Requirements:**
- 30px top margin
- Sticky positioning (stays at top when scrolling)
- Top: 0 (sticks to top of viewport)
- White background
- Z-index 10 (above other content)
- 10px bottom padding
- 20px bottom margin
- Prevents question from moving when keyboard appears on mobile

**Used By:**
- index.html: `#questionSection` (has `class="question-container"`)
- `startSession()` in quiz.js (removes 'hidden' class to show section)
- `endSession()` in summary.js (adds 'hidden' class to hide section)

### Question Line (`.question-line`)
**Requirements:**
- 32px font size
- 15px vertical margin
- Right text alignment
- 10px padding
- Light gray background (#f8f9fa)
- 8px border radius
- 60px minimum height
- Flexbox layout
- Center vertical alignment
- Right justification
- 600 font weight
- Dark gray color (#333)
- 10px scroll margin top (for smooth scrolling)

**Used By:**
- index.html: `#line1`, `#line2` (question display lines)
- `displayQuestion()` in quiz.js (shows/hides and sets content)
- Can have 'multidigit' class added for multi-digit variants

### Question Line - Multi-digit (`.question-line.multidigit`)
**Requirements:**
- Monospace font (Courier New)
- 8px letter spacing

### Answer Input (`.answer-input`)
**Requirements:**
- 32px font size
- Right text alignment
- 3px solid purple border (#667eea)
- 8px border radius
- 10px vertical, 15px horizontal padding
- Full width (100%)
- 15px vertical margin
- 600 font weight
- 20px scroll margin top (prevents scroll jump on mobile)

**Used By:**
- index.html: `#answerInput`
- `setupNormalInput()` in quiz.js (shows for standard variants)
- `setupRightToLeftInput()` in quiz.js (hides for multi-digit variants)

### Answer Input Focus (`.answer-input:focus`)
**Requirements:**
- Remove default outline
- Change border color to #764ba2
- Auto scroll behavior (prevents auto-scroll on mobile when keyboard appears)

### Answer Input - Remove Spinner (`.answer-input::-webkit-outer-spin-button`, `.answer-input::-webkit-inner-spin-button`)
**Requirements:**
- Remove webkit spinner buttons
- Set appearance to none
- Zero margin

### Answer Input - Number Type (`.answer-input[type=number]`)
**Requirements:**
- Remove Firefox spinner (textfield appearance)
- Remove all spinner arrows

### Answer Display (`.answer-display`)
**Requirements:**
- 32px font size
- Right text alignment
- 3px solid purple border (#667eea)
- 8px border radius
- 10px vertical, 15px horizontal padding
- Full width (100%)
- 15px vertical margin
- 600 font weight
- Monospace font (Courier New)
- 8px letter spacing
- 60px minimum height
- Flexbox layout
- Center vertical alignment
- Right justification
- White background

**Used By:**
- index.html: `#answerDisplay` (currently not actively used, kept for compatibility)
- `setupNormalInput()` in quiz.js (hides this element)
- `setupRightToLeftInput()` in quiz.js (hides this element)

### Answer Display Focus (`.answer-display:focus-within`)
**Requirements:**
- Change border color to #764ba2 when any child element is focused

### Answer Display Digit (`.answer-display .digit`)
**Requirements:**
- Inline-block display
- 24px minimum width
- Center text alignment

### Answer Display Placeholder (`.answer-display .placeholder`)
**Requirements:**
- Light gray color (#ccc)

### Answer Display Entered (`.answer-display .entered`)
**Requirements:**
- Dark gray color (#333)

### Hidden Input (`.hidden-input`)
**Requirements:**
- Absolute positioning
- Zero opacity (invisible)
- No pointer events

### Multidigit Table (`.multidigit-table`)
**Requirements:**
- Full width (100%)
- Collapsed borders
- 15px vertical margin
- Monospace font (Courier New)
- 32px font size
- 600 font weight

**Used By:**
- index.html: `#multidigitTable`
- `setupRightToLeftInput()` in quiz.js (creates table structure and shows it)
- `setupNormalInput()` in quiz.js (hides this element)

### Multidigit Table Cells (`.multidigit-table td`)
**Requirements:**
- 2px solid purple border (#667eea)
- 15px padding
- Center text alignment
- 60px minimum width
- 60px height
- White background

### Multidigit Table - Operation Cell (`.multidigit-table td.operation-cell`)
**Requirements:**
- Light gray background (#f8f9fa)
- Purple border (#764ba2)
- 36px font size

**Used By:**
- `setupRightToLeftInput()` in quiz.js (adds 'operation-cell' class to operation symbol cells)

### Multidigit Table - Thick Line After Second Row (`.multidigit-table tr:nth-child(2) td`)
**Requirements:**
- 4px solid dark gray bottom border (#333)
- Creates visual separator after operation row

### Multidigit Table - Input Cell (`.multidigit-table td.input-cell`)
**Requirements:**
- White background
- Purple border (#667eea)
- Text cursor
- Tap highlight color (rgba(118, 75, 162, 0.3)) for mobile
- Touch action: manipulation (prevents double-tap zoom)

**Used By:**
- `setupRightToLeftInput()` in quiz.js (adds 'input-cell' class to answer input cells)
- Can have 'placeholder' or 'entered' classes added based on input state

### Multidigit Table - Input Cell Placeholder (`.multidigit-table td.input-cell.placeholder`)
**Requirements:**
- Light gray color (#ccc)

### Multidigit Table - Input Cell Entered (`.multidigit-table td.input-cell.entered`)
**Requirements:**
- Dark gray color (#333)

### Multidigit Table - Input Cell Focus (`.multidigit-table td.input-cell:focus`)
**Requirements:**
- 3px solid purple outline (#764ba2)
- -3px outline offset (inside border)
- Enhanced tap highlight for mobile (rgba(118, 75, 162, 0.5))

### Mobile Styles - Multidigit Table (`@media (max-width: 768px)`)
**Requirements:**
- Table: 20px font size, 10px vertical margin, full width, auto table layout
- Cells: 8px vertical, 4px horizontal padding, no minimum width, auto width, 45px height, 1.5px border width
- Operation cell: 24px font size, 8px vertical, 6px horizontal padding
- Table: maximum width 100%, border-box sizing

### Mobile Styles - Question Container (`@media (max-width: 768px)`)
**Requirements:**
- Negative left/right margins (-15px) to extend to container edges
- 15px horizontal padding
- Horizontal scroll enabled for table if needed
- Smooth scrolling on iOS

### Extra Small Mobile - Multidigit Table (`@media (max-width: 480px)`)
**Requirements:**
- Table: 18px font size
- Cells: 6px vertical, 3px horizontal padding, 40px height, 18px font size
- Operation cell: 20px font size, 6px vertical, 4px horizontal padding
- Question container: -10px margins, 10px horizontal padding

### Correct Answer (`.correct-answer`)
**Requirements:**
- 24px font size
- Red color (#dc3545)
- Right text alignment
- 10px top margin
- 40px minimum height

**Used By:**
- index.html: `#line4`
- `checkAnswer()` in quiz.js (displays correct answer when user is wrong)

### Timer (`.timer`)
**Requirements:**
- Center text alignment
- 20px font size
- Purple color (#667eea)
- 15px vertical margin
- 600 font weight

**Used By:**
- index.html: `#timer`
- `startTimer()` in quiz.js (adds 'hidden' class, can add 'warning' class)

### Timer Warning (`.timer.warning`)
**Requirements:**
- Red color (#dc3545)

---

## Summary CSS (summary.css)

### Summary Section (`.summary-section`)
**Requirements:**
- 30px top margin
- 20px padding
- Light gray background (#f8f9fa)
- 8px border radius

**Used By:**
- index.html: `#summarySection`
- `endSession()` in summary.js (removes 'hidden' class to show section)
- `resetSession()` in summary.js (adds 'hidden' class to hide section)

### Summary Section Heading (`.summary-section h2`)
**Requirements:**
- Dark gray color (#333)
- 15px bottom margin
- Center text alignment

### Summary Stats (`.summary-stats`)
**Requirements:**
- 20px bottom margin

### Summary Stats Paragraph (`.summary-stats p`)
**Requirements:**
- 8px vertical margin
- 16px font size
- Gray color (#555)

### Pass/Fail (`.pass-fail`)
**Requirements:**
- Center text alignment
- 24px font size
- 700 font weight
- 15px padding
- 8px border radius
- 20px vertical margin

**Used By:**
- index.html: `#passFail`
- `showSummary()` in summary.js (sets className to 'pass-fail pass' or 'pass-fail fail')

### Pass (`.pass`)
**Requirements:**
- Light green background (#d4edda)
- Dark green text (#155724)

### Fail (`.fail`)
**Requirements:**
- Light red background (#f8d7da)
- Dark red text (#721c24)

### Question Details (`.question-details`)
**Requirements:**
- 20px top margin
- 400px maximum height
- Vertical scroll enabled (overflow-y: auto)

### Question Item (`.question-item`)
**Requirements:**
- 10px padding
- 8px vertical margin
- White background
- 6px border radius
- 4px solid purple left border (#667eea)

**Used By:**
- `showSummary()` in summary.js (creates question items dynamically)
- Can have 'wrong' or 'correct' classes added

### Question Item Wrong (`.question-item.wrong`)
**Requirements:**
- Red left border (#dc3545)
- Red text color (#dc3545)

### Question Item Wrong - Strong (`.question-item.wrong strong`)
**Requirements:**
- Red color (#dc3545)

### Question Item Correct (`.question-item.correct`)
**Requirements:**
- Green left border (#28a745)

---

## Teacher Dashboard CSS (teacher-dashboard.css)

### Teacher Dashboard Container (`.teacher-dashboard`)
**Requirements:**
- Maximum width 1200px
- Auto horizontal margins (centered)
- 20px padding

### Teacher Dashboard Heading (`.teacher-dashboard h1`)
**Requirements:**
- Center text alignment
- 30px bottom margin
- Dark gray color (#333)

### Teacher Dashboard Stats (`.teacher-dashboard-stats`)
**Requirements:**
- CSS Grid layout
- 3 equal columns
- 20px gap
- 30px bottom margin

### Teacher Dashboard Stat Card (`.teacher-stat-card`)
**Requirements:**
- White background
- 2px solid #ddd border
- 10px border radius
- 20px padding
- Center text alignment
- Box shadow (0 2px 4px rgba(0, 0, 0, 0.1))

### Teacher Dashboard Stat Label (`.teacher-stat-label`)
**Requirements:**
- 14px font size
- Gray color (#666)
- 5px bottom margin

### Teacher Dashboard Stat Value (`.teacher-stat-value`)
**Requirements:**
- 32px font size
- Bold font weight
- Purple color (#667eea)

### Teacher Dashboard Table (`.teacher-dashboard-table`)
**Requirements:**
- Full width (100%)
- Collapsed borders
- White background
- 10px border radius
- Overflow hidden

### Teacher Dashboard Table Header (`.teacher-dashboard-table thead`)
**Requirements:**
- Light gray background (#f8f9fa)

### Teacher Dashboard Table Header Cell (`.teacher-dashboard-table th`)
**Requirements:**
- 12px padding
- Left text alignment
- 600 font weight
- Dark gray color (#333)
- 1px solid #ddd bottom border

### Teacher Dashboard Table Body Cell (`.teacher-dashboard-table td`)
**Requirements:**
- 12px padding
- Left text alignment
- 1px solid #ddd bottom border

### Teacher Dashboard Table Row Hover (`.teacher-dashboard-table tbody tr:hover`)
**Requirements:**
- Light gray background (#f8f9fa)

---

## Teacher Dashboard CSS (teacher-dashboard.css)

### Global Reset (`*`)
**Requirements:**
- Reset all margins to 0
- Reset all padding to 0
- Set box-sizing to border-box for all elements

### Body Styles (`body`)
**Requirements:**
- System font stack (-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, etc.)
- Gradient background (135deg, #667eea to #764ba2)
- Minimum height 100vh
- 20px padding

### Container (`.container`)
**Requirements:**
- Maximum width 95%
- Auto horizontal margins (centered)
- White background
- 12px border radius
- Box shadow (0 10px 40px rgba(0, 0, 0, 0.2))
- Overflow hidden

### Header (`.header`)
**Requirements:**
- Gradient background (135deg, #667eea to #764ba2)
- White text color
- 20px vertical, 30px horizontal padding
- Flexbox layout with space-between justification
- Center vertical alignment
- Wrap on smaller screens
- 15px gap

### Header Heading (`.header h1`)
**Requirements:**
- 24px font size
- 600 font weight

### User Info (`.user-info`)
**Requirements:**
- Flexbox layout
- Center vertical alignment
- 15px gap

### Button (`.btn`)
**Requirements:**
- 10px vertical, 20px horizontal padding
- No border
- 6px border radius
- 14px font size
- 600 font weight
- Pointer cursor
- Transform and box-shadow transitions (0.2s)

### Button Hover (`.btn:hover`)
**Requirements:**
- Translate up 2px
- Box shadow (0 4px 8px rgba(0, 0, 0, 0.2))

### Button Primary (`.btn-primary`)
**Requirements:**
- Green background (#28a745)
- White text color

### Button Secondary (`.btn-secondary`)
**Requirements:**
- Semi-transparent white background (rgba(255, 255, 255, 0.2))
- White text color

### Loading/Error Messages (`.loading-message`, `.error-message`)
**Requirements:**
- 20px vertical, 30px horizontal padding
- Center text alignment
- 16px font size

### Loading Message (`.loading-message`)
**Requirements:**
- Purple color (#667eea)

### Error Message (`.error-message`)
**Requirements:**
- Light red background (#f8d7da)
- Dark red text (#721c24)
- 1px solid light red border (#f5c6cb)

### Hidden (`.hidden`)
**Requirements:**
- Display: none with !important

**Used By:**
- teacher-dashboard.js: add/remove 'hidden' class to show/hide elements:
  - `loadDashboard()` (dashboardControls, dashboardGrid)
  - `showError()` (errorMessage)

### Dashboard Controls (`.dashboard-controls`)
**Requirements:**
- 20px vertical, 30px horizontal padding
- Flexbox layout with space-between justification
- Center vertical alignment
- 2px solid #e9ecef bottom border
- Wrap on smaller screens
- 15px gap

**Used By:**
- teacher-dashboard.html: `#dashboardControls`
- `loadDashboard()` in teacher-dashboard.js (removes 'hidden' class)

### Stats (`.stats`)
**Requirements:**
- Flexbox layout
- 20px gap
- Gray color (#666)
- 14px font size

### Stats Strong (`.stats strong`)
**Requirements:**
- Dark gray color (#333)

### Dashboard Grid Container (`.dashboard-grid-container`)
**Requirements:**
- 20px padding
- Overflow auto
- Maximum height calc(100vh - 250px)

### Grid Wrapper (`.grid-wrapper`)
**Requirements:**
- Horizontal and vertical scroll enabled

### Progress Table (`.progress-table`)
**Requirements:**
- Full width (100%)
- Collapsed borders
- 13px font size
- 800px minimum width

### Progress Table Header (`.progress-table th`)
**Requirements:**
- Light gray background (#f8f9fa)
- 12px vertical, 8px horizontal padding
- Center text alignment
- 600 font weight
- 1px solid #dee2e6 border
- Sticky positioning at top
- Z-index 10
- No text wrapping (white-space: nowrap)

### Progress Table Header - Fixed Column (`.progress-table th.fixed-column`)
**Requirements:**
- Darker gray background (#e9ecef)
- Sticky positioning at left
- Z-index 11

**Used By:**
- `buildProgressTable()` in teacher-dashboard.js (adds 'fixed-column' class to header cells)

### Progress Table Cell (`.progress-table td`)
**Requirements:**
- 10px vertical, 8px horizontal padding
- Center text alignment
- 1px solid #dee2e6 border
- No text wrapping

### Progress Table Cell - Fixed Column (`.progress-table td.fixed-column`)
**Requirements:**
- Light gray background (#f8f9fa)
- Sticky positioning at left
- Z-index 9
- 500 font weight

**Used By:**
- `buildProgressTable()` in teacher-dashboard.js (adds 'fixed-column' class to name, roll, class, section cells)

### Progress Table Row Hover (`.progress-table tbody tr:hover`)
**Requirements:**
- Light gray background (#f1f3f5)

### Progress Table Row Hover - Fixed Column (`.progress-table tbody tr:hover td.fixed-column`)
**Requirements:**
- Darker gray background (#e9ecef)

### Status Pass (`.status-pass`)
**Requirements:**
- Light green background (#d4edda)
- Dark green text (#155724)
- 600 font weight
- 16px font size

**Used By:**
- `buildProgressTable()` in teacher-dashboard.js (adds 'status-pass' class to passed variant cells)

### Status Fail (`.status-fail`)
**Requirements:**
- Light red background (#f8d7da)
- Dark red text (#721c24)
- 600 font weight
- 16px font size

**Used By:**
- `buildProgressTable()` in teacher-dashboard.js (adds 'status-fail' class to failed variant cells)

### Status Empty (`.status-empty`)
**Requirements:**
- White background

**Used By:**
- `buildProgressTable()` in teacher-dashboard.js (adds 'status-empty' class to cells with no data)

### Scrollbar Styling (`.grid-wrapper::-webkit-scrollbar`)
**Requirements:**
- 10px height and width

### Scrollbar Track (`.grid-wrapper::-webkit-scrollbar-track`)
**Requirements:**
- Light gray background (#f1f1f1)

### Scrollbar Thumb (`.grid-wrapper::-webkit-scrollbar-thumb`)
**Requirements:**
- Gray background (#888)
- 5px border radius

### Scrollbar Thumb Hover (`.grid-wrapper::-webkit-scrollbar-thumb:hover`)
**Requirements:**
- Darker gray background (#555)

### Responsive - Mobile (`@media (max-width: 768px)`)
**Requirements:**
- Header: column flex direction, flex-start alignment
- Dashboard controls: column flex direction, stretch alignment
- Progress table: 11px font size
- Table cells: 8px vertical, 4px horizontal padding

---

## Notes

- All CSS files use consistent color scheme:
  - Primary purple: #667eea, #764ba2
  - Success green: #28a745, #d4edda, #155724
  - Error red: #dc3545, #f8d7da, #721c24
  - Neutral grays: #333, #555, #666, #ddd, #f8f9fa
- Mobile-first responsive design with breakpoints at 768px and 480px
- All interactive elements have hover states and transitions
- Focus states are clearly defined for accessibility
- Spinner arrows are removed from all number inputs
- Sticky positioning used for question container to keep it visible on mobile
- Touch-friendly tap highlights and touch actions for mobile devices
