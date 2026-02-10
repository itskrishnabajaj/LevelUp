// Level Up - RPG Habit Tracker v1.0.0
// Developed by KrisVeltrix

// ===== STATE MANAGEMENT =====
let allUsers = {};
let currentUser = null;
let selectedAvatar = '🦸';
let selectedMood = null;
let selectedActivity = null;
let selectedActivityName = '';
let identityReminderTimeout = null;
let achievementFilter = 'all';
let editingQuestId = null;

// ===== PIN LOCK SYSTEM =====
function checkPinLock() {
    const storedPin = localStorage.getItem('levelup_pin');
    if (!storedPin) {
        showPinScreen('setup');
    } else {
        showPinScreen('verify');
    }
}

async function hashPin(pin) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + 'levelup_salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function setupPin(pin) {
    if (pin && /^\d{4}$/.test(pin)) {
        const hashed = await hashPin(pin);
        localStorage.setItem('levelup_pin', hashed);
        hidePinScreen();
        return true;
    }
    return false;
}

async function verifyPin(pin) {
    const storedPin = localStorage.getItem('levelup_pin');
    const hashed = await hashPin(pin);
    if (hashed === storedPin) {
        hidePinScreen();
        return true;
    }
    return false;
}

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

function hidePinScreen() {
    const overlay = document.getElementById('pinLockOverlay');
    if (overlay) overlay.remove();
}

const FREQUENCY_LABELS = { daily: '📅 Daily', weekly: '📆 Weekly', biweekly: '🗓️ Biweekly', monthly: '📋 Monthly', custom: '🔧 Custom' };
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ===== DEFAULT DATA =====
const DEFAULT_QUESTS = [
    {
        id: 'q1',
        name: 'Morning Pushups',
        icon: '💪',
        category: 'health',
        xp: 15,
        target: 30,
        essential: false,
        frequency: 'daily',
        stats: { strength: 1 }
    },
    {
        id: 'q2',
        name: 'Strength Training',
        icon: '🏋️',
        category: 'health',
        xp: 20,
        target: 20,
        essential: false,
        frequency: 'daily',
        stats: { strength: 2 }
    },
    {
        id: 'q3',
        name: 'Daily Hygiene',
        icon: '🚿',
        category: 'health',
        xp: 10,
        target: 30,
        essential: true,
        frequency: 'daily',
        stats: { vitality: 1 }
    },
    {
        id: 'q4',
        name: 'MBA Study - 2 Hours',
        icon: '📚',
        category: 'study',
        xp: 30,
        target: 30,
        essential: false,
        frequency: 'daily',
        stats: { wisdom: 2, focus: 1 }
    },
    {
        id: 'q5',
        name: 'Mock Test Practice',
        icon: '📝',
        category: 'study',
        xp: 30,
        target: 15,
        essential: false,
        frequency: 'daily',
        stats: { wisdom: 1, focus: 2 }
    },
    {
        id: 'q6',
        name: 'Meditation - 15 min',
        icon: '🧘',
        category: 'mindset',
        xp: 15,
        target: 30,
        essential: false,
        frequency: 'daily',
        stats: { focus: 2, vitality: 1 }
    },
    {
        id: 'q7',
        name: 'Slow Speech Practice',
        icon: '🗣️',
        category: 'mindset',
        xp: 20,
        target: 30,
        essential: false,
        frequency: 'daily',
        stats: { discipline: 2 }
    }
];

const ACHIEVEMENTS_DATA = [
    // Micro achievements
    { id: 'a1', name: 'First Step', icon: '👣', desc: 'Complete your first quest', condition: 'complete_1_quest', unlocked: false },
    { id: 'a2', name: 'Getting Started', icon: '🌱', desc: 'Complete 10 quests total', condition: 'complete_10_quests', unlocked: false },
    { id: 'a3', name: 'Consistent', icon: '📅', desc: 'Complete quests 3 days in a row', condition: 'streak_3', unlocked: false },
    { id: 'a4', name: 'Week Warrior', icon: '🔥', desc: 'Complete quests 7 days in a row', condition: 'streak_7', unlocked: false },
    { id: 'a5', name: 'Two Weeks Strong', icon: '💪', desc: 'Complete quests 14 days in a row', condition: 'streak_14', unlocked: false },
    { id: 'a6', name: 'Monthly Master', icon: '📆', desc: 'Complete quests 30 days in a row', condition: 'streak_30', unlocked: false },
    { id: 'a7', name: 'Century', icon: '💯', desc: 'Complete quests 100 days in a row', condition: 'streak_100', unlocked: false },
    
    // Level achievements
    { id: 'a8', name: 'Level 5', icon: '⭐', desc: 'Reach character level 5', condition: 'level_5', unlocked: false },
    { id: 'a9', name: 'Level 10', icon: '⭐⭐', desc: 'Reach character level 10', condition: 'level_10', unlocked: false },
    { id: 'a10', name: 'Level 20', icon: '🌟', desc: 'Reach character level 20', condition: 'level_20', unlocked: false },
    
    // Stat achievements
    { id: 'a11', name: 'Strength Builder', icon: '🏋️', desc: 'Reach 50 Strength', condition: 'strength_50', unlocked: false },
    { id: 'a12', name: 'Strength Master', icon: '💪', desc: 'Reach 100 Strength', condition: 'strength_100', unlocked: false },
    { id: 'a13', name: 'Disciplined Mind', icon: '🎯', desc: 'Reach 50 Discipline', condition: 'discipline_50', unlocked: false },
    { id: 'a14', name: 'Discipline Master', icon: '🎖️', desc: 'Reach 100 Discipline', condition: 'discipline_100', unlocked: false },
    { id: 'a15', name: 'Focused', icon: '🧠', desc: 'Reach 50 Focus', condition: 'focus_50', unlocked: false },
    { id: 'a16', name: 'Focus Master', icon: '🔮', desc: 'Reach 100 Focus', condition: 'focus_100', unlocked: false },
    { id: 'a17', name: 'Vital', icon: '❤️', desc: 'Reach 50 Vitality', condition: 'vitality_50', unlocked: false },
    { id: 'a18', name: 'Vitality Master', icon: '💖', desc: 'Reach 100 Vitality', condition: 'vitality_100', unlocked: false },
    { id: 'a19', name: 'Wise', icon: '📚', desc: 'Reach 50 Wisdom', condition: 'wisdom_50', unlocked: false },
    { id: 'a20', name: 'Wisdom Master', icon: '🦉', desc: 'Reach 100 Wisdom', condition: 'wisdom_100', unlocked: false },
    
    // Daily achievements
    { id: 'a21', name: 'Productive Day', icon: '✅', desc: 'Complete 5 quests in one day', condition: 'daily_5', unlocked: false },
    { id: 'a22', name: 'Super Productive', icon: '🚀', desc: 'Complete 10 quests in one day', condition: 'daily_10', unlocked: false },
    
    // Journal achievements
    { id: 'a23', name: 'First Journal', icon: '📖', desc: 'Write your first journal entry', condition: 'journal_1', unlocked: false },
    { id: 'a24', name: 'Reflective', icon: '💭', desc: 'Write 7 journal entries', condition: 'journal_7', unlocked: false },
    { id: 'a25', name: 'Dedicated Writer', icon: '✍️', desc: 'Write 30 journal entries', condition: 'journal_30', unlocked: false },
    
    // Timer achievements
    { id: 'a26', name: 'Study Beast', icon: '📚', desc: 'Study for 10 hours total', condition: 'study_10h', unlocked: false },
    { id: 'a27', name: 'Scholar', icon: '🎓', desc: 'Study for 50 hours total', condition: 'study_50h', unlocked: false },
    { id: 'a28', name: 'Gym Rat', icon: '💪', desc: 'Exercise 20 times', condition: 'exercise_20', unlocked: false },
    { id: 'a29', name: 'Fitness Enthusiast', icon: '🏃', desc: 'Exercise 50 times', condition: 'exercise_50', unlocked: false },
    { id: 'a30', name: 'Zen Master', icon: '🧘', desc: 'Meditate 30 times', condition: 'meditate_30', unlocked: false },
    { id: 'a31', name: 'Inner Peace', icon: '☮️', desc: 'Meditate 100 times', condition: 'meditate_100', unlocked: false },
    { id: 'a32', name: 'Early Bird', icon: '🌅', desc: 'Complete morning routine 30 times', condition: 'morning_30', unlocked: false },
    
    // Special achievements
    { id: 'a33', name: 'Perfect Week', icon: '🏆', desc: 'Complete all quests for 7 days straight', condition: 'perfect_week', unlocked: false },
    { id: 'a34', name: 'Perfect Month', icon: '👑', desc: 'Complete all quests for 30 days', condition: 'perfect_month', unlocked: false },
    { id: 'a35', name: 'XP Hunter', icon: '💰', desc: 'Earn 1000 XP total', condition: 'xp_1000', unlocked: false },
    { id: 'a36', name: 'XP Master', icon: '💎', desc: 'Earn 10000 XP total', condition: 'xp_10000', unlocked: false },
    { id: 'a37', name: 'Comeback Kid', icon: '🔄', desc: 'Restart after breaking a streak', condition: 'comeback', unlocked: false },
    { id: 'a38', name: 'Dedicated', icon: '💎', desc: 'Use the app for 30 days', condition: 'login_30', unlocked: false },
    { id: 'a39', name: 'Vision Set', icon: '🎯', desc: 'Set your vision and anti-vision', condition: 'vision_set', unlocked: false },
    { id: 'a40', name: 'Class Changed', icon: '⚔️', desc: 'Complete class change', condition: 'class_change', unlocked: false, hidden: true },
    { id: 'a41', name: 'Quest Creator', icon: '🛠️', desc: 'Create your first custom quest', condition: 'custom_quest', unlocked: false },
    { id: 'a42', name: 'Organized', icon: '📋', desc: 'Create 10 custom quests', condition: 'custom_quest_10', unlocked: false },
    { id: 'a43', name: 'Low Energy Warrior', icon: '🛡️', desc: 'Use low energy mode 5 times', condition: 'low_energy_5', unlocked: false },
    { id: 'a44', name: 'All Stats 50', icon: '🌟', desc: 'Reach 50 in all stats', condition: 'all_stats_50', unlocked: false, hidden: true },
    { id: 'a45', name: 'Ascension Ready', icon: '✨', desc: 'Reach 100 in all core stats', condition: 'all_stats_100', unlocked: false, hidden: true }
];

const ACTIVITY_TYPES = [
    { id: 'study', name: '📚 MBA Study', xpPerMin: 2.5, interval: 120, stat: 'wisdom' },
    { id: 'exercise', name: '💪 Exercise', xpPerMin: 3, interval: 60, stat: 'strength' },
    { id: 'meditation', name: '🧘 Meditation', xpPerMin: 3, interval: 60, stat: 'focus' },
    { id: 'speaking', name: '🗣️ Speech Practice', xpPerMin: 3, interval: 60, stat: 'discipline' }
];

