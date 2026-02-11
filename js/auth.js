// Level Up - Authentication & PIN Lock Module
// Handles all user authentication, PIN security, and user management

(function() {
    'use strict';

    // ===== PIN LOCK SYSTEM =====
    
    /**
     * Checks if PIN is set and shows appropriate PIN screen
     */
    function checkPinLock() {
        const storedPin = localStorage.getItem('levelup_pin');
        const savedUsers = localStorage.getItem('allUsers');
        let hasExistingUsers = false;
        if (savedUsers) {
            try {
                const parsed = JSON.parse(savedUsers);
                hasExistingUsers = Object.keys(parsed).length > 0;
            } catch (e) {
                hasExistingUsers = false;
            }
        }
        
        if (!hasExistingUsers && !storedPin) {
            // First time user, no persistent sessions - skip PIN screen
            return;
        }
        
        if (!storedPin) {
            showPinScreen('setup');
        } else {
            showPinScreen('verify');
        }
    }

    /**
     * Hashes PIN with SHA-256 for secure storage
     * @param {string} pin - 4-digit PIN to hash
     * @returns {Promise<string>} Hashed PIN as hex string
     */
    async function hashPin(pin) {
        const encoder = new TextEncoder();
        const data = encoder.encode(pin + 'levelup_salt');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Sets up a new PIN for the application
     * @param {string} pin - 4-digit PIN to set
     * @returns {Promise<boolean>} True if setup successful
     */
    async function setupPin(pin) {
        if (pin && /^\d{4}$/.test(pin)) {
            const hashed = await hashPin(pin);
            localStorage.setItem('levelup_pin', hashed);
            hidePinScreen();
            return true;
        }
        return false;
    }

    /**
     * Verifies PIN against stored hash
     * @param {string} pin - 4-digit PIN to verify
     * @returns {Promise<boolean>} True if PIN is correct
     */
    async function verifyPin(pin) {
        const storedPin = localStorage.getItem('levelup_pin');
        const hashed = await hashPin(pin);
        if (hashed === storedPin) {
            hidePinScreen();
            return true;
        }
        return false;
    }

    /**
     * Shows change PIN screen (verifies current PIN then sets new one)
     */
    function changePin() {
        const storedPin = localStorage.getItem('levelup_pin');
        
        if (!storedPin) {
            // No PIN set yet, go directly to setup
            showPinScreen('setup');
            return;
        }
        
        // Show a screen that asks for current PIN, then new PIN
        let overlay = document.getElementById('pinLockOverlay');
        if (overlay) overlay.remove();

        overlay = document.createElement('div');
        overlay.id = 'pinLockOverlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:var(--bg-primary,#0f0f23);z-index:99999;display:flex;align-items:center;justify-content:center;flex-direction:column;';

        overlay.innerHTML = `
            <div style="text-align:center;padding:20px;max-width:320px;width:100%;">
                <div style="font-size:3rem;margin-bottom:16px;">🔑</div>
                <h2 style="color:var(--text-primary,#fff);margin-bottom:8px;" id="changePinTitle">Enter Current PIN</h2>
                <p style="color:var(--text-secondary,#94a3b8);margin-bottom:24px;font-size:0.9rem;" id="changePinDesc">
                    Verify your current PIN to continue
                </p>
                <input type="password" id="pinInput" maxlength="4" inputmode="numeric" pattern="[0-9]*"
                    aria-label="Enter your current PIN"
                    style="width:200px;text-align:center;font-size:2rem;letter-spacing:16px;padding:14px 20px;border-radius:12px;border:2px solid var(--border,#333);background:var(--bg-secondary,#1a1a2e);color:var(--text-primary,#fff);outline:none;"
                    autocomplete="off">
                <br>
                <button id="pinSubmitBtn" style="margin-top:16px;padding:12px 32px;border-radius:12px;border:none;background:linear-gradient(135deg,var(--primary,#ff6b6b),var(--purple,#a463f2));color:#fff;font-size:1rem;font-weight:600;cursor:pointer;">
                    Verify
                </button>
                <button id="pinCancelBtn" style="margin-top:8px;padding:10px 24px;border-radius:12px;border:1px solid var(--border,#333);background:transparent;color:var(--text-secondary,#94a3b8);font-size:0.9rem;cursor:pointer;display:block;margin-left:auto;margin-right:auto;">
                    Cancel
                </button>
                <p id="pinError" style="color:#ef4444;margin-top:12px;font-size:0.85rem;min-height:20px;"></p>
            </div>
        `;
        document.body.appendChild(overlay);

        const pinInput = document.getElementById('pinInput');
        const pinSubmitBtn = document.getElementById('pinSubmitBtn');
        const pinError = document.getElementById('pinError');
        const pinCancelBtn = document.getElementById('pinCancelBtn');
        const changePinTitle = document.getElementById('changePinTitle');
        const changePinDesc = document.getElementById('changePinDesc');

        let step = 'verify'; // 'verify' -> 'new' -> done
        pinInput.focus();

        pinCancelBtn.addEventListener('click', () => {
            hidePinScreen();
        });

        pinSubmitBtn.addEventListener('click', async () => {
            const pin = pinInput.value;

            if (step === 'verify') {
                const hashed = await hashPin(pin);
                if (hashed === storedPin) {
                    step = 'new';
                    changePinTitle.textContent = 'Set New PIN';
                    changePinDesc.textContent = 'Choose a new 4-digit PIN';
                    pinSubmitBtn.textContent = 'Set PIN';
                    pinInput.value = '';
                    pinInput.focus();
                    pinError.textContent = '';
                } else {
                    pinError.textContent = 'Incorrect PIN. Try again.';
                    pinInput.value = '';
                    pinInput.focus();
                }
            } else if (step === 'new') {
                if (pin && /^\d{4}$/.test(pin)) {
                    const hashed = await hashPin(pin);
                    localStorage.setItem('levelup_pin', hashed);
                    hidePinScreen();
                    if (window.showNotification) {
                        window.showNotification('✅ PIN changed successfully!');
                    }
                } else {
                    pinError.textContent = 'Please enter a valid 4-digit PIN';
                    pinInput.value = '';
                    pinInput.focus();
                }
            }
        });

        pinInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') pinSubmitBtn.click();
        });
    }

    /**
     * Displays PIN entry screen
     * @param {string} mode - 'setup' or 'verify'
     */
    function showPinScreen(mode) {
        let overlay = document.getElementById('pinLockOverlay');
        if (overlay) overlay.remove();

        overlay = document.createElement('div');
        overlay.id = 'pinLockOverlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:var(--bg-primary,#0f0f23);z-index:99999;display:flex;align-items:center;justify-content:center;flex-direction:column;';

        const isSetup = mode === 'setup';
        overlay.innerHTML = `
            <div style="text-align:center;padding:20px;max-width:320px;width:100%;">
                <div style="font-size:3rem;margin-bottom:16px;">${isSetup ? '🔐' : '🔒'}</div>
                <h2 style="color:var(--text-primary,#fff);margin-bottom:8px;">${isSetup ? 'Set Your PIN' : 'Enter PIN'}</h2>
                <p style="color:var(--text-secondary,#94a3b8);margin-bottom:24px;font-size:0.9rem;">
                    ${isSetup ? 'Choose a 4-digit PIN to protect your data' : 'Enter your 4-digit PIN to continue'}
                </p>
                <input type="password" id="pinInput" maxlength="4" inputmode="numeric" pattern="[0-9]*"
                    aria-label="${isSetup ? 'Set a 4-digit PIN' : 'Enter your 4-digit PIN'}"
                    style="width:200px;text-align:center;font-size:2rem;letter-spacing:16px;padding:14px 20px;border-radius:12px;border:2px solid var(--border,#333);background:var(--bg-secondary,#1a1a2e);color:var(--text-primary,#fff);outline:none;"
                    autocomplete="off">
                <br>
                <button id="pinSubmitBtn" style="margin-top:16px;padding:12px 32px;border-radius:12px;border:none;background:linear-gradient(135deg,var(--primary,#ff6b6b),var(--purple,#a463f2));color:#fff;font-size:1rem;font-weight:600;cursor:pointer;">
                    ${isSetup ? 'Set PIN' : 'Unlock'}
                </button>
                <p id="pinError" style="color:#ef4444;margin-top:12px;font-size:0.85rem;min-height:20px;"></p>
            </div>
        `;
        document.body.appendChild(overlay);

        const pinInput = document.getElementById('pinInput');
        const pinSubmitBtn = document.getElementById('pinSubmitBtn');
        const pinError = document.getElementById('pinError');

        pinInput.focus();

        pinSubmitBtn.addEventListener('click', async () => {
            const pin = pinInput.value;
            if (isSetup) {
                if (await setupPin(pin)) {
                    return;
                }
                pinError.textContent = 'Please enter a valid 4-digit PIN';
            } else {
                if (await verifyPin(pin)) {
                    return;
                }
                pinError.textContent = 'Incorrect PIN. Try again.';
            }
            pinInput.value = '';
            pinInput.focus();
        });

        pinInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') pinSubmitBtn.click();
        });
    }

    /**
     * Removes PIN screen from view
     */
    function hidePinScreen() {
        const overlay = document.getElementById('pinLockOverlay');
        if (overlay) overlay.remove();
    }

    // ===== USER DATA MANAGEMENT =====

    /**
     * Loads all users from localStorage
     */
    function loadAllUsers() {
        const saved = localStorage.getItem('allUsers');
        if (saved) {
            try {
                window.allUsers = JSON.parse(saved);
                initializeUserData();
            } catch (e) {
                console.error('Failed to load users:', e);
                window.allUsers = {};
            }
        }
    }

    /**
     * Initializes user data with default values if missing
     */
    function initializeUserData() {
        // Get DEFAULT_QUESTS and ACHIEVEMENTS_DATA from window if available
        const DEFAULT_QUESTS = window.DEFAULT_QUESTS || [];
        const ACHIEVEMENTS_DATA = window.ACHIEVEMENTS_DATA || [];

        Object.keys(window.allUsers).forEach(username => {
            const user = window.allUsers[username];
            
            if (!user.quests) user.quests = JSON.parse(JSON.stringify(DEFAULT_QUESTS));
            if (!user.achievements) user.achievements = JSON.parse(JSON.stringify(ACHIEVEMENTS_DATA));
            if (!user.journal) user.journal = [];
            if (!user.loginData) user.loginData = { lastLogin: null, loginStreak: 0, totalLogins: 0 };
            if (!user.timerState) user.timerState = { running: false, elapsed: 0, activity: null, activityName: '' };
            if (!user.timerStats) user.timerStats = { study: 0, exercise: 0, meditation: 0, speaking: 0 };
            if (user.lowEnergyMode === undefined) user.lowEnergyMode = false;
            if (!user.lowEnergyCount) user.lowEnergyCount = 0;
            if (!user.dismissedFeedback) user.dismissedFeedback = [];
            if (!user.dailyQuote) user.dailyQuote = null;
            if (!user.lastQuoteFetch) user.lastQuoteFetch = null;
            if (!user.vision) user.vision = '';
            if (!user.antiVision) user.antiVision = '';
            if (!user.bio) user.bio = '';
            if (!user.selectedClass) user.selectedClass = null;
            if (!user.totalXPEarned) user.totalXPEarned = 0;
            if (!user.questsCreated) user.questsCreated = 0;
            
            user.quests = user.quests.map(q => ({
                ...q,
                essential: q.essential !== undefined ? q.essential : false,
                frequency: q.frequency || 'daily',
                stats: q.stats || { [q.type || 'strength']: 1 },
                category: q.category || 'custom'
            }));
        });
        
        if (window.saveAllUsers) {
            window.saveAllUsers();
        }
    }

    /**
     * Saves all users to localStorage
     */
    function saveAllUsers() {
        try {
            const usersToSave = JSON.parse(JSON.stringify(window.allUsers, (key, value) => {
                if (key === 'interval') return undefined;
                return value;
            }));
            localStorage.setItem('allUsers', JSON.stringify(usersToSave));
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                compactAndSave();
            } else {
                console.error('Save error:', e);
            }
        }
    }

    /**
     * Compacts user data and saves (removes old data when storage is full)
     */
    function compactAndSave() {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const cutoff = ninetyDaysAgo.toISOString().split('T')[0];
        
        Object.keys(window.allUsers).forEach(username => {
            const user = window.allUsers[username];
            const recent = {};
            Object.keys(user.completions).forEach(key => {
                const date = key.split('-').slice(1).join('-');
                if (date >= cutoff) recent[key] = user.completions[key];
            });
            user.completions = recent;
            
            if (user.journal && user.journal.length > 30) {
                user.journal = user.journal.slice(0, 30);
            }
        });
        
        try {
            localStorage.setItem('allUsers', JSON.stringify(window.allUsers));
            if (window.showNotification) {
                window.showNotification('⚠️ Storage optimized - old data removed');
            }
        } catch (e) {
            if (window.showNotification) {
                window.showNotification('❌ Storage full! Cannot save progress.');
            }
        }
    }

    // ===== AUTO LOGIN =====

    /**
     * Checks if user should be auto-logged in
     */
    function checkAutoLogin() {
        const lastUser = localStorage.getItem('lastLoggedInUser');
        if (lastUser && window.allUsers[lastUser]) {
            window.currentUser = lastUser;
            showApp();
        } else {
            document.getElementById('loginContainer').classList.add('active');
            renderUserList();
        }
    }

    // ===== USER LIST RENDERING =====

    /**
     * Renders the list of existing users
     */
    function renderUserList() {
        const list = document.getElementById('userList');
        if (!list) return;
        
        list.innerHTML = '';
        
        const users = allUsers ? Object.values(allUsers) : [];
        if (users.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No accounts yet. Create one above!</p>';
            return;
        }
        
        users.forEach(user => {
            const card = document.createElement('div');
            card.className = 'user-card';
            card.innerHTML = `
                <div class="user-avatar">${user.avatar}</div>
                <div class="user-info">
                    <div class="user-name">${user.name}</div>
                    <div class="user-level">Level ${user.level} • ${Object.keys(user.completions || {}).length} quests completed</div>
                </div>
            `;
            card.addEventListener('click', () => {
                const loginUsername = document.getElementById('loginUsername');
                const loginPassword = document.getElementById('loginPassword');
                if (loginUsername) loginUsername.value = user.username;
                if (loginPassword) loginPassword.focus();
            });
            list.appendChild(card);
        });
    }

    // ===== SIGNUP HANDLER =====

    /**
     * Handles user signup
     * @param {Event} e - Form submit event
     */
    function handleSignup(e) {
        e.preventDefault();
        
        const name = document.getElementById('signupName').value.trim();
        const username = document.getElementById('signupUsername').value.trim().toLowerCase();
        const password = document.getElementById('signupPassword').value;
        
        if (!name || !username || !password) {
            if (window.showNotification) {
                window.showNotification('⚠️ Please fill all fields!');
            }
            return;
        }
        
        if (!window.selectedAvatar) {
            if (window.showNotification) {
                window.showNotification('⚠️ Please select an avatar!');
            }
            return;
        }
        
        if (window.allUsers[username]) {
            if (window.showNotification) {
                window.showNotification('⚠️ Username already exists!');
            }
            return;
        }
        
        // Get DEFAULT_QUESTS and ACHIEVEMENTS_DATA from window
        const DEFAULT_QUESTS = window.DEFAULT_QUESTS || [];
        const ACHIEVEMENTS_DATA = window.ACHIEVEMENTS_DATA || [];
        
        window.allUsers[username] = {
            name,
            username,
            password,
            avatar: window.selectedAvatar,
            level: 1,
            xp: 0,
            totalXPEarned: 0,
            stats: { strength: 0, discipline: 0, focus: 0, vitality: 0, wisdom: 0 },
            quests: JSON.parse(JSON.stringify(DEFAULT_QUESTS)),
            completions: {},
            achievements: JSON.parse(JSON.stringify(ACHIEVEMENTS_DATA)),
            timerState: { running: false, elapsed: 0, activity: null, activityName: '' },
            timerStats: { study: 0, exercise: 0, meditation: 0, speaking: 0 },
            vision: '',
            antiVision: '',
            bio: '',
            dailyQuote: null,
            lastQuoteFetch: null,
            journal: [],
            loginData: { lastLogin: null, loginStreak: 0, totalLogins: 0 },
            lowEnergyMode: false,
            lowEnergyCount: 0,
            dismissedFeedback: [],
            selectedClass: null,
            questsCreated: 0,
            createdAt: new Date().toISOString()
        };
        
        saveAllUsers();
        window.currentUser = username;
        localStorage.setItem('lastLoggedInUser', username);
        
        if (window.showNotification) {
            window.showNotification('🎉 Welcome to your transformation journey!');
        }
        showApp();
    }

    // ===== LOGIN HANDLER =====

    /**
     * Handles user login
     * @param {Event} e - Form submit event
     */
    function handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('loginUsername').value.trim().toLowerCase();
        const password = document.getElementById('loginPassword').value;
        
        if (!window.allUsers[username]) {
            if (window.showNotification) {
                window.showNotification('⚠️ User not found!');
            }
            return;
        }
        
        if (window.allUsers[username].password !== password) {
            if (window.showNotification) {
                window.showNotification('⚠️ Incorrect password!');
            }
            return;
        }
        
        window.currentUser = username;
        localStorage.setItem('lastLoggedInUser', username);
        if (window.showNotification) {
            window.showNotification('✅ Welcome back, ' + window.allUsers[username].name + '!');
        }
        showApp();
    }

    // ===== SHOW APP =====

    /**
     * Shows the main application after successful login
     */
    function showApp() {
        document.getElementById('loginContainer').classList.remove('active');
        document.getElementById('appContainer').classList.add('active');
        
        if (window.renderAll) window.renderAll();
        if (window.checkDailyLoginBonus) window.checkDailyLoginBonus();
        if (window.startIdentityReminders) window.startIdentityReminders();
        if (window.restoreTimerState) window.restoreTimerState();
    }

    // ===== LOGOUT =====

    /**
     * Logs out the current user
     */
    function logout() {
        if (confirm('Are you sure you want to logout?')) {
            const user = window.allUsers[window.currentUser];
            if (user && user.timerState && user.timerState.interval) {
                clearInterval(user.timerState.interval);
                user.timerState.interval = null;
                user.timerState.running = false;
                saveAllUsers();
            }
            
            if (window.identityReminderTimeout) {
                clearTimeout(window.identityReminderTimeout);
                window.identityReminderTimeout = null;
            }
            
            window.currentUser = null;
            localStorage.removeItem('lastLoggedInUser');
            document.getElementById('loginContainer').classList.add('active');
            document.getElementById('appContainer').classList.remove('active');
            if (window.showNotification) {
                window.showNotification('👋 Logged out successfully!');
            }
            renderUserList();
        }
    }

    // ===== LOGIN TABS SETUP =====

    /**
     * Sets up the login/signup tab switching
     */
    function setupLoginTabs() {
        document.querySelectorAll('.login-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.tab;
                document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.login-form').forEach(f => f.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(target + 'Form').classList.add('active');
            });
        });
    }

    // ===== AVATAR SELECTORS SETUP =====

    /**
     * Sets up avatar selection handlers
     */
    function setupAvatarSelectors() {
        document.querySelectorAll('.avatar-selector').forEach(selector => {
            selector.addEventListener('click', (e) => {
                const option = e.target.closest('.avatar-option');
                if (!option) return;
                
                const avatar = option.dataset.avatar;
                selector.querySelectorAll('.avatar-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                option.classList.add('selected');
                
                if (selector.id === 'avatarSelector') {
                    window.selectedAvatar = avatar;
                }
            });
        });
    }

    // ===== DAILY LOGIN BONUS =====

    /**
     * Checks and awards daily login bonus
     */
    function checkDailyLoginBonus() {
        const user = window.allUsers[window.currentUser];
        const today = new Date().toISOString().split('T')[0];
        
        if (!user.loginData) {
            user.loginData = { lastLogin: null, loginStreak: 0, totalLogins: 0 };
        }
        
        if (user.loginData.lastLogin === today) return;
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (user.loginData.lastLogin === yesterdayStr) {
            user.loginData.loginStreak++;
        } else if (user.loginData.lastLogin !== null) {
            user.loginData.loginStreak = 1;
        } else {
            user.loginData.loginStreak = 1;
        }
        
        user.loginData.lastLogin = today;
        user.loginData.totalLogins++;
        
        const baseXP = 10;
        const bonus = Math.min(user.loginData.loginStreak - 1, 10);
        const totalXP = baseXP + bonus;
        
        user.xp += totalXP;
        user.totalXPEarned += totalXP;
        
        saveAllUsers();
        if (window.updatePlayerLevel) window.updatePlayerLevel();
        showLoginBonus(totalXP, user.loginData.loginStreak);
        if (window.checkAchievements) window.checkAchievements();
    }

    /**
     * Shows the login bonus modal
     * @param {number} xp - XP earned
     * @param {number} streak - Current login streak
     */
    function showLoginBonus(xp, streak) {
        const modal = document.getElementById('loginBonusModal');
        const text = document.getElementById('loginBonusText');
        const streakText = document.getElementById('loginBonusStreak');
        
        if (!modal || !text || !streakText) return;
        
        text.textContent = `+${xp} XP for showing up!`;
        streakText.textContent = streak > 1 ? `🔥 ${streak} day login streak!` : '🌟 Start your streak today!';
        
        modal.classList.add('show');
        setTimeout(() => closeLoginBonus(), 4000);
    }

    /**
     * Closes the login bonus modal
     */
    function closeLoginBonus() {
        const modal = document.getElementById('loginBonusModal');
        if (modal) modal.classList.remove('show');
    }

    /**
     * Updates the login streak display
     */
    function updateLoginStreakDisplay() {
        const user = window.allUsers[window.currentUser];
        const display = document.getElementById('loginStreakDisplay');
        const number = document.getElementById('loginStreakNumber');
        
        if (!display || !number) return;
        
        if (!user.loginData || user.loginData.loginStreak === 0) {
            display.classList.remove('active');
            return;
        }
        
        display.classList.add('active');
        number.textContent = user.loginData.loginStreak + (user.loginData.loginStreak === 1 ? ' Day' : ' Days');
    }

    // ===== INITIALIZATION =====

    /**
     * Initializes authentication event listeners
     */
    function initAuthEventListeners() {
        // Signup form
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', handleSignup);
        }

        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }
    }

    // ===== MODULE EXPORTS =====

    // Create LevelUp namespace if it doesn't exist
    if (!window.LevelUp) {
        window.LevelUp = {};
    }

    // Export to LevelUp.auth namespace
    window.LevelUp.auth = {
        checkPinLock,
        hashPin,
        setupPin,
        verifyPin,
        changePin,
        showPinScreen,
        hidePinScreen,
        checkAutoLogin,
        loadAllUsers,
        initializeUserData,
        saveAllUsers,
        compactAndSave,
        handleSignup,
        handleLogin,
        logout,
        renderUserList,
        showApp,
        setupLoginTabs,
        setupAvatarSelectors,
        checkDailyLoginBonus,
        showLoginBonus,
        closeLoginBonus,
        updateLoginStreakDisplay,
        initAuthEventListeners
    };

    // Export key functions directly to window for backward compatibility
    window.checkPinLock = checkPinLock;
    window.hashPin = hashPin;
    window.setupPin = setupPin;
    window.verifyPin = verifyPin;
    window.changePin = changePin;
    window.showPinScreen = showPinScreen;
    window.hidePinScreen = hidePinScreen;
    window.checkAutoLogin = checkAutoLogin;
    window.loadAllUsers = loadAllUsers;
    window.initializeUserData = initializeUserData;
    window.saveAllUsers = saveAllUsers;
    window.compactAndSave = compactAndSave;
    window.handleSignup = handleSignup;
    window.handleLogin = handleLogin;
    window.logout = logout;
    window.renderUserList = renderUserList;
    window.showApp = showApp;
    window.setupLoginTabs = setupLoginTabs;
    window.setupAvatarSelectors = setupAvatarSelectors;
    window.checkDailyLoginBonus = checkDailyLoginBonus;
    window.showLoginBonus = showLoginBonus;
    window.closeLoginBonus = closeLoginBonus;
    window.updateLoginStreakDisplay = updateLoginStreakDisplay;
    window.initAuthEventListeners = initAuthEventListeners;

})();
