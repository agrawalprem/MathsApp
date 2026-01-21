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
    const questionKey = `${question.first}_${question.second}_${question.answer}`;

    // Skip if already asked (shouldn't happen, but safety check)
    if (currentSession.askedQuestions.has(questionKey)) {
        currentSession.questionIndex++;
        askNextQuestion();
        return;
    }

    currentSession.askedQuestions.add(questionKey);
    displayQuestion(question);
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
        if (isMultiDigit) {
            quizControls.classList.remove('hidden');
            quizControls.style.display = 'flex';
        } else {
            quizControls.classList.add('hidden');
            quizControls.style.display = 'none';
        }
    }
    
    if (isMultiDigit) {
        // Hide regular lines, table will be shown
        line1.classList.add('hidden');
        line2.classList.add('hidden');
        
        // Clear the multidigit table before creating a new one
        const multidigitTable = document.getElementById('multidigitTable');
        if (multidigitTable) {
            multidigitTable.innerHTML = '';
            // Remove any stored data from previous question
            delete multidigitTable._question;
            delete multidigitTable._answerCells;
            delete multidigitTable._answerDisplayCells;
            delete multidigitTable._enteredDigits;
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
        setupRightToLeftInput(question, requiredDigits);
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
    
    answerDisplay.classList.add('hidden');
    multidigitTable.classList.add('hidden');
    input.classList.remove('hidden');
    input.value = '';
    input.disabled = false;
    // Reset background color to white for new question
    input.style.backgroundColor = 'white';
    input.style.transition = '';
    
    // Remove previous event listeners by cloning
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);
    
    newInput.addEventListener('input', function() {
        const userAnswer = this.value;
        if (userAnswer.length >= requiredDigits) {
            const parsed = parseInt(userAnswer);
            checkAnswer(question, isNaN(parsed) ? null : parsed);
        }
    });

    // Focus on the new input after it's added to DOM
    // Prevent aggressive auto-scroll on mobile when keyboard appears
    setTimeout(() => {
        newInput.focus();
        // Don't select text on mobile as it can cause issues
        if (window.innerWidth > 768) {
            newInput.select();
        }
    }, 50);
    
    // Minimize scroll jump when keyboard appears on mobile
    newInput.addEventListener('focus', function() {
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
function setupRightToLeftInput(question, requiredDigits) {
    if (window.debugLog) window.debugLog('setupRightToLeftInput');
    const answerDisplay = document.getElementById('answerDisplay');
    const input = document.getElementById('answerInput');
    const multidigitTable = document.getElementById('multidigitTable');
    
    // Simply hide the input field
    input.classList.add('hidden');
    answerDisplay.classList.add('hidden');
    
    // Clear any existing table content BEFORE showing it (to prevent old content from flashing)
    // This ensures old rows are completely removed before new ones are added
    multidigitTable.innerHTML = '';
    
    // Remove any stored data from previous question to prevent memory leaks
    if (multidigitTable._question) delete multidigitTable._question;
    if (multidigitTable._answerCells) delete multidigitTable._answerCells;
    if (multidigitTable._answerDisplayCells) delete multidigitTable._answerDisplayCells;
    if (multidigitTable._enteredDigits) delete multidigitTable._enteredDigits;
    
    // Now show the table (it's empty, ready for new content)
    multidigitTable.classList.remove('hidden');
    
    // Convert numbers to digit arrays
    const firstNumStr = question.first.toString();
    const secondNumStr = question.second.toString();
    const firstDigits = firstNumStr.split('');
    const secondDigits = secondNumStr.split('');
    const operation = currentSession.operation === 'addition' ? '+' : 
                    currentSession.operation === 'subtraction' ? '-' :
                    currentSession.operation === 'multiplication' ? '×' : '÷';
    
    const numCols = 6;
    
    // Right-align by padding left with empty strings
    const padFirst = new Array(numCols - firstDigits.length).fill('');
    const padSecond = new Array(numCols - secondDigits.length).fill('');
    const firstRowDigits = [...padFirst, ...firstDigits];
    const secondRowDigits = [...padSecond, ...secondDigits];
    
    // Create 4 rows
    const rows = [];
    const answerCells = [];
    
    // Row 1: First number (right-aligned)
    const row1 = document.createElement('tr');
    for (let i = 0; i < numCols; i++) {
        const cell = document.createElement('td');
        cell.textContent = firstRowDigits[i] || '';
        row1.appendChild(cell);
    }
    rows.push(row1);
    
    // Row 2: Operation + Second number
    // Find rightmost non-empty position for operation
    let opPosition = numCols - secondDigits.length - 1;
    if (opPosition < 0) opPosition = 0;
    
    const row2 = document.createElement('tr');
    for (let i = 0; i < numCols; i++) {
        const cell = document.createElement('td');
        if (i === opPosition) {
            cell.textContent = operation;
            cell.className = 'operation-cell';
        } else {
            // Adjust index for second number digits
            const digitIndex = i - opPosition - 1;
            if (digitIndex >= 0 && digitIndex < secondDigits.length) {
                cell.textContent = secondDigits[digitIndex];
            } else {
                cell.textContent = '';
            }
        }
        row2.appendChild(cell);
    }
    rows.push(row2);
    
    // Row 3: Answer input cells (right-aligned, rightmost cell is last in array)
    const row3 = document.createElement('tr');
    const enteredDigits = [];
    // Store cells from left to right, but input goes right to left
    for (let i = 0; i < numCols; i++) {
        const cell = document.createElement('td');
        cell.className = 'input-cell';
        cell.textContent = ''; // No placeholder prompt
        // Make cell focusable - use both tabindex and contenteditable for better mobile support
        cell.setAttribute('tabindex', '0');
        cell.setAttribute('contenteditable', 'false'); // We'll handle input via keydown, not contenteditable
        cell.setAttribute('role', 'textbox'); // For better accessibility
        cell.setAttribute('aria-label', `Answer digit ${i + 1}`);
        cell.dataset.position = i; // Position from left (0 = leftmost, 5 = rightmost)
        // Prevent default contenteditable behavior
        cell.style.userSelect = 'none';
        cell.style.webkitUserSelect = 'none';
        answerCells.push(cell);
        row3.appendChild(cell);
    }
    rows.push(row3);
    
    // Row 4: Correct answer display (initially empty, shown when answer is checked)
    const row4 = document.createElement('tr');
    const answerDisplayCells = [];
    for (let i = 0; i < numCols; i++) {
        const cell = document.createElement('td');
        cell.textContent = '';
        cell.style.borderTop = '3px solid #764ba2';
        cell.style.color = '#dc3545'; // Red color for correct answer
        answerDisplayCells.push(cell);
        row4.appendChild(cell);
    }
    rows.push(row4);
    
    // Add rows to table
    rows.forEach(row => multidigitTable.appendChild(row));
    
    // Store data for handlers
    const isDivision = currentSession.operation === 'division';
    multidigitTable._question = question;
    multidigitTable._answerCells = answerCells;
    multidigitTable._answerDisplayCells = answerDisplayCells;
    multidigitTable._requiredDigits = requiredDigits;
    multidigitTable._enteredDigits = [];
    // Division: start at 5th cell from LEFT (index 4, 0-indexed)
    // Other operations: start at rightmost cell (index numCols - 1)
    multidigitTable._currentPosition = isDivision ? 4 : numCols - 1;
    
    // Handle keypress for right-to-left entry (or left-to-right for division)
    const handleKeyPress = (e) => {
        const target = e.target;
        if (!target.classList.contains('input-cell')) return;
        
        // Prevent any input that's not a digit or control key
        if (e.key >= '0' && e.key <= '9') {
            e.preventDefault();
            e.stopPropagation();
            const enteredCount = multidigitTable._enteredDigits.length;
            if (enteredCount < requiredDigits && enteredCount < numCols) {
                let position;
                if (isDivision) {
                    // Division: add digit from left to right, starting at position 4
                    position = 4 + enteredCount;
                } else {
                    // Other operations: add digit from right to left (rightmost position is numCols - 1)
                    position = numCols - 1 - enteredCount;
                }
                const cell = answerCells[position];
                cell.textContent = e.key;
                cell.className = 'input-cell entered';
                multidigitTable._enteredDigits.push(e.key);
                multidigitTable._currentPosition = position;
                
                // Check if all digits entered
                if (multidigitTable._enteredDigits.length === requiredDigits) {
                    let userAnswer;
                    if (isDivision) {
                        // Division: digits entered left-to-right, no reversal needed
                        userAnswer = parseInt(multidigitTable._enteredDigits.join(''));
                    } else {
                        // Other operations: reverse the array since digits were entered right-to-left
                        const reversedDigits = [...multidigitTable._enteredDigits].reverse();
                        userAnswer = parseInt(reversedDigits.join(''));
                    }
                    setTimeout(() => {
                        checkAnswer(question, userAnswer);
                    }, 100);
                } else {
                    // Move focus to next cell
                    let nextPosition;
                    if (isDivision) {
                        // Division: move right
                        nextPosition = position + 1;
                        if (nextPosition < numCols) {
                            setTimeout(() => {
                                answerCells[nextPosition].focus();
                            }, 10);
                        }
                    } else {
                        // Other operations: move left
                        if (position > 0) {
                            setTimeout(() => {
                                answerCells[position - 1].focus();
                            }, 10);
                        }
                    }
                }
            }
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
            e.preventDefault();
            e.stopPropagation();
            const enteredCount = multidigitTable._enteredDigits.length;
            if (enteredCount > 0) {
                let position;
                if (isDivision) {
                    // Division: remove last entered digit (from rightmost entered position)
                    position = 4 + enteredCount - 1;
                } else {
                    // Other operations: remove digit from right to left
                    position = numCols - enteredCount;
                }
                const cell = answerCells[position];
                cell.textContent = '';
                cell.className = 'input-cell';
                multidigitTable._enteredDigits.pop();
                // Move focus to the cell we just cleared
                setTimeout(() => {
                    cell.focus();
                }, 10);
            }
        } else if (e.key === 'ArrowLeft' && multidigitTable._currentPosition > 0) {
            e.preventDefault();
            e.stopPropagation();
            multidigitTable._currentPosition--;
            answerCells[multidigitTable._currentPosition].focus();
        } else if (e.key === 'ArrowRight' && multidigitTable._currentPosition < numCols - 1) {
            e.preventDefault();
            e.stopPropagation();
            multidigitTable._currentPosition++;
            answerCells[multidigitTable._currentPosition].focus();
        } else if (e.key.length === 1) {
            // Block any other single character input
            e.preventDefault();
            e.stopPropagation();
        }
    };
    
    // Handle touch/click events for mobile
    const handleClick = function() {
        const position = parseInt(this.dataset.position);
        multidigitTable._currentPosition = position;
        // Use requestAnimationFrame for better focus timing
        requestAnimationFrame(() => {
            this.focus();
            // On mobile, ensure keyboard appears
            if (window.innerWidth <= 768) {
                // Force focus again after a short delay to ensure keyboard appears
                setTimeout(() => {
                    this.focus();
                }, 100);
            }
        });
    };
    
    // Handle focus event to ensure proper scrolling
    const handleFocus = function() {
        // Use 'nearest' to prevent excessive scrolling, let sticky positioning keep question visible
        setTimeout(() => {
            const rect = this.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            // Only scroll if cell is mostly hidden by keyboard
            if (rect.bottom > viewportHeight * 0.85) {
                this.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
            }
        }, 200); // Delay to allow keyboard animation
    };
    
    // Add event listeners to all answer cells BEFORE focusing
    answerCells.forEach(cell => {
        cell.addEventListener('keydown', handleKeyPress);
        cell.addEventListener('click', handleClick);
        cell.addEventListener('touchstart', handleClick, { passive: true });
        cell.addEventListener('focus', handleFocus);
        // Prevent default behaviors that might interfere
        cell.addEventListener('paste', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
        cell.addEventListener('input', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
    });
    
    // Focus on initial cell after DOM update and all event listeners are attached
    // Division: 5th cell (index 4), Others: rightmost cell
    // Use multiple attempts to ensure focus works on mobile
    const focusInitialCell = () => {
        const initialCell = answerCells[multidigitTable._currentPosition];
        if (initialCell) {
            // First attempt
            initialCell.focus();
            // Second attempt after a delay for mobile devices
            setTimeout(() => {
                initialCell.focus();
                // Third attempt if on mobile (for stubborn devices)
                if (window.innerWidth <= 768) {
                    setTimeout(() => {
                        initialCell.focus();
                        // Scroll the cell into view to ensure it's visible
                        initialCell.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
                    }, 300);
                }
            }, 150);
        }
    };
    
    // Wait for DOM to fully render before focusing
    requestAnimationFrame(() => {
        setTimeout(focusInitialCell, 100);
    });
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

    const timeTaken = Math.round(timeElapsed * 10) / 10;
    const correctAnswer = question.answer;
    const isCorrect = userAnswer !== null && userAnswer === correctAnswer;

    currentSession.totalTime += timeTaken;

    if (isCorrect) {
        currentSession.correctCount++;
    } else {
        currentSession.wrongCount++;
        // For multi-digit variants, show answer in table row 4, otherwise in line4
        const multidigitTable = document.getElementById('multidigitTable');
        if (multidigitTable && !multidigitTable.classList.contains('hidden')) {
            // Show correct answer in row 4 of table (right-aligned)
            const answerDisplayCells = multidigitTable._answerDisplayCells || [];
            const answerStr = correctAnswer.toString();
            const answerDigits = answerStr.split('');
            const numCols = 6;
            // Right-align the answer
            const padCount = numCols - answerDigits.length;
            for (let i = 0; i < numCols; i++) {
                const cell = answerDisplayCells[i];
                if (i < padCount) {
                    cell.textContent = '';
                } else {
                    cell.textContent = answerDigits[i - padCount];
                }
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

    // Disable input (both normal, right-to-left display, and table)
    const input = document.getElementById('answerInput');
    const answerDisplay = document.getElementById('answerDisplay');
    const multidigitTable = document.getElementById('multidigitTable');
    if (input && !input.classList.contains('hidden')) {
        input.disabled = true;
    }
    if (answerDisplay && !answerDisplay.classList.contains('hidden')) {
        answerDisplay.setAttribute('tabindex', '-1');
        answerDisplay.style.pointerEvents = 'none';
    }
    if (multidigitTable && !multidigitTable.classList.contains('hidden')) {
        const answerCells = multidigitTable._answerCells || [];
        answerCells.forEach(cell => {
            cell.setAttribute('tabindex', '-1');
            cell.style.pointerEvents = 'none';
        });
    }

    // If wrong or no answer, speak and wait for speech to complete (skip for multi-digit variants)
    const variantConfig = variants[operation][currentSession.variant];
    if (!isCorrect && variantConfig.rightToLeft) {
        // Multi-digit variant: answer already shown in row 4, wait 6 seconds, then move to next question
        setTimeout(() => {
            currentSession.questionIndex++;
            askNextQuestion();
        }, 6000);
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
        return;
    }

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
            return;
        }
    } catch (err) {
        console.warn('Unable to parse cached profile for question header', err);
    }

    // Final fallback for anonymous / missing data
    const userNameDisplay = document.getElementById('questionUserNameDisplay');
    const userClassDisplay = document.getElementById('questionUserClassDisplay');
    const userRollDisplay = document.getElementById('questionUserRollDisplay');
    if (userNameDisplay) userNameDisplay.textContent = 'Name: Anonymous';
    if (userClassDisplay) userClassDisplay.textContent = 'Class: NA';
    if (userRollDisplay) userRollDisplay.textContent = 'Roll Number: NA';
}

// CALLED BY: question.html - <button onclick="goBackToDashboard()">Go Back</button>
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
    if (typeof askNextQuestion === 'function' && currentSession) {
        const currentQuestion = currentSession.questions[currentSession.questionIndex];
        if (currentQuestion) {
            displayQuestion(currentQuestion);
        }
    }
}

// CALLED BY: question.html - <button onclick="handleNextQuestion()">Next Question</button>
function handleNextQuestion() {
    if (window.debugLog) window.debugLog('handleNextQuestion');
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
window.handleOnHold = handleOnHold;
window.handleResume = handleResume;
window.handleTryAgain = handleTryAgain;
window.handleNextQuestion = handleNextQuestion;
window.handleNextAssignment = handleNextAssignment;