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

// ===== EXPORTS =====
// Export to window.LevelUp namespace
window.LevelUp.utils = {
    registerServiceWorker,
    extractKeyPhrase,
    pad,
    openModal,
    closeModal,
    showNotification
};

// Also export directly to window for backward compatibility
window.registerServiceWorker = registerServiceWorker;
window.extractKeyPhrase = extractKeyPhrase;
window.pad = pad;
window.openModal = openModal;
window.closeModal = closeModal;
window.showNotification = showNotification;