const CLASS_OPTIONS = [
    {
        id: 'warrior',
        name: 'Warrior',
        icon: '⚔️',
        desc: 'Master of physical discipline and endurance. Strength and Vitality grow 50% faster.',
        bonuses: { strength: 1.5, vitality: 1.5 }
    },
    {
        id: 'scholar',
        name: 'Scholar',
        icon: '📚',
        desc: 'Dedicated to knowledge and mental growth. Wisdom and Focus grow 50% faster.',
        bonuses: { wisdom: 1.5, focus: 1.5 }
    },
    {
        id: 'monk',
        name: 'Monk',
        icon: '🧘',
        desc: 'Balanced in mind, body, and spirit. All stats grow 20% faster.',
        bonuses: { strength: 1.2, discipline: 1.2, focus: 1.2, vitality: 1.2, wisdom: 1.2 }
    },
    {
        id: 'leader',
        name: 'Leader',
        icon: '👑',
        desc: 'Focused on discipline and influence. Discipline grows 75% faster.',
        bonuses: { discipline: 1.75 }
    }
];

const MOODS = [
    { id: 'great', emoji: '🔥', label: 'Great' },
    { id: 'good', emoji: '😊', label: 'Good' },
    { id: 'okay', emoji: '😐', label: 'Okay' },
    { id: 'low', emoji: '😔', label: 'Low Energy' },
    { id: 'struggling', emoji: '😞', label: 'Struggling' }
];

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    checkPinLock();
    registerServiceWorker();
    loadAllUsers();
    initializeUI();
    checkAutoLogin();
});

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./serviceworker.js')
            .then(() => console.log('✅ PWA ready'))
            .catch(err => console.log('Service Worker failed:', err));
    }
}

function initializeUI() {
    setupLoginTabs();
    setupAvatarSelectors();
    setupNavigation();
    setupModals();
    setupForms();
    setupButtons();
}

// ===== DATA MANAGEMENT =====
function loadAllUsers() {
    const saved = localStorage.getItem('allUsers');
    if (saved) {
        try {
            allUsers = JSON.parse(saved);
            initializeUserData();
        } catch (e) {
            console.error('Failed to load users:', e);
            allUsers = {};
        }
    }
}

function initializeUserData() {
    Object.keys(allUsers).forEach(username => {
        const user = allUsers[username];
        
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
    
    saveAllUsers();
}

function saveAllUsers() {
    try {
        const usersToSave = JSON.parse(JSON.stringify(allUsers, (key, value) => {
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

function compactAndSave() {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const cutoff = ninetyDaysAgo.toISOString().split('T')[0];
    
    Object.keys(allUsers).forEach(username => {
        const user = allUsers[username];
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
        localStorage.setItem('allUsers', JSON.stringify(allUsers));
        showNotification('⚠️ Storage optimized - old data removed');
    } catch (e) {
        showNotification('❌ Storage full! Cannot save progress.');
    }
}

// ===== LOGIN SYSTEM =====
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
                selectedAvatar = avatar;
            }
        });
    });
}

function checkAutoLogin() {
    const lastUser = localStorage.getItem('lastLoggedInUser');
    if (lastUser && allUsers[lastUser]) {
        currentUser = lastUser;
        showApp();
    } else {
        document.getElementById('loginContainer').classList.add('active');
        renderUserList();
    }
}

function renderUserList() {
    const list = document.getElementById('userList');
    list.innerHTML = '';
    
    const users = Object.values(allUsers);
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
            document.getElementById('loginUsername').value = user.username;
            document.getElementById('loginPassword').focus();
        });
        list.appendChild(card);
    });
}

document.getElementById('signupForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value.trim();
    const username = document.getElementById('signupUsername').value.trim().toLowerCase();
    const password = document.getElementById('signupPassword').value;
    
    if (!name || !username || !password) {
        showNotification('⚠️ Please fill all fields!');
        return;
    }
    
    if (!selectedAvatar) {
        showNotification('⚠️ Please select an avatar!');
        return;
    }
    
    if (allUsers[username]) {
        showNotification('⚠️ Username already exists!');
        return;
    }
    
    allUsers[username] = {
        name,
        username,
        password,
        avatar: selectedAvatar,
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
    currentUser = username;
    localStorage.setItem('lastLoggedInUser', username);
    
    showNotification('🎉 Welcome to your transformation journey!');
    showApp();
});

document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    
    if (!allUsers[username]) {
        showNotification('⚠️ User not found!');
        return;
    }
    
    if (allUsers[username].password !== password) {
        showNotification('⚠️ Incorrect password!');
        return;
    }
    
    currentUser = username;
    localStorage.setItem('lastLoggedInUser', username);
    showNotification('✅ Welcome back, ' + allUsers[username].name + '!');
    showApp();
});

function showApp() {
    document.getElementById('loginContainer').classList.remove('active');
    document.getElementById('appContainer').classList.add('active');
    renderAll();
    checkDailyLoginBonus();
    startIdentityReminders();
    restoreTimerState();
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        const user = allUsers[currentUser];
        if (user && user.timerState && user.timerState.interval) {
            clearInterval(user.timerState.interval);
            user.timerState.interval = null;
            user.timerState.running = false;
            saveAllUsers();
        }
        
        if (identityReminderTimeout) {
            clearTimeout(identityReminderTimeout);
            identityReminderTimeout = null;
        }
        
        currentUser = null;
        localStorage.removeItem('lastLoggedInUser');
        document.getElementById('loginContainer').classList.add('active');
        document.getElementById('appContainer').classList.remove('active');
        showNotification('👋 Logged out successfully!');
        renderUserList();
    }
}

// ===== NAVIGATION =====
function setupNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = link.dataset.tab;
            switchTab(tab);
            
            if (window.innerWidth <= 1024) {
                document.getElementById('sidebar').classList.remove('mobile-visible');
                document.body.classList.remove('sidebar-open');
            }
        });
    });

}

function switchTab(tabName) {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');
    
    if (tabName === 'analytics') {
        setTimeout(renderCharts, 100);
    }
    if (tabName === 'settings') {
        loadSettings();
    }
    if (tabName === 'achievements') {
        renderAchievements();
    }
}

// ===== RENDER SYSTEM =====
function renderAll() {
    const user = allUsers[currentUser];
    if (!user) return;
    
    updateUserProfile();
    updatePlayerLevel();
    updateStats();
    updateWelcomeMessage();
    renderQuests();
    renderAchievements();
    renderCharts();
    fetchDailyQuote();
    renderJournalHistory();
    updateLoginStreakDisplay();
    applyEnergyMode();
    updateIdentityWidget();
    updateConsistencyStats();
    renderBehaviorFeedback();
    renderProgressInsights();
    renderMomentumScore();
    renderActivityGrid();
    renderMoodSelector();
    checkClassChangeEligibility();
}

function updateUserProfile() {
    const user = allUsers[currentUser];
    document.getElementById('userAvatar').textContent = user.avatar;
    document.getElementById('userName').textContent = user.name;
    
    const titles = [
        { level: 1, title: 'Novice Adventurer' },
        { level: 3, title: 'Aspiring Warrior' },
        { level: 5, title: 'Determined Fighter' },
        { level: 10, title: 'MBA Candidate' },
        { level: 15, title: 'Disciplined Scholar' },
        { level: 20, title: 'Master of Habits' }
    ];
    
    const title = titles.reverse().find(t => user.level >= t.level)?.title || 'Novice Adventurer';
    document.getElementById('userTitle').textContent = title;
    
    const classEl = document.getElementById('userClass');
    if (user.selectedClass) {
        const classData = CLASS_OPTIONS.find(c => c.id === user.selectedClass);
        classEl.textContent = classData ? `${classData.icon} ${classData.name}` : '';
    } else {
        classEl.textContent = '';
    }
}

function updatePlayerLevel() {
    const user = allUsers[currentUser];
    const xpNeeded = user.level * 100;
    const progress = Math.min((user.xp / xpNeeded) * 100, 100);
    
    document.getElementById('playerLevel').textContent = user.level;
    document.getElementById('currentXP').textContent = user.xp;
    document.getElementById('nextLevelXP').textContent = xpNeeded;
    document.getElementById('xpBar').style.width = progress + '%';
    
    if (user.xp >= xpNeeded) {
        levelUp();
    }
}

function levelUp() {
    const user = allUsers[currentUser];
    user.level++;
    user.xp = 0;
    
    const bonus = user.selectedClass ? CLASS_OPTIONS.find(c => c.id === user.selectedClass)?.bonuses || {} : {};
    Object.keys(user.stats).forEach(stat => {
        const multiplier = bonus[stat] || 1;
        user.stats[stat] = Math.min(getStatCap(), user.stats[stat] + Math.floor(2 * multiplier));
    });
    
    saveAllUsers();
    updatePlayerLevel();
    updateStats();
    updateUserProfile();
    checkAchievements();
    
    showNotification('🎉 LEVEL UP! You reached Level ' + user.level);
}

function getStatCap() {
    const user = allUsers[currentUser];
    return user.selectedClass ? 1000 : 100;
}

function updateStats() {
    const user = allUsers[currentUser];
    const statsContainer = document.getElementById('statsOverview');
    if (!statsContainer) return;
    
    const cap = getStatCap();
    const displayCap = user.selectedClass ? cap : 100;
    
    statsContainer.innerHTML = '';
    
    const statConfigs = [
        { key: 'strength', icon: '💪', label: 'Strength', color: 'var(--strength)' },
        { key: 'discipline', icon: '🎯', label: 'Discipline', color: 'var(--discipline)' },
        { key: 'focus', icon: '🧠', label: 'Focus', color: 'var(--focus)' },
        { key: 'vitality', icon: '❤️', label: 'Vitality', color: 'var(--vitality)' },
        { key: 'wisdom', icon: '📚', label: 'Wisdom', color: 'var(--wisdom)' }
    ];
    
    statConfigs.forEach(config => {
        const value = Math.min(cap, user.stats[config.key]);
        const progress = (value / displayCap) * 100;
        
        const card = document.createElement('div');
        card.className = 'stat-card';
        card.style.setProperty('--stat-color', config.color);
        card.innerHTML = `
            <div class="stat-icon">${config.icon}</div>
            <div class="stat-label">${config.label}</div>
            <div class="stat-value">${value}</div>
            <div class="stat-max">/ ${displayCap}</div>
            <div class="stat-progress">
                <div class="stat-progress-fill" style="width: ${progress}%"></div>
            </div>
        `;
        statsContainer.appendChild(card);
    });
}

