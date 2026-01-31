// ============================================================================
// SHARED MODULE - Variants, Constants, and Session State
// ============================================================================
// This module contains:
// - Multi-digit and standard variant definitions
// - Current session state variables
// - Timer-related state variables
// ============================================================================

// ============================================================================
// MULTI-DIGIT VARIANTS SECTION
// ============================================================================
// All multi-digit variants are defined here. They share common features:
// - Right-to-left cursor movement
// - No time limit
// - Multi-digit number formatting with spacing
// - Special input handling
//
// To add a new multi-digit variant:
// 1. Add it to the appropriate operation section below
// 2. Include: first/second ranges, name, and any special flags (noCarry, etc.)
// 3. The variant will automatically get: noTimeLimit: true, rightToLeft: true
// ============================================================================

// CALLED BY: shared_db.js - fetchAndUpdateVariantStatuses() (reads variant definitions), question.js - startSession() (reads variant configuration)
const multiDigitVariants = {
    addition: {
        '1M1': {
            first: [10000, 99999],
            second: [10000, 99999],
            name: '1M1: Adding Multi-digit Numbers without Carry',
            noCarry: true,
            maxQuestions: 10
        },
        '1M2': {
            first: [10000, 99999],
            second: [10000, 99999],
            name: '1M2: Adding Multi-digit Numbers with Carry',
            hasCarry: true,
            maxQuestions: 10
        }
        // Add more multi-digit addition variants here:
        // '1M3': { ... },
    },
    subtraction: {
        '2M1': {
            first: [10000, 99999],
            second: [1000, 99999],
            name: '2M1: Subtracting Multi-digit Numbers without Borrow',
            noBorrow: true,
            maxQuestions: 10
        },
        '2M2': {
            first: [10000, 99999],
            second: [1000, 99999],
            name: '2M2: Subtracting Multi-digit Numbers with Borrow',
            hasBorrow: true,
            maxQuestions: 10
        },
        '2M3': {
            first: [10000, 99999],
            second: [1000, 99999],
            name: '2M3: Subtracting Multi-digit Numbers with Borrow from 0',
            hasBorrow: true,
            hasBorrowFromZero: true,
            maxQuestions: 10
        }
    },
    multiplication: {
        '3M1': {
            first: [10000, 99999],
            second: [0, 9],
            name: '3M1: Multi-digit x 1-digit Multiplication 1',
            noZero: true,
            onePerSecond: true,
            maxQuestions: 10
        },
        '3M2': {
            first: [10000, 99999],
            second: [0, 9],
            name: '3M2: Multi-digit x 1-digit Multiplication 2',
            hasZero: true,
            onePerSecond: true,
            maxQuestions: 10
        }
    },
    division: {
        '4M1': {
            first: [10000, 99999],
            second: [1, 9],
            name: '4M1: Multi-digit by 1-digit Division 1',
            noZero: true,
            onePerSecond: true,
            maxQuestions: 9
        },
        '4M2': {
            first: [10000, 99999],
            second: [1, 9],
            name: '4M2: Multi-digit by 1-digit Division 2',
            hasZero: true,
            onePerSecond: true,
            maxQuestions: 9
        }
    }
};

// Apply multi-digit flags to all multi-digit variants
for (const operation in multiDigitVariants) {
    for (const variantKey in multiDigitVariants[operation]) {
        const variant = multiDigitVariants[operation][variantKey];
        variant.noTimeLimit = true;
        variant.rightToLeft = true;
    }
}

