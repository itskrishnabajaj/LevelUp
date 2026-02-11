// Level Up - RPG Habit Tracker v2.0.0
// Developed by KrisVeltrix
// Main Entry Point

// ===== MAIN INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('%c⚡ Level Up v2.0.0', 'font-size: 20px; font-weight: bold; color: #6C5CE7;');
    console.log('%cDeveloped by KrisVeltrix', 'font-size: 12px; color: #A29BFE;');
    console.log('%cYour transformation journey starts now!', 'font-size: 14px; color: #00CEC9;');
    
    // Initialize Firebase
    if (window.LevelUp && window.LevelUp.firebase) {
        window.LevelUp.firebase.init();
    }
    
    // Register service worker
    if (typeof registerServiceWorker === 'function') {
        registerServiceWorker();
    }
    
    // Check PIN lock
    if (typeof checkPinLock === 'function') {
        checkPinLock();
    }
    
    // Load all users
    if (typeof loadAllUsers === 'function') {
        loadAllUsers();
    }
    
    // Check auto-login
    if (typeof checkAutoLogin === 'function') {
        checkAutoLogin();
    }
    
    // Initialize auth event listeners
    if (typeof initAuthEventListeners === 'function') {
        initAuthEventListeners();
    }
    
    // Initialize UI
    if (typeof initUI === 'function') {
        initUI();
    }
    
    // Setup forms
    setupForms();
});

// ===== RENDER ALL =====
function renderAll() {
    if (!currentUser || !allUsers[currentUser]) return;
    
    // Update user profile
    if (typeof updateUserProfile === 'function') {
        updateUserProfile();
    }
    
    // Update player level
    if (typeof updatePlayerLevel === 'function') {
        updatePlayerLevel();
    }
    
    // Update stats
    if (typeof updateStats === 'function') {
        updateStats();
    }
    
    // Update welcome message
    if (typeof updateWelcomeMessage === 'function') {
        updateWelcomeMessage();
    }
    
    // Render quests
    if (typeof renderQuests === 'function') {
        renderQuests();
    }
    
    // Render consistency stats
    if (typeof renderConsistencyStats === 'function') {
        renderConsistencyStats();
    }
    
    // Render behavior feedback
    if (typeof renderBehaviorFeedback === 'function') {
        renderBehaviorFeedback();
    }
    
    // Render progress insights
    if (typeof renderProgressInsights === 'function') {
        renderProgressInsights();
    }
    
    // Render momentum score
    if (typeof renderMomentumScore === 'function') {
        renderMomentumScore();
    }
    
    // Update daily quote
    if (typeof updateDailyQuote === 'function') {
        updateDailyQuote();
    }
    
    // Render achievements
    if (typeof renderAchievements === 'function') {
        renderAchievements();
    }
    
    // Check class change eligibility
    if (typeof checkClassChangeEligibility === 'function') {
        checkClassChangeEligibility();
    }
    
    // Update identity widget
    if (typeof updateIdentityWidget === 'function') {
        updateIdentityWidget();
    }
    
    // Start identity reminders
    if (typeof startIdentityReminders === 'function') {
        startIdentityReminders();
    }
    
    // Check daily login bonus
    if (typeof checkDailyLoginBonus === 'function') {
        checkDailyLoginBonus();
    }
    
    // Load settings
    if (typeof loadSettings === 'function') {
        loadSettings();
    }
    
    // Render activity grid
    if (typeof renderActivityGrid === 'function') {
        renderActivityGrid();
    }
    
    // Restore timer state
    if (typeof restoreTimerState === 'function') {
        restoreTimerState();
    }
    
    // Render charts
    if (typeof renderCharts === 'function') {
        setTimeout(renderCharts, 100);
    }
    
    // Render personal records
    if (typeof renderPersonalRecords === 'function') {
        renderPersonalRecords();
    }
    
    // Check weekly review
    if (typeof checkWeeklyReview === 'function') {
        setTimeout(checkWeeklyReview, 2000); // Delay to avoid overlap with login bonus
    }
}

