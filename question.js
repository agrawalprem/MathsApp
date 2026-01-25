// ============================================================================
// QUIZ MODULE - Question/Answer Page Logic
// ============================================================================
// This module contains:
// - Session management (startSession, askNextQuestion)
// - Question generation (generateAllQuestions)
// - Input handling (setupNormalInput, setupRightToLeftInput)
// - Answer checking (checkAnswer)
// - Timer management (startTimer)
// - Speech synthesis (speakQuestionAndAnswer)
// - Modal handling (showTerminationModal, continueSession)
// ============================================================================
// NOTE: This module depends on:
// - shared.js: currentSession, timerInterval, timeElapsed, questionStartTime, 
//              answerTimeout, variants
// - summary.js: endSession (will be called when all questions are completed)
// ============================================================================

/**
 * REQUIREMENTS:
 * - Convert both numbers to strings
 * - Pad shorter number with leading zeros
 * - Check each digit position from right to left
 * - Return true if no digit position has sum >= 10 (no carry)
 * - Return false if any position has sum >= 10 (has carry)
 * 
 * CALLED BY: question.js - generateAllQuestions() (for addition variants with noCarry flag)
 */
function hasNoCarry(first, second) {
    if (window.debugLog) window.debugLog('hasNoCarry');
    // Convert numbers to strings to check digit by digit
    const firstStr = first.toString();
    const secondStr = second.toString();
    const maxLength = Math.max(firstStr.length, secondStr.length);
    
    // Pad shorter number with leading zeros
    const firstPadded = firstStr.padStart(maxLength, '0');
    const secondPadded = secondStr.padStart(maxLength, '0');
    
    // Check each digit position from right to left
    for (let i = maxLength - 1; i >= 0; i--) {
        const digit1 = parseInt(firstPadded[i]);
        const digit2 = parseInt(secondPadded[i]);
        if (digit1 + digit2 >= 10) {
            return false; // Has carry
        }
    }
    return true; // No carry
}

/**
 * REQUIREMENTS:
 * - Convert both numbers to strings
 * - Pad shorter number with leading zeros
 * - Check each digit position from right to left
 * - Return true if any position requires borrow (firstDigit < secondDigit)
 * - Return false if no borrow needed
 * 
 * CALLED BY: question.js - generateAllQuestions() (for subtraction variants with hasBorrow flag)
 */
function hasBorrow(first, second) {
    if (window.debugLog) window.debugLog('hasBorrow');
    // Convert numbers to strings to check digit by digit
    const firstStr = first.toString();
    const secondStr = second.toString();
    const maxLength = Math.max(firstStr.length, secondStr.length);
    
    // Pad shorter number with leading zeros
    const firstPadded = firstStr.padStart(maxLength, '0');
    const secondPadded = secondStr.padStart(maxLength, '0');
    
    // Check each digit position from right to left
    let needsBorrow = false;
    for (let i = maxLength - 1; i >= 0; i--) {
        const firstDigit = parseInt(firstPadded[i]);
        const secondDigit = parseInt(secondPadded[i]);
        if (firstDigit < secondDigit) {
            needsBorrow = true;
            break;
        }
    }
    return needsBorrow;
}

/**
 * REQUIREMENTS:
 * - Convert both numbers to strings
 * - Pad shorter number with leading zeros
 * - Check each digit position from right to left
 * - Return true if any position has sum >= 10 (has carry)
 * - Return false if no carry
 * 
 * CALLED BY: question.js - generateAllQuestions() (for addition variants with hasCarry flag)
 */
function hasCarry(first, second) {
    if (window.debugLog) window.debugLog('hasCarry');
    // Convert numbers to strings to check digit by digit
    const firstStr = first.toString();
    const secondStr = second.toString();
    const maxLength = Math.max(firstStr.length, secondStr.length);
    
    // Pad shorter number with leading zeros
    const firstPadded = firstStr.padStart(maxLength, '0');
    const secondPadded = secondStr.padStart(maxLength, '0');
    
    // Check each digit position from right to left
    for (let i = maxLength - 1; i >= 0; i--) {
        const digit1 = parseInt(firstPadded[i]);
        const digit2 = parseInt(secondPadded[i]);
        if (digit1 + digit2 >= 10) {
            return true; // Has carry
        }
    }
    return false; // No carry
}

/**
 * REQUIREMENTS:
 * - Validate operation and variant are provided
 * - Initialize currentSession object with:
 *   - operation, variant
 *   - empty questions array
 *   - empty askedQuestions Set
 *   - questionIndex: 0
 *   - correctCount: 0, wrongCount: 0
 *   - totalTime: 0
 *   - empty results array
 * - Call generateAllQuestions(operation, variant)
 * - Show question section, hide summary section
 * - Call askNextQuestion() to start quiz
 * 
 * CALLED FROM:
 * - launchVariant() in dashboard.js
 * 
 * CALLED BY: question.html - DOMContentLoaded listener (reads operation and variant from sessionStorage, then calls startSession)
 */
function startSession(operation, variant) {
    if (window.debugLog) window.debugLog('startSession', `(${operation}, ${variant})`);
    // Use provided operation and variant, or fall back to currentSession if already set
    if (!operation) operation = currentSession?.operation;
    if (!variant) variant = currentSession?.variant;

    if (!operation || !variant) {
        console.error('Operation and variant are required to start a session');
        return;
    }

    currentSession = {
        operation: operation,
        variant: variant,
        questions: [],
        askedQuestions: new Set(),
        questionIndex: 0,
        correctCount: 0,
        wrongCount: 0,
        totalTime: 0,
        results: []
    };

    generateAllQuestions(operation, variant);
    
    // Hide quiz controls initially (will be shown for multi-digit variants in displayQuestion)
    const quizControls = document.getElementById('quizControls');
    if (quizControls) {
        quizControls.classList.add('hidden');
        quizControls.style.display = 'none';
    }
    
    // Update question page header
    if (typeof updateQuestionPageHeader === 'function') {
        updateQuestionPageHeader();
    }
    
    askNextQuestion();
}

/**
 * REQUIREMENTS:
 * - Get variant configuration from variants object
 * - Generate questions based on operation type:
 *   - Addition: handle noCarry, hasCarry, 'same', excludeSame, or all combinations
 *   - Subtraction: handle noBorrow, hasBorrow, hasBorrowFromZero, or all combinations
 *   - Multiplication: handle onePerSecond, noZero/hasZero, sequential, maxQuestions, or all combinations
 *   - Division: handle onePerSecond, noZero/hasZero, maxQuestions, or all combinations
 * - Shuffle questions (except sequential variants)
 * - Store questions in currentSession.questions array
 * - No return value
 * 
 * CALLED FROM:
 * 
 * CALLED BY: question.js - startSession() (to generate all questions for the session)
 */
