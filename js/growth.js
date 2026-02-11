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
    
    // ===== HABIT HEATMAP =====
    
    /**
     * Generate habit heatmap data for the last 90 days
     */
    function getHeatmapData() {
        const user = allUsers[currentUser];
        const today = new Date();
        const data = [];
        
        for (let i = 89; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            // Count quests completed on this day
            const completionsOnDay = Object.keys(user.completions || {}).filter(key => 
                key.includes(dateStr)
            ).length;
            
            // Calculate completion rate (assuming ~7 quests available)
            const totalQuests = (user.quests || []).filter(q => {
                const freq = q.frequency || 'daily';
                if (freq === 'daily') return true;
                if (freq === 'weekly') {
                    // Check if this date is within a weekly period
                    const daysDiff = Math.floor((today - date) / (1000 * 60 * 60 * 24));
                    return daysDiff % 7 < 7;
                }
                return false;
            }).length;
            
            const rate = totalQuests > 0 ? Math.round((completionsOnDay / Math.max(totalQuests, 1)) * 100) : 0;
            
            data.push({
                date: dateStr,
                count: completionsOnDay,
                rate,
                day: date.getDay()
            });
        }
        
        return data;
    }
    
    /**
     * Render habit heatmap
     */
    function renderHabitHeatmap() {
        const container = document.getElementById('habitHeatmapContainer');
        if (!container) return;
        
        const data = getHeatmapData();
        
        // Group by weeks
        const weeks = [];
        let currentWeek = [];
        
        // Pad start to align with day of week
        const firstDay = data[0].day;
        for (let i = 0; i < firstDay; i++) {
            currentWeek.push(null);
        }
        
        data.forEach(day => {
            currentWeek.push(day);
            if (day.day === 6) { // Saturday
                weeks.push([...currentWeek]);
                currentWeek = [];
            }
        });
        
        if (currentWeek.length > 0) {
            weeks.push([...currentWeek]);
        }
        
        const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        container.innerHTML = `
            <h3 style="margin-bottom: 16px;">📅 Habit Heatmap (Last 90 Days)</h3>
            <p style="color: var(--text-secondary); margin-bottom: 20px; font-size: 0.9rem;">
                Track your consistency over time. Darker colors = more quests completed.
            </p>
            <div class="heatmap-wrapper">
                <div class="heatmap-days">
                    ${dayLabels.map(day => `<div class="heatmap-day-label">${day}</div>`).join('')}
                </div>
                <div class="heatmap-grid-wrapper">
                    ${weeks.map(week => `
                        <div class="heatmap-week">
                            ${week.map(day => {
                                if (!day) return '<div class="heatmap-cell empty"></div>';
                                
                                let intensity = 0;
                                if (day.rate === 0) intensity = 0;
                                else if (day.rate <= 25) intensity = 1;
                                else if (day.rate <= 50) intensity = 2;
                                else if (day.rate <= 75) intensity = 3;
                                else intensity = 4;
                                
                                return `<div class="heatmap-cell intensity-${intensity}" 
                                    data-date="${day.date}" 
                                    data-count="${day.count}" 
                                    data-rate="${day.rate}"
                                    title="${day.date}: ${day.count} quests (${day.rate}%)"></div>`;
                            }).join('')}
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="heatmap-legend">
                <span style="color: var(--text-secondary); font-size: 0.85rem; margin-right: 12px;">Less</span>
                <div class="heatmap-cell intensity-0"></div>
                <div class="heatmap-cell intensity-1"></div>
                <div class="heatmap-cell intensity-2"></div>
                <div class="heatmap-cell intensity-3"></div>
                <div class="heatmap-cell intensity-4"></div>
                <span style="color: var(--text-secondary); font-size: 0.85rem; margin-left: 12px;">More</span>
            </div>
        `;
    }
    
    // ===== POMODORO TIMER =====
    
    /**
     * Initialize Pomodoro settings
     */
    function initPomodoroSettings() {
        const user = allUsers[currentUser];
        if (!user.pomodoroSettings) {
            user.pomodoroSettings = {
                enabled: false,
                workDuration: 25, // minutes
                breakDuration: 5, // minutes
                sessionsTarget: 4,
                currentSession: 0,
                doNotDisturb: false
            };
            if (typeof saveAllUsers === 'function') {
                saveAllUsers();
            }
        }
    }
    
    /**
     * Render Pomodoro controls in timer tab
     */
    function renderPomodoroControls() {
        const container = document.getElementById('pomodoroControlsContainer');
        if (!container) return;
        
        initPomodoroSettings();
        const user = allUsers[currentUser];
        const settings = user.pomodoroSettings;
        
        container.innerHTML = `
            <div class="pomodoro-section glass-card" style="margin-top: 24px;">
                <h3 style="margin-bottom: 16px;">🍅 Pomodoro Mode</h3>
                <p style="color: var(--text-secondary); margin-bottom: 20px; font-size: 0.9rem;">
                    Work in focused intervals with scheduled breaks
                </p>
                
                <div class="pomodoro-toggle">
                    <label class="toggle-switch">
                        <input type="checkbox" id="pomodoroEnabled" ${settings.enabled ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </label>
                    <span style="margin-left: 12px; color: var(--text-primary);">Enable Pomodoro Mode</span>
                </div>
                
                <div id="pomodoroSettings" style="margin-top: 20px; ${settings.enabled ? '' : 'display: none;'}">
                    <div class="form-group">
                        <label class="form-label">Work Duration (minutes)</label>
                        <input type="number" id="workDuration" class="form-input" value="${settings.workDuration}" min="1" max="60">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Break Duration (minutes)</label>
                        <input type="number" id="breakDuration" class="form-input" value="${settings.breakDuration}" min="1" max="30">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Sessions Target</label>
                        <input type="number" id="sessionsTarget" class="form-input" value="${settings.sessionsTarget}" min="1" max="10">
                    </div>
                    <button class="btn-primary small" onclick="savePomodoroSettings()">Save Settings</button>
                    
                    <div class="pomodoro-status" style="margin-top: 24px;">
                        <div class="session-counter">
                            <span style="font-size: 1.2rem; font-weight: 600;">Session ${settings.currentSession} of ${settings.sessionsTarget}</span>
                        </div>
                        <div class="dnd-indicator" style="margin-top: 12px;">
                            ${settings.doNotDisturb ? '🔕 Do Not Disturb Active' : '🔔 Notifications Enabled'}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Setup event listeners
        const pomodoroToggle = document.getElementById('pomodoroEnabled');
        if (pomodoroToggle) {
            pomodoroToggle.addEventListener('change', (e) => {
                const settingsDiv = document.getElementById('pomodoroSettings');
                if (settingsDiv) {
                    settingsDiv.style.display = e.target.checked ? '' : 'none';
                }
                user.pomodoroSettings.enabled = e.target.checked;
                if (typeof saveAllUsers === 'function') {
                    saveAllUsers();
                }
            });
        }
    }
    
    /**
     * Save Pomodoro settings
     */
    function savePomodoroSettings() {
        const user = allUsers[currentUser];
        
        user.pomodoroSettings.workDuration = parseInt(document.getElementById('workDuration').value) || 25;
        user.pomodoroSettings.breakDuration = parseInt(document.getElementById('breakDuration').value) || 5;
        user.pomodoroSettings.sessionsTarget = parseInt(document.getElementById('sessionsTarget').value) || 4;
        
        if (typeof saveAllUsers === 'function') {
            saveAllUsers();
        }
        if (typeof showNotification === 'function') {
            showNotification('✅ Pomodoro settings saved!');
        }
    }
    
    // ===== MORNING & NIGHT ROUTINES =====
    
    /**
     * Initialize routine data
     */
    function initRoutines() {
        const user = allUsers[currentUser];
        if (!user.routines) {
            user.routines = {
                morning: [
                    { id: 'mr1', text: 'Make bed', completed: false },
                    { id: 'mr2', text: 'Drink water', completed: false },
                    { id: 'mr3', text: 'Review daily goals', completed: false }
                ],
                night: [
                    { id: 'nr1', text: 'Plan tomorrow', completed: false },
                    { id: 'nr2', text: 'Write gratitude', completed: false },
                    { id: 'nr3', text: 'Screen off by 11 PM', completed: false }
                ],
                lastReset: new Date().toISOString().split('T')[0]
            };
            if (typeof saveAllUsers === 'function') {
                saveAllUsers();
            }
        }
        
        // Reset routines daily
        const today = new Date().toISOString().split('T')[0];
        if (user.routines.lastReset !== today) {
            user.routines.morning.forEach(item => item.completed = false);
            user.routines.night.forEach(item => item.completed = false);
            user.routines.lastReset = today;
            if (typeof saveAllUsers === 'function') {
                saveAllUsers();
            }
        }
    }
    
    /**
     * Render routines widget on dashboard
     */
    function renderRoutinesWidget() {
        const container = document.getElementById('routinesWidgetContainer');
        if (!container) return;
        
        initRoutines();
        const user = allUsers[currentUser];
        const routines = user.routines;
        
        const morningComplete = routines.morning.every(i => i.completed);
        const nightComplete = routines.night.every(i => i.completed);
        
        container.innerHTML = `
            <div class="routines-widget glass-card">
                <h3 style="margin-bottom: 16px;">🌅 Daily Routines</h3>
                
                <div class="routine-section">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <h4 style="margin: 0;">Morning Routine</h4>
                        ${morningComplete ? '<span style="color: var(--success);">✅ Complete (+10 XP)</span>' : ''}
                    </div>
                    <div class="routine-checklist">
                        ${routines.morning.map(item => `
                            <div class="routine-item ${item.completed ? 'completed' : ''}" onclick="toggleRoutineItem('morning', '${item.id}')">
                                <div class="routine-checkbox"></div>
                                <div class="routine-label">${item.text}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="routine-section" style="margin-top: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <h4 style="margin: 0;">Night Routine</h4>
                        ${nightComplete ? '<span style="color: var(--success);">✅ Complete (+10 XP)</span>' : ''}
                    </div>
                    <div class="routine-checklist">
                        ${routines.night.map(item => `
                            <div class="routine-item ${item.completed ? 'completed' : ''}" onclick="toggleRoutineItem('night', '${item.id}')">
                                <div class="routine-checkbox"></div>
                                <div class="routine-label">${item.text}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Toggle routine item completion
     */
    function toggleRoutineItem(type, itemId) {
        const user = allUsers[currentUser];
        const routine = user.routines[type];
        const item = routine.find(i => i.id === itemId);
        
        if (!item) return;
        
        const wasCompleted = item.completed;
        item.completed = !item.completed;
        
        // Check if routine just became complete
        const allComplete = routine.every(i => i.completed);
        if (allComplete && !wasCompleted) {
            // Award bonus XP
            user.xp += 10;
            user.totalXPEarned += 10;
            if (typeof updatePlayerLevel === 'function') {
                updatePlayerLevel();
            }
            if (typeof showNotification === 'function') {
                showNotification(`🎉 ${type === 'morning' ? 'Morning' : 'Night'} Routine Complete! +10 XP`);
            }
        }
        
        if (typeof saveAllUsers === 'function') {
            saveAllUsers();
        }
        
        renderRoutinesWidget();
    }
    
    // ===== GOAL MILESTONES =====
    
    /**
     * Initialize milestones
     */
    function initMilestones() {
        const user = allUsers[currentUser];
        if (!user.milestones) {
            user.milestones = [
                { id: 'm1', title: 'Read 12 Books', icon: '📚', current: 0, target: 12, category: 'Learning' },
                { id: 'm2', title: 'Exercise 100 Days', icon: '💪', current: 0, target: 100, category: 'Fitness' },
                { id: 'm3', title: 'Meditate 30 Days', icon: '🧘', current: 0, target: 30, category: 'Mindfulness' },
                { id: 'm4', title: 'Reach Level 20', icon: '⭐', current: user.level || 1, target: 20, category: 'Progress' }
            ];
            if (typeof saveAllUsers === 'function') {
                saveAllUsers();
            }
        }
        
        // Auto-update level milestone
        const levelMilestone = user.milestones.find(m => m.id === 'm4');
        if (levelMilestone) {
            levelMilestone.current = user.level || 1;
        }
    }
    
    /**
     * Render milestones
     */
    function renderMilestones() {
        const container = document.getElementById('milestonesContainer');
        if (!container) return;
        
        initMilestones();
        const user = allUsers[currentUser];
        
        container.innerHTML = `
            <h3 style="margin-bottom: 20px;">🎯 Goal Milestones</h3>
            <p style="color: var(--text-secondary); margin-bottom: 24px; font-size: 0.9rem;">
                Track your long-term goals and celebrate progress
            </p>
            
            <div class="milestone-grid">
                ${user.milestones.map(milestone => {
                    const progress = Math.min(100, Math.round((milestone.current / milestone.target) * 100));
                    const isComplete = milestone.current >= milestone.target;
                    
                    return `
                        <div class="milestone-card ${isComplete ? 'milestone-complete' : ''}">
                            <div class="milestone-header">
                                <div class="milestone-icon">${milestone.icon}</div>
                                <div>
                                    <div class="milestone-title">${milestone.title}</div>
                                    <div style="font-size: 0.85rem; color: var(--text-muted);">${milestone.category}</div>
                                </div>
                            </div>
                            <div class="milestone-progress">
                                <div class="milestone-progress-bar">
                                    <div class="milestone-progress-fill" style="width: ${progress}%"></div>
                                </div>
                            </div>
                            <div class="milestone-stats">
                                <span class="milestone-current">${milestone.current}</span>
                                <span style="color: var(--text-muted);"> / ${milestone.target}</span>
                                <span style="margin-left: auto; font-weight: 600; color: var(--primary);">${progress}%</span>
                            </div>
                            ${!isComplete ? `
                                <button class="btn-primary small" onclick="updateMilestone('${milestone.id}')" style="margin-top: 12px; width: 100%;">
                                    Update Progress
                                </button>
                            ` : '<div style="margin-top: 12px; text-align: center; color: var(--success); font-weight: 600;">🎉 Completed!</div>'}
                        </div>
                    `;
                }).join('')}
            </div>
            
            <button class="btn-primary" onclick="showAddMilestoneModal()" style="margin-top: 20px;">
                + Add New Milestone
            </button>
        `;
    }
    
    /**
     * Update milestone progress
     */
    function updateMilestone(milestoneId) {
        const user = allUsers[currentUser];
        const milestone = user.milestones.find(m => m.id === milestoneId);
        
        if (!milestone) return;
        
        const newValue = prompt(`Update progress for "${milestone.title}"\nCurrent: ${milestone.current} / ${milestone.target}`, milestone.current);
        
        if (newValue === null) return;
        
        const oldValue = milestone.current;
        milestone.current = Math.min(milestone.target, Math.max(0, parseInt(newValue) || 0));
        
        // Check if milestone was just completed
        if (milestone.current >= milestone.target && oldValue < milestone.target) {
            if (typeof showNotification === 'function') {
                showNotification(`🎉 Milestone Achieved: ${milestone.title}!`);
            }
            if (typeof createConfetti === 'function') {
                createConfetti(window.innerWidth / 2, window.innerHeight / 2);
            }
        }
        
        if (typeof saveAllUsers === 'function') {
            saveAllUsers();
        }
        
        renderMilestones();
    }
    
    /**
     * Show add milestone modal
     */
    function showAddMilestoneModal() {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'addMilestoneModal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">🎯 Add New Milestone</h3>
                    <button class="close-modal" onclick="closeAddMilestoneModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Title</label>
                        <input type="text" id="milestoneTitle" class="form-input" placeholder="e.g., Run 50 km">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Icon (Emoji)</label>
                        <input type="text" id="milestoneIcon" class="form-input" placeholder="🏃" maxlength="2">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Category</label>
                        <select id="milestoneCategory" class="form-input">
                            <option value="Fitness">Fitness</option>
                            <option value="Learning">Learning</option>
                            <option value="Mindfulness">Mindfulness</option>
                            <option value="Progress">Progress</option>
                            <option value="Custom">Custom</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Target Value</label>
                        <input type="number" id="milestoneTarget" class="form-input" placeholder="100" min="1">
                    </div>
                    <button class="btn-primary" onclick="addMilestone()">Add Milestone</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    /**
     * Close add milestone modal
     */
    function closeAddMilestoneModal() {
        const modal = document.getElementById('addMilestoneModal');
        if (modal) modal.remove();
    }
    
    /**
     * Add new milestone
     */
    function addMilestone() {
        const user = allUsers[currentUser];
        
        const title = document.getElementById('milestoneTitle').value;
        const icon = document.getElementById('milestoneIcon').value || '🎯';
        const category = document.getElementById('milestoneCategory').value;
        const target = parseInt(document.getElementById('milestoneTarget').value);
        
        if (!title || !target) {
            if (typeof showNotification === 'function') {
                showNotification('Please fill in all fields');
            }
            return;
        }
        
        user.milestones.push({
            id: 'm' + Date.now(),
            title,
            icon,
            current: 0,
            target,
            category
        });
        
        if (typeof saveAllUsers === 'function') {
            saveAllUsers();
        }
        
        closeAddMilestoneModal();
        renderMilestones();
        
        if (typeof showNotification === 'function') {
            showNotification('✅ Milestone added!');
        }
    }
    
    // ===== EXPORTS =====
    
    window.LevelUp = window.LevelUp || {};
    window.LevelUp.growth = {
        checkWeeklyReview,
        showWeeklyReviewModal,
        saveWeeklyReview,
        closeWeeklyReview,
        getPersonalRecords,
        renderPersonalRecords,
        renderHabitHeatmap,
        renderPomodoroControls,
        savePomodoroSettings,
        renderRoutinesWidget,
        toggleRoutineItem,
        renderMilestones,
        updateMilestone,
        showAddMilestoneModal,
        closeAddMilestoneModal,
        addMilestone
    };
    
    // Backward compatibility
    window.checkWeeklyReview = checkWeeklyReview;
    window.showWeeklyReviewModal = showWeeklyReviewModal;
    window.saveWeeklyReview = saveWeeklyReview;
    window.closeWeeklyReview = closeWeeklyReview;
    window.renderPersonalRecords = renderPersonalRecords;
    window.renderHabitHeatmap = renderHabitHeatmap;
    window.renderPomodoroControls = renderPomodoroControls;
    window.savePomodoroSettings = savePomodoroSettings;
    window.renderRoutinesWidget = renderRoutinesWidget;
    window.toggleRoutineItem = toggleRoutineItem;
    window.renderMilestones = renderMilestones;
    window.updateMilestone = updateMilestone;
    window.showAddMilestoneModal = showAddMilestoneModal;
    window.closeAddMilestoneModal = closeAddMilestoneModal;
    window.addMilestone = addMilestone;

})();
