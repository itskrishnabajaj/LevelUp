// ===== UTILITY FUNCTIONS =====
// General utility functions for Level Up app

// Initialize window.LevelUp namespace if not exists
window.LevelUp = window.LevelUp || {};
window.LevelUp.utils = window.LevelUp.utils || {};

// ===== SERVICE WORKER =====
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./serviceworker.js')
            .then(() => console.log('✅ PWA ready'))
            .catch(err => console.log('Service Worker failed:', err));
    }
}

// ===== TEXT UTILITIES =====
function extractKeyPhrase(text) {
    if (!text) return '';
    const phrases = text.split(/[,;]/).map(p => p.trim()).filter(p => p);
    return phrases[0] || text.substring(0, 50);
}

// ===== DATE/TIME HELPERS =====
function pad(num) {
    return num.toString().padStart(2, '0');
}

// ===== MODAL UTILITIES =====
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// ===== NOTIFICATIONS =====
let notificationCount = 0;
function showNotification(message) {
    const offset = notificationCount * 60;
    notificationCount++;
    const notif = document.createElement('div');
    notif.className = 'app-notification';
    notif.style.top = `calc(env(safe-area-inset-top, 0px) + ${20 + offset}px)`;
    notif.textContent = message;
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.classList.add('exit');
        setTimeout(() => {
            notif.remove();
            notificationCount = Math.max(0, notificationCount - 1);
        }, 300);
    }, 3000);
}

// ===== ANIMATION UTILITIES =====

// Show floating XP animation
function showXPFloat(xp, x, y) {
    const xpEl = document.createElement('div');
    xpEl.className = 'xp-float';
    xpEl.textContent = `+${xp} XP`;
    xpEl.style.left = x + 'px';
    xpEl.style.top = y + 'px';
    document.body.appendChild(xpEl);
    
    setTimeout(() => xpEl.remove(), 1500);
}

// Create confetti burst
function createConfetti(x, y) {
    const colors = ['#6C5CE7', '#00CEC9', '#FDCB6E', '#FF6B6B', '#55EFC4', '#A29BFE'];
    const confettiCount = 30;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = x + 'px';
        confetti.style.top = y + 'px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.transform = `translate(${(Math.random() - 0.5) * 100}px, 0) rotate(${Math.random() * 360}deg)`;
        confetti.style.animationDelay = `${Math.random() * 0.3}s`;
        confetti.style.animationDuration = `${1.5 + Math.random()}s`;
        document.body.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 2500);
    }
}

// Show level up overlay
function showLevelUp(level) {
    const overlay = document.createElement('div');
    overlay.className = 'level-up-overlay';
    overlay.innerHTML = `
        <div class="level-up-content">
            <div class="level-up-icon">🎉</div>
            <div class="level-up-title">LEVEL UP!</div>
            <div class="level-up-subtitle">You've reached Level ${level}</div>
            <button class="btn-primary" onclick="this.parentElement.parentElement.remove()" style="max-width: 200px; margin: 0 auto;">Awesome!</button>
        </div>
    `;
    document.body.appendChild(overlay);
    
    // Create confetti burst in center
    createConfetti(window.innerWidth / 2, window.innerHeight / 2);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (overlay.parentElement) {
            overlay.remove();
        }
    }, 5000);
}

// ===== EXPORTS =====
// Export to window.LevelUp namespace
window.LevelUp.utils = {
    registerServiceWorker,
    extractKeyPhrase,
    pad,
    openModal,
    closeModal,
    showNotification,
    showXPFloat,
    createConfetti,
    showLevelUp
};

// Also export directly to window for backward compatibility
window.registerServiceWorker = registerServiceWorker;
window.extractKeyPhrase = extractKeyPhrase;
window.pad = pad;
window.openModal = openModal;
window.closeModal = closeModal;
window.showNotification = showNotification;
window.showXPFloat = showXPFloat;
window.createConfetti = createConfetti;
window.showLevelUp = showLevelUp;