function generateAllQuestions(operation, variant) {
    if (window.debugLog) window.debugLog('generateAllQuestions', `(${operation}, ${variant})`);
    const variantConfig = variants[operation][variant];
    const allQuestions = [];

    if (operation === 'addition') {
        const firstRange = variantConfig.first;
        const secondRange = variantConfig.second;

        if (variantConfig.noCarry) {
            // Special handling for multi-digit addition without carry
            // More efficient: generate first number, then construct second number digit by digit
            const maxQuestions = variantConfig.maxQuestions || 10;
            const usedQuestions = new Set();
            let attempts = 0;
            const maxAttempts = 10000; // Safety limit
            
            while (allQuestions.length < maxQuestions && attempts < maxAttempts) {
                attempts++;
                // Generate first number randomly
                const first = Math.floor(Math.random() * (firstRange[1] - firstRange[0] + 1)) + firstRange[0];
                const firstStr = first.toString();
                const firstDigits = firstStr.split('').map(d => parseInt(d));
                
                // Construct second number digit by digit (right to left)
                // For each position, determine valid digits that won't cause carry
                const secondDigits = [];
                const numDigits = firstStr.length;
                
                for (let i = numDigits - 1; i >= 0; i--) {
                    const firstDigit = firstDigits[i];
                    // Valid digits for this position: 0 to (9 - firstDigit) to avoid carry
                    const maxValidDigit = 9 - firstDigit;
                    const validDigits = [];
                    
                    // Build list of valid digits (0 to maxValidDigit)
                    for (let d = 0; d <= maxValidDigit; d++) {
                        validDigits.push(d);
                    }
                    
                    // Randomly select one valid digit
                    if (validDigits.length > 0) {
                        const randomIndex = Math.floor(Math.random() * validDigits.length);
                        secondDigits.unshift(validDigits[randomIndex]);
                    } else {
                        // Should not happen, but if it does, skip this attempt
                        break;
                    }
                }
                
                // Convert second number array to actual number
                const second = parseInt(secondDigits.join(''));
                
                // Check if second number is within range (should always be true for same-length numbers)
                if (second >= secondRange[0] && second <= secondRange[1]) {
                    const questionKey = `${first}_${second}_${first + second}`;
                    
                    // Check if we already have this question
                    if (!usedQuestions.has(questionKey)) {
                        usedQuestions.add(questionKey);
                        allQuestions.push({ first: first, second: second, answer: first + second });
                    }
                }
            }
        } else if (variantConfig.hasCarry) {
            // Special handling for multi-digit addition with carry
            const maxQuestions = variantConfig.maxQuestions || 10;
            let attempts = 0;
            const maxAttempts = 100000; // Prevent infinite loop
            
            while (allQuestions.length < maxQuestions && attempts < maxAttempts) {
                attempts++;
                const first = Math.floor(Math.random() * (firstRange[1] - firstRange[0] + 1)) + firstRange[0];
                const second = Math.floor(Math.random() * (secondRange[1] - secondRange[0] + 1)) + secondRange[0];
                
                if (hasCarry(first, second)) {
                    const questionKey = `${first}_${second}_${first + second}`;
                    // Check if we already have this question
                    if (!allQuestions.some(q => q.first === first && q.second === second)) {
                        allQuestions.push({ first: first, second: second, answer: first + second });
                    }
                }
            }
        } else if (secondRange === 'same') {
            for (let i = firstRange[0]; i <= firstRange[1]; i++) {
                allQuestions.push({ first: i, second: i, answer: i + i });
            }
        } else {
            for (let i = firstRange[0]; i <= firstRange[1]; i++) {
                for (let j = secondRange[0]; j <= secondRange[1]; j++) {
                    if (variantConfig.excludeSame && i === j) continue;
                    allQuestions.push({ first: i, second: j, answer: i + j });
                }
            }
        }
    } else if (operation === 'subtraction') {
        const secondRange = variantConfig.second;
        const resultRange = variantConfig.result;
        const firstRange = variantConfig.first; // For multi-digit variants

        if (variantConfig.noBorrow) {
            // Special handling for multi-digit subtraction without borrow
            const maxQuestions = variantConfig.maxQuestions || 10;
            const usedQuestions = new Set();
            let attempts = 0;
            const maxAttempts = 10000;
            
            while (allQuestions.length < maxQuestions && attempts < maxAttempts) {
                attempts++;
                const first = Math.floor(Math.random() * (firstRange[1] - firstRange[0] + 1)) + firstRange[0];
                const firstStr = first.toString();
                const firstDigits = firstStr.split('').map(d => parseInt(d));
                
                // Construct second number digit by digit (right to left) to avoid borrow
                const secondDigits = [];
                const numDigits = firstStr.length;
                
                for (let i = numDigits - 1; i >= 0; i--) {
                    const firstDigit = firstDigits[i];
                    // Valid digits: 0 to firstDigit (to avoid borrow)
                    const maxValidDigit = firstDigit;
                    const validDigits = [];
                    
                    for (let d = 0; d <= maxValidDigit; d++) {
                        validDigits.push(d);
                    }
                    
                    if (validDigits.length > 0) {
                        const randomIndex = Math.floor(Math.random() * validDigits.length);
                        secondDigits.unshift(validDigits[randomIndex]);
                    } else {
                        break;
                    }
                }
                
                const second = parseInt(secondDigits.join(''));
                const result = first - second;
                
                if (result >= 0 && (!secondRange || (second >= secondRange[0] && second <= secondRange[1]))) {
                    const questionKey = `${first}_${second}_${result}`;
                    if (!usedQuestions.has(questionKey)) {
                        usedQuestions.add(questionKey);
                        allQuestions.push({ first: first, second: second, answer: result });
                    }
                }
            }
        } else if (variantConfig.hasBorrow) {
            // Special handling for multi-digit subtraction with borrow
            const maxQuestions = variantConfig.maxQuestions || 10;
            const usedQuestions = new Set();
            let attempts = 0;
            const maxAttempts = 100000;
            
            while (allQuestions.length < maxQuestions && attempts < maxAttempts) {
                attempts++;
                
                let firstStr = '';
                const firstNumDigits = firstRange[1].toString().length; // Get number of digits from max
                
                if (variantConfig.hasBorrowFromZero) {
                    // 2M3: First number must have at least 2 zeros (but first digit cannot be 0)
                    // Generate first number with at least 2 zeros
                    const zeroPositions = new Set();
                    // Choose number of zeros: at least 2, up to numDigits-2 (since first digit can't be 0)
                    const maxZeros = firstNumDigits - 2; // Leave room for non-zero first digit
                    const numZeros = maxZeros >= 2 ? (Math.floor(Math.random() * (maxZeros - 1)) + 2) : 2; // At least 2 zeros
                    
                    // Randomly select positions for zeros (at least 2, but not position 0)
                    while (zeroPositions.size < numZeros && zeroPositions.size < firstNumDigits - 2) {
                        const pos = Math.floor(Math.random() * (firstNumDigits - 1)) + 1; // Positions 1 to numDigits-1 (skip first position)
                        zeroPositions.add(pos);
                    }
                    
                    // Generate first number digit by digit
                    for (let i = 0; i < firstNumDigits; i++) {
                        if (i === 0) {
                            // First digit must be non-zero
                            firstStr += Math.floor(Math.random() * 9) + 1; // 1 to 9
                        } else if (zeroPositions.has(i)) {
                            firstStr += '0';
                        } else {
                            firstStr += Math.floor(Math.random() * 9) + 1; // 1 to 9 (non-zero)
                        }
                    }
                } else {
                    // 2M2: First number must have no zeros (all digits 1-9)
                    // For 5-digit: range is 11111 to 99999 (all digits 1-9)
                    for (let i = 0; i < firstNumDigits; i++) {
                        // Each digit is 1-9 (no zeros)
                        firstStr += Math.floor(Math.random() * 9) + 1; // 1 to 9
                    }
                }
                
                const first = parseInt(firstStr);
                
                // Ensure first number is valid (not all zeros, and within range)
                if (first === 0 || first < firstRange[0] || first > firstRange[1]) {
                    continue;
                }
                
                // Generate second number randomly, smaller than first
                let second;
                if (variantConfig.hasBorrowFromZero) {
                    // 2M3: Second number can be any length (4 or 5 digits)
                    const secondMax = Math.min(secondRange[1] || first - 1, first - 1);
                    const secondMin = secondRange[0] || 1;
                    second = Math.floor(Math.random() * (secondMax - secondMin + 1)) + secondMin;
                } else {
                    // 2M2: Second number should also be 5-digit (10000 to first-1)
                    // Ensure second number is same length as first (5-digit)
                    const secondMin = 10000; // Minimum 5-digit number
                    const secondMax = first - 1; // Must be smaller than first
                    if (secondMax < secondMin) {
                        continue; // Skip if first is too small (shouldn't happen)
                    }
                    second = Math.floor(Math.random() * (secondMax - secondMin + 1)) + secondMin;
                }
                
                // Ensure second is smaller than first and has borrow
                if (first > second && hasBorrow(first, second)) {
                    const questionKey = `${first}_${second}_${first - second}`;
                    if (!usedQuestions.has(questionKey)) {
                        usedQuestions.add(questionKey);
                        allQuestions.push({ first: first, second: second, answer: first - second });
                    }
                }
            }
        } else {
            // Standard single-digit subtraction
            for (let second = secondRange[0]; second <= secondRange[1]; second++) {
                for (let result = resultRange[0]; result <= resultRange[1]; result++) {
                    const first = second + result;
                    // No limit on first number for subtraction
                    allQuestions.push({ first: first, second: second, answer: result });
                }
            }
        }
    } else if (operation === 'multiplication') {
        const firstRange = variantConfig.first;
        const secondRange = variantConfig.second;

        if (variantConfig.onePerSecond) {
            // 3M1 and 3M2: One question for each second number (0-9), random first number
            // First number: 5-digit, randomly generated
            // 3M1: no zeros, 3M2: at least 1 zero
            const firstNumDigits = firstRange[1].toString().length; // 5 digits
            let first;
            
            // Generate one first number for the entire session
            let attempts = 0;
            const maxAttempts = 10000;
            
            while (attempts < maxAttempts) {
                attempts++;
                // Generate random 5-digit number (10000 to 99999)
                first = Math.floor(Math.random() * (firstRange[1] - firstRange[0] + 1)) + firstRange[0];
                const firstStr = first.toString();
                
                if (variantConfig.noZero) {
                    // 3M1: Check for absence of zero
                    if (!firstStr.includes('0')) {
                        break; // Found a number with no zeros
                    }
                } else if (variantConfig.hasZero) {
                    // 3M2: Check for presence of zero
                    if (firstStr.includes('0')) {
                        break; // Found a number with at least one zero
                    }
                } else {
                    // No constraint, use any valid number
                    break;
                }
            }
            
            if (!first || first < firstRange[0] || first > firstRange[1]) {
                console.error('Failed to generate valid first number for multiplication variant');
                return; // Exit if we can't generate a valid first number
            }
            
            // Generate exactly one question for each second number (0-9), total 10 questions
            // Use a Set to ensure no duplicate second numbers
            const usedSeconds = new Set();
            for (let second = secondRange[0]; second <= secondRange[1]; second++) {
                if (!usedSeconds.has(second)) {
                    usedSeconds.add(second);
                    allQuestions.push({ first: first, second: second, answer: first * second });
                }
            }
            
            // Ensure we have exactly 10 questions (one for each digit 0-9)
            if (allQuestions.length !== 10) {
                console.warn(`Expected 10 questions but generated ${allQuestions.length} for ${variantConfig.name}`);
            }
            
            // Shuffle questions to randomize sequence of second number
            for (let i = allQuestions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
            }
        } else if (variantConfig.maxQuestions) {
            // Multi-digit multiplication: generate limited random questions
            const maxQuestions = variantConfig.maxQuestions;
            const usedQuestions = new Set();
            let attempts = 0;
            const maxAttempts = 10000;
            
            while (allQuestions.length < maxQuestions && attempts < maxAttempts) {
                attempts++;
                const first = Math.floor(Math.random() * (firstRange[1] - firstRange[0] + 1)) + firstRange[0];
                const second = Math.floor(Math.random() * (secondRange[1] - secondRange[0] + 1)) + secondRange[0];
                const questionKey = `${first}_${second}_${first * second}`;
                
                if (!usedQuestions.has(questionKey)) {
                    usedQuestions.add(questionKey);
                    allQuestions.push({ first: first, second: second, answer: first * second });
                }
            }
        } else if (variantConfig.sequential) {
            // Sequential variants: generate questions in order (0-9 for second number)
            const first = firstRange[0]; // For sequential, first number is fixed
            for (let j = secondRange[0]; j <= secondRange[1]; j++) {
                allQuestions.push({ first: first, second: j, answer: first * j });
            }
        } else {
            // Random variants: generate all combinations
            for (let i = firstRange[0]; i <= firstRange[1]; i++) {
                for (let j = secondRange[0]; j <= secondRange[1]; j++) {
                    allQuestions.push({ first: i, second: j, answer: i * j });
                }
            }
        }
    } else if (operation === 'division') {
        const secondRange = variantConfig.second;
        const resultRange = variantConfig.result;

        if (variantConfig.onePerSecond) {
            // 4M1 and 4M2: One question for each second number (1-9)
            // First number: 5-digit, randomly generated
            // 4M1: no zeros, 4M2: at least 1 zero
            // If division has remainder, subtract remainder from first number
            // Check adjusted first number still meets zero requirements
            const firstRange = variantConfig.first || [10000, 99999];
            const firstNumDigits = firstRange[1].toString().length; // 5 digits
            let baseFirst;
            
            // Helper function to check if number has zeros
            function hasZeros(num) {
                return num.toString().includes('0');
            }
            
            // Helper function to count zeros
            function countZeros(num) {
                return (num.toString().match(/0/g) || []).length;
            }
            
            // Generate one base first number for the entire session
            let attempts = 0;
            const maxAttempts = 1000;
            while (attempts < maxAttempts) {
                attempts++;
                let firstStr = '';
                
                if (variantConfig.noZero) {
                    // 4M1: First number with no zeros (all digits 1-9)
                    for (let i = 0; i < firstNumDigits; i++) {
                        firstStr += Math.floor(Math.random() * 9) + 1; // 1 to 9
                    }
                } else if (variantConfig.hasZero) {
                    // 4M2: First number with at least 1 zero
                    const zeroPositions = new Set();
                    const numZeros = Math.floor(Math.random() * (firstNumDigits - 1)) + 1; // At least 1 zero
                    
                    // Randomly select positions for zeros (but not first position)
                    while (zeroPositions.size < numZeros && zeroPositions.size < firstNumDigits - 1) {
                        const pos = Math.floor(Math.random() * (firstNumDigits - 1)) + 1; // Positions 1 to 4
                        zeroPositions.add(pos);
                    }
                    
                    for (let i = 0; i < firstNumDigits; i++) {
                        if (i === 0) {
                            // First digit must be non-zero
                            firstStr += Math.floor(Math.random() * 9) + 1; // 1 to 9
                        } else if (zeroPositions.has(i)) {
                            firstStr += '0';
                        } else {
                            firstStr += Math.floor(Math.random() * 9) + 1; // 1 to 9
                        }
                    }
                } else {
                    // Fallback: random 5-digit number
                    baseFirst = Math.floor(Math.random() * (firstRange[1] - firstRange[0] + 1)) + firstRange[0];
                    break;
                }
                
                baseFirst = parseInt(firstStr);
                if (baseFirst >= firstRange[0] && baseFirst <= firstRange[1] && baseFirst > 0) {
                    break;
                }
            }
            
            if (!baseFirst || baseFirst < firstRange[0] || baseFirst > firstRange[1]) {
                console.error('Failed to generate valid first number for division variant');
                return; // Exit if we can't generate a valid first number
            }
            
            // Generate one question for each second number (1-9)
            // Adjust first number if remainder exists
            for (let second = secondRange[0]; second <= secondRange[1]; second++) {
                let adjustedFirst = baseFirst;
                const remainder = adjustedFirst % second;
                
                // If there's a remainder, subtract it from first number
                if (remainder > 0) {
                    adjustedFirst = adjustedFirst - remainder;
                    
                    // Check if adjusted first number still meets zero requirements
                    let valid = false;
                    if (variantConfig.noZero) {
                        // 4M1: Adjusted first should have no zeros
                        valid = !hasZeros(adjustedFirst) && adjustedFirst >= 10000;
                    } else if (variantConfig.hasZero) {
                        // 4M2: Adjusted first should have at least 1 zero
                        valid = countZeros(adjustedFirst) >= 1 && adjustedFirst >= 10000;
                    } else {
                        valid = adjustedFirst >= firstRange[0];
                    }
                    
                    if (!valid) {
                        // Try adding multiples of second to find valid first number
                        let foundValid = false;
                        for (let multiple = 1; multiple <= 100 && !foundValid; multiple++) {
                            const testFirst = baseFirst - remainder + (second * multiple);
                            if (testFirst < firstRange[0] || testFirst > firstRange[1]) continue;
                            
                            if (variantConfig.noZero) {
                                if (!hasZeros(testFirst) && testFirst >= 10000) {
                                    adjustedFirst = testFirst;
                                    foundValid = true;
                                }
                            } else if (variantConfig.hasZero) {
                                if (countZeros(testFirst) >= 1 && testFirst >= 10000) {
                                    adjustedFirst = testFirst;
                                    foundValid = true;
                                }
                            } else {
                                adjustedFirst = testFirst;
                                foundValid = true;
                            }
                        }
                        
                        // If still not valid, try subtracting multiples
                        if (!foundValid) {
                            for (let multiple = 1; multiple <= remainder && !foundValid; multiple++) {
                                const testFirst = baseFirst - remainder - (second * multiple);
                                if (testFirst < firstRange[0] || testFirst > firstRange[1]) break;
                                
                                if (variantConfig.noZero) {
                                    if (!hasZeros(testFirst) && testFirst >= 10000) {
                                        adjustedFirst = testFirst;
                                        foundValid = true;
                                    }
                                } else if (variantConfig.hasZero) {
                                    if (countZeros(testFirst) >= 1 && testFirst >= 10000) {
                                        adjustedFirst = testFirst;
                                        foundValid = true;
                                    }
                                } else {
                                    adjustedFirst = testFirst;
                                    foundValid = true;
                                }
                            }
                        }
                        
                        // If still not valid, use the base adjustment (might have zeros but will still work)
                        if (!foundValid) {
                            adjustedFirst = baseFirst - remainder;
                        }
                    }
                }
                
                const result = Math.floor(adjustedFirst / second);
                allQuestions.push({ first: adjustedFirst, second: second, answer: result });
            }
            
            // Shuffle questions to randomize sequence of second number
            for (let i = allQuestions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
            }
        } else if (variantConfig.maxQuestions) {
            // Multi-digit division: generate limited random questions
            const maxQuestions = variantConfig.maxQuestions;
            const usedQuestions = new Set();
            let attempts = 0;
            const maxAttempts = 10000;
            
            while (allQuestions.length < maxQuestions && attempts < maxAttempts) {
                attempts++;
                const second = Math.floor(Math.random() * (secondRange[1] - secondRange[0] + 1)) + secondRange[0];
                const result = Math.floor(Math.random() * (resultRange[1] - resultRange[0] + 1)) + resultRange[0];
                const first = second * result;
                const questionKey = `${first}_${second}_${result}`;
                
                if (!usedQuestions.has(questionKey)) {
                    usedQuestions.add(questionKey);
                    allQuestions.push({ first: first, second: second, answer: result });
                }
            }
        } else {
            // Standard single-digit division
            for (let second = secondRange[0]; second <= secondRange[1]; second++) {
                for (let result = resultRange[0]; result <= resultRange[1]; result++) {
                    const first = second * result;
                    // No limit on first number for division
                    allQuestions.push({ first: first, second: second, answer: result });
                }
            }
        }
    }

    // Shuffle questions (except sequential variants which are already in order)
    if (!variantConfig.sequential) {
        for (let i = allQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
        }
    }

    currentSession.questions = allQuestions;
}

