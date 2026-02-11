// ===== QUEST SYSTEM =====
// Quest creation, rendering, completion, and management

(function() {
    'use strict';
    
    // Initialize window.LevelUp namespace if not exists
    window.LevelUp = window.LevelUp || {};
    
    // ===== QUEST COMPLETION CHECKING =====
    
    /**
     * Check if a quest has been completed for the current period based on frequency
     * @param {string} questId - The quest ID
     * @param {string} frequency - Quest frequency (daily, weekly, biweekly, monthly, custom)
     * @param {Object} quest - Quest object (needed for custom days)
     * @returns {boolean} True if quest is completed for the period
     */
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
    
    // ===== QUEST RENDERING =====
    
    /**
     * Render all quests grouped by category
     * Categories can be reordered, collapsed/expanded
     */
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
    
    /**
     * Move a category up or down in the display order
     * @param {string} catKey - Category key
     * @param {string} direction - 'up' or 'down'
     */
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
    
    /**
     * Render a single quest card with progress, streak, and completion button
     * @param {Object} quest - Quest object
     * @returns {HTMLElement} Quest card element
     */
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
    
    // ===== QUEST COMPLETION =====
    
    /**
     * Complete a quest: award XP, update stats, check achievements and perfect day
     * @param {string} questId - The quest ID
     */
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
    
    // ===== PERFECT DAY SYSTEM =====
    
    /**
     * Check if all essential quests have been completed today
     * @returns {boolean} True if all essential quests are done
     */
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
    
    /**
     * Award bonus XP for completing all essential quests in a day
     */
    function awardPerfectDayBonus() {
        const user = allUsers[currentUser];
        user.xp += 20;
        user.totalXPEarned += 20;
        saveAllUsers();
        updatePlayerLevel();
        showNotification('🌟 PERFECT ESSENTIAL DAY! +20 XP Bonus');
    }
    
    // ===== QUEST CREATION & EDITING =====
    
    /**
     * Set the quest modal to edit or create mode
     * @param {boolean} isEdit - True for edit mode, false for create mode
     */
    function setQuestModalMode(isEdit) {
        const modalTitle = document.querySelector('#addQuestModal .modal-title');
        const submitBtn = document.querySelector('#questForm button[type="submit"]');
        if (modalTitle) modalTitle.textContent = isEdit ? 'Edit Quest' : 'Create New Quest';
        if (submitBtn) submitBtn.textContent = isEdit ? 'Save Quest' : 'Create Quest';
    }
    
    /**
     * Setup the quest form with frequency selector and custom days
     * Also setup form submission handler
     */
    function setupQuestForm() {
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
    
    /**
     * Open the quest form in edit mode with quest data pre-filled
     * @param {string} questId - The quest ID to edit
     */
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
    
    /**
     * Delete a quest after confirmation
     * @param {string} questId - The quest ID to delete
     */
    function deleteQuest(questId) {
        if (confirm('Are you sure you want to delete this quest?')) {
            const user = allUsers[currentUser];
            user.quests = user.quests.filter(q => q.id !== questId);
            saveAllUsers();
            renderQuests();
            showNotification('🗑️ Quest Deleted');
        }
    }
    
    /**
     * Setup all forms in the app (for backward compatibility - calls setupQuestForm)
     */
    function setupForms() {
        setupQuestForm();
    }
    
    // ===== EXPORTS =====
    
    // Export to window.LevelUp.quests namespace
    window.LevelUp.quests = {
        isQuestCompletedForPeriod,
        renderQuests,
        renderQuestCard,
        moveCategoryOrder,
        completeQuest,
        checkPerfectEssentialDay,
        awardPerfectDayBonus,
        setQuestModalMode,
        setupQuestForm,
        setupForms,
        editQuest,
        deleteQuest
    };
    
    // Also export directly to window for backward compatibility
    window.isQuestCompletedForPeriod = isQuestCompletedForPeriod;
    window.renderQuests = renderQuests;
    window.renderQuestCard = renderQuestCard;
    window.moveCategoryOrder = moveCategoryOrder;
    window.completeQuest = completeQuest;
    window.checkPerfectEssentialDay = checkPerfectEssentialDay;
    window.awardPerfectDayBonus = awardPerfectDayBonus;
    window.setQuestModalMode = setQuestModalMode;
    window.setupQuestForm = setupQuestForm;
    window.setupForms = setupForms;
    window.editQuest = editQuest;
    window.deleteQuest = deleteQuest;
    
})();