function updateWelcomeMessage() {
    const user = allUsers[currentUser];
    const hour = new Date().getHours();
    let greeting = 'Welcome Back';
    
    if (hour < 12) greeting = 'Good Morning';
    else if (hour < 18) greeting = 'Good Afternoon';
    else greeting = 'Good Evening';
    
    const streak = calculateCurrentStreak();
    const message = streak > 0 
        ? `${greeting}, ${user.name}! 🔥 ${streak} Day Streak`
        : `${greeting}, ${user.name}! 💪`;
    
    document.getElementById('welcomeMessage').textContent = message;
    
    const completedToday = getTodayQuestCount();
    const totalQuests = user.quests.length;
    const rate = totalQuests > 0 ? (completedToday / totalQuests) * 100 : 0;
    
    let subtitle = '';
    if (user.vision && rate === 100) {
        subtitle = `🎯 Perfect day! You're embodying: ${extractKeyPhrase(user.vision)}`;
    } else if (user.vision && rate >= 50) {
        subtitle = `Keep pushing toward: ${extractKeyPhrase(user.vision)}`;
    } else if (user.antiVision && rate > 0) {
        subtitle = `Don't let yourself become: ${extractKeyPhrase(user.antiVision)}`;
    } else {
        subtitle = 'Every quest completed is a step closer to your goals!';
    }
    
    document.getElementById('welcomeSubtitle').textContent = subtitle;
}

function extractKeyPhrase(text) {
    if (!text) return '';
    const phrases = text.split(/[,;]/).map(p => p.trim()).filter(p => p);
    return phrases[0] || text.substring(0, 50);
}

// ===== QUEST SYSTEM =====
function isQuestCompletedForPeriod(questId, frequency, quest) {
    const user = allUsers[currentUser];
    const now = new Date();
    const freq = frequency || 'daily';

    if (freq === 'custom' && quest && quest.customDays) {
        const todayDay = now.getDay();
        if (!quest.customDays.includes(todayDay)) return true; // not scheduled today, treat as "done"
        const today = now.toISOString().split('T')[0];
        return !!user.completions[`${questId}-${today}`];
    }

    if (freq === 'daily') {
        const today = now.toISOString().split('T')[0];
        return !!user.completions[`${questId}-${today}`];
    }

    if (freq === 'weekly') {
        const day = now.getDay();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - day);
        weekStart.setHours(0, 0, 0, 0);
        for (let d = new Date(weekStart); d <= now; d.setDate(d.getDate() + 1)) {
            if (user.completions[`${questId}-${d.toISOString().split('T')[0]}`]) return true;
        }
        return false;
    }

    if (freq === 'biweekly') {
        const epoch = new Date(2024, 0, 1);
        const daysSinceEpoch = Math.floor((now - epoch) / (1000 * 60 * 60 * 24));
        const periodStart = new Date(epoch);
        periodStart.setDate(epoch.getDate() + (daysSinceEpoch - (daysSinceEpoch % 14)));
        periodStart.setHours(0, 0, 0, 0);
        for (let d = new Date(periodStart); d <= now; d.setDate(d.getDate() + 1)) {
            if (user.completions[`${questId}-${d.toISOString().split('T')[0]}`]) return true;
        }
        return false;
    }

    if (freq === 'monthly') {
        const monthKey = now.toISOString().slice(0, 7);
        return Object.keys(user.completions).some(k => k.startsWith(questId + '-') && k.includes(monthKey));
    }

    return false;
}

function renderQuests() {
    const user = allUsers[currentUser];
    const container = document.getElementById('questCategories');
    if (!container) return;
    
    container.innerHTML = '';
    
    const categories = {};
    user.quests.forEach(quest => {
        const cat = quest.category || 'custom';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(quest);
    });
    
    const categoryNames = {
        health: '💪 Health & Fitness',
        study: '📚 Study & Learning',
        mindset: '🧘 Mindset & Growth',
        custom: '⭐ Custom Quests'
    };

    // Use saved category order if available
    const savedOrder = user.categoryOrder || [];
    const catKeys = Object.keys(categories);
    const orderedKeys = savedOrder.filter(k => catKeys.includes(k));
    catKeys.forEach(k => { if (!orderedKeys.includes(k)) orderedKeys.push(k); });
    
    orderedKeys.forEach((catKey, idx) => {
        const quests = categories[catKey];
        if (!quests) return;
        
        const catDiv = document.createElement('div');
        catDiv.className = 'quest-category';
        catDiv.dataset.category = catKey;
        
        const header = document.createElement('div');
        header.className = 'category-header';
        header.innerHTML = `
            <div class="category-title">${categoryNames[catKey] || catKey}</div>
            <div class="category-controls">
                <button class="cat-move-btn" data-dir="up" title="Move Up" ${idx === 0 ? 'disabled' : ''}>▲</button>
                <button class="cat-move-btn" data-dir="down" title="Move Down" ${idx === orderedKeys.length - 1 ? 'disabled' : ''}>▼</button>
                <span class="category-toggle">▼</span>
            </div>
        `;
        
        const questsDiv = document.createElement('div');
        questsDiv.className = 'category-quests';
        
        quests.forEach(quest => {
            const card = renderQuestCard(quest);
            questsDiv.appendChild(card);
        });
        
        header.querySelector('.category-toggle').addEventListener('click', (e) => {
            e.stopPropagation();
            header.classList.toggle('collapsed');
        });

        header.querySelectorAll('.cat-move-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                moveCategoryOrder(catKey, btn.dataset.dir);
            });
        });
        
        catDiv.appendChild(header);
        catDiv.appendChild(questsDiv);
        container.appendChild(catDiv);
    });
}

function moveCategoryOrder(catKey, direction) {
    const user = allUsers[currentUser];
    const categories = {};
    user.quests.forEach(quest => {
        const cat = quest.category || 'custom';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(quest);
    });
    const catKeys = Object.keys(categories);
    const savedOrder = user.categoryOrder || [];
    const orderedKeys = savedOrder.filter(k => catKeys.includes(k));
    catKeys.forEach(k => { if (!orderedKeys.includes(k)) orderedKeys.push(k); });

    const idx = orderedKeys.indexOf(catKey);
    if (idx === -1) return;
    if (direction === 'up' && idx > 0) {
        [orderedKeys[idx - 1], orderedKeys[idx]] = [orderedKeys[idx], orderedKeys[idx - 1]];
    } else if (direction === 'down' && idx < orderedKeys.length - 1) {
        [orderedKeys[idx + 1], orderedKeys[idx]] = [orderedKeys[idx], orderedKeys[idx + 1]];
    }
    user.categoryOrder = orderedKeys;
    saveAllUsers();
    renderQuests();
}

function renderQuestCard(quest) {
    const user = allUsers[currentUser];
    const frequency = quest.frequency || 'daily';
    const completed = isQuestCompletedForPeriod(quest.id, frequency, quest);
    
    // For custom frequency, check if quest is scheduled today
    const isScheduledToday = frequency !== 'custom' || !quest.customDays || quest.customDays.includes(new Date().getDay());
    
    const monthKey = new Date().toISOString().slice(0, 7);
    const monthlyCount = Object.keys(user.completions).filter(k => 
        k.startsWith(quest.id) && k.includes(monthKey)
    ).length;
    
    const streak = calculateQuestStreak(quest.id);
    const isFirst = getTodayQuestCount() === 0;
    const { totalXP } = calculateQuestXP(quest, isFirst && !completed);

    let freqLabel = FREQUENCY_LABELS[frequency] || frequency;
    if (frequency === 'custom' && quest.customDays) {
        freqLabel = quest.customDays.map(d => DAY_NAMES[d]).join(', ');
    }

    const completedLabel = frequency === 'daily' || frequency === 'custom' ? 'Done' :
        frequency === 'weekly' ? 'This Week' :
        frequency === 'biweekly' ? 'This Period' : 'This Month';

    const progressPct = quest.target > 0 ? Math.min(100, Math.round((monthlyCount / quest.target) * 100)) : 0;
    
    const card = document.createElement('div');
    card.className = 'quest-card' + (quest.essential ? ' essential-quest' : '') + (completed ? ' quest-completed' : '') + (!isScheduledToday ? ' quest-not-today' : '');
    card.innerHTML = `
        <div class="quest-top-row">
            <div class="quest-icon-wrap">${quest.icon}</div>
            <div class="quest-info">
                <div class="quest-name">${quest.name}</div>
                <div class="quest-meta">
                    <span class="quest-freq-badge">${freqLabel}</span>
                    ${quest.essential ? '<span class="essential-indicator">ESSENTIAL</span>' : ''}
                </div>
            </div>
            <div class="quest-actions">
                <button class="btn-icon-sm" data-action="edit" data-id="${quest.id}" title="Edit">✏️</button>
                <button class="btn-icon-sm" data-action="delete" data-id="${quest.id}" title="Delete">🗑️</button>
            </div>
        </div>
        <div class="quest-progress-row">
            <div class="quest-progress-bar">
                <div class="quest-progress-fill" style="width:${progressPct}%"></div>
            </div>
            <span class="quest-progress-text">${monthlyCount}/${quest.target}</span>
        </div>
        <div class="quest-bottom-row">
            <div class="quest-chip">🔥 ${streak}</div>
            <div class="quest-chip">⚡ ${quest.xp} XP</div>
            ${!completed && isScheduledToday ? `<div class="quest-chip quest-chip-bonus">+${totalXP} XP</div>` : ''}
        </div>
        ${isScheduledToday ? `<button class="check-in-btn ${completed ? 'completed' : ''}" data-quest="${quest.id}" ${completed ? 'disabled' : ''}>
            ${completed ? '✅ ' + completedLabel : '⚡ Complete'}
        </button>` : '<div class="quest-not-scheduled">Not scheduled today</div>'}
    `;
    
    card.querySelectorAll('.btn-icon-sm').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = btn.dataset.action;
            const id = btn.dataset.id;
            if (action === 'edit') editQuest(id);
            if (action === 'delete') deleteQuest(id);
        });
    });
    
    const completeBtn = card.querySelector('.check-in-btn');
    if (completeBtn && !completed) {
        completeBtn.addEventListener('click', () => completeQuest(quest.id));
    }
    
    return card;
}

function completeQuest(questId) {
    const user = allUsers[currentUser];
    const quest = user.quests.find(q => q.id === questId);
    if (!quest) return;
    
    const frequency = quest.frequency || 'daily';
    if (isQuestCompletedForPeriod(questId, frequency, quest)) return;
    
    const today = new Date().toISOString().split('T')[0];
    const key = `${questId}-${today}`;
    
    if (user.completions[key]) return;
    
    const isFirst = getTodayQuestCount() === 0;
    const { totalXP, baseXP } = calculateQuestXP(quest, isFirst);
    
    user.completions[key] = true;
    user.xp += totalXP;
    user.totalXPEarned += totalXP;
    
    const bonus = user.selectedClass ? CLASS_OPTIONS.find(c => c.id === user.selectedClass)?.bonuses || {} : {};
    Object.keys(quest.stats || {}).forEach(stat => {
        const increment = quest.stats[stat] || 1;
        const multiplier = bonus[stat] || 1;
        user.stats[stat] = Math.min(getStatCap(), user.stats[stat] + Math.floor(increment * multiplier));
    });
    
    saveAllUsers();
    renderAll();
    checkAchievements();
    
    let msg = `🎯 Quest Complete! +${totalXP} XP`;
    if (totalXP > baseXP) {
        msg += ` (${baseXP} base + ${totalXP - baseXP} bonus!)`;
    }
    showNotification(msg);
    
    if (checkPerfectEssentialDay()) {
        setTimeout(() => awardPerfectDayBonus(), 1000);
    }
}

