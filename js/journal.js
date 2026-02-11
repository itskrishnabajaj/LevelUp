// Level Up - Journal System
// Handles mood tracking, journal entries, and journal history

(function() {
    'use strict';

    // ===== JOURNAL FUNCTIONS =====
    
    /**
     * Renders the mood selector interface with all available moods
     */
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

    /**
     * Handles mood selection
     * @param {string} moodId - The ID of the selected mood
     * @param {HTMLElement} element - The clicked mood element
     */
    function selectMood(moodId, element) {
        selectedMood = moodId;
        document.querySelectorAll('.mood-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        element.classList.add('selected');
    }

    /**
     * Saves a journal entry with mood and reflections
     * Awards +5 XP and maintains a limit of 30 entries
     */
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
        
        // Maintain limit of 30 journal entries
        if (user.journal.length > 30) {
            user.journal = user.journal.slice(0, 30);
        }
        
        // Award XP for self-awareness
        user.xp += 5;
        user.totalXPEarned += 5;
        saveAllUsers();
        updatePlayerLevel();
        
        showNotification('✅ Journal entry saved! +5 XP for self-awareness');
        
        // Clear form
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

    /**
     * Renders the journal history with all past entries
     */
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

    // ===== EXPORTS =====
    
    // Export to window.LevelUp namespace
    window.LevelUp = window.LevelUp || {};
    window.LevelUp.journal = {
        renderMoodSelector,
        selectMood,
        saveJournal,
        renderJournalHistory
    };

    // Export to window for compatibility
    window.renderMoodSelector = renderMoodSelector;
    window.selectMood = selectMood;
    window.saveJournal = saveJournal;
    window.renderJournalHistory = renderJournalHistory;

})();