/**
 * REQUIREMENTS:
 * - Check if 50 questions asked and more questions available → show termination modal
 * - Check if all questions completed → call endSession()
 * - Get current question from questions array
 * - Check if question already asked (safety check)
 * - Mark question as asked in askedQuestions Set
 * - Call displayQuestion(question)
 * - Call startTimer()
 * - No return value
 * 
 * CALLED FROM:
 * - startSession() (to begin quiz)
 * - checkAnswer() (after each answer, to move to next question)
 * - continueSession() (to continue after 50 questions)
 * - askNextQuestion() (recursively, when skipping already-asked questions)
 */
function askNextQuestion() {
    if (window.debugLog) window.debugLog('askNextQuestion');
    console.log('🔵 askNextQuestion called. currentSession:', currentSession ? {
        questionIndex: currentSession.questionIndex,
        totalQuestions: currentSession.questions?.length,
        operation: currentSession.operation,
        variant: currentSession.variant
    } : 'null');
    
    // Check if we've asked 50 questions and need to prompt
    if (currentSession.questionIndex === 50 && currentSession.questions.length > 50) {
        showTerminationModal();
        return;
    }

    // Check if all questions have been asked
    if (currentSession.questionIndex >= currentSession.questions.length) {
        console.log('✅ All questions completed. Question index:', currentSession.questionIndex, 'Total questions:', currentSession.questions.length);
        // Call endSession from summary.js (will be available globally)
        if (window.endSession) {
            window.endSession();
        } else {
            console.error('endSession function not found. Make sure summary.js is loaded.');
        }
        return;
    }

    const question = currentSession.questions[currentSession.questionIndex];
    console.log('🔵 Current question:', question);
    const questionKey = `${question.first}_${question.second}_${question.answer}`;

    // Skip if already asked (shouldn't happen, but safety check)
    if (currentSession.askedQuestions.has(questionKey)) {
        currentSession.questionIndex++;
        askNextQuestion();
        return;
    }

    currentSession.askedQuestions.add(questionKey);
    console.log('🔵 Calling displayQuestion with:', question);
    displayQuestion(question);
    updateProgressTracker();
    startTimer();
}

