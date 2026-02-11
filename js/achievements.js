// Level Up - Achievements Module
// Handles achievement checking, rendering, and display

(function() {
    'use strict';

    // Initialize window.LevelUp namespace if not exists
    window.LevelUp = window.LevelUp || {};

    // ===== ACHIEVEMENT CHECKING =====
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
            all_stats_50: user.stats ? Object.values(user.stats).every(v => v >= 50) : false,
            all_stats_100: user.stats ? Object.values(user.stats).every(v => v >= 100) : false
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

    // ===== ACHIEVEMENT RENDERING =====
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

    // ===== ACHIEVEMENT DETAIL MODAL =====
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

    // ===== EXPORTS =====
    // Export to window.LevelUp namespace
    window.LevelUp.achievements = {
        checkAchievements,
        renderAchievements,
        showAchievementDetail
    };

    // Also export directly to window for backward compatibility
    window.checkAchievements = checkAchievements;
    window.renderAchievements = renderAchievements;
    window.showAchievementDetail = showAchievementDetail;

})();