// ============================================================================
// STANDARD VARIANTS
// ============================================================================
// CALLED BY: shared_db.js - fetchAndUpdateVariantStatuses() (reads variant definitions), question.js - startSession() (reads variant configuration)
const variants = {
    addition: {
        '1A0': { first: [0, 9], second: [0, 0], name: '1A0: Adding 0' },
        '1A1': { first: [0, 9], second: [1, 1], name: '1A1: Adding 1' },
        '1A2': { first: [0, 9], second: [2, 2], name: '1A2: Adding 2' },
        '1A3': { first: [0, 9], second: [3, 3], name: '1A3: Adding 3' },
        '1A': { first: [0, 9], second: [0, 3], name: '1A: Adding 0, 1, 2, 3' },
        '1B': { first: [0, 3], second: [0, 9], name: '1B: Adding Bigger Number to Smaller Number' },
        '1C': { first: [0, 9], second: 'same', name: '1C: Both Numbers Same' },
        '1D': { first: [6, 9], second: [6, 9], name: '1D: Adding Large Numbers (6-9)', excludeSame: true },
        '1': { first: [0, 9], second: [0, 9], name: '1: Adding Single-digit Numbers (0-9)' }
    },
    subtraction: {
        '2A': { second: [0, 4], result: [0, 4], name: '2A: Subtracting (0-4), Result (0-4)' },
        '2B': { second: [0, 4], result: [5, 9], name: '2B: Subtracting (0-4), Result (5-9)' },
        '2C': { second: [5, 9], result: [0, 4], name: '2C: Subtracting (5-9), Result (0-4)' },
        '2D': { second: [5, 9], result: [5, 9], name: '2D: Subtracting (5-9), Result (5-9)' },
        '2': { second: [0, 9], result: [0, 9], name: '2: Subtracting Single-digit Numbers (0-9)' }
    },
    multiplication: {
        '3A0': { first: [0, 0], second: [0, 9], name: '3A0: Multiplying 0 by any Number' },
        '3A1': { first: [1, 1], second: [0, 9], name: '3A1: Multiplying 1 by any Number' },
        '3A2S': { first: [2, 2], second: [0, 9], name: '3A2S: Table of 2', sequential: true },
        '3A2': { first: [2, 2], second: [0, 9], name: '3A2: Table of 2 Random' },
        '3A3S': { first: [3, 3], second: [0, 9], name: '3A3S: Table of 3', sequential: true },
        '3A3': { first: [3, 3], second: [0, 9], name: '3A3: Table of 3 Random' },
        '3A': { first: [0, 3], second: [0, 9], name: '3A: Multiplying 0, 1, 2, 3 by any Number' },
        '3B4S': { first: [4, 4], second: [0, 9], name: '3B4S: Table of 4', sequential: true },
        '3B4': { first: [4, 4], second: [0, 9], name: '3B4: Table of 4 Random' },
        '3B5S': { first: [5, 5], second: [0, 9], name: '3B5S: Table of 5', sequential: true },
        '3B5': { first: [5, 5], second: [0, 9], name: '3B5: Table of 5 Random' },
        '3B6S': { first: [6, 6], second: [0, 9], name: '3B6S: Table of 6', sequential: true },
        '3B6': { first: [6, 6], second: [0, 9], name: '3B6: Table of 6 Random' },
        '3B': { first: [4, 6], second: [0, 9], name: '3B: Multiplying 4, 5, 6 by any Number' },
        '3C7S': { first: [7, 7], second: [0, 9], name: '3C7S: Table of 7', sequential: true },
        '3C7': { first: [7, 7], second: [0, 9], name: '3C7: Table of 7 Random' },
        '3C8S': { first: [8, 8], second: [0, 9], name: '3C8S: Table of 8', sequential: true },
        '3C8': { first: [8, 8], second: [0, 9], name: '3C8: Table of 8 Random' },
        '3C9S': { first: [9, 9], second: [0, 9], name: '3C9S: Table of 9', sequential: true },
        '3C9': { first: [9, 9], second: [0, 9], name: '3C9: Table of 9 Random' },
        '3C': { first: [7, 9], second: [0, 9], name: '3C: Multiplying 7, 8, 9 by any Number' },
        '3': { first: [0, 9], second: [0, 9], name: '3: Multiplying Single-digit Numbers' }
    },
    division: {
        '4A1': { second: [1, 1], result: [0, 9], name: '4A1: Dividing by 1' },
        '4A2': { second: [2, 2], result: [0, 9], name: '4A2: Dividing by 2' },
        '4A3': { second: [3, 3], result: [0, 9], name: '4A3: Dividing by 3' },
        '4A': { second: [1, 3], result: [0, 9], name: '4A: Dividing by 1, 2, 3' },
        '4B4': { second: [4, 4], result: [0, 9], name: '4B4: Dividing by 4' },
        '4B5': { second: [5, 5], result: [0, 9], name: '4B5: Dividing by 5' },
        '4B6': { second: [6, 6], result: [0, 9], name: '4B6: Dividing by 6' },
        '4B': { second: [4, 6], result: [0, 9], name: '4B: Dividing by 4, 5, 6' },
        '4C7': { second: [7, 7], result: [0, 9], name: '4C7: Dividing by 7' },
        '4C8': { second: [8, 8], result: [0, 9], name: '4C8: Dividing by 8' },
        '4C9': { second: [9, 9], result: [0, 9], name: '4C9: Dividing by 9' },
        '4C': { second: [7, 9], result: [0, 9], name: '4C: Dividing by 7, 8, 9' },
        '4': { second: [1, 9], result: [0, 9], name: '4: Dividing Single-digit Numbers (1-9)' }
    }
};