/**
 * REQUIREMENTS:
 * - Get operation and variant configuration
 * - Determine operation symbol (+, -, ×, ÷)
 * - Check if variant is multi-digit (rightToLeft flag)
 * - If multi-digit: hide regular question lines (table will be shown)
 * - If standard: show regular question lines with first and second numbers
 * - Calculate required digits for answer
 * - Call setupRightToLeftInput() for multi-digit variants
 * - Call setupNormalInput() for standard variants
 * - Reset timeElapsed and questionStartTime
 * - Scroll question area to top on mobile
 * - No return value
 * 
 * CALLED FROM:
 * - askNextQuestion() (to display the current question)
 */
function displayQuestion(question) {
    if (window.debugLog) window.debugLog('displayQuestion');
    const operation = currentSession.operation;
    const variantConfig = variants[operation][currentSession.variant];
    let opSymbol = '+';
    if (operation === 'subtraction') opSymbol = '-';
    else if (operation === 'multiplication') opSymbol = '×';
    else if (operation === 'division') opSymbol = '÷';

    const line1 = document.getElementById('line1');
    const line2 = document.getElementById('line2');
    
    // Check if this is multi-digit variant (uses table layout)
    const isMultiDigit = variantConfig.rightToLeft;
    
    // Show/hide quiz controls based on variant type (only for multi-digit)
    const quizControls = document.getElementById('quizControls');
    if (quizControls) {
        // Keep buttons hidden initially for all variants (will be shown only on wrong answer for multi-digit)
        quizControls.classList.add('hidden');
        quizControls.style.display = 'none';
    }
    
    if (isMultiDigit) {
        console.log('🔵 Multi-digit variant detected. Setting up right-to-left input.');
        // Always show question in line1/line2 with right-aligned, spaced digits
        line1.classList.remove('hidden');
        line2.classList.remove('hidden');
        // Format numbers with spacing between digits and right-align
        const firstStr = question.first.toString();
        const secondStr = question.second.toString();
        line1.textContent = firstStr; // CSS letter-spacing will handle spacing
        line2.textContent = `${opSymbol} ${secondStr}`; // CSS letter-spacing will handle spacing
        // Add mobile-question class for styling (works for both mobile and desktop now)
        line1.classList.add('mobile-question');
        line2.classList.add('mobile-question');
        
        // Show the divider line
        const mathDivider = document.getElementById('mathDivider');
        if (mathDivider) {
            mathDivider.classList.remove('hidden');
        }
        
        // Hide correct answer line initially (will show when answer is wrong)
        const correctAnswerLine = document.getElementById('correctAnswerLine');
        if (correctAnswerLine) {
            correctAnswerLine.classList.add('hidden');
            correctAnswerLine.textContent = '';
        }
        
        // Hide the table (we'll use answer cells container instead)
        const multidigitTable = document.getElementById('multidigitTable');
        if (multidigitTable) {
            multidigitTable.classList.add('hidden');
        }
    } else {
        // Show regular lines
        line1.classList.remove('hidden');
        line2.classList.remove('hidden');
        line1.textContent = question.first;
        line2.textContent = `${opSymbol} ${question.second}`;
        line1.classList.remove('multidigit');
        line2.classList.remove('multidigit');
        
        // Hide multidigit table for standard variants
        const multidigitTable = document.getElementById('multidigitTable');
        if (multidigitTable) {
            multidigitTable.innerHTML = '';
            multidigitTable.classList.add('hidden');
        }
    }
    
    // Clear line4, but for multi-digit variants we'll use table row 4 instead
    if (!variantConfig.rightToLeft) {
        document.getElementById('line4').textContent = '';
    }
    
    // Scroll question area to top on mobile to keep it visible when keyboard appears
    // Use requestAnimationFrame to ensure DOM is updated first, then scroll smoothly
    requestAnimationFrame(() => {
        // Only scroll on mobile devices
        if (window.innerWidth <= 768) {
            const questionContainer = document.querySelector('.question-container');
            if (questionContainer) {
                // Scroll container to top so sticky question stays visible
                questionContainer.scrollIntoView({ behavior: 'auto', block: 'start', inline: 'nearest' });
            }
        }
    });
    
    // Determine required digits for answer
    const requiredDigits = question.answer.toString().length;
    
    // Check if right-to-left input is needed (multi-digit variants)
    if (variantConfig.rightToLeft) {
        setupRightToLeftInput(question, requiredDigits, operation);
    } else {
        setupNormalInput(question, requiredDigits);
    }

    timeElapsed = 0;
    questionStartTime = Date.now();
}

