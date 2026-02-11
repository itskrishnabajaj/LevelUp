// Level Up - Configuration & Constants
// Contains Firebase config, constants, and default data

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDYBjb_AQO7bGYaO_tPvdWxLQ_cFPwxjIk",
    authDomain: "levelup-26722.firebaseapp.com",
    databaseURL: "https://levelup-26722-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "levelup-26722",
    storageBucket: "levelup-26722.firebasestorage.app",
    messagingSenderId: "427149702123",
    appId: "1:427149702123:web:6687bbd37a8ef1a1d41fae",
    measurementId: "G-3H3F0L8ZKY"
};

// Frequency Labels
const FREQUENCY_LABELS = { 
    daily: '📅 Daily', 
    weekly: '📆 Weekly', 
    biweekly: '🗓️ Biweekly', 
    monthly: '📋 Monthly', 
    custom: '🔧 Custom' 
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Default Quests
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

// Achievements Data
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

// Activity Types
const ACTIVITY_TYPES = [
    { id: 'study', name: '📚 MBA Study', xpPerMin: 2.5, interval: 120, stat: 'wisdom' },
    { id: 'exercise', name: '💪 Exercise', xpPerMin: 3, interval: 60, stat: 'strength' },
    { id: 'meditation', name: '🧘 Meditation', xpPerMin: 3, interval: 60, stat: 'focus' },
    { id: 'speaking', name: '🗣️ Speech Practice', xpPerMin: 3, interval: 60, stat: 'discipline' }
];

// Class Options
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

// Moods
const MOODS = [
    { id: 'great', emoji: '🔥', label: 'Great' },
    { id: 'good', emoji: '😊', label: 'Good' },
    { id: 'okay', emoji: '😐', label: 'Okay' },
    { id: 'low', emoji: '😔', label: 'Low Energy' },
    { id: 'struggling', emoji: '😞', label: 'Struggling' }
];