// Merge multi-digit variants into main variants object
for (const operation in multiDigitVariants) {
    if (variants[operation]) {
        Object.assign(variants[operation], multiDigitVariants[operation]);
    }
}

// ============================================================================
// SESSION STATE VARIABLES
// ============================================================================

// CALLED BY: question.js - startSession() (initializes session), question.js - askNextQuestion() (reads/writes session data), question.js - checkAnswer() (updates session), summary.js - endSession() (reads session data), summary.js - showSummary() (reads session data)
let currentSession = {
    operation: '',
    variant: '',
    questions: [],
    askedQuestions: new Set(),
    questionIndex: 0,
    correctCount: 0,
    wrongCount: 0,
    totalTime: 0,
    results: []
};

// Timer-related state variables
// CALLED BY: question.js - startTimer() (sets timerInterval), question.js - checkAnswer() (reads timeElapsed, questionStartTime), question.js - handleOnHold() (clears timerInterval), question.js - handleResume() (restarts timerInterval), question.js - handleTryAgain() (resets timeElapsed)
let timerInterval = null;
// CALLED BY: question.js - startTimer() (increments timeElapsed), question.js - checkAnswer() (reads timeElapsed), question.js - handleTryAgain() (resets timeElapsed), summary.js - showSummary() (reads timeElapsed)
let timeElapsed = 0;
// CALLED BY: question.js - askNextQuestion() (sets questionStartTime), question.js - checkAnswer() (reads questionStartTime)
let questionStartTime = 0;
// CALLED BY: question.js - setupNormalInput() (sets answerTimeout), question.js - setupRightToLeftInput() (sets answerTimeout), question.js - checkAnswer() (clears answerTimeout)
let answerTimeout = null;

// Expose variants and currentSession globally for cross-page access
window.variants = variants;
window.currentSession = currentSession;

// ============================================================================
// DEBUGGING UTILITIES (global)
// ============================================================================
// Toggle this in the browser console:
//   window.DEBUG = true  // enable
//   window.DEBUG = false // disable
//
// Use debugLog('functionName') to trace execution only when DEBUG is on.
if (typeof window.DEBUG === 'undefined') {
    window.DEBUG = false;
}

window.debugLog = function debugLog(functionName, extra = '') {
    if (!window.DEBUG) return;
    const suffix = extra ? ` ${extra}` : '';
    console.log(`In function ${functionName}.${suffix}`);
};

// ============================================================================
// PWA INSTALL PROMPT FUNCTIONALITY
// ============================================================================
// Makes the install prompt available on all pages
// Usage: Run showInstallPrompt() in the console when installPrompt is available

window.installPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.installPrompt = e;
    console.log('✓ Install prompt available! Run: showInstallPrompt()');
});

window.showInstallPrompt = async function() {
    if (window.installPrompt) {
        window.installPrompt.prompt();
        const { outcome } = await window.installPrompt.userChoice;
        console.log('User choice:', outcome);
        window.installPrompt = null;
    } else {
        console.log('Install prompt not available. The event may have been consumed or the app is already installed.');
    }
};
