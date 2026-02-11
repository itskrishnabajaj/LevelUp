// ===== TIMER AND ACTIVITY TRACKING =====
// Timer system for activity tracking with XP and stat rewards

(function() {
    'use strict';
    
    // Initialize window.LevelUp namespace if not exists
    window.LevelUp = window.LevelUp || {};
    
    // ===== ACTIVITY GRID =====
    
    /**
     * Renders the activity grid UI with all available activities
     * Displays activity options from config and binds click handlers
     */
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
    
    /**
     * Selects an activity for the timer
     * Updates UI to show selected activity
     * @param {string} id - Activity ID from ACTIVITY_TYPES
     * @param {string} name - Display name of the activity
     */
    function selectActivity(id, name) {
        selectedActivity = id;
        selectedActivityName = name;
        
        document.querySelectorAll('.activity-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        document.querySelector(`[data-activity="${id}"]`)?.classList.add('selected');
        const timerActivityEl = document.getElementById('timerActivity');
        if (timerActivityEl) timerActivityEl.textContent = name;
    }
    
    // ===== TIMER CONTROLS =====
    
    /**
     * Starts the activity timer
     * Validates activity selection, initializes interval
     * Awards XP and stats at configured intervals based on activity type
     */
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
        if (!activityData) return;
        
        saveAllUsers();
        
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
                saveAllUsers();
            }
        }, 1000);
    }
    
    /**
     * Pauses the timer without resetting elapsed time
     * Saves current state to localStorage
     */
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
    
    /**
     * Stops the timer and resets state
     * Records total session time to user stats
     * Checks for achievements after completion
     */
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
    
    /**
     * Updates the timer display with current elapsed time
     * Formats as HH:MM:SS
     */
    function updateTimerDisplay() {
        const user = allUsers[currentUser];
        const hours = Math.floor(user.timerState.elapsed / 3600);
        const minutes = Math.floor((user.timerState.elapsed % 3600) / 60);
        const seconds = user.timerState.elapsed % 60;
        
        const display = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
        document.getElementById('timerClock').textContent = display;
    }
    
    // ===== STATE RESTORATION =====
    
    /**
     * Restores timer state on app load
     * Resumes running timer or restores paused state
     * Handles both running and paused timer states from localStorage
     */
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
            if (!activityData) return;
            
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
    
    // ===== EXPORTS =====
    
    // Export to window.LevelUp.timer namespace
    window.LevelUp.timer = {
        renderActivityGrid,
        selectActivity,
        startTimer,
        pauseTimer,
        stopTimer,
        updateTimerDisplay,
        restoreTimerState
    };
    
    // Also export directly to window for backward compatibility
    window.renderActivityGrid = renderActivityGrid;
    window.selectActivity = selectActivity;
    window.startTimer = startTimer;
    window.pauseTimer = pauseTimer;
    window.stopTimer = stopTimer;
    window.updateTimerDisplay = updateTimerDisplay;
    window.restoreTimerState = restoreTimerState;
})();
