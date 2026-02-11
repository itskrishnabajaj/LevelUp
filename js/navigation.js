// Level Up - Navigation Module
// Handles tab switching, sidebar toggle, and mobile navigation

(function() {
    'use strict';

    let currentTab = 'dashboard';

    // Switch between tabs
    function switchTab(tabName) {
        currentTab = tabName;
        
        // Hide all tabs
        const tabs = document.querySelectorAll('.tab-content');
        tabs.forEach(tab => tab.classList.remove('active'));
        
        // Show selected tab
        const selectedTab = document.getElementById(tabName);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }
        
        // Update navigation links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => link.classList.remove('active'));
        
        const activeLink = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        // Special handling for specific tabs
        if (tabName === 'analytics' && typeof renderCharts === 'function') {
            setTimeout(renderCharts, 100);
        }
        
        if (tabName === 'journal' && typeof renderJournalHistory === 'function') {
            renderJournalHistory();
        }
        
        // Close sidebar on mobile after tab switch
        if (window.innerWidth <= 768) {
            closeSidebar();
        }
    }

    // Toggle sidebar visibility
    function toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.toggle('active');
        }
    }

    // Close sidebar
    function closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.remove('active');
        }
    }

    // Initialize navigation event listeners
    function initNavigation() {
        // Tab navigation links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = link.dataset.tab;
                if (tabName) {
                    switchTab(tabName);
                }
            });
        });
        
        // Mobile menu toggle
        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', toggleSidebar);
        }
        
        // Close sidebar when clicking outside
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            const menuToggle = document.getElementById('menuToggle');
            if (sidebar && !sidebar.contains(e.target) && e.target !== menuToggle) {
                if (window.innerWidth <= 768 && sidebar.classList.contains('active')) {
                    closeSidebar();
                }
            }
        });
    }

    // Export to global namespace
    window.LevelUp = window.LevelUp || {};
    window.LevelUp.navigation = {
        switchTab,
        toggleSidebar,
        closeSidebar,
        initNavigation,
        getCurrentTab: () => currentTab
    };

    // Backward compatibility
    window.switchTab = switchTab;
    window.toggleSidebar = toggleSidebar;
    window.closeSidebar = closeSidebar;
    window.initNavigation = initNavigation;

})();
