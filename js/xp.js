// ===== XP, LEVELING, AND STREAK CALCULATIONS =====
// Contains all XP calculation, level progression, and streak tracking logic

(function() {
    'use strict';
    
    // Initialize window.LevelUp namespace if not exists
    window.LevelUp = window.LevelUp || {};
    
    // ===== LEVEL PROGRESSION =====
    
    /**
     * Updates the player's level display and checks for level up
     * Calculates XP progress and updates UI elements
     */
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
    
    /**
     * Handles level up logic: increment level, reset XP, boost stats
     * Applies class bonuses to stat increases
     */
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
    
    /**
     * Get the stat cap based on whether user has a class selected
     * @returns {number} 1000 if class selected, 100 otherwise
     */
    function getStatCap() {
        const user = allUsers[currentUser];
        return user.selectedClass ? 1000 : 100;
    }
    
    // ===== XP CALCULATIONS =====
    
    /**
     * Calculate total XP for completing a quest with all bonuses
     * @param {Object} quest - The quest object
     * @param {boolean} isFirst - Whether this is the first quest of the day
     * @returns {Object} { totalXP, baseXP }
     * 
     * Bonuses applied:
     * - First quest of day: +50% of base XP
     * - Streak multipliers: 10%-75% based on current streak
     * - Comeback bonus: +15 XP if yesterday was missed and this is first quest
     */
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
    
    /**
     * Get XP multiplier based on current streak
     * @param {number} streak - Current streak count
     * @returns {number} Multiplier (0.10 to 0.75)
     * 
     * Streak tiers:
     * - 30+ days: 75% bonus
     * - 14+ days: 50% bonus
     * - 7+ days: 25% bonus
     * - 3+ days: 10% bonus
     * - < 3 days: no bonus
     */
    function getStreakMultiplier(streak) {
        if (streak >= 30) return 0.75;
        if (streak >= 14) return 0.50;
        if (streak >= 7) return 0.25;
        if (streak >= 3) return 0.10;
        return 0;
    }
    
    // ===== STREAK CALCULATIONS =====
    
    /**
     * Calculate the current streak (consecutive days with at least one quest completed)
     * @returns {number} Current streak count
     */
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
    
    /**
     * Calculate streak for a specific quest (consecutive days that quest was completed)
     * @param {string} questId - The quest ID
     * @returns {number} Quest-specific streak count
     */
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
    
    /**
     * Calculate the longest streak ever achieved by the user
     * @returns {number} Longest streak count
     */
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
    
    // ===== HELPER FUNCTIONS =====
    
    /**
     * Get the count of quests completed today
     * @returns {number} Number of quests completed today
     */
    function getTodayQuestCount() {
        const user = allUsers[currentUser];
        const today = new Date().toISOString().split('T')[0];
        return Object.keys(user.completions).filter(k => k.includes(today)).length;
    }
    
    /**
     * Check if yesterday had no quest completions
     * @returns {boolean} True if yesterday was missed
     */
    function wasYesterdayMissed() {
        const user = allUsers[currentUser];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        return Object.keys(user.completions).filter(k => k.includes(yesterdayStr)).length === 0;
    }
    
    // ===== EXPORTS =====
    
    // Export to window.LevelUp.xp namespace
    window.LevelUp.xp = {
        updatePlayerLevel,
        levelUp,
        getStatCap,
        calculateQuestXP,
        getStreakMultiplier,
        calculateCurrentStreak,
        calculateQuestStreak,
        calculateLongestStreak,
        getTodayQuestCount,
        wasYesterdayMissed
    };
    
    // Also export directly to window for backward compatibility
    window.updatePlayerLevel = updatePlayerLevel;
    window.levelUp = levelUp;
    window.getStatCap = getStatCap;
    window.calculateQuestXP = calculateQuestXP;
    window.getStreakMultiplier = getStreakMultiplier;
    window.calculateCurrentStreak = calculateCurrentStreak;
    window.calculateQuestStreak = calculateQuestStreak;
    window.calculateLongestStreak = calculateLongestStreak;
    window.getTodayQuestCount = getTodayQuestCount;
    window.wasYesterdayMissed = wasYesterdayMissed;
    
})();
