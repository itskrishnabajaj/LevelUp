// Level Up - Settings System
// 
// Dependencies:
// - state.js: allUsers, currentUser
// - config.js: CLASS_OPTIONS, DEFAULT_QUESTS, ACHIEVEMENTS_DATA
// - auth.js: saveAllUsers
// - dashboard.js: updateUserProfile, updateStats, updateWelcomeMessage
// - identity.js: updateIdentityWidget
// - achievements.js: checkAchievements
// - quests.js: renderQuests
// - utils.js: openModal, closeModal, showNotification
// - app.js: renderAll
(function() {
    'use strict';

    // ===== SETTINGS MANAGEMENT =====
    
    function loadSettings() {
        const user = allUsers[currentUser];
        document.getElementById('settingsName').value = user.name;
        document.getElementById('settingsVision').value = user.vision || '';
        document.getElementById('settingsAntiVision').value = user.antiVision || '';
        document.getElementById('settingsBio').value = user.bio || '';
        
        if (user.vision) {
            document.getElementById('visionDisplay').innerHTML = user.vision;
        } else {
            document.getElementById('visionDisplay').innerHTML = '<span class="vision-empty">Set your vision...</span>';
        }
        
        if (user.antiVision) {
            document.getElementById('antiVisionDisplay').innerHTML = user.antiVision;
        } else {
            document.getElementById('antiVisionDisplay').innerHTML = '<span class="vision-empty">Set your anti-vision...</span>';
        }
        
        document.querySelectorAll('#settingsAvatarSelector .avatar-option').forEach(opt => {
            opt.classList.remove('selected');
            if (opt.dataset.avatar === user.avatar) {
                opt.classList.add('selected');
            }
        });
    }

    function saveSettings() {
        const user = allUsers[currentUser];
        user.name = document.getElementById('settingsName').value.trim() || user.name;
        user.vision = document.getElementById('settingsVision').value.trim();
        user.antiVision = document.getElementById('settingsAntiVision').value.trim();
        user.bio = document.getElementById('settingsBio').value.trim();
        
        const selected = document.querySelector('#settingsAvatarSelector .avatar-option.selected');
        if (selected) {
            user.avatar = selected.dataset.avatar;
        }
        
        saveAllUsers();
        updateUserProfile();
        updateWelcomeMessage();
        loadSettings();
        updateIdentityWidget();
        checkAchievements();
        
        showNotification('✅ Settings saved successfully!');
    }

    // ===== ENERGY MODE =====
    
    function toggleEnergyMode() {
        const user = allUsers[currentUser];
        user.lowEnergyMode = !user.lowEnergyMode;
        
        if (user.lowEnergyMode) {
            user.lowEnergyCount++;
        }
        
        saveAllUsers();
        applyEnergyMode();
        
        const msg = user.lowEnergyMode ? '🛡️ Low Energy Mode activated' : '🔋 Normal Mode restored';
        showNotification(msg);
        checkAchievements();
    }

    function applyEnergyMode() {
        const user = allUsers[currentUser];
        const body = document.body;
        const btn = document.getElementById('energyToggleBtn');
        const icon = document.getElementById('energyModeIcon');
        const text = document.getElementById('energyModeText');
        
        if (user.lowEnergyMode) {
            body.classList.add('low-energy-mode');
            if (btn) btn.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
            if (icon) icon.textContent = '🛡️';
            if (text) text.textContent = 'Deactivate Low Energy Mode';
        } else {
            body.classList.remove('low-energy-mode');
            if (btn) btn.style.background = 'linear-gradient(135deg, var(--vitality), var(--secondary))';
            if (icon) icon.textContent = '🔋';
            if (text) text.textContent = 'Activate Low Energy Mode';
        }
        
        renderQuests();
    }

    // ===== DANGER ZONE =====
    
    function resetProgress() {
        if (confirm('⚠️ This will delete ALL your progress! Are you absolutely sure?')) {
            if (confirm('This action cannot be undone. Continue?')) {
                const user = allUsers[currentUser];
                user.level = 1;
                user.xp = 0;
                user.totalXPEarned = 0;
                user.stats = { strength: 0, discipline: 0, focus: 0, vitality: 0, wisdom: 0 };
                user.completions = {};
                user.quests = JSON.parse(JSON.stringify(DEFAULT_QUESTS));
                user.achievements = JSON.parse(JSON.stringify(ACHIEVEMENTS_DATA));
                user.timerStats = { study: 0, exercise: 0, meditation: 0, speaking: 0 };
                user.selectedClass = null;
                
                saveAllUsers();
                renderAll();
                showNotification('🔄 Progress reset successfully!');
            }
        }
    }

    function deleteProfile() {
        if (confirm('⚠️ PERMANENT DELETE: This will completely remove your profile and all data!')) {
            const typed = prompt('Type your username to confirm deletion:');
            if (typed === currentUser) {
                delete allUsers[currentUser];
                localStorage.removeItem('allUsers');
                localStorage.removeItem('lastLoggedInUser');
                location.reload();
            } else if (typed !== null) {
                showNotification('⚠️ Username did not match. Deletion cancelled.');
            }
        }
    }

    // ===== CLASS CHANGE SYSTEM =====
    
    function checkClassChangeEligibility() {
        const user = allUsers[currentUser];
        if (user.selectedClass) return;
        
        const allAt100 = user.stats ? Object.values(user.stats).every(v => v >= 100) : false;
        if (allAt100) {
            showClassChangeModal();
        }
    }

    function showClassChangeModal() {
        const modal = document.getElementById('classChangeModal');
        const container = document.getElementById('classOptions');
        
        container.innerHTML = '';
        
        CLASS_OPTIONS.forEach(classData => {
            const option = document.createElement('div');
            option.className = 'class-option';
            option.innerHTML = `
                <div class="class-option-header">
                    <div class="class-option-icon">${classData.icon}</div>
                    <div class="class-option-name">${classData.name}</div>
                </div>
                <div class="class-option-description">${classData.desc}</div>
            `;
            option.addEventListener('click', () => selectClass(classData.id));
            container.appendChild(option);
        });
        
        openModal('classChangeModal');
    }

    function selectClass(classId) {
        const user = allUsers[currentUser];
        user.selectedClass = classId;
        saveAllUsers();
        closeModal('classChangeModal');
        updateUserProfile();
        updateStats();
        checkAchievements();
        
        const classData = CLASS_OPTIONS.find(c => c.id === classId);
        showNotification(`⚔️ Class Changed! You are now a ${classData.name}`);
    }

    // ===== EXPORTS =====
    
    // Export to window.LevelUp namespace
    if (!window.LevelUp) {
        window.LevelUp = {};
    }
    
    window.LevelUp.settings = {
        loadSettings,
        saveSettings,
        toggleEnergyMode,
        applyEnergyMode,
        resetProgress,
        deleteProfile,
        checkClassChangeEligibility,
        showClassChangeModal,
        selectClass
    };
    
    // Export to window for backwards compatibility
    window.loadSettings = loadSettings;
    window.saveSettings = saveSettings;
    window.toggleEnergyMode = toggleEnergyMode;
    window.applyEnergyMode = applyEnergyMode;
    window.resetProgress = resetProgress;
    window.deleteProfile = deleteProfile;
    window.checkClassChangeEligibility = checkClassChangeEligibility;
    window.showClassChangeModal = showClassChangeModal;
    window.selectClass = selectClass;

})();