function calculateQuestStreak(questId) {
    const user = allUsers[currentUser];
    let streak = 0;
    let date = new Date();
    
    while (streak < 365) {
        const key = `${questId}-${date.toISOString().split('T')[0]}`;
        if (user.completions[key]) {
            streak++;
            date.setDate(date.getDate() - 1);
        } else {
            break;
        }
    }
    
    return streak;
}

function calculateQuestXP(quest, isFirst = false) {
    const user = allUsers[currentUser];
    const baseXP = quest.xp;
    let totalXP = baseXP;
    
    if (isFirst) {
        totalXP += Math.floor(baseXP * 0.5);
    }
    
    const streak = calculateCurrentStreak();
    const multiplier = getStreakMultiplier(streak);
    
    if (multiplier > 0) {
        totalXP += Math.floor(totalXP * multiplier);
    }
    
    if (isFirst && wasYesterdayMissed()) {
        totalXP += 15;
    }
    
    return { totalXP, baseXP };
}

function getStreakMultiplier(streak) {
    if (streak >= 30) return 0.75;
    if (streak >= 14) return 0.50;
    if (streak >= 7) return 0.25;
    if (streak >= 3) return 0.10;
    return 0;
}

function getTodayQuestCount() {
    const user = allUsers[currentUser];
    const today = new Date().toISOString().split('T')[0];
    return Object.keys(user.completions).filter(k => k.includes(today)).length;
}

function wasYesterdayMissed() {
    const user = allUsers[currentUser];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    return Object.keys(user.completions).filter(k => k.includes(yesterdayStr)).length === 0;
}

function calculateCurrentStreak() {
    const user = allUsers[currentUser];
    let streak = 0;
    let date = new Date();
    
    while (streak < 365) {
        const key = date.toISOString().split('T')[0];
        const count = Object.keys(user.completions).filter(k => k.includes(key)).length;
        
        if (count > 0) {
            streak++;
            date.setDate(date.getDate() - 1);
        } else {
            const today = new Date().toISOString().split('T')[0];
            if (key === today && streak > 0) break;
            if (key === today) break;
            break;
        }
    }
    
    return streak;
}

function checkPerfectEssentialDay() {
    const user = allUsers[currentUser];
    const today = new Date().toISOString().split('T')[0];
    
    const essential = user.quests.filter(q => q.essential);
    if (essential.length === 0) return false;
    
    const completed = essential.filter(q => {
        const key = `${q.id}-${today}`;
        return user.completions[key];
    });
    
    return completed.length === essential.length;
}

function awardPerfectDayBonus() {
    const user = allUsers[currentUser];
    user.xp += 20;
    user.totalXPEarned += 20;
    saveAllUsers();
    updatePlayerLevel();
    showNotification('🌟 PERFECT ESSENTIAL DAY! +20 XP Bonus');
}

// ===== QUEST CREATION =====
function setQuestModalMode(isEdit) {
    const modalTitle = document.querySelector('#addQuestModal .modal-title');
    const submitBtn = document.querySelector('#questForm button[type="submit"]');
    if (modalTitle) modalTitle.textContent = isEdit ? 'Edit Quest' : 'Create New Quest';
    if (submitBtn) submitBtn.textContent = isEdit ? 'Save Quest' : 'Create Quest';
}

function setupForms() {
    // Inject frequency select with custom days into quest form
    const essentialGroup = document.getElementById('questEssential')?.closest('.form-group');
    if (essentialGroup) {
        const freqGroup = document.createElement('div');
        freqGroup.className = 'form-group';
        freqGroup.innerHTML = `
            <label class="form-label">Frequency</label>
            <select class="form-select" id="questFrequency">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom Days</option>
            </select>
            <div id="customDaysSelector" class="custom-days-selector" style="display:none;margin-top:10px;">
                <label class="form-label" style="font-size:0.85rem;margin-bottom:6px;">Select days:</label>
                <div class="custom-days-row">
                    ${DAY_NAMES.map((d, i) => `<label class="day-chip"><input type="checkbox" value="${i}" class="custom-day-cb">${d}</label>`).join('')}
                </div>
            </div>
        `;
        essentialGroup.parentNode.insertBefore(freqGroup, essentialGroup);

        document.getElementById('questFrequency').addEventListener('change', (e) => {
            document.getElementById('customDaysSelector').style.display = e.target.value === 'custom' ? 'block' : 'none';
        });
    }

    const questForm = document.getElementById('questForm');
    questForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const user = allUsers[currentUser];
        const name = document.getElementById('questName').value.trim();
        const icon = document.getElementById('questIcon').value.trim();
        const categorySelect = document.getElementById('questCategory').value;
        const customCat = document.getElementById('questCustomCategory').value.trim();
        const category = categorySelect === 'custom' ? customCat : categorySelect;
        const xp = parseInt(document.getElementById('questXP').value);
        const target = parseInt(document.getElementById('questTarget').value);
        const essential = document.getElementById('questEssential').checked;
        const freqSelect = document.getElementById('questFrequency');
        const frequency = freqSelect ? freqSelect.value : 'daily';

        let customDays = null;
        if (frequency === 'custom') {
            customDays = Array.from(document.querySelectorAll('.custom-day-cb:checked')).map(cb => parseInt(cb.value));
            if (customDays.length === 0) {
                showNotification('⚠️ Please select at least one day');
                return;
            }
        }
        
        const stats = {};
        document.querySelectorAll('.stat-checkbox-label input[type="checkbox"]:checked').forEach(cb => {
            const stat = cb.value;
            const increment = parseInt(cb.parentElement.querySelector('.stat-increment').value) || 1;
            stats[stat] = increment;
        });
        
        if (Object.keys(stats).length === 0) {
            stats.strength = 1;
        }

        // Save last used category for persistence
        if (category) {
            localStorage.setItem('levelup_lastCategory', categorySelect);
        }
        
        if (editingQuestId) {
            user.quests = user.quests.filter(q => q.id !== editingQuestId);
            const quest = {
                id: editingQuestId,
                name,
                icon,
                category,
                xp,
                target,
                essential,
                frequency,
                stats
            };
            if (customDays) quest.customDays = customDays;
            user.quests.push(quest);
            editingQuestId = null;
            saveAllUsers();
            renderQuests();
            closeModal('addQuestModal');
            questForm.reset();
            showNotification('✅ Quest Updated!');
        } else {
            const quest = {
                id: 'q' + Date.now(),
                name,
                icon,
                category,
                xp,
                target,
                essential,
                frequency,
                stats
            };
            if (customDays) quest.customDays = customDays;
            user.quests.push(quest);
            user.questsCreated++;
            saveAllUsers();
            renderQuests();
            closeModal('addQuestModal');
            questForm.reset();
            showNotification('✨ New Quest Created!');
            checkAchievements();
        }

        setQuestModalMode(false);
    });
    
    document.getElementById('questCategory').addEventListener('change', (e) => {
        const custom = document.getElementById('questCustomCategory');
        custom.style.display = e.target.value === 'custom' ? 'block' : 'none';
    });
    
    document.querySelectorAll('.stat-checkbox-label input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const increment = e.target.parentElement.querySelector('.stat-increment');
            increment.disabled = !e.target.checked;
        });
    });

    // Restore last used category when opening the add quest modal
    document.getElementById('addQuestBtn')?.addEventListener('click', () => {
        const lastCat = localStorage.getItem('levelup_lastCategory');
        if (lastCat) {
            const catSelect = document.getElementById('questCategory');
            if (catSelect) {
                catSelect.value = lastCat;
                const custom = document.getElementById('questCustomCategory');
                custom.style.display = lastCat === 'custom' ? 'block' : 'none';
            }
        }
    });
}

function editQuest(questId) {
    const user = allUsers[currentUser];
    const quest = user.quests.find(q => q.id === questId);
    if (!quest) return;
    
    editingQuestId = questId;
    
    document.getElementById('questName').value = quest.name;
    document.getElementById('questIcon').value = quest.icon;
    document.getElementById('questCategory').value = quest.category;
    document.getElementById('questXP').value = quest.xp;
    document.getElementById('questTarget').value = quest.target;
    document.getElementById('questEssential').checked = quest.essential;
    
    const freqSelect = document.getElementById('questFrequency');
    if (freqSelect) {
        freqSelect.value = quest.frequency || 'daily';
        const customDaysSelector = document.getElementById('customDaysSelector');
        if (customDaysSelector) {
            customDaysSelector.style.display = quest.frequency === 'custom' ? 'block' : 'none';
            document.querySelectorAll('.custom-day-cb').forEach(cb => {
                cb.checked = quest.customDays ? quest.customDays.includes(parseInt(cb.value)) : false;
            });
        }
    }
    
    document.querySelectorAll('.stat-checkbox-label input[type="checkbox"]').forEach(cb => {
        const stat = cb.value;
        if (quest.stats && quest.stats[stat]) {
            cb.checked = true;
            const increment = cb.parentElement.querySelector('.stat-increment');
            increment.disabled = false;
            increment.value = quest.stats[stat];
        }
    });
    
    setQuestModalMode(true);
    
    openModal('addQuestModal');
}

function deleteQuest(questId) {
    if (confirm('Are you sure you want to delete this quest?')) {
        const user = allUsers[currentUser];
        user.quests = user.quests.filter(q => q.id !== questId);
        saveAllUsers();
        renderQuests();
        showNotification('🗑️ Quest Deleted');
    }
}

// ===== TIMER SYSTEM =====
function renderActivityGrid() {
    const grid = document.getElementById('activityGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    ACTIVITY_TYPES.forEach(activity => {
        const option = document.createElement('div');
        option.className = 'activity-option';
        option.dataset.activity = activity.id;
        option.innerHTML = `
            <div class="activity-option-icon">${activity.name.split(' ')[0]}</div>
            <div>${activity.name.split(' ').slice(1).join(' ')}</div>
        `;
        option.addEventListener('click', () => selectActivity(activity.id, activity.name));
        grid.appendChild(option);
    });
}

function selectActivity(id, name) {
    selectedActivity = id;
    selectedActivityName = name;
    
    document.querySelectorAll('.activity-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    document.querySelector(`[data-activity="${id}"]`).classList.add('selected');
    document.getElementById('timerActivity').textContent = name;
}

function setupButtons() {
    document.getElementById('menuToggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('mobile-visible');
        document.body.classList.toggle('sidebar-open');
    });
    
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('addQuestBtn').addEventListener('click', () => {
        editingQuestId = null;
        document.getElementById('questForm').reset();
        setQuestModalMode(false);
        openModal('addQuestModal');
    });
    document.getElementById('saveJournalBtn').addEventListener('click', saveJournal);
    document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
    document.getElementById('energyToggleBtn').addEventListener('click', toggleEnergyMode);
    document.getElementById('resetProgressBtn').addEventListener('click', resetProgress);
    document.getElementById('deleteProfileBtn').addEventListener('click', deleteProfile);
    
    document.getElementById('startBtn').addEventListener('click', startTimer);
    document.getElementById('pauseBtn').addEventListener('click', pauseTimer);
    document.getElementById('stopBtn').addEventListener('click', stopTimer);
    
    document.getElementById('closeLoginBonus').addEventListener('click', closeLoginBonus);
    document.getElementById('closeIdentityReminder').addEventListener('click', closeIdentityReminder);
    document.getElementById('editIdentityBtn').addEventListener('click', () => switchTab('settings'));
    document.getElementById('identityWidgetToggle').addEventListener('click', toggleIdentityWidget);
    
    document.querySelectorAll('.low-energy-action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action === 'quests') switchTab('quests');
            if (action === 'journal') switchTab('journal');
            if (action === 'exit-energy') toggleEnergyMode();
        });
    });
}

