// ============================================================================
// STUDENT DASHBOARD - Dashboard-specific Functions
// ============================================================================
// This module handles:
// - User display updates
// - Operation selection and variant loading
// - Dashboard UI updates
// - Variant launching
// ============================================================================

// REQUIREMENTS: Fetch data from the database to display user name, Class and section, and Roll number in user's dashboard.
// CALLED BY: student-dashboard.js - updateStudentDashboardHeader() (updates user info display)
function updateUserDisplay(profile) {
    if (window.debugLog) window.debugLog('updateUserDisplay');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const userClassDisplay = document.getElementById('userClassDisplay');
    const userRollDisplay = document.getElementById('userRollDisplay');
    
    if (profile) {
        const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
        if (userNameDisplay) {
            userNameDisplay.textContent = `Name: ${fullName || 'N/A'}`;
        }
        if (userClassDisplay) {
            userClassDisplay.textContent = `Class: ${profile.class && profile.section ? `${profile.class}${profile.section}` : 'N/A'}`;
        }
        if (userRollDisplay) {
            userRollDisplay.textContent = `Roll Number: ${profile.roll_number || 'N/A'}`;
        }
    } else if (currentUser) {
        if (userNameDisplay) {
            userNameDisplay.textContent = `Name: ${currentUser.email || 'N/A'}`;
        }
        if (userClassDisplay) {
            userClassDisplay.textContent = `Class: N/A`;
        }
        if (userRollDisplay) {
            userRollDisplay.textContent = `Roll Number: N/A`;
        }
    }
}

// CALLED BY: student-dashboard.js - updateAuthUI() (updates header when user logs in), student-dashboard.html - DOMContentLoaded listener (initializes header on page load)
function updateStudentDashboardHeader() {
    if (window.debugLog) window.debugLog('updateStudentDashboardHeader');
    if (currentUserProfile) {
        updateUserDisplay(currentUserProfile);
    } else if (currentUser) {
        updateUserDisplay(null);
    }
}

// CALLED BY: student-dashboard.js - updateAuthUI() (updates operation completion status after fetching variants), student-dashboard.js - selectOperation() (updates completion status when operation selected)
function updateOperationCompletionStatus() {
    if (window.debugLog) window.debugLog('updateOperationCompletionStatus');
    if (!currentUser) return;

    const operations = ['addition', 'subtraction', 'multiplication', 'division'];
    
    operations.forEach(operation => {
        const opsVariants = variants[operation];
        if (!opsVariants) return;

        const variantKeys = Object.keys(opsVariants);
        const allVariantsPassed = variantKeys.every(variantKey => {
            const variantKeyFull = `${operation}_${variantKey}`;
            return window.passedVariants.has(variantKeyFull);
        });

        const operationCards = document.querySelectorAll('.operation-card');
        operationCards.forEach(card => {
            const onclickAttr = card.getAttribute('onclick');
            if (onclickAttr && onclickAttr.includes(`selectOperation('${operation}')`)) {
                if (allVariantsPassed && variantKeys.length > 0) {
                    card.classList.add('completed');
                } else {
                    card.classList.remove('completed');
                }
            }
        });
    });
}

async function updateAuthUI(skipPageSwitch = false) {
    if (window.debugLog) window.debugLog('updateAuthUI', `(skipPageSwitch=${skipPageSwitch})`);
    const studentDashboard = document.getElementById('studentDashboard');

    if (currentUser && supabase) {
        if (studentDashboard) {
            studentDashboard.style.display = 'block';
            studentDashboard.style.visibility = 'visible';
            updateStudentDashboardHeader();
        }
        
        try {
            if (!currentUserProfile && currentUser) {
                currentUserProfile = await fetchUserProfile();
            }

            // Cache profile for use in question page headers
            try {
                sessionStorage.setItem('quizUserProfile', JSON.stringify(currentUserProfile || {}));
            } catch (e) {
                console.warn('Unable to cache user profile for quiz header', e);
            }
            
            await fetchPassedVariants();
            await fetchFailedVariants();
            updateOperationCompletionStatus();
            
            if (window.selectedOperation) {
                loadVariantsForOperation(window.selectedOperation);
            }
        } catch (err) {
            console.error('Error fetching user data:', err);
        }
        
        updateStudentDashboardHeader();
    } else {
        currentUserProfile = null;
        window.passedVariants.clear();
        window.failedVariants.clear();
        
        document.querySelectorAll('.variant-card').forEach(card => {
            card.classList.remove('passed', 'failed');
        });
        
        document.querySelectorAll('.operation-card').forEach(card => {
            card.classList.remove('completed');
        });
        
        const variantsContainer = document.getElementById('variantsContainer');
        if (variantsContainer) {
            variantsContainer.innerHTML = '';
        }
        window.selectedOperation = null;
    }
}

