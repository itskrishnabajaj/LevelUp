// Level Up - Identity System
(function() {
    'use strict';

    // ===== IDENTITY WIDGET =====
    
    function updateIdentityWidget() {
        const user = allUsers[currentUser];
        const content = document.getElementById('widgetIdentityContent');
        if (!content) return;
        
        content.innerHTML = '';
        
        if (user.vision) {
            const vision = document.createElement('div');
            vision.className = 'identity-section';
            vision.innerHTML = `
                <div class="identity-section-label">✨ Vision</div>
                <div class="identity-section-text">${user.vision}</div>
            `;
            content.appendChild(vision);
        }
        
        if (user.antiVision) {
            const antiVision = document.createElement('div');
            antiVision.className = 'identity-section';
            antiVision.innerHTML = `
                <div class="identity-section-label">⚠️ Anti-Vision</div>
                <div class="identity-section-text anti">${user.antiVision}</div>
            `;
            content.appendChild(antiVision);
        }
        
        if (user.bio) {
            const bio = document.createElement('div');
            bio.className = 'identity-section';
            bio.innerHTML = `
                <div class="identity-section-label">📖 Your Story</div>
                <div class="identity-section-text">${user.bio}</div>
            `;
            content.appendChild(bio);
        }
        
        if (!user.vision && !user.antiVision && !user.bio) {
            content.innerHTML = '<p class="identity-empty">Set your identity in settings</p>';
        }
    }

    function toggleIdentityWidget() {
        const widget = document.getElementById('identityWidget');
        widget.classList.toggle('expanded');
    }

    // ===== IDENTITY REMINDERS =====
    
    function startIdentityReminders() {
        const user = allUsers[currentUser];
        
        if (!user.vision && !user.antiVision) return;
        
        if (identityReminderTimeout) {
            clearTimeout(identityReminderTimeout);
        }
        
        function schedule() {
            if (identityReminderTimeout) {
                clearTimeout(identityReminderTimeout);
            }
            
            const min = 45;
            const max = 90;
            const random = Math.floor(Math.random() * (max - min + 1)) + min;
            const ms = random * 60 * 1000;
            
            identityReminderTimeout = setTimeout(() => {
                showIdentityReminder();
                schedule();
            }, ms);
        }
        
        schedule();
    }

    function showIdentityReminder() {
        const user = allUsers[currentUser];
        const notif = document.getElementById('identityReminderNotif');
        const title = document.getElementById('reminderTitle');
        const text = document.getElementById('reminderText');
        
        const useVision = Math.random() > 0.5;
        
        if (useVision && user.vision) {
            title.textContent = '✨ Remember Your Vision';
            text.textContent = user.vision;
        } else if (!useVision && user.antiVision) {
            title.textContent = '⚠️ Remember What You\'re Avoiding';
            text.textContent = user.antiVision;
        } else if (user.vision) {
            title.textContent = '✨ Remember Your Vision';
            text.textContent = user.vision;
        } else if (user.antiVision) {
            title.textContent = '⚠️ Remember What You\'re Avoiding';
            text.textContent = user.antiVision;
        } else {
            return;
        }
        
        notif.classList.add('show');
        setTimeout(() => closeIdentityReminder(), 8000);
    }

    function closeIdentityReminder() {
        document.getElementById('identityReminderNotif').classList.remove('show');
    }

    // ===== EXPORTS =====
    
    // Export to window.LevelUp namespace
    if (!window.LevelUp) {
        window.LevelUp = {};
    }
    
    window.LevelUp.identity = {
        updateIdentityWidget,
        toggleIdentityWidget,
        startIdentityReminders,
        showIdentityReminder,
        closeIdentityReminder
    };
    
    // Export to window for backwards compatibility
    window.updateIdentityWidget = updateIdentityWidget;
    window.toggleIdentityWidget = toggleIdentityWidget;
    window.startIdentityReminders = startIdentityReminders;
    window.showIdentityReminder = showIdentityReminder;
    window.closeIdentityReminder = closeIdentityReminder;

})();