/**
 * REQUIREMENTS:
 * - Hide answerDisplay and multidigitTable
 * - Show answerInput field
 * - Clear input value
 * - Enable input field
 * - Reset background color to white
 * - Remove previous event listeners by cloning input element
 * - Add input event listener: check if input length >= requiredDigits, parse and call checkAnswer() when complete
 * - Focus input after DOM update
 * - Select text on desktop (not mobile)
 * - Handle focus event to minimize scroll jump on mobile
 * - No return value
 * 
 * CALLED FROM:
 * - displayQuestion() (for standard variants that don't use multi-digit table)
 */
function setupNormalInput(question, requiredDigits) {
    if (window.debugLog) window.debugLog('setupNormalInput');
    const answerDisplay = document.getElementById('answerDisplay');
    const input = document.getElementById('answerInput');
    const multidigitTable = document.getElementById('multidigitTable');
    const isMobile = window.innerWidth <= 768;
    
    answerDisplay.classList.add('hidden');
    multidigitTable.classList.add('hidden');
    input.classList.remove('hidden');
    input.value = '';
    input.disabled = false;
    // Reset background color to white for new question
    input.style.backgroundColor = 'white';
    input.style.transition = '';
    
    // On mobile, avoid cloning to keep keyboard open - just update event listeners
    if (isMobile) {
        // Check if input was focused (keyboard was open)
        const wasFocused = document.activeElement === input;
        
        // Remove old event listeners by cloning the input
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);
        
        newInput.addEventListener('input', function() {
            const userAnswer = this.value;
            if (userAnswer.length >= requiredDigits) {
                const parsed = parseInt(userAnswer);
                // Add delay on mobile so user can see the last digit before it submits
                setTimeout(() => {
                    checkAnswer(question, isNaN(parsed) ? null : parsed);
                }, 200); // 0.2 seconds delay on mobile
            }
        });
        
        // Immediately restore focus on mobile to keep keyboard open
        if (wasFocused) {
            // Use multiple methods to ensure focus is restored
            requestAnimationFrame(() => {
                newInput.focus();
                // Also try after a tiny delay as backup
                setTimeout(() => {
                    if (document.activeElement !== newInput) {
                        newInput.focus();
                    }
                }, 5);
            });
        } else {
            // If not focused, focus it to open keyboard
            setTimeout(() => {
                newInput.focus();
            }, 10);
        }
    } else {
        // Desktop: clone and replace as before
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);
        
        newInput.addEventListener('input', function() {
            const userAnswer = this.value;
            if (userAnswer.length >= requiredDigits) {
                const parsed = parseInt(userAnswer);
                // Add delay so user can see the last digit before it submits
                setTimeout(() => {
                    checkAnswer(question, isNaN(parsed) ? null : parsed);
                }, 200); // 0.2 seconds delay
            }
        });

        // Focus on the new input after it's added to DOM
        setTimeout(() => {
            newInput.focus();
            newInput.select();
        }, 50);
    }
    
    // Minimize scroll jump when keyboard appears on mobile
    const finalInput = isMobile ? document.getElementById('answerInput') : input;
    finalInput.addEventListener('focus', function() {
        // Let sticky positioning handle keeping question visible
        // Only make minimal scroll adjustment if input is completely hidden
        setTimeout(() => {
            const rect = this.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            // If input is mostly below viewport (keyboard visible), make minimal scroll
            // Use 'nearest' to prevent excessive jumping
            if (rect.bottom > viewportHeight * 0.9) {
                this.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
            }
        }, 150); // Delay to allow keyboard animation
    });
}

/**
 * REQUIREMENTS:
 * - Hide answerInput and answerDisplay
 * - Show multidigitTable
 * - Convert question numbers to digit arrays
 * - Create 6-column table with 4 rows:
 *   - Row 1: First number (right-aligned)
 *   - Row 2: Operation symbol and second number (right-aligned)
 *   - Row 3: Answer input cells (focusable, tabindex=0)
 *   - Row 4: Correct answer display (initially empty)
 * - Store question data and cells in table object
 * - Set initial cursor position: Division at 5th cell from left (index 4), Others at rightmost cell (index 5)
 * - Add keydown handler: handle digits (0-9), Backspace/Delete, Arrow keys, block other input
 * - Add click/touch handlers for mobile
 * - Add focus handler for proper scrolling
 * - Focus initial cell after DOM update (multiple attempts for mobile)
 * - No return value
 * 
 * CALLED FROM:
 * - displayQuestion() (for multi-digit variants that use right-to-left input table)
 */