// ===== SETUP FORMS =====
function setupForms() {
    // Setup quest form
    if (typeof setupQuestForm === 'function') {
        setupQuestForm();
    }
    
    // Quest form submission
    const questForm = document.getElementById('questForm');
    if (questForm) {
        questForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const questId = editingQuestId || 'q' + Date.now();
            const name = document.getElementById('questName').value;
            const icon = document.getElementById('questIcon').value || '⭐';
            const xp = parseInt(document.getElementById('questXP').value) || 10;
            const target = parseInt(document.getElementById('questTarget').value) || 30;
            const essential = document.getElementById('questEssential').checked;
            const frequency = document.getElementById('questFrequency').value;
            const category = document.getElementById('questCategory').value;
            
            let customDays = [];
            if (frequency === 'custom') {
                const checkedDays = document.querySelectorAll('.custom-day-cb:checked');
                customDays = Array.from(checkedDays).map(cb => parseInt(cb.value));
            }
            
            const statInputs = document.querySelectorAll('.quest-stat-input');
            const stats = {};
            statInputs.forEach(input => {
                const value = parseInt(input.value) || 0;
                if (value > 0) {
                    stats[input.name] = value;
                }
            });
            
            const user = allUsers[currentUser];
            let questIndex = user.quests.findIndex(q => q.id === questId);
            
            const questData = { id: questId, name, icon, xp, target, essential, frequency, category, stats };
            if (frequency === 'custom') {
                questData.customDays = customDays;
            }
            
            if (questIndex === -1) {
                user.quests.push(questData);
                if (typeof checkAchievements === 'function') {
                    checkAchievements();
                }
            } else {
                user.quests[questIndex] = questData;
            }
            
            if (typeof saveAllUsers === 'function') {
                saveAllUsers();
            }
            if (typeof renderQuests === 'function') {
                renderQuests();
            }
            if (typeof closeModal === 'function') {
                closeModal('addQuestModal');
            }
            
            editingQuestId = null;
            if (typeof setQuestModalMode === 'function') {
                setQuestModalMode(false);
            }
            questForm.reset();
        });
    }
    
    // Signup form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (typeof handleSignup === 'function') {
                handleSignup();
            }
        });
    }
    
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (typeof handleLogin === 'function') {
                handleLogin();
            }
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (typeof logout === 'function') {
                logout();
            }
        });
    }
    
    // Timer buttons
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            if (typeof startTimer === 'function') {
                startTimer();
            }
        });
    }
    
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            if (typeof pauseTimer === 'function') {
                pauseTimer();
            }
        });
    }
    
    const stopBtn = document.getElementById('stopBtn');
    if (stopBtn) {
        stopBtn.addEventListener('click', () => {
            if (typeof stopTimer === 'function') {
                stopTimer();
            }
        });
    }
    
    // Journal save button
    const saveJournalBtn = document.getElementById('saveJournalBtn');
    if (saveJournalBtn) {
        saveJournalBtn.addEventListener('click', () => {
            if (typeof saveJournal === 'function') {
                saveJournal();
            }
        });
    }
    
    // Settings save button
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', () => {
            if (typeof saveSettings === 'function') {
                saveSettings();
            }
        });
    }
    
    // Energy mode toggle
    const energyToggleBtn = document.getElementById('energyToggleBtn');
    if (energyToggleBtn) {
        energyToggleBtn.addEventListener('click', () => {
            if (typeof toggleEnergyMode === 'function') {
                toggleEnergyMode();
            }
        });
    }
    
    // Reset progress button
    const resetProgressBtn = document.getElementById('resetProgressBtn');
    if (resetProgressBtn) {
        resetProgressBtn.addEventListener('click', () => {
            if (typeof resetProgress === 'function') {
                resetProgress();
            }
        });
    }
    
    // Delete profile button
    const deleteProfileBtn = document.getElementById('deleteProfileBtn');
    if (deleteProfileBtn) {
        deleteProfileBtn.addEventListener('click', () => {
            if (typeof deleteProfile === 'function') {
                deleteProfile();
            }
        });
    }
    
    // Modal backdrop clicks
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal && typeof closeModal === 'function') {
                closeModal(modal.id);
                if (modal.id === 'addQuestModal') {
                    editingQuestId = null;
                    if (typeof setQuestModalMode === 'function') {
                        setQuestModalMode(false);
                    }
                    if (questForm) {
                        questForm.reset();
                    }
                }
            }
        });
    });
}
