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

function setupButtons() {
    document.getElementById('menuToggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('mobile-visible');
        document.body.classList.toggle('sidebar-open');
    });
    
    // Close sidebar when clicking on the backdrop overlay
    document.addEventListener('click', (e) => {
        const sidebar = document.getElementById('sidebar');
        if (document.body.classList.contains('sidebar-open') &&
            !e.target.closest('.sidebar') &&
            !e.target.closest('#menuToggle')) {
            sidebar.classList.remove('mobile-visible');
            document.body.classList.remove('sidebar-open');
        }
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
// Moved to js/settings.js

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
// Moved to js/settings.js



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
    notif.style.top = `calc(env(safe-area-inset-top, 0px) + ${20 + offset}px)`;
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