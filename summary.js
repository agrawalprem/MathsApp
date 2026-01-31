// ============================================================================
// SUMMARY MODULE - Assignment Summary (Results Display)
// ============================================================================
// This module contains:
// - Session ending logic (endSession)
// - Summary display (showSummary)
// - Session reset (resetSession)
// ============================================================================
// NOTE: This module depends on:
// - shared.js: currentSession, timerInterval, variants
// - shared_db.js: currentUser, saveScore
// - dashboard.js: (no longer needed - status updates handled by fetchAndUpdateVariantStatuses)
// - dashboard.js: selectedOperation (accessed via window)
// ============================================================================

/**
 * REQUIREMENTS:
 * - Hide termination modal if visible
 * - Clear timer interval
 * - Hide question section
 * - Show summary section
 * - Call showSummary() to display results
 * - If user is logged in:
 *   - Call saveScore() to save session data
 *   - Refresh passed and failed variants after save
 *   - Update operation completion status
 *   - Refresh variant cards if operation is selected and dashboard visible
 * - Log all actions to console
 * - No return value
 * 
 * CALLED FROM:
 * - askNextQuestion() in quiz.js (when all questions are completed)
 * - index.html onclick="endSession()" (user clicks End Session button)
 */
function endSession() {
    if (window.debugLog) window.debugLog('endSession');
    console.log('🛑 endSession() called');
    const modal = document.getElementById('modal');
    if (modal) {
        modal.style.display = 'none';
        console.log('✅ Modal closed');
    }
    
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    // Save session data to sessionStorage before navigating
    if (currentSession) {
        try {
            // Convert Set to Array for JSON serialization
            const sessionData = {
                ...currentSession,
                askedQuestions: Array.from(currentSession.askedQuestions || [])
            };
            sessionStorage.setItem('quizSessionData', JSON.stringify(sessionData));
            console.log('✅ Session data saved to sessionStorage');
        } catch (e) {
            console.error('❌ Error saving session data:', e);
        }
    }
    
    // Clear active session tracking
    if (typeof window.clearActiveSession === 'function') {
        window.clearActiveSession();
    }
    
    // Navigate to summary page (score saving will happen on summary page load)
    window.location.href = 'summary.html';
}

/**
 * REQUIREMENTS:
 * - Get session statistics (correct, wrong, total, time, average time)
 * - Get variant name and operation name
 * - Calculate wrong percentage
 * - Build stats HTML with all session information
 * - Display stats in summaryStats element
 * - Determine pass/fail:
 *   - All variants: correct >= 90% AND wrong <= 10%
 *   - Single-digit variants: also requires average time ≤ 6 seconds
 * - Display PASS or FAIL with appropriate styling
 * - Store pass/fail result in currentSession.passed
 * - Build question details HTML with all results
 * - Display question details in questionDetails element
 * - No return value
 * 
 * CALLED BY: summary.js - endSession() (to display results after session ends), summary.html - DOMContentLoaded listener (displays summary when page loads)
 */