function setupRightToLeftInput(question, requiredDigits, operation) {
    if (window.debugLog) window.debugLog('setupRightToLeftInput');
    console.log('🔵 setupRightToLeftInput called with:', { question, requiredDigits, operation });
    
    // Division uses left-to-right input (cursor starts at rightmost position)
    const isDivision = operation === 'division';
    
    const answerDisplay = document.getElementById('answerDisplay');
    const input = document.getElementById('answerInput');
    const multidigitTable = document.getElementById('multidigitTable');
    const mobileInput = document.getElementById('mobileAnswerInput');
    const answerCellsContainer = document.getElementById('answerCellsContainer');
    const line1 = document.getElementById('line1');
    const line2 = document.getElementById('line2');
    const mathDivider = document.getElementById('mathDivider');
    const correctAnswerLine = document.getElementById('correctAnswerLine');
    
    // Hide other input methods
    input.classList.add('hidden');
    answerDisplay.classList.add('hidden');
    multidigitTable.classList.add('hidden');
    answerCellsContainer.classList.add('hidden');
    
    // The 4-field vertical layout is already set up by displayQuestion()
    // Line 1: First number (Question 1) - already formatted with spaces
    // Line 2: Operation and second number (Question 2) - already formatted with spaces
    // Line 3: User answer input (we create below)
    // Line 4: Correct answer (shown when wrong)
    
    // Show divider
    if (mathDivider) {
        mathDivider.classList.remove('hidden');
    }
    
    // Create a wrapper div styled exactly like question lines
    const answerWrapper = document.createElement('div');
    answerWrapper.className = 'question-line mobile-question';
    answerWrapper.id = 'multidigitAnswerWrapper';
    answerWrapper.style.position = 'relative';
    
    // Create a simple input field for user answer - styled exactly like question lines
    const answerInput = document.createElement('input');
    answerInput.type = 'text';
    answerInput.inputMode = 'numeric';
    answerInput.pattern = '[0-9]*';
    answerInput.className = 'multidigit-answer-input';
    answerInput.id = 'multidigitAnswerInput';
    // Style to match question lines exactly - inherit from mobile-question class
    // All styling (including letter-spacing) is handled by CSS classes
    answerInput.style.padding = '0';
    answerInput.style.margin = '0';
    answerInput.style.border = 'none';
    answerInput.style.borderRadius = '0';
    answerInput.style.background = 'transparent';
    answerInput.style.outline = 'none';
    answerInput.style.width = '100%';
    answerInput.placeholder = '';
    answerInput.autocomplete = 'off';
    answerInput.maxLength = requiredDigits;
    
    // Put input inside wrapper
    answerWrapper.appendChild(answerInput);
    
    // Clear any existing multidigit answer input
    const existingWrapper = document.getElementById('multidigitAnswerWrapper');
    if (existingWrapper) {
        existingWrapper.remove();
    }
    const existingInput = document.getElementById('multidigitAnswerInput');
    if (existingInput) {
        existingInput.remove();
    }
    
    // Insert the wrapper (with input inside) after the divider
    if (mathDivider && mathDivider.parentNode) {
        mathDivider.parentNode.insertBefore(answerWrapper, mathDivider.nextSibling);
    }
    
    // Hide correct answer line initially
    if (correctAnswerLine) {
        correctAnswerLine.classList.add('hidden');
    }
    
    // Handle input manually
    // For division: cursor starts at rightmost position and moves left (left-to-right input)
    // For other operations: cursor stays at leftmost position and digits flow right-to-left
    // Direction is handled by CSS (text-align: right), no need to set dir attribute
    
    // Function to get raw value (no spaces needed - CSS letter-spacing handles visual spacing)
    const getRawValue = (value) => {
        return value.replace(/\D/g, '');
    };
    
    answerInput.addEventListener('keydown', function(e) {
        const rawValue = getRawValue(this.value);
        const cursorPos = this.selectionStart;
        
        if (isDivision) {
            // Division: left-to-right input (normal browser behavior)
            // Only intercept to limit digits and auto-submit, otherwise let browser handle input
            if (/^\d$/.test(e.key)) {
                const currentLength = rawValue.length;
                if (currentLength >= requiredDigits) {
                    // Already at max digits, prevent input and auto-submit
                    e.preventDefault();
                    const userAnswer = parseInt(rawValue, 10);
                    if (!isNaN(userAnswer)) {
                        const isMobile = window.innerWidth <= 768;
                        const delay = isMobile ? 200 : 300;
                        setTimeout(() => {
                            checkAnswer(question, userAnswer);
                        }, delay);
                    }
                }
                // Otherwise, let browser handle the input normally (don't prevent default)
                // The input event handler will clean non-digits and handle auto-submit
            }
            // Handle Enter
            else if (e.key === 'Enter') {
                const value = getRawValue(this.value);
                if (value.length > 0) {
                    const userAnswer = parseInt(value, 10);
                    if (!isNaN(userAnswer)) {
                        checkAnswer(question, userAnswer);
                    }
                }
            }
            // Allow all other keys (Backspace, Delete, Arrow keys, etc.) to work normally
            // No need to prevent default - let normal cursor movement work
        } else {
            // Other operations: right-to-left input (cursor stays at left)
            // Handle digit input - always insert at position 0 (leftmost)
            if (/^\d$/.test(e.key) && rawValue.length < requiredDigits) {
                e.preventDefault();
                
                // Insert digit at the beginning (position 0) - this makes digits flow right-to-left
                const newRawValue = e.key + rawValue;
                // CSS letter-spacing will handle visual spacing
                this.value = newRawValue;
                
                // Keep cursor at position 0 (left side)
                setTimeout(() => {
                    this.setSelectionRange(0, 0);
                }, 0);
                
                // Auto-submit when all digits entered
                if (newRawValue.length >= requiredDigits) {
                    const userAnswer = parseInt(newRawValue, 10);
                    if (!isNaN(userAnswer)) {
                        // Add delay so user can see the last digit (especially on mobile)
                        const isMobile = window.innerWidth <= 768;
                        const delay = isMobile ? 200 : 300; // 0.2 seconds on mobile, 0.3 on desktop
                        setTimeout(() => {
                            checkAnswer(question, userAnswer);
                        }, delay);
                    }
                }
            }
            // Handle Backspace - delete from the left (position 0)
            else if (e.key === 'Backspace' && rawValue.length > 0) {
                e.preventDefault();
                const newRawValue = rawValue.slice(1); // Remove first character
                this.value = newRawValue;
                setTimeout(() => {
                    this.setSelectionRange(0, 0);
                }, 0);
            }
            // Handle Delete - same as Backspace for our use case
            else if (e.key === 'Delete' && rawValue.length > 0) {
                e.preventDefault();
                const newRawValue = rawValue.slice(1);
                this.value = newRawValue;
                setTimeout(() => {
                    this.setSelectionRange(0, 0);
                }, 0);
            }
            // Handle Enter
            else if (e.key === 'Enter') {
                const value = getRawValue(this.value);
                if (value.length > 0) {
                    const userAnswer = parseInt(value, 10);
                    if (!isNaN(userAnswer)) {
                        checkAnswer(question, userAnswer);
                    }
                }
            }
            // Prevent arrow keys and other navigation - keep cursor at left
            else if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
                e.preventDefault();
                setTimeout(() => {
                    this.setSelectionRange(0, 0);
                }, 0);
            }
        }
    });
    
    // Handle input event to clean non-digits and auto-submit
    answerInput.addEventListener('input', function() {
        const rawValue = getRawValue(this.value);
        const cursorPos = this.selectionStart;
        
        if (this.value !== rawValue) {
            // Non-digits were entered, clean them
            this.value = rawValue;
            // Restore cursor position (approximate)
            setTimeout(() => {
                if (isDivision) {
                    // For division, let cursor stay where it naturally is (normal behavior)
                    // Don't force cursor position
                } else {
                    // For other operations, keep cursor at position 0 (left)
                    this.setSelectionRange(0, 0);
                }
            }, 0);
        }
        
        // Auto-submit when all digits entered (for division)
        if (isDivision && rawValue.length >= requiredDigits) {
            const userAnswer = parseInt(rawValue, 10);
            if (!isNaN(userAnswer)) {
                // Add delay so user can see the last digit (especially on mobile)
                const isMobile = window.innerWidth <= 768;
                const delay = isMobile ? 200 : 300; // 0.2 seconds on mobile, 0.3 on desktop
                setTimeout(() => {
                    checkAnswer(question, userAnswer);
                }, delay);
            }
        }
    });
    
    // Handle click - move cursor appropriately
    answerInput.addEventListener('click', function() {
        setTimeout(() => {
            if (isDivision) {
                // For division, let normal click behavior work (cursor goes where user clicks)
                // Don't force cursor position
            } else {
                // For other operations, move cursor to position 0 (left)
                this.setSelectionRange(0, 0);
            }
        }, 0);
    });
    
    // Focus the input field with cursor at appropriate position
    setTimeout(() => {
        answerInput.focus();
        if (isDivision) {
            // For division, cursor should start at the rightmost position
            // For a right-aligned empty input, position 0 should appear on the right
            // But to ensure it's on the right, we'll set cursor to position 0
            // The browser will handle normal left-to-right input from there
            answerInput.setSelectionRange(0, 0);
            // Force a reflow to ensure cursor appears on the right
            answerInput.blur();
            answerInput.focus();
        } else {
            // For other operations, cursor at position 0 (left)
            answerInput.setSelectionRange(0, 0);
        }
    }, 100);
    
    // Store reference for cleanup
    if (answerCellsContainer) {
        answerCellsContainer._multidigitInput = answerInput;
    }
    
    console.log('✅ Simple 4-field layout setup complete.');
}

/**
 * REQUIREMENTS:
 * - Clear existing timer interval
 * - Get variant configuration
 * - Hide timer element (always hidden)
 * - If variant has noTimeLimit: track time but don't display, update timeElapsed every 100ms
 * - If variant has time limit: track time, check if time >= 6 seconds, if timeout call checkAnswer() with null answer
 * - No return value
 * 
 * CALLED FROM:
 * - askNextQuestion() (when a new question is displayed)
 */
function startTimer() {
    if (window.debugLog) window.debugLog('startTimer');
    if (timerInterval) clearInterval(timerInterval);
    
    const operation = currentSession.operation;
    const variantConfig = variants[operation][currentSession.variant];
    const timerEl = document.getElementById('timer');
    
    // Timer is always hidden, but we still track time
    timerEl.style.display = 'none';
    timerEl.classList.add('hidden');
    
    // Check if there's no time limit for this variant
    if (variantConfig.noTimeLimit) {
        // Still track time even though timer is hidden
        timeElapsed = 0;
        questionStartTime = Date.now();
        timerInterval = setInterval(() => {
            timeElapsed += 0.1;
        }, 100);
        return;
    }
    
    // For variants with time limits, track time but don't display timer
    timeElapsed = 0;
    questionStartTime = Date.now();
    timerEl.textContent = 'Time: 0.0s';
    timerEl.classList.remove('warning');
    
    timerInterval = setInterval(() => {
        timeElapsed += 0.1;
        const roundedTime = Math.round(timeElapsed * 10) / 10;
        
        // Check time limit without displaying timer
        if (roundedTime >= 6) {
            clearInterval(timerInterval);
            // Timeout - show correct answer
            const question = currentSession.questions[currentSession.questionIndex];
            checkAnswer(question, null);
        }
    }, 100);
}

/**
 * REQUIREMENTS:
 * - Return Promise that resolves when speech completes
 * - Check if speechSynthesis is available
 * - Convert operation to word (plus, minus, times, divided by)
 * - Create speech utterance with text: "{first} {opWord} {second} equals {answer}"
 * - Set speech rate to 0.9, pitch to 1
 * - Resolve promise on utterance end or error
 * - Return immediately resolved promise if speech not supported
 * 
 * CALLED FROM:
 * - checkAnswer() (for standard variants when answer is wrong, to speak the correct answer)
 */
