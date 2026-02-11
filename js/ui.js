// Level Up - UI Initialization Module
// Handles form setup, button bindings, and UI initialization

(function() {
    'use strict';

    // Initialize all UI components
    function initUI() {
        setupAvatarSelectors();
        setupLoginTabs();
        setupMoodSelector();
        setupActivityGrid();
        setupAchievementFilters();
        setupModals();
        initNavigation();
    }

    // Setup avatar selectors
    function setupAvatarSelectors() {
        const selectors = document.querySelectorAll('.avatar-selector');
        selectors.forEach(selector => {
            const options = selector.querySelectorAll('.avatar-option');
            options.forEach(option => {
                option.addEventListener('click', () => {
                    options.forEach(o => o.classList.remove('selected'));
                    option.classList.add('selected');
                    if (selector.id === 'avatarSelector') {
                        selectedAvatar = option.dataset.avatar;
                    }
                });
            });
        });
    }

    // Setup login tabs
    function setupLoginTabs() {
        const loginTabs = document.querySelectorAll('.login-tab');
        const loginForms = document.querySelectorAll('.login-form');
        
        loginTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                loginTabs.forEach(t => t.classList.remove('active'));
                loginForms.forEach(f => f.classList.remove('active'));
                
                tab.classList.add('active');
                const targetForm = document.getElementById(`${tab.dataset.tab}Form`);
                if (targetForm) {
                    targetForm.classList.add('active');
                }
                
                if (tab.dataset.tab === 'login' && typeof renderUserList === 'function') {
                    renderUserList();
                }
            });
        });
    }

    // Setup mood selector
    function setupMoodSelector() {
        if (typeof renderMoodSelector === 'function') {
            renderMoodSelector();
        }
    }

    // Setup activity grid
    function setupActivityGrid() {
        if (typeof renderActivityGrid === 'function') {
            renderActivityGrid();
        }
    }

    // Setup achievement filters
    function setupAchievementFilters() {
        const filterBtns = document.querySelectorAll('.achievement-filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                achievementFilter = btn.dataset.filter;
                if (typeof renderAchievements === 'function') {
                    renderAchievements();
                }
            });
        });
    }

    // Setup modals
    function setupModals() {
        // Close modals when clicking backdrop
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                closeModal(e.target.id);
            }
        });
        
        // Close buttons
        const closeButtons = document.querySelectorAll('.modal-close, .btn-cancel');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal');
                if (modal) {
                    closeModal(modal.id);
                }
            });
        });
    }

    // Export to global namespace
    window.LevelUp = window.LevelUp || {};
    window.LevelUp.ui = {
        initUI,
        setupAvatarSelectors,
        setupLoginTabs,
        setupMoodSelector,
        setupActivityGrid,
        setupAchievementFilters,
        setupModals
    };

    // Backward compatibility
    window.initUI = initUI;
    window.setupAvatarSelectors = setupAvatarSelectors;
    window.setupLoginTabs = setupLoginTabs;

})();