// CALLED BY: student-dashboard.html - <div class="operation-card" onclick="selectOperation('addition')"> (and similar for other operations)
function selectOperation(operation) {
    if (window.debugLog) window.debugLog('selectOperation', `(${operation})`);
    document.querySelectorAll('.operation-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    if (event && event.target) {
        const clickedCard = event.target.closest('.operation-card');
        if (clickedCard) {
            clickedCard.classList.add('selected');
        }
    }
    
    window.selectedOperation = operation;
    
    if (currentUser && supabase) {
        fetchPassedVariants()
            .then(() => fetchFailedVariants())
            .then(() => {
                updateOperationCompletionStatus();
                loadVariantsForOperation(operation);
            })
            .catch(err => {
                console.warn('Error fetching variants:', err);
                loadVariantsForOperation(operation);
            });
    } else {
        loadVariantsForOperation(operation);
    }
}

// CALLED BY: student-dashboard.js - updateAuthUI() (loads variants for selected operation), student-dashboard.js - selectOperation() (loads variants when operation selected)
async function loadVariantsForOperation(operation) {
    if (window.debugLog) window.debugLog('loadVariantsForOperation', `(${operation})`);
    const container = document.getElementById('variantsContainer');
    if (!container) {
        console.error('variantsContainer not found');
        return;
    }
    
    container.innerHTML = '<p style="text-align: center; color: #666;">Loading variants...</p>';

    const opsVariants = variants[operation];
    if (!opsVariants) {
        container.innerHTML = '<p style="text-align: center; color: #dc3545;">No variants found for this operation.</p>';
        return;
    }

    const sequence = window.learningSequence[operation] || [];

    const variantKeys = Object.keys(opsVariants);
    const sortedKeys = variantKeys.sort((a, b) => {
        const indexA = sequence.indexOf(a);
        const indexB = sequence.indexOf(b);
        
        if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
        }
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return 0;
    });

    container.innerHTML = '';
    
    sortedKeys.forEach(variantKey => {
        const variant = opsVariants[variantKey];
        const variantKeyFull = `${operation}_${variantKey}`;
        const isPassed = window.passedVariants.has(variantKeyFull);
        const isFailed = window.failedVariants.has(variantKeyFull);
        
        const card = document.createElement('div');
        let cardClass = 'variant-card';
        if (isPassed) {
            cardClass += ' passed';
        } else if (isFailed) {
            cardClass += ' failed';
        }
        card.className = cardClass;
        card.onclick = () => launchVariant(operation, variantKey);
        
        let statusText = 'Not started';
        if (isPassed) {
            statusText = '✓ Passed';
        } else if (isFailed) {
            statusText = '✗ All attempts failed';
        }
        
        card.innerHTML = `
            <div class="variant-name">${variant.name}</div>
            <div class="variant-status">${statusText}</div>
        `;
        
        container.appendChild(card);
    });
    
    console.log(`✅ Loaded ${sortedKeys.length} variants for ${operation}`);
}

// CALLED BY: student-dashboard.js - loadVariantsForOperation() (card.onclick = () => launchVariant(operation, variantKey))
function launchVariant(operation, variant) {
    if (window.debugLog) window.debugLog('launchVariant', `(${operation}, ${variant})`);
    sessionStorage.setItem('quizOperation', operation);
    sessionStorage.setItem('quizVariant', variant);
    window.location.href = 'question.html';
}

// CALLED BY: student-dashboard.html - <button onclick="goBackToRegistration()">Go Back</button>
function goBackToRegistration() {
    if (window.debugLog) window.debugLog('goBackToRegistration');
    window.location.href = 'index.html';
}

// Expose functions globally
// CALLED BY: student-dashboard.html - All onclick handlers and DOMContentLoaded listener access these via window object
window.updateUserDisplay = updateUserDisplay;
window.updateStudentDashboardHeader = updateStudentDashboardHeader;
window.updateOperationCompletionStatus = updateOperationCompletionStatus;
window.updateAuthUI = updateAuthUI;
window.selectOperation = selectOperation;
window.loadVariantsForOperation = loadVariantsForOperation;
window.launchVariant = launchVariant;
window.goBackToRegistration = goBackToRegistration;