function showSummary() {
    if (window.debugLog) window.debugLog('showSummary');
    console.log('📊 showSummary() called');
    // Get session from window.currentSession (set in summary.html) or fallback to currentSession
    const session = window.currentSession || currentSession;
    
    if (!session || !session.operation || !session.variant) {
        console.error('❌ Invalid session data:', session);
        document.getElementById('summaryStats').innerHTML = '<p>Error: Session data not found.</p>';
        return;
    }
    
    const totalQuestions = session.correctCount + session.wrongCount;
    console.log('📊 Session stats:', {
        correct: session.correctCount,
        wrong: session.wrongCount,
        total: totalQuestions,
        results: session.results ? session.results.length : 0
    });
    const wrongPercentage = totalQuestions > 0 ? (session.wrongCount / totalQuestions) * 100 : 0;
    const totalTime = Math.round((session.totalTime || 0) * 10) / 10;
    const avgTime = session.correctCount > 0 ? Math.round((session.totalTime || 0) / session.correctCount * 10) / 10 : 0;

    // Get variants from window.variants (exposed by shared.js) or fallback to variants
    const variantsObj = window.variants || variants;
    if (!variantsObj || !variantsObj[session.operation] || !variantsObj[session.operation][session.variant]) {
        console.error('❌ Variant not found:', session.operation, session.variant);
        document.getElementById('summaryStats').innerHTML = '<p>Error: Variant configuration not found.</p>';
        return;
    }
    
    const variantName = variantsObj[session.operation][session.variant].name;
    const operationName = session.operation.charAt(0).toUpperCase() + session.operation.slice(1);
    const statsHTML = `
        <p><strong>Operation:</strong> ${operationName}</p>
        <p><strong>Variant:</strong> ${variantName}</p>
        <p><strong>Total Questions:</strong> ${totalQuestions}</p>
        <p><strong>Correct Answers:</strong> ${session.correctCount}</p>
        <p><strong>Wrong Answers:</strong> ${session.wrongCount}</p>
        <p><strong>Total Time:</strong> ${totalTime} seconds</p>
        <p><strong>Average Time per Correct Sum:</strong> ${avgTime} seconds</p>
    `;

    document.getElementById('summaryStats').innerHTML = statsHTML;

    // Check if this is a multi-digit variant
    const variantConfig = variantsObj[session.operation][session.variant];
    const isMultiDigit = variantConfig.rightToLeft;
    
    // Pass criteria: 
    // - All variants: correct >= 90% AND wrong <= 10%
    // - Single-digit variants: also requires average time per correct question < 6 seconds
    let passed = false;
    if (totalQuestions > 0) {
        const correctPercentage = (session.correctCount / totalQuestions) * 100;
        if (isMultiDigit) {
            // Multi-digit: correct >= 90% AND wrong <= 10% (no time limit)
            passed = correctPercentage >= 90 && wrongPercentage <= 10;
        } else {
            // Single-digit: correct >= 90% AND wrong <= 10% AND average time < 6 seconds
            passed = correctPercentage >= 90 && wrongPercentage <= 10 && avgTime < 6;
        }
    }
    
    const passFailEl = document.getElementById('passFail');
    passFailEl.textContent = passed ? 'PASS' : 'FAIL';
    passFailEl.className = 'pass-fail ' + (passed ? 'pass' : 'fail');
    
    // Store pass/fail result in session for saving to database
    session.passed = passed;
    // Also update window.currentSession if it exists
    if (window.currentSession) {
        window.currentSession.passed = passed;
    }
    // Also update global currentSession if it exists
    if (typeof currentSession !== 'undefined') {
        currentSession.passed = passed;
    }

    // Show question details
    let detailsHTML = '<h3 style="margin-top: 20px; margin-bottom: 10px;">Question Details:</h3>';
    if (session.results && Array.isArray(session.results)) {
        session.results.forEach((result, index) => {
            const itemClass = result.isCorrect ? 'correct' : 'wrong';
            detailsHTML += `
                <div class="question-item ${itemClass}">
                    <strong>${result.question} = ${result.userAnswer}</strong>
                    ${!result.isCorrect ? `<br>Correct Answer: ${result.correctAnswer}` : ''}
                    <br><small>Time: ${result.time}s | ${result.isCorrect ? 'Correct' : 'Wrong'}</small>
                </div>
            `;
        });
    } else {
        detailsHTML += '<p>No question details available.</p>';
    }

    document.getElementById('questionDetails').innerHTML = detailsHTML;
}

/**
 * REQUIREMENTS:
 * - Hide summary section
 * - If user is logged in:
 *   - Show dashboard
 *   - Refresh passed and failed variants
 *   - Update operation completion status
 *   - Refresh variant cards if operation is selected
 * - If user is not logged in:
 *   - Hide dashboard
 * - Re-enable answerInput
 * - Clear timer interval
 * - Note: Does NOT log out user (preserves session)
 * - No return value
 * 
 * CALLED BY: summary.html - <button onclick="resetSession()">Go Back</button>
 */
function resetSession() {
    if (window.debugLog) window.debugLog('resetSession');
    // Navigate back to student dashboard
    // Note: This does NOT log out the user - they remain logged in
    window.location.href = 'student-dashboard.html';
}

// Expose functions globally
window.endSession = endSession;
window.showSummary = showSummary;
window.resetSession = resetSession;