function speakQuestionAndAnswer(question, correctAnswer) {
    if (window.debugLog) window.debugLog('speakQuestionAndAnswer');
    return new Promise((resolve) => {
        if ('speechSynthesis' in window) {
            const operation = currentSession.operation;
            let opWord = 'plus';
            if (operation === 'subtraction') opWord = 'minus';
            else if (operation === 'multiplication') opWord = 'times';
            else if (operation === 'division') opWord = 'divided by';

            const text = `${question.first} ${opWord} ${question.second} equals ${correctAnswer}`;
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            
            utterance.onend = () => {
                resolve();
            };
            
            utterance.onerror = () => {
                resolve(); // Resolve even on error to continue
            };
            
            speechSynthesis.speak(utterance);
        } else {
            resolve(); // If speech not supported, resolve immediately
        }
    });
}

/**
 * REQUIREMENTS:
 * - Clear timer interval
 * - Calculate time taken
 * - Determine if answer is correct (userAnswer === question.answer)
 * - Update currentSession.totalTime
 * - Increment correctCount or wrongCount
 * - If wrong: show correct answer (in table row 4 for multi-digit, line4 for standard)
 * - Record result in currentSession.results array
 * - Disable all input methods (normal input, answerDisplay, table cells)
 * - If wrong or no answer: for multi-digit wait 6 seconds then next question, for standard speak and wait 0.5s then next question
 * - If correct: make input light green for standard variants (not multi-digit), wait 0.25 seconds then next question
 * - No return value
 * 
 * CALLED FROM:
 * - setupNormalInput() (when user enters answer in normal input field)
 * - setupRightToLeftInput() (when user enters all digits in multidigit table)
 * - startTimer() (when time limit exceeded, with null answer)
 */
function checkAnswer(question, userAnswer) {
    if (window.debugLog) window.debugLog('checkAnswer');
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    // Get answer from multidigit input field if userAnswer not provided
    if (userAnswer === undefined || userAnswer === null) {
        const multidigitInput = document.getElementById('multidigitAnswerInput');
        if (multidigitInput && !multidigitInput.classList.contains('hidden')) {
            // Remove spaces and non-digits to get raw number
            const value = multidigitInput.value.replace(/\s/g, '').replace(/\D/g, '');
            if (value.length > 0) {
                userAnswer = parseInt(value, 10);
                if (isNaN(userAnswer)) {
                    userAnswer = null;
                }
            } else {
                userAnswer = null;
            }
        }
    }

    const timeTaken = Math.round(timeElapsed * 10) / 10;
    const correctAnswer = question.answer;
    const isCorrect = userAnswer !== null && userAnswer === correctAnswer;
    
    // Debug logging for answer comparison
    if (window.debugLog) {
        console.log('🔍 Answer check:', {
            userAnswer,
            correctAnswer,
            isCorrect,
            userAnswerType: typeof userAnswer,
            correctAnswerType: typeof correctAnswer
        });
    }

    currentSession.totalTime += timeTaken;

    if (isCorrect) {
        currentSession.correctCount++;
    } else {
        currentSession.wrongCount++;
        // For multi-digit variants, show correct answer in correctAnswerLine
        const multidigitInput = document.getElementById('multidigitAnswerInput');
        const correctAnswerLine = document.getElementById('correctAnswerLine');
        if (multidigitInput && !multidigitInput.classList.contains('hidden')) {
            // Show correct answer in fourth line (CSS letter-spacing handles spacing)
            if (correctAnswerLine) {
                const answerStr = correctAnswer.toString();
                // CSS letter-spacing will handle visual spacing
                correctAnswerLine.textContent = answerStr;
                correctAnswerLine.classList.remove('hidden');
            }
        } else {
            // Standard variant: show in line4 text element
            document.getElementById('line4').textContent = `Correct Answer: ${correctAnswer}`;
        }
    }

    // Record result
    const operation = currentSession.operation;
    let opSymbol = '+';
    if (operation === 'subtraction') opSymbol = '-';
    else if (operation === 'multiplication') opSymbol = '×';
    else if (operation === 'division') opSymbol = '÷';

    currentSession.results.push({
        question: `${question.first} ${opSymbol} ${question.second}`,
        userAnswer: userAnswer !== null ? userAnswer : 'No Answer',
        correctAnswer: correctAnswer,
        time: timeTaken,
        isCorrect: isCorrect
    });

    // Update active session tracking (question number is 1-based for display)
    if (typeof window.updateActiveSession === 'function') {
        const questionNo = currentSession.questionIndex + 1; // Convert 0-based to 1-based
        window.updateActiveSession(
            operation,
            currentSession.variant,
            questionNo,
            isCorrect,
            currentSession.questions.length
        );
    }

    // Disable input (both normal, multidigit input, and other input methods)
    // For single-digit on mobile, keep input enabled to maintain keyboard
    const input = document.getElementById('answerInput');
    const answerDisplay = document.getElementById('answerDisplay');
    const multidigitTable = document.getElementById('multidigitTable');
    const multidigitInput = document.getElementById('multidigitAnswerInput');
    const isMobile = window.innerWidth <= 768;
    
    // Get variant config (will be used later in the function)
    const variantConfig = variants[operation][currentSession.variant];
    
    // For single-digit on mobile, don't disable - just clear value to keep keyboard open
    if (input && !input.classList.contains('hidden')) {
        if (isMobile && !variantConfig.rightToLeft) {
            // Keep enabled on mobile for single-digit to maintain keyboard
            input.value = '';
            input.style.backgroundColor = 'white';
        } else {
            input.disabled = true;
        }
    }
    if (answerDisplay && !answerDisplay.classList.contains('hidden')) {
        answerDisplay.setAttribute('tabindex', '-1');
        answerDisplay.style.pointerEvents = 'none';
    }
    if (multidigitInput && !multidigitInput.classList.contains('hidden')) {
        multidigitInput.disabled = true;
    }

    // If wrong or no answer, speak and wait for speech to complete (skip for multi-digit variants)
    // variantConfig already declared above
    if (!isCorrect && variantConfig.rightToLeft) {
        // Multi-digit variant: answer already shown in row 4, show buttons and wait for user action
        const quizControls = document.getElementById('quizControls');
        if (quizControls) {
            quizControls.classList.remove('hidden');
            quizControls.style.display = 'flex';
        }
        // Don't auto-advance - wait for user to click a button (Try Again, Next Question, or Next Assignment)
    } else if (!isCorrect) {
        // Standard variant: speak and wait for speech to complete
        speakQuestionAndAnswer(question, correctAnswer).then(() => {
            setTimeout(() => {
                currentSession.questionIndex++;
                askNextQuestion();
            }, 500);
        });
    } else {
        // If correct, make input light green for single-digit questions (not multi-digit)
        if (!variantConfig.rightToLeft && input && !input.classList.contains('hidden')) {
            input.style.backgroundColor = '#d4edda'; // Light green color (same as dashboard)
            input.style.transition = 'background-color 0.3s ease';
        }
        // Wait 0.25 seconds then move to next question (green will persist during this time)
        setTimeout(() => {
            currentSession.questionIndex++;
            askNextQuestion();
        }, 250);
    }
}

/**
 * REQUIREMENTS:
 * - Display modal element (flex)
 * - No return value
 * 
 * CALLED FROM:
 * - askNextQuestion() (when 50 questions have been asked and more questions available)
 */
function showTerminationModal() {
    if (window.debugLog) window.debugLog('showTerminationModal');
    document.getElementById('modal').style.display = 'flex';
}

/**
 * REQUIREMENTS:
 * - Hide modal
 * - Increment currentSession.questionIndex
 * - Call askNextQuestion() to continue
 * - No return value
 * 
 * CALLED FROM:
 * - index.html onclick="continueSession()" (user clicks Continue button in termination modal)
 */
function continueSession() {
    if (window.debugLog) window.debugLog('continueSession');
    console.log('▶️ continueSession() called');
    const modal = document.getElementById('modal');
    if (modal) {
        modal.style.display = 'none';
        console.log('✅ Modal closed');
    }
    // Increment questionIndex to move past question 50, then continue
    currentSession.questionIndex++;
    console.log('✅ Question index incremented to:', currentSession.questionIndex);
    askNextQuestion();
}