function startTimer() {
    const user = allUsers[currentUser];
    if (!selectedActivity) {
        showNotification('⚠️ Please select an activity first');
        return;
    }
    
    if (user.timerState.interval) {
        clearInterval(user.timerState.interval);
    }
    
    user.timerState.running = true;
    user.timerState.activity = selectedActivity;
    user.timerState.activityName = selectedActivityName;
    
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('pauseBtn').style.display = 'inline-block';
    document.getElementById('stopBtn').style.display = 'inline-block';
    
    const activityData = ACTIVITY_TYPES.find(a => a.id === selectedActivity);
    
    user.timerState.interval = setInterval(() => {
        user.timerState.elapsed++;
        updateTimerDisplay();
        
        if (user.timerState.elapsed % activityData.interval === 0) {
            const xpGain = Math.floor(activityData.xpPerMin * (activityData.interval / 60));
            user.xp += xpGain;
            user.totalXPEarned += xpGain;
            
            const bonus = user.selectedClass ? CLASS_OPTIONS.find(c => c.id === user.selectedClass)?.bonuses || {} : {};
            const multiplier = bonus[activityData.stat] || 1;
            user.stats[activityData.stat] = Math.min(getStatCap(), user.stats[activityData.stat] + Math.floor(1 * multiplier));
            
            updatePlayerLevel();
            updateStats();
        }
    }, 1000);
}

function pauseTimer() {
    const user = allUsers[currentUser];
    user.timerState.running = false;
    clearInterval(user.timerState.interval);
    user.timerState.interval = null;
    saveAllUsers();
    
    document.getElementById('startBtn').style.display = 'inline-block';
    document.getElementById('startBtn').textContent = 'Resume';
    document.getElementById('pauseBtn').style.display = 'none';
    document.getElementById('stopBtn').style.display = 'inline-block';
}

function stopTimer() {
    const user = allUsers[currentUser];
    if (user.timerState.elapsed > 0) {
        const minutes = Math.floor(user.timerState.elapsed / 60);
        if (user.timerState.activity) {
            user.timerStats[user.timerState.activity] += user.timerState.elapsed;
        }
        showNotification(`⏱️ Session Complete! ${minutes} minutes trained`);
    }
    
    if (user.timerState.interval) {
        clearInterval(user.timerState.interval);
    }
    
    user.timerState.elapsed = 0;
    user.timerState.running = false;
    user.timerState.interval = null;
    
    document.getElementById('timerClock').textContent = '00:00:00';
    document.getElementById('startBtn').style.display = 'inline-block';
    document.getElementById('startBtn').textContent = 'Start';
    document.getElementById('pauseBtn').style.display = 'none';
    document.getElementById('stopBtn').style.display = 'none';
    
    saveAllUsers();
    checkAchievements();
}

function updateTimerDisplay() {
    const user = allUsers[currentUser];
    const hours = Math.floor(user.timerState.elapsed / 3600);
    const minutes = Math.floor((user.timerState.elapsed % 3600) / 60);
    const seconds = user.timerState.elapsed % 60;
    
    const display = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    document.getElementById('timerClock').textContent = display;
}

function pad(num) {
    return num.toString().padStart(2, '0');
}

function restoreTimerState() {
    const user = allUsers[currentUser];
    if (!user.timerState) return;
    
    if (user.timerState.interval) {
        clearInterval(user.timerState.interval);
        user.timerState.interval = null;
    }
    
    if (user.timerState.running && user.timerState.activity && user.timerState.elapsed > 0) {
        selectedActivity = user.timerState.activity;
        selectedActivityName = user.timerState.activityName;
        
        document.getElementById('timerActivity').textContent = selectedActivityName;
        document.querySelector(`[data-activity="${selectedActivity}"]`)?.classList.add('selected');
        
        updateTimerDisplay();
        
        const hours = Math.floor(user.timerState.elapsed / 3600);
        const minutes = Math.floor((user.timerState.elapsed % 3600) / 60);
        let timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        
        showNotification(`⏱️ Timer resumed from ${timeStr}`);
        
        const activityData = ACTIVITY_TYPES.find(a => a.id === selectedActivity);
        
        user.timerState.interval = setInterval(() => {
            user.timerState.elapsed++;
            updateTimerDisplay();
            
            if (user.timerState.elapsed % activityData.interval === 0) {
                const xpGain = Math.floor(activityData.xpPerMin * (activityData.interval / 60));
                user.xp += xpGain;
                user.totalXPEarned += xpGain;
                
                const bonus = user.selectedClass ? CLASS_OPTIONS.find(c => c.id === user.selectedClass)?.bonuses || {} : {};
                const multiplier = bonus[activityData.stat] || 1;
                user.stats[activityData.stat] = Math.min(getStatCap(), user.stats[activityData.stat] + Math.floor(1 * multiplier));
                
                updatePlayerLevel();
                updateStats();
            }
        }, 1000);
        
        document.getElementById('startBtn').style.display = 'none';
        document.getElementById('pauseBtn').style.display = 'inline-block';
        document.getElementById('stopBtn').style.display = 'inline-block';
    } else if (user.timerState.elapsed > 0 && !user.timerState.running) {
        selectedActivity = user.timerState.activity;
        selectedActivityName = user.timerState.activityName;
        
        if (selectedActivity) {
            document.getElementById('timerActivity').textContent = selectedActivityName;
            document.querySelector(`[data-activity="${selectedActivity}"]`)?.classList.add('selected');
        }
        
        updateTimerDisplay();
        document.getElementById('startBtn').style.display = 'inline-block';
        document.getElementById('startBtn').textContent = 'Resume';
        document.getElementById('pauseBtn').style.display = 'none';
        document.getElementById('stopBtn').style.display = 'inline-block';
    }
}

// ===== JOURNAL SYSTEM =====
function renderMoodSelector() {
    const container = document.getElementById('moodSelector');
    if (!container) return;
    
    container.innerHTML = '';
    
    MOODS.forEach(mood => {
        const option = document.createElement('div');
        option.className = 'mood-option';
        option.dataset.mood = mood.id;
        option.innerHTML = `${mood.emoji} ${mood.label}`;
        option.addEventListener('click', () => selectMood(mood.id, option));
        container.appendChild(option);
    });
}

