// Level Up - Growth Features Module
// Weekly Review, Heatmap, Pomodoro, Records, Routines, Milestones

(function() {
    'use strict';

    // ===== WEEKLY REVIEW SYSTEM =====
    
    /**
     * Check if it's time to show weekly review (Sundays or configurable day)
     */
    function checkWeeklyReview() {
        if (!currentUser || !allUsers[currentUser]) return;
        
        const user = allUsers[currentUser];
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday
        const todayStr = today.toISOString().split('T')[0];
        
        // Show on Sundays (can be configured)
        const reviewDay = user.weeklyReviewDay || 0; // Default Sunday
        
        if (dayOfWeek === reviewDay && user.lastWeeklyReview !== todayStr) {
            showWeeklyReviewModal();
        }
    }
    
    /**
     * Show the weekly review modal
     */
    function showWeeklyReviewModal() {
        const user = allUsers[currentUser];
        const weekStats = getWeekStats();
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'weeklyReviewModal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3 class="modal-title">📊 Weekly Review</h3>
                    <button class="close-modal" onclick="closeWeeklyReview()">&times;</button>
                </div>
                <div class="modal-body">
                    <p style="color: var(--text-secondary); margin-bottom: 24px;">
                        Take a moment to reflect on your week and plan ahead.
                    </p>
                    
                    <div class="weekly-stats">
                        <div class="weekly-stat-card">
                            <div class="stat-value">${weekStats.questsCompleted}</div>
                            <div class="stat-label">Quests Completed</div>
                        </div>
                        <div class="weekly-stat-card">
                            <div class="stat-value">${weekStats.xpEarned}</div>
                            <div class="stat-label">XP Earned</div>
                        </div>
                        <div class="weekly-stat-card">
                            <div class="stat-value">${weekStats.journalEntries}</div>
                            <div class="stat-label">Journal Entries</div>
                        </div>
                        <div class="weekly-stat-card">
                            <div class="stat-value">${weekStats.timerHours}h</div>
                            <div class="stat-label">Deep Work</div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">🏆 What was your biggest win this week?</label>
                        <textarea id="weeklyWin" class="form-input" rows="3" placeholder="Share your proudest achievement..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">🎯 What will you focus on next week?</label>
                        <textarea id="weeklyFocus" class="form-input" rows="3" placeholder="Set your intention for the week ahead..."></textarea>
                    </div>
                    
                    <button class="btn-primary" onclick="saveWeeklyReview()">
                        Complete Review (+50 XP) 🎁
                    </button>
                    <button class="btn-primary small" onclick="closeWeeklyReview()" style="margin-top: 10px; background: transparent; border: 1px solid var(--glass-border);">
                        Skip for now
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    /**
     * Get stats for the past week
     */
    function getWeekStats() {
        const user = allUsers[currentUser];
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        let questsCompleted = 0;
        let xpEarned = 0;
        
        // Count quests completed in the last 7 days
        Object.keys(user.completions).forEach(key => {
            const dateStr = key.split('-').slice(-3).join('-');
            const date = new Date(dateStr);
            if (date >= weekAgo && date <= today) {
                questsCompleted++;
            }
        });
        
        // Count journal entries from last 7 days
        const journalEntries = (user.journal || []).filter(entry => {
            const date = new Date(entry.date);
            return date >= weekAgo && date <= today;
        }).length;
        
        // Calculate timer hours (approximate)
        const timerSeconds = Object.values(user.timerStats || {}).reduce((a, b) => a + b, 0);
        const timerHours = Math.floor(timerSeconds / 3600);
        
        return {
            questsCompleted,
            xpEarned: questsCompleted * 15, // Approximate
            journalEntries,
            timerHours
        };
    }
    
    /**
     * Save weekly review response
     */
    function saveWeeklyReview() {
        const user = allUsers[currentUser];
        const win = document.getElementById('weeklyWin').value;
        const focus = document.getElementById('weeklyFocus').value;
        
        if (!win && !focus) {
            showNotification('Please share at least one reflection!');
            return;
        }
        
        // Save review
        user.weeklyReviews = user.weeklyReviews || [];
        user.weeklyReviews.push({
            date: new Date().toISOString().split('T')[0],
            win,
            focus,
            stats: getWeekStats()
        });
        
        // Keep only last 12 weeks
        if (user.weeklyReviews.length > 12) {
            user.weeklyReviews = user.weeklyReviews.slice(-12);
        }
        
        // Award bonus XP
        user.xp += 50;
        user.totalXPEarned += 50;
        user.lastWeeklyReview = new Date().toISOString().split('T')[0];
        
        saveAllUsers();
        updatePlayerLevel();
        
        showNotification('🎉 Weekly Review Complete! +50 XP');
        closeWeeklyReview();
        
        if (typeof renderAll === 'function') {
            renderAll();
        }
    }
    
    /**
     * Close weekly review modal
     */
    function closeWeeklyReview() {
        const modal = document.getElementById('weeklyReviewModal');
        if (modal) {
            modal.remove();
        }
    }
    
    // ===== PERSONAL RECORDS DASHBOARD =====
    
    /**
     * Get personal records for the user
     */
    function getPersonalRecords() {
        const user = allUsers[currentUser];
        
        // Longest streak
        const longestStreak = calculateLongestStreak();
        
        // Most XP in one day
        let mostXPDay = { date: '', xp: 0 };
        const dailyXP = {};
        Object.keys(user.completions).forEach(key => {
            const dateStr = key.split('-').slice(-3).join('-');
            dailyXP[dateStr] = (dailyXP[dateStr] || 0) + 15; // Approximate
        });
        Object.entries(dailyXP).forEach(([date, xp]) => {
            if (xp > mostXPDay.xp) {
                mostXPDay = { date, xp };
            }
        });
        
        // Most quests in one day
        let mostQuestsDay = { date: '', count: 0 };
        const dailyQuests = {};
        Object.keys(user.completions).forEach(key => {
            const dateStr = key.split('-').slice(-3).join('-');
            dailyQuests[dateStr] = (dailyQuests[dateStr] || 0) + 1;
        });
        Object.entries(dailyQuests).forEach(([date, count]) => {
            if (count > mostQuestsDay.count) {
                mostQuestsDay = { date, count };
            }
        });
        
        // Highest level
        const highestLevel = user.level;
        
        // Total hours by activity
        const activityHours = {};
        Object.entries(user.timerStats || {}).forEach(([activity, seconds]) => {
            activityHours[activity] = Math.floor(seconds / 3600);
        });
        
        return {
            longestStreak,
            mostXPDay,
            mostQuestsDay,
            highestLevel,
            activityHours
        };
    }
    
    /**
     * Render personal records section
     */
    function renderPersonalRecords() {
        const container = document.getElementById('personalRecordsContainer');
        if (!container) return;
        
        const records = getPersonalRecords();
        
        container.innerHTML = `
            <h3 style="margin-bottom: 20px;">🏆 Personal Records</h3>
            <div class="records-grid">
                <div class="record-card glass-card">
                    <div class="record-icon">🔥</div>
                    <div class="record-value">${records.longestStreak}</div>
                    <div class="record-label">Longest Streak</div>
                </div>
                <div class="record-card glass-card">
                    <div class="record-icon">⚡</div>
                    <div class="record-value">${records.mostXPDay.xp}</div>
                    <div class="record-label">Most XP (One Day)</div>
                    <div class="record-date">${records.mostXPDay.date}</div>
                </div>
                <div class="record-card glass-card">
                    <div class="record-icon">📋</div>
                    <div class="record-value">${records.mostQuestsDay.count}</div>
                    <div class="record-label">Most Quests (One Day)</div>
                    <div class="record-date">${records.mostQuestsDay.date}</div>
                </div>
                <div class="record-card glass-card">
                    <div class="record-icon">🎖️</div>
                    <div class="record-value">${records.highestLevel}</div>
                    <div class="record-label">Highest Level</div>
                </div>
            </div>
            <h4 style="margin: 30px 0 15px 0;">⏱️ Time Invested</h4>
            <div class="activity-hours">
                ${Object.entries(records.activityHours).map(([activity, hours]) => `
                    <div class="activity-hour-bar">
                        <span class="activity-name">${activity}</span>
                        <div class="hour-bar-bg">
                            <div class="hour-bar-fill" style="width: ${Math.min(100, (hours / 10) * 100)}%"></div>
                        </div>
                        <span class="hour-value">${hours}h</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // ===== EXPORTS =====
    
    window.LevelUp = window.LevelUp || {};
    window.LevelUp.growth = {
        checkWeeklyReview,
        showWeeklyReviewModal,
        saveWeeklyReview,
        closeWeeklyReview,
        getPersonalRecords,
        renderPersonalRecords
    };
    
    // Backward compatibility
    window.checkWeeklyReview = checkWeeklyReview;
    window.showWeeklyReviewModal = showWeeklyReviewModal;
    window.saveWeeklyReview = saveWeeklyReview;
    window.closeWeeklyReview = closeWeeklyReview;
    window.renderPersonalRecords = renderPersonalRecords;

})();