// CALLED BY: question.js - startSession() (updates header when session starts), question.html - DOMContentLoaded listener (updates header on page load)
function updateQuestionPageHeader() {
    if (window.debugLog) window.debugLog('updateQuestionPageHeader');
    // Read from user_profile if available
    if (currentUserProfile) {
        const fullName = [currentUserProfile.first_name, currentUserProfile.last_name].filter(Boolean).join(' ');
        const classSection = currentUserProfile.class && currentUserProfile.section
            ? `${currentUserProfile.class}${currentUserProfile.section}`
            : '';
        const rollNumber = currentUserProfile.roll_number || '';

        const userNameDisplay = document.getElementById('questionUserNameDisplay');
        const userClassDisplay = document.getElementById('questionUserClassDisplay');
        const userRollDisplay = document.getElementById('questionUserRollDisplay');

        if (userNameDisplay) userNameDisplay.textContent = fullName ? `Name: ${fullName}` : 'Name: Anonymous';
        if (userClassDisplay) userClassDisplay.textContent = classSection ? `Class: ${classSection}` : 'Class: NA';
        if (userRollDisplay) userRollDisplay.textContent = rollNumber ? `Roll Number: ${rollNumber}` : 'Roll Number: NA';
    } else {
        // Fallback to stored values from sessionStorage (set in student dashboard)
        try {
            const cachedProfile = sessionStorage.getItem('quizUserProfile');
            if (cachedProfile) {
                const profile = JSON.parse(cachedProfile);
                const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
                const classSection = profile.class && profile.section ? `${profile.class}${profile.section}` : '';
                const rollNumber = profile.roll_number || '';

                const userNameDisplay = document.getElementById('questionUserNameDisplay');
                const userClassDisplay = document.getElementById('questionUserClassDisplay');
                const userRollDisplay = document.getElementById('questionUserRollDisplay');

                if (userNameDisplay) userNameDisplay.textContent = fullName ? `Name: ${fullName}` : 'Name: Anonymous';
                if (userClassDisplay) userClassDisplay.textContent = classSection ? `Class: ${classSection}` : 'Class: NA';
                if (userRollDisplay) userRollDisplay.textContent = rollNumber ? `Roll Number: ${rollNumber}` : 'Roll Number: NA';
            } else {
                // Final fallback for anonymous / missing data
                const userNameDisplay = document.getElementById('questionUserNameDisplay');
                const userClassDisplay = document.getElementById('questionUserClassDisplay');
                const userRollDisplay = document.getElementById('questionUserRollDisplay');
                if (userNameDisplay) userNameDisplay.textContent = 'Name: Anonymous';
                if (userClassDisplay) userClassDisplay.textContent = 'Class: NA';
                if (userRollDisplay) userRollDisplay.textContent = 'Roll Number: NA';
            }
        } catch (err) {
            console.warn('Unable to parse cached profile for question header', err);
            // Final fallback for anonymous / missing data
            const userNameDisplay = document.getElementById('questionUserNameDisplay');
            const userClassDisplay = document.getElementById('questionUserClassDisplay');
            const userRollDisplay = document.getElementById('questionUserRollDisplay');
            if (userNameDisplay) userNameDisplay.textContent = 'Name: Anonymous';
            if (userClassDisplay) userClassDisplay.textContent = 'Class: NA';
            if (userRollDisplay) userRollDisplay.textContent = 'Roll Number: NA';
        }
    }

    // Update operation and variant from sessionStorage
    const operation = sessionStorage.getItem('quizOperation');
    const variant = sessionStorage.getItem('quizVariant');
    
    const operationDisplay = document.getElementById('questionOperationDisplay');
    const variantDisplay = document.getElementById('questionVariantDisplay');
    
    if (operationDisplay) {
        // Capitalize first letter of operation
        const operationText = operation ? operation.charAt(0).toUpperCase() + operation.slice(1) : 'N/A';
        operationDisplay.textContent = `Operation: ${operationText}`;
    }
    
    if (variantDisplay) {
        variantDisplay.textContent = variant ? `Variant: ${variant}` : 'Variant: N/A';
    }
}

/**
 * REQUIREMENTS:
 * - Update progress tracker to show current question number / total questions
 * - Update both progress text and progress bar
 * - Calculate percentage for progress bar width
 * - No return value
 * 
 * CALLED BY: question.js - askNextQuestion() (after question is displayed)
 */
function updateProgressTracker() {
    if (window.debugLog) window.debugLog('updateProgressTracker');
    if (!currentSession || !currentSession.questions) {
        return;
    }
    
    const currentQuestion = currentSession.questionIndex + 1; // 1-based for display
    const totalQuestions = currentSession.questions.length;
    const percentage = totalQuestions > 0 ? (currentQuestion / totalQuestions) * 100 : 0;
    
    // Update progress text
    const progressText = document.getElementById('progressText');
    if (progressText) {
        progressText.textContent = `${currentQuestion} / ${totalQuestions}`;
    }
    
    // Update progress bar
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }
}

// CALLED BY: question.html - <button onclick="goBackToDashboard()">Dashboard</button>
function goBackToDashboard() {
    if (window.debugLog) window.debugLog('goBackToDashboard');
    window.location.href = 'student-dashboard.html';
}

// CALLED BY: question.html - <button onclick="handleOnHold()">On Hold</button>
function handleOnHold() {
    if (window.debugLog) window.debugLog('handleOnHold');
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    const onHoldBtn = document.getElementById('onHoldBtn');
    if (onHoldBtn) {
        onHoldBtn.textContent = 'Resume';
        onHoldBtn.onclick = handleResume;
    }
}

// CALLED BY: question.js - handleOnHold() (button.onclick = handleResume when timer is on hold)
function handleResume() {
    if (window.debugLog) window.debugLog('handleResume');
    if (typeof startTimer === 'function') {
        startTimer();
    }
    const onHoldBtn = document.getElementById('onHoldBtn');
    if (onHoldBtn) {
        onHoldBtn.textContent = 'On Hold';
        onHoldBtn.onclick = handleOnHold;
    }
}

// CALLED BY: question.html - <button onclick="handleTryAgain()">Try Again</button>
function handleTryAgain() {
    if (window.debugLog) window.debugLog('handleTryAgain');
    
    // Hide buttons
    const quizControls = document.getElementById('quizControls');
    if (quizControls) {
        quizControls.classList.add('hidden');
        quizControls.style.display = 'none';
    }
    
    if (currentSession) {
        // Store current question before incrementing
        const currentQuestion = currentSession.questions[currentSession.questionIndex];
        
        // Increment questionIndex (counts as next question)
        currentSession.questionIndex++;
        
        // Display the same question again
        if (currentQuestion) {
            displayQuestion(currentQuestion);
            startTimer();
        }
    }
}

// CALLED BY: question.html - <button onclick="handleNextQuestion()">Next Question</button>
function handleNextQuestion() {
    if (window.debugLog) window.debugLog('handleNextQuestion');
    
    // Hide buttons
    const quizControls = document.getElementById('quizControls');
    if (quizControls) {
        quizControls.classList.add('hidden');
        quizControls.style.display = 'none';
    }
    
    // Increment questionIndex and move to next question
    // Note: askNextQuestion() will increment questionIndex, so we increment here first
    if (currentSession) {
        currentSession.questionIndex++;
    }
    
    // Call askNextQuestion (will display next question)
    if (typeof askNextQuestion === 'function') {
        askNextQuestion();
    }
}

// CALLED BY: question.html - <button onclick="handleNextAssignment()">Next Assignment</button>
function handleNextAssignment() {
    if (window.debugLog) window.debugLog('handleNextAssignment');
    window.location.href = 'student-dashboard.html';
}

// Expose functions globally for use by other modules
window.startSession = startSession;
window.continueSession = continueSession;
window.showTerminationModal = showTerminationModal;
window.updateQuestionPageHeader = updateQuestionPageHeader;
window.goBackToDashboard = goBackToDashboard;
window.updateProgressTracker = updateProgressTracker;
window.handleOnHold = handleOnHold;
window.handleResume = handleResume;
window.handleTryAgain = handleTryAgain;
window.handleNextQuestion = handleNextQuestion;
window.handleNextAssignment = handleNextAssignment;