function selectMood(moodId, element) {
    selectedMood = moodId;
    document.querySelectorAll('.mood-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    element.classList.add('selected');
}

function saveJournal() {
    const user = allUsers[currentUser];
    
    if (!selectedMood) {
        showNotification('⚠️ Please select your mood first');
        return;
    }
    
    const wins = document.getElementById('journalWins').value.trim();
    const challenges = document.getElementById('journalChallenges').value.trim();
    const tomorrow = document.getElementById('journalTomorrow').value.trim();
    
    if (!wins && !challenges && !tomorrow) {
        showNotification('⚠️ Please write at least one reflection');
        return;
    }
    
    const entry = {
        id: 'j' + Date.now(),
        date: new Date().toISOString(),
        mood: selectedMood,
        wins,
        challenges,
        tomorrow
    };
    
    user.journal.unshift(entry);
    
    if (user.journal.length > 30) {
        user.journal = user.journal.slice(0, 30);
    }
    
    user.xp += 5;
    user.totalXPEarned += 5;
    saveAllUsers();
    updatePlayerLevel();
    
    showNotification('✅ Journal entry saved! +5 XP for self-awareness');
    
    document.getElementById('journalWins').value = '';
    document.getElementById('journalChallenges').value = '';
    document.getElementById('journalTomorrow').value = '';
    selectedMood = null;
    document.querySelectorAll('.mood-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    renderJournalHistory();
    checkAchievements();
}

function renderJournalHistory() {
    const user = allUsers[currentUser];
    const container = document.getElementById('journalHistoryList');
    if (!container) return;
    
    if (!user.journal || user.journal.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Your journal entries will appear here</p>';
        return;
    }
    
    container.innerHTML = '';
    
    const moodEmojis = {
        great: '🔥',
        good: '😊',
        okay: '😐',
        low: '😔',
        struggling: '😞'
    };
    
    user.journal.forEach(entry => {
        const date = new Date(entry.date);
        const dateStr = date.toLocaleDateString('en', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        const card = document.createElement('div');
        card.className = 'journal-card';
        card.innerHTML = `
            <div class="journal-date">
                📅 ${dateStr}
                <span class="journal-mood">${moodEmojis[entry.mood]}</span>
            </div>
            ${entry.wins ? `<div class="journal-text"><strong>✅ Wins:</strong> ${entry.wins}</div>` : ''}
            ${entry.challenges ? `<div class="journal-text"><strong>⚠️ Challenges:</strong> ${entry.challenges}</div>` : ''}
            ${entry.tomorrow ? `<div class="journal-text"><strong>🎯 Tomorrow:</strong> ${entry.tomorrow}</div>` : ''}
        `;
        container.appendChild(card);
    });
}

// ===== ACHIEVEMENTS SYSTEM =====
function renderAchievements() {
    const user = allUsers[currentUser];
    const grid = document.getElementById('achievementsGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    const filtered = user.achievements.filter(a => {
        if (achievementFilter === 'all') return true;
        if (achievementFilter === 'unlocked') return a.unlocked;
        if (achievementFilter === 'locked') return !a.unlocked;
        return true;
    });
    
    filtered.forEach(achievement => {
        const div = document.createElement('div');
        div.className = `achievement ${achievement.unlocked ? 'unlocked' : 'locked'}`;
        div.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-name">${achievement.name}</div>
            ${achievement.progress ? `<div class="achievement-progress">${achievement.progress}</div>` : ''}
        `;
        div.addEventListener('click', () => showAchievementDetail(achievement));
        grid.appendChild(div);
    });
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            achievementFilter = btn.dataset.filter;
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderAchievements();
        });
    });
}

function showAchievementDetail(achievement) {
    const modal = document.getElementById('achievementModal');
    const title = document.getElementById('achievementModalTitle');
    const content = document.getElementById('achievementModalContent');
    
    title.textContent = achievement.name;
    content.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 4rem; margin-bottom: 10px;">${achievement.icon}</div>
            <div style="font-size: 1.2rem; color: var(--text-primary); margin-bottom: 10px;">${achievement.name}</div>
            <div style="color: var(--text-secondary); line-height: 1.6;">${achievement.desc}</div>
        </div>
        <div style="background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 15px; margin-top: 15px;">
            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px;">Status</div>
            <div style="font-size: 1rem; color: ${achievement.unlocked ? 'var(--green)' : 'var(--text-secondary)'};">
                ${achievement.unlocked ? '✅ Unlocked!' : (achievement.hidden ? '🔒 Hidden Achievement' : '🔒 Locked')}
            </div>
        </div>
        ${achievement.progress ? `
        <div style="background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 15px; margin-top: 10px;">
            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px;">Progress</div>
            <div style="font-size: 1rem; color: var(--text-primary);">${achievement.progress}</div>
        </div>
        ` : ''}
    `;
    
    openModal('achievementModal');
}

function checkAchievements() {
    const user = allUsers[currentUser];
    let newUnlocks = 0;
    
    const totalQuests = Object.keys(user.completions).length;
    const currentStreak = calculateCurrentStreak();
    const todayCount = getTodayQuestCount();
    const journalCount = user.journal ? user.journal.length : 0;
    const studyHours = Math.floor((user.timerStats.study || 0) / 3600);
    const exerciseCount = Math.floor((user.timerStats.exercise || 0) / 60);
    const meditateCount = Math.floor((user.timerStats.meditation || 0) / 60);
    
    const conditions = {
        complete_1_quest: totalQuests >= 1,
        complete_10_quests: totalQuests >= 10,
        streak_3: currentStreak >= 3,
        streak_7: currentStreak >= 7,
        streak_14: currentStreak >= 14,
        streak_30: currentStreak >= 30,
        streak_100: currentStreak >= 100,
        level_5: user.level >= 5,
        level_10: user.level >= 10,
        level_20: user.level >= 20,
        strength_50: user.stats.strength >= 50,
        strength_100: user.stats.strength >= 100,
        discipline_50: user.stats.discipline >= 50,
        discipline_100: user.stats.discipline >= 100,
        focus_50: user.stats.focus >= 50,
        focus_100: user.stats.focus >= 100,
        vitality_50: user.stats.vitality >= 50,
        vitality_100: user.stats.vitality >= 100,
        wisdom_50: user.stats.wisdom >= 50,
        wisdom_100: user.stats.wisdom >= 100,
        daily_5: todayCount >= 5,
        daily_10: todayCount >= 10,
        journal_1: journalCount >= 1,
        journal_7: journalCount >= 7,
        journal_30: journalCount >= 30,
        study_10h: studyHours >= 10,
        study_50h: studyHours >= 50,
        exercise_20: exerciseCount >= 20,
        exercise_50: exerciseCount >= 50,
        meditate_30: meditateCount >= 30,
        meditate_100: meditateCount >= 100,
        morning_30: totalQuests >= 30,
        xp_1000: user.totalXPEarned >= 1000,
        xp_10000: user.totalXPEarned >= 10000,
        login_30: user.loginData.totalLogins >= 30,
        vision_set: user.vision && user.antiVision,
        class_change: user.selectedClass !== null,
        custom_quest: user.questsCreated >= 1,
        custom_quest_10: user.questsCreated >= 10,
        low_energy_5: user.lowEnergyCount >= 5,
        all_stats_50: Object.values(user.stats).every(v => v >= 50),
        all_stats_100: Object.values(user.stats).every(v => v >= 100)
    };
    
    user.achievements.forEach(achievement => {
        if (achievement.unlocked) return;
        
        if (conditions[achievement.condition]) {
            achievement.unlocked = true;
            newUnlocks++;
            showNotification(`🏆 Achievement Unlocked: ${achievement.name}`);
        }
    });
    
    if (newUnlocks > 0) {
        saveAllUsers();
        renderAchievements();
    }
}

// ===== SETTINGS SYSTEM =====
function loadSettings() {
    const user = allUsers[currentUser];
    document.getElementById('settingsName').value = user.name;
    document.getElementById('settingsVision').value = user.vision || '';
    document.getElementById('settingsAntiVision').value = user.antiVision || '';
    document.getElementById('settingsBio').value = user.bio || '';
    
    if (user.vision) {
        document.getElementById('visionDisplay').innerHTML = user.vision;
    } else {
        document.getElementById('visionDisplay').innerHTML = '<span class="vision-empty">Set your vision...</span>';
    }
    
    if (user.antiVision) {
        document.getElementById('antiVisionDisplay').innerHTML = user.antiVision;
    } else {
        document.getElementById('antiVisionDisplay').innerHTML = '<span class="vision-empty">Set your anti-vision...</span>';
    }
    
    document.querySelectorAll('#settingsAvatarSelector .avatar-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.avatar === user.avatar) {
            opt.classList.add('selected');
        }
    });
}

function saveSettings() {
    const user = allUsers[currentUser];
    user.name = document.getElementById('settingsName').value.trim() || user.name;
    user.vision = document.getElementById('settingsVision').value.trim();
    user.antiVision = document.getElementById('settingsAntiVision').value.trim();
    user.bio = document.getElementById('settingsBio').value.trim();
    
    const selected = document.querySelector('#settingsAvatarSelector .avatar-option.selected');
    if (selected) {
        user.avatar = selected.dataset.avatar;
    }
    
    saveAllUsers();
    updateUserProfile();
    updateWelcomeMessage();
    loadSettings();
    updateIdentityWidget();
    checkAchievements();
    
    showNotification('✅ Settings saved successfully!');
}

function toggleEnergyMode() {
    const user = allUsers[currentUser];
    user.lowEnergyMode = !user.lowEnergyMode;
    
    if (user.lowEnergyMode) {
        user.lowEnergyCount++;
    }
    
    saveAllUsers();
    applyEnergyMode();
    
    const msg = user.lowEnergyMode ? '🛡️ Low Energy Mode activated' : '🔋 Normal Mode restored';
    showNotification(msg);
    checkAchievements();
}

function applyEnergyMode() {
    const user = allUsers[currentUser];
    const body = document.body;
    const btn = document.getElementById('energyToggleBtn');
    const icon = document.getElementById('energyModeIcon');
    const text = document.getElementById('energyModeText');
    
    if (user.lowEnergyMode) {
        body.classList.add('low-energy-mode');
        if (btn) btn.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
        if (icon) icon.textContent = '🛡️';
        if (text) text.textContent = 'Deactivate Low Energy Mode';
    } else {
        body.classList.remove('low-energy-mode');
        if (btn) btn.style.background = 'linear-gradient(135deg, var(--vitality), var(--secondary))';
        if (icon) icon.textContent = '🔋';
        if (text) text.textContent = 'Activate Low Energy Mode';
    }
    
    renderQuests();
}

function resetProgress() {
    if (confirm('⚠️ This will delete ALL your progress! Are you absolutely sure?')) {
        if (confirm('This action cannot be undone. Continue?')) {
            const user = allUsers[currentUser];
            user.level = 1;
            user.xp = 0;
            user.totalXPEarned = 0;
            user.stats = { strength: 0, discipline: 0, focus: 0, vitality: 0, wisdom: 0 };
            user.completions = {};
            user.quests = JSON.parse(JSON.stringify(DEFAULT_QUESTS));
            user.achievements = JSON.parse(JSON.stringify(ACHIEVEMENTS_DATA));
            user.timerStats = { study: 0, exercise: 0, meditation: 0, speaking: 0 };
            user.selectedClass = null;
            
            saveAllUsers();
            renderAll();
            showNotification('🔄 Progress reset successfully!');
        }
    }
}

function deleteProfile() {
    if (confirm('⚠️ PERMANENT DELETE: This will completely remove your profile and all data!')) {
        const typed = prompt('Type your username to confirm deletion:');
        if (typed === currentUser) {
            delete allUsers[currentUser];
            localStorage.removeItem('allUsers');
            localStorage.removeItem('lastLoggedInUser');
            location.reload();
        } else if (typed !== null) {
            showNotification('⚠️ Username did not match. Deletion cancelled.');
        }
    }
}

// ===== IDENTITY SYSTEM =====
function updateIdentityWidget() {
    const user = allUsers[currentUser];
    const content = document.getElementById('widgetIdentityContent');
    if (!content) return;
    
    content.innerHTML = '';
    
    if (user.vision) {
        const vision = document.createElement('div');
        vision.className = 'identity-section';
        vision.innerHTML = `
            <div class="identity-section-label">✨ Vision</div>
            <div class="identity-section-text">${user.vision}</div>
        `;
        content.appendChild(vision);
    }
    
    if (user.antiVision) {
        const antiVision = document.createElement('div');
        antiVision.className = 'identity-section';
        antiVision.innerHTML = `
            <div class="identity-section-label">⚠️ Anti-Vision</div>
            <div class="identity-section-text anti">${user.antiVision}</div>
        `;
        content.appendChild(antiVision);
    }
    
    if (user.bio) {
        const bio = document.createElement('div');
        bio.className = 'identity-section';
        bio.innerHTML = `
            <div class="identity-section-label">📖 Your Story</div>
            <div class="identity-section-text">${user.bio}</div>
        `;
        content.appendChild(bio);
    }
    
    if (!user.vision && !user.antiVision && !user.bio) {
        content.innerHTML = '<p class="identity-empty">Set your identity in settings</p>';
    }
}

function toggleIdentityWidget() {
    const widget = document.getElementById('identityWidget');
    widget.classList.toggle('expanded');
}

function startIdentityReminders() {
    const user = allUsers[currentUser];
    
    if (!user.vision && !user.antiVision) return;
    
    if (identityReminderTimeout) {
        clearTimeout(identityReminderTimeout);
    }
    
    function schedule() {
        if (identityReminderTimeout) {
            clearTimeout(identityReminderTimeout);
        }
        
        const min = 45;
        const max = 90;
        const random = Math.floor(Math.random() * (max - min + 1)) + min;
        const ms = random * 60 * 1000;
        
        identityReminderTimeout = setTimeout(() => {
            showIdentityReminder();
            schedule();
        }, ms);
    }
    
    schedule();
}

function showIdentityReminder() {
    const user = allUsers[currentUser];
    const notif = document.getElementById('identityReminderNotif');
    const title = document.getElementById('reminderTitle');
    const text = document.getElementById('reminderText');
    
    const useVision = Math.random() > 0.5;
    
    if (useVision && user.vision) {
        title.textContent = '✨ Remember Your Vision';
        text.textContent = user.vision;
    } else if (!useVision && user.antiVision) {
        title.textContent = '⚠️ Remember What You\'re Avoiding';
        text.textContent = user.antiVision;
    } else if (user.vision) {
        title.textContent = '✨ Remember Your Vision';
        text.textContent = user.vision;
    } else if (user.antiVision) {
        title.textContent = '⚠️ Remember What You\'re Avoiding';
        text.textContent = user.antiVision;
    } else {
        return;
    }
    
    notif.classList.add('show');
    setTimeout(() => closeIdentityReminder(), 8000);
}

function closeIdentityReminder() {
    document.getElementById('identityReminderNotif').classList.remove('show');
}

// ===== CONSISTENCY STATS =====
function updateConsistencyStats() {
    const container = document.getElementById('consistencyStats');
    if (!container) return;
    
    const currentStreak = calculateCurrentStreak();
    const multiplier = getStreakMultiplier(currentStreak);
    const todayCount = getTodayQuestCount();
    const longestStreak = calculateLongestStreak();
    
    container.innerHTML = `
        <div class="consistency-stat-item">
            <div class="consistency-stat-icon">🔥</div>
            <div class="consistency-stat-value">${currentStreak}</div>
            <div class="consistency-stat-label">Current Streak</div>
        </div>
        <div class="consistency-stat-item">
            <div class="consistency-stat-icon">⚡</div>
            <div class="consistency-stat-value">+${Math.floor(multiplier * 100)}%</div>
            <div class="consistency-stat-label">XP Multiplier</div>
        </div>
        <div class="consistency-stat-item">
            <div class="consistency-stat-icon">🎯</div>
            <div class="consistency-stat-value">${todayCount}</div>
            <div class="consistency-stat-label">Today's Quests</div>
        </div>
        <div class="consistency-stat-item">
            <div class="consistency-stat-icon">💎</div>
            <div class="consistency-stat-value">${longestStreak}</div>
            <div class="consistency-stat-label">Best Streak</div>
        </div>
    `;
}

function calculateLongestStreak() {
    const user = allUsers[currentUser];
    let longest = 0;
    let current = 0;
    
    const dates = [...new Set(
        Object.keys(user.completions).map(k => k.split('-').slice(1).join('-'))
    )].sort();
    
    if (dates.length === 0) return 0;
    
    let prev = null;
    
    dates.forEach(dateStr => {
        const date = new Date(dateStr);
        
        if (prev === null) {
            current = 1;
        } else {
            const diff = Math.floor((date - prev) / (1000 * 60 * 60 * 24));
            
            if (diff === 1) {
                current++;
            } else {
                longest = Math.max(longest, current);
                current = 1;
            }
        }
        
        prev = date;
    });
    
    longest = Math.max(longest, current);
    return longest;
}

// ===== BEHAVIOR FEEDBACK =====
function renderBehaviorFeedback() {
    const container = document.getElementById('behaviorFeedback');
    if (!container) return;
    
    const user = allUsers[currentUser];
    const patterns = analyzePatterns();
    
    container.innerHTML = '';
    
    const all = [...patterns.positive, ...patterns.warning, ...patterns.neutral];
    const active = all.filter(f => !user.dismissedFeedback.includes(f.type)).slice(0, 2);
    
    active.forEach(feedback => {
        const type = patterns.positive.includes(feedback) ? 'positive' :
                     patterns.warning.includes(feedback) ? 'warning' : 'neutral';
        
        const card = document.createElement('div');
        card.className = `feedback-card ${type}`;
        card.innerHTML = `
            <button class="feedback-dismiss" data-type="${feedback.type}">&times;</button>
            <div class="feedback-header">
                <div class="feedback-icon">${feedback.icon}</div>
                <div class="feedback-title">${feedback.title}</div>
            </div>
            <div class="feedback-message">${feedback.message}</div>
            <div class="feedback-insight">${feedback.insight}</div>
        `;
        
        card.querySelector('.feedback-dismiss').addEventListener('click', (e) => {
            const type = e.target.dataset.type;
            dismissFeedback(type);
        });
        
        container.appendChild(card);
    });
}

function analyzePatterns() {
    const user = allUsers[currentUser];
    const patterns = { positive: [], warning: [], neutral: [] };
    
    const streak = calculateCurrentStreak();
    const todayCount = getTodayQuestCount();
    
    if (streak >= 14) {
        patterns.positive.push({
            type: 'consistency',
            title: 'Building real momentum',
            message: `${streak} days straight. This isn't motivation anymore—this is identity shift.`,
            insight: `The version of you from ${streak} days ago wouldn't recognize you now.`,
            icon: '💎'
        });
    }
    
    if (todayCount > 0 && todayCount < 3 && user.lowEnergyMode) {
        patterns.positive.push({
            type: 'low_energy_win',
            title: 'Showing up on hard days',
            message: `You're in low-energy mode and you still did ${todayCount} quest${todayCount > 1 ? 's' : ''}. That counts.`,
            insight: `You didn't give up. That's the only metric that matters today.`,
            icon: '🛡️'
        });
    }
    
    return patterns;
}

function dismissFeedback(type) {
    const user = allUsers[currentUser];
    if (!user.dismissedFeedback) {
        user.dismissedFeedback = [];
    }
    user.dismissedFeedback.push(type);
    saveAllUsers();
    renderBehaviorFeedback();
}

// ===== PROGRESS INSIGHTS =====
function renderProgressInsights() {
    const container = document.getElementById('progressInsights');
    if (!container) return;
    
    const user = allUsers[currentUser];
    const today = new Date().toISOString().split('T')[0];
    const todayCount = getTodayQuestCount();
    const totalQuests = user.quests.length;
    const rate = totalQuests > 0 ? Math.floor((todayCount / totalQuests) * 100) : 0;
    
    const last7 = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const key = date.toISOString().split('T')[0];
        const count = Object.keys(user.completions).filter(k => k.includes(key)).length;
        last7.push(count);
    }
    const weeklyTotal = last7.reduce((a, b) => a + b, 0);
    const activeDays = last7.filter(c => c > 0).length;
    
    const maxStat = Math.max(...Object.values(user.stats));
    const strongest = Object.keys(user.stats).find(k => user.stats[k] === maxStat);
    const statNames = {
        strength: 'Strength',
        discipline: 'Discipline',
        focus: 'Focus',
        vitality: 'Vitality',
        wisdom: 'Wisdom'
    };
    
    container.innerHTML = `
        <div class="insight-mini" style="--insight-color: ${rate >= 70 ? 'var(--green)' : rate >= 40 ? 'var(--accent)' : 'var(--text-secondary)'}">
            <div class="insight-value">${rate}%</div>
            <div class="insight-label">Today's Progress</div>
            <div class="insight-context">${todayCount} of ${totalQuests} quests</div>
        </div>
        <div class="insight-mini" style="--insight-color: ${activeDays >= 6 ? 'var(--green)' : activeDays >= 4 ? 'var(--accent)' : 'var(--text-secondary)'}">
            <div class="insight-value">${activeDays}/7</div>
            <div class="insight-label">Weekly Momentum</div>
            <div class="insight-context">${weeklyTotal} quests completed</div>
        </div>
        ${maxStat > 0 ? `
        <div class="insight-mini" style="--insight-color: var(--purple)">
            <div class="insight-value">${statNames[strongest]}</div>
            <div class="insight-label">Leading Stat</div>
            <div class="insight-context">Level ${maxStat}/${getStatCap()}</div>
        </div>
        ` : ''}
    `;
}

// ===== LOGIN BONUS =====
function checkDailyLoginBonus() {
    const user = allUsers[currentUser];
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
    updatePlayerLevel();
    showLoginBonus(totalXP, user.loginData.loginStreak);
    checkAchievements();
}

function showLoginBonus(xp, streak) {
    const modal = document.getElementById('loginBonusModal');
    const text = document.getElementById('loginBonusText');
    const streakText = document.getElementById('loginBonusStreak');
    
    text.textContent = `+${xp} XP for showing up!`;
    streakText.textContent = streak > 1 ? `🔥 ${streak} day login streak!` : '🌟 Start your streak today!';
    
    modal.classList.add('show');
    setTimeout(() => closeLoginBonus(), 4000);
}

function closeLoginBonus() {
    document.getElementById('loginBonusModal').classList.remove('show');
}

function updateLoginStreakDisplay() {
    const user = allUsers[currentUser];
    const display = document.getElementById('loginStreakDisplay');
    const number = document.getElementById('loginStreakNumber');
    
    if (!user.loginData || user.loginData.loginStreak === 0) {
        display.classList.remove('active');
        return;
    }
    
    display.classList.add('active');
    number.textContent = user.loginData.loginStreak + (user.loginData.loginStreak === 1 ? ' Day' : ' Days');
}

// ===== CLASS CHANGE SYSTEM =====
function checkClassChangeEligibility() {
    const user = allUsers[currentUser];
    if (user.selectedClass) return;
    
    const allAt100 = Object.values(user.stats).every(v => v >= 100);
    if (allAt100) {
        showClassChangeModal();
    }
}

function showClassChangeModal() {
    const modal = document.getElementById('classChangeModal');
    const container = document.getElementById('classOptions');
    
    container.innerHTML = '';
    
    CLASS_OPTIONS.forEach(classData => {
        const option = document.createElement('div');
        option.className = 'class-option';
        option.innerHTML = `
            <div class="class-option-header">
                <div class="class-option-icon">${classData.icon}</div>
                <div class="class-option-name">${classData.name}</div>
            </div>
            <div class="class-option-description">${classData.desc}</div>
        `;
        option.addEventListener('click', () => selectClass(classData.id));
        container.appendChild(option);
    });
    
    openModal('classChangeModal');
}

function selectClass(classId) {
    const user = allUsers[currentUser];
    user.selectedClass = classId;
    saveAllUsers();
    closeModal('classChangeModal');
    updateUserProfile();
    updateStats();
    checkAchievements();
    
    const classData = CLASS_OPTIONS.find(c => c.id === classId);
    showNotification(`⚔️ Class Changed! You are now a ${classData.name}`);
}

// ===== MOMENTUM SCORE =====
// Weights: completion (40%) is the primary driver of habit formation,
// streak (30%) rewards consistency, journal (15%) encourages reflection,
// timer (15%) rewards focused deep work sessions.
function calculateMomentumScore() {
    const user = allUsers[currentUser];
    if (!user) return 0;

    const totalQuests = user.quests.length;
    if (totalQuests === 0) return 0;

    // 7-day completion rate (40% weight - primary habit signal)
    let completedLast7 = 0;
    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const key = date.toISOString().split('T')[0];
        completedLast7 += Object.keys(user.completions).filter(k => k.includes(key)).length;
    }
    const maxPossible7Days = totalQuests * 7;
    const completionRate = Math.min(completedLast7 / maxPossible7Days, 1);
    const completionScore = completionRate * 40;

    // Current streak (30% weight, capped at 30 days for full score)
    const streak = calculateCurrentStreak();
    const streakScore = Math.min(streak / 30, 1) * 30;

    // Journal entries this week (15% weight)
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    const journalThisWeek = (user.journal || []).filter(j => new Date(j.date) >= weekAgo).length;
    const journalScore = Math.min(journalThisWeek / 7, 1) * 15;

    // Timer usage this week (15% weight, full score at 10 hours)
    const TIMER_HOURS_FOR_FULL_SCORE = 10;
    const timerTotal = Object.values(user.timerStats || {}).reduce((a, b) => a + (Number(b) || 0), 0);
    const timerHours = timerTotal / 3600;
    const timerScore = Math.min(timerHours / TIMER_HOURS_FOR_FULL_SCORE, 1) * 15;

    return Math.round(completionScore + streakScore + journalScore + timerScore);
}

function renderMomentumScore() {
    const user = allUsers[currentUser];
    if (!user) return;

    let block = document.getElementById('momentumScoreBlock');
    if (!block) {
        block = document.createElement('div');
        block.id = 'momentumScoreBlock';
        const progressInsights = document.getElementById('progressInsights');
        if (progressInsights && progressInsights.parentNode) {
            progressInsights.parentNode.insertBefore(block, progressInsights.nextSibling);
        } else {
            const dashboard = document.getElementById('dashboard');
            if (dashboard) dashboard.appendChild(block);
        }
    }

    const score = calculateMomentumScore();
    const thresholds = [
        { min: 80, color: 'var(--green, #10b981)', label: '🔥 On Fire!' },
        { min: 60, color: 'var(--green, #10b981)', label: '💪 Strong' },
        { min: 40, color: 'var(--accent, #f59e0b)', label: '📈 Building' },
        { min: 20, color: 'var(--text-secondary, #94a3b8)', label: '🌱 Starting' },
        { min: 0, color: 'var(--text-secondary, #94a3b8)', label: '😴 Dormant' }
    ];
    const tier = thresholds.find(t => score >= t.min);
    const color = tier.color;
    const label = tier.label;

    block.className = 'momentum-score-block';
    block.innerHTML = `
        <div class="momentum-label">⚡ Momentum Score</div>
        <div class="momentum-value" style="color:${color}">${score}</div>
        <div class="momentum-tier">${label}</div>
        <div class="momentum-bar">
            <div class="momentum-bar-fill" style="width:${score}%;background:${color}"></div>
        </div>
    `;
}

