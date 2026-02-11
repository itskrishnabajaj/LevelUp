// ===== DASHBOARD RENDERING & DISPLAY =====
// Contains all dashboard rendering functions, stats display, and user profile updates

(function() {
    'use strict';
    
    // Initialize window.LevelUp namespace if not exists
    window.LevelUp = window.LevelUp || {};
    
    // ===== USER PROFILE =====
    
    /**
     * Updates the user profile display (avatar, name, title, class)
     */
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
    
    // ===== STATS DISPLAY =====
    
    /**
     * Updates the stats overview display with all player stats
     * Shows strength, discipline, focus, vitality, and wisdom
     */
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
    
    // ===== WELCOME MESSAGE =====
    
    /**
     * Updates the welcome message based on time of day and streak
     */
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
    
    // ===== CONSISTENCY STATS =====
    
    /**
     * Renders the consistency stats section (streak, multiplier, today's quests, best streak)
     */
    function renderConsistencyStats() {
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
    
    // ===== BEHAVIOR FEEDBACK =====
    
    /**
     * Renders behavior feedback cards based on user patterns
     */
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
    
    /**
     * Analyzes user patterns and returns feedback messages
     * @returns {Object} { positive: [], warning: [], neutral: [] }
     */
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
    
    /**
     * Dismisses a feedback card
     * @param {string} type - The feedback type to dismiss
     */
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
    
    /**
     * Renders the progress insights section (today's progress, weekly momentum, leading stat)
     */
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
    
    // ===== MOMENTUM SCORE =====
    
    /**
     * Calculates the momentum score based on completion rate, streak, journal, and timer usage
     * @returns {number} Momentum score (0-100)
     * 
     * Weights: completion (40%) is the primary driver of habit formation,
     * streak (30%) rewards consistency, journal (15%) encourages reflection,
     * timer (15%) rewards focused deep work sessions.
     */
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
    
    /**
     * Renders the momentum score block on the dashboard
     */
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
    
    // ===== DAILY QUOTE =====
    
    /**
     * Fetches and displays the daily quote from ZenQuotes API
     */
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
    
    /**
     * Displays a quote on the dashboard
     * @param {Object} quote - Quote object with text and author
     */
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
    
    // Alias for fetchDailyQuote (for compatibility)
    function updateDailyQuote() {
        return fetchDailyQuote();
    }
    
    // ===== EXPORTS =====
    
    // Export to window.LevelUp.dashboard namespace
    window.LevelUp.dashboard = {
        updateUserProfile,
        updateStats,
        updateWelcomeMessage,
        renderConsistencyStats,
        renderBehaviorFeedback,
        analyzePatterns,
        dismissFeedback,
        renderProgressInsights,
        calculateMomentumScore,
        renderMomentumScore,
        fetchDailyQuote,
        displayQuote,
        updateDailyQuote
    };
    
    // Also export directly to window for backward compatibility
    window.updateUserProfile = updateUserProfile;
    window.updateStats = updateStats;
    window.updateWelcomeMessage = updateWelcomeMessage;
    window.renderConsistencyStats = renderConsistencyStats;
    window.updateConsistencyStats = renderConsistencyStats; // Alias for backward compatibility
    window.renderBehaviorFeedback = renderBehaviorFeedback;
    window.analyzePatterns = analyzePatterns;
    window.dismissFeedback = dismissFeedback;
    window.renderProgressInsights = renderProgressInsights;
    window.calculateMomentumScore = calculateMomentumScore;
    window.renderMomentumScore = renderMomentumScore;
    window.fetchDailyQuote = fetchDailyQuote;
    window.displayQuote = displayQuote;
    window.updateDailyQuote = updateDailyQuote;
    
})();