// ===== CHARTS SYSTEM =====
function renderCharts() {
    renderWeeklyChart();
    renderStatsRadar();
    renderMonthlyChart();
    renderXPChart();
    renderDailyXPChart();
    renderStatGrowthChart();
}

function renderWeeklyChart() {
    const canvas = document.getElementById('weeklyChart');
    if (!canvas) return;
    
    const user = allUsers[currentUser];
    const ctx = canvas.getContext('2d');
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;
    
    ctx.clearRect(0, 0, width, height);
    
    const days = [];
    const completions = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const key = date.toISOString().split('T')[0];
        const count = Object.keys(user.completions).filter(k => k.includes(key)).length;
        days.push(date.toLocaleDateString('en', { weekday: 'short' }));
        completions.push(count);
    }
    
    drawBarChart(ctx, width, height, days, completions);
}

function drawBarChart(ctx, width, height, labels, data) {
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const barWidth = chartWidth / data.length / 1.5;
    const maxValue = Math.max(...data, 1);
    
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    
    data.forEach((value, i) => {
        const barHeight = (value / maxValue) * chartHeight;
        const x = padding + (chartWidth / data.length) * i + (chartWidth / data.length - barWidth) / 2;
        const y = height - padding - barHeight;
        
        const gradient = ctx.createLinearGradient(x, y, x, height - padding);
        gradient.addColorStop(0, '#a463f2');
        gradient.addColorStop(1, '#ff6b6b');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);
        
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText(labels[i], x + barWidth / 2, height - padding + 20);
        ctx.fillText(value, x + barWidth / 2, y - 5);
    });
}

function renderStatsRadar() {
    const canvas = document.getElementById('statsRadar');
    if (!canvas) return;
    
    const user = allUsers[currentUser];
    const ctx = canvas.getContext('2d');
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;
    
    ctx.clearRect(0, 0, width, height);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 40;
    
    const stats = [
        { name: 'STR', value: user.stats.strength, color: '#ef4444' },
        { name: 'DIS', value: user.stats.discipline, color: '#3b82f6' },
        { name: 'FOC', value: user.stats.focus, color: '#8b5cf6' },
        { name: 'VIT', value: user.stats.vitality, color: '#10b981' },
        { name: 'WIS', value: user.stats.wisdom, color: '#f59e0b' }
    ];
    
    const angleStep = (Math.PI * 2) / stats.length;
    const cap = getStatCap();
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    for (let i = 1; i <= 5; i++) {
        ctx.beginPath();
        const r = (radius / 5) * i;
        stats.forEach((_, index) => {
            const angle = angleStep * index - Math.PI / 2;
            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r;
            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.stroke();
    }
    
    stats.forEach((stat, index) => {
        const angle = angleStep * index - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.stroke();
        
        const labelX = centerX + Math.cos(angle) * (radius + 20);
        const labelY = centerY + Math.sin(angle) * (radius + 20);
        ctx.fillStyle = stat.color;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(stat.name, labelX, labelY);
    });
    
    ctx.beginPath();
    stats.forEach((stat, index) => {
        const angle = angleStep * index - Math.PI / 2;
        const value = (Math.min(stat.value, cap) / cap) * radius;
        const x = centerX + Math.cos(angle) * value;
        const y = centerY + Math.sin(angle) * value;
        
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(168, 99, 242, 0.2)';
    ctx.fill();
    ctx.strokeStyle = '#a463f2';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function renderMonthlyChart() {
    const canvas = document.getElementById('monthlyChart');
    if (!canvas) return;
    
    const user = allUsers[currentUser];
    const ctx = canvas.getContext('2d');
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;
    
    ctx.clearRect(0, 0, width, height);
    
    const monthlyData = [];
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const currentYear = new Date().getFullYear();
    for (let month = 0; month < 12; month++) {
        const monthKey = new Date(currentYear, month).toISOString().slice(0, 7);
        const count = Object.keys(user.completions).filter(k => k.includes(monthKey)).length;
        monthlyData.push(count);
    }
    
    drawBarChart(ctx, width, height, labels, monthlyData);
}

function renderXPChart() {
    const canvas = document.getElementById('xpChart');
    if (!canvas) return;
    
    const user = allUsers[currentUser];
    const ctx = canvas.getContext('2d');
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;
    
    ctx.clearRect(0, 0, width, height);
    
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    const xpHistory = [];
    for (let i = 0; i <= 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (30 - i));
        const key = date.toISOString().split('T')[0];
        const dailyXP = Object.keys(user.completions).filter(k => k.includes(key)).reduce((sum, k) => {
            const questId = k.split('-')[0];
            const quest = user.quests.find(q => q.id === questId);
            return sum + (quest ? quest.xp : 0);
        }, 0);
        xpHistory.push(dailyXP);
    }
    
    const maxXP = Math.max(...xpHistory, 1);
    
    ctx.strokeStyle = '#a463f2';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    xpHistory.forEach((xp, i) => {
        const x = padding + (chartWidth / 30) * i;
        const y = height - padding - (xp / maxXP) * chartHeight;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(164, 99, 242, 0.1)';
    ctx.lineTo(width - padding, height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.closePath();
    ctx.fill();
}

function renderDailyXPChart() {
    const canvas = document.getElementById('dailyXPChart');
    if (!canvas) return;
    
    const user = allUsers[currentUser];
    const ctx = canvas.getContext('2d');
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;
    
    ctx.clearRect(0, 0, width, height);
    
    const days = [];
    const xpData = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const key = date.toISOString().split('T')[0];
        const dailyXP = Object.keys(user.completions).filter(k => k.includes(key)).reduce((sum, k) => {
            const questId = k.split('-')[0];
            const quest = user.quests.find(q => q.id === questId);
            return sum + (quest ? quest.xp : 0);
        }, 0);
        days.push(date.toLocaleDateString('en', { weekday: 'short' }));
        xpData.push(dailyXP);
    }
    
    drawBarChart(ctx, width, height, days, xpData);
}

function renderStatGrowthChart() {
    const canvas = document.getElementById('statGrowthChart');
    if (!canvas) return;
    
    const user = allUsers[currentUser];
    const ctx = canvas.getContext('2d');
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;
    
    ctx.clearRect(0, 0, width, height);
    
    const statNames = ['Strength', 'Discipline', 'Focus', 'Vitality', 'Wisdom'];
    const statKeys = ['strength', 'discipline', 'focus', 'vitality', 'wisdom'];
    const statValues = statKeys.map(k => user.stats[k]);
    
    drawBarChart(ctx, width, height, statNames, statValues);
}

// ===== DAILY QUOTE =====
async function fetchDailyQuote() {
    const user = allUsers[currentUser];
    const today = new Date().toDateString();
    
    if (user.dailyQuote && user.lastQuoteFetch === today) {
        displayQuote(user.dailyQuote);
        return;
    }
    
    try {
        const response = await fetch('https://zenquotes.io/api/today');
        const data = await response.json();
        
        if (data && data[0]) {
            const quote = {
                text: data[0].q,
                author: data[0].a
            };
            
            user.dailyQuote = quote;
            user.lastQuoteFetch = today;
            saveAllUsers();
            displayQuote(quote);
        }
    } catch (error) {
        console.log('Could not fetch quote:', error);
        if (user.vision) {
            displayQuote({
                text: `Your vision: ${user.vision}`,
                author: 'Your Future Self'
            });
        }
    }
}

function displayQuote(quote) {
    const quoteDiv = document.getElementById('quoteOfDay');
    const quoteText = document.getElementById('quoteText');
    const quoteAuthor = document.getElementById('quoteAuthor');
    const user = allUsers[currentUser];
    
    let finalQuote = quote;
    
    if (quote && quote.text && quote.author !== 'Your Future Self') {
        finalQuote = quote;
    } else if (user.vision || user.antiVision) {
        const visionQuotes = [
            { text: `Your vision shapes your reality. Today, step closer to: ${extractKeyPhrase(user.vision || user.antiVision)}`, author: 'Your Journey' },
            { text: `Every small action today builds the future you envision. Focus on becoming your best self.`, author: 'Your Path' },
            { text: `Success is the sum of small efforts repeated daily. Keep building toward greatness.`, author: 'Your Commitment' }
        ];
        finalQuote = visionQuotes[Math.floor(Math.random() * visionQuotes.length)];
    }
    
    if (finalQuote && finalQuote.text) {
        quoteText.textContent = `"${finalQuote.text}"`;
        quoteAuthor.textContent = `— ${finalQuote.author}`;
        quoteDiv.classList.add('active');
    }
}

// ===== MODAL SYSTEM =====
function setupModals() {
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            modal.classList.remove('active');
            if (modal.id === 'addQuestModal') {
                editingQuestId = null;
                setQuestModalMode(false);
                document.getElementById('questForm').reset();
            }
        });
    });
    
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                if (modal.id === 'addQuestModal') {
                    editingQuestId = null;
                    setQuestModalMode(false);
                    document.getElementById('questForm').reset();
                }
            }
        });
    });
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// ===== NOTIFICATIONS =====
let notificationCount = 0;
function showNotification(message) {
    const offset = notificationCount * 60;
    notificationCount++;
    const notif = document.createElement('div');
    notif.className = 'app-notification';
    notif.style.top = (20 + offset) + 'px';
    notif.textContent = message;
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.classList.add('exit');
        setTimeout(() => {
            notif.remove();
            notificationCount = Math.max(0, notificationCount - 1);
        }, 300);
    }, 3000);
}

console.log('%c⚡ Level Up v1.0.0', 'font-size: 20px; font-weight: bold; color: #ff6b6b;');
console.log('%cDeveloped by KrisVeltrix', 'font-size: 12px; color: #a463f2;');
console.log('%cYour transformation journey starts now!', 'font-size: 14px; color: #4ecdc4;');