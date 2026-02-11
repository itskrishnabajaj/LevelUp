// Level Up - Firebase Integration
// Firebase initialization and data sync helpers

(function() {
    'use strict';

    // Firebase app and database references
    let firebaseApp = null;
    let firebaseDB = null;
    let isFirebaseInitialized = false;
    let syncQueue = [];

    // Initialize Firebase
    function initFirebase() {
        try {
            if (typeof firebase === 'undefined') {
                console.warn('Firebase SDK not loaded, falling back to localStorage only');
                return false;
            }

            if (!firebase.apps.length) {
                firebaseApp = firebase.initializeApp(firebaseConfig);
                firebaseDB = firebase.database();
                isFirebaseInitialized = true;
                console.log('✅ Firebase initialized successfully');
                
                // Process any queued sync operations
                processSyncQueue();
                return true;
            }
        } catch (error) {
            console.error('Firebase initialization error:', error);
            return false;
        }
    }

    // Save user data to Firebase
    async function saveToFirebase(username, userData) {
        if (!isFirebaseInitialized || !firebaseDB) {
            // Queue for later if offline
            queueSync('save', username, userData);
            return false;
        }

        try {
            await firebaseDB.ref(`users/${username}`).set(userData);
            return true;
        } catch (error) {
            console.error('Firebase save error:', error);
            queueSync('save', username, userData);
            return false;
        }
    }

    // Load user data from Firebase
    async function loadFromFirebase(username) {
        if (!isFirebaseInitialized || !firebaseDB) {
            return null;
        }

        try {
            const snapshot = await firebaseDB.ref(`users/${username}`).once('value');
            return snapshot.val();
        } catch (error) {
            console.error('Firebase load error:', error);
            return null;
        }
    }

    // Load all users from Firebase
    async function loadAllUsersFromFirebase() {
        if (!isFirebaseInitialized || !firebaseDB) {
            return null;
        }

        try {
            const snapshot = await firebaseDB.ref('users').once('value');
            return snapshot.val();
        } catch (error) {
            console.error('Firebase loadAll error:', error);
            return null;
        }
    }

    // Queue sync operation for when Firebase becomes available
    function queueSync(operation, username, data) {
        syncQueue.push({ operation, username, data, timestamp: Date.now() });
        // Keep queue limited to prevent memory issues
        if (syncQueue.length > 50) {
            syncQueue = syncQueue.slice(-50);
        }
    }

    // Process queued sync operations
    async function processSyncQueue() {
        if (!isFirebaseInitialized || syncQueue.length === 0) {
            return;
        }

        console.log(`Processing ${syncQueue.length} queued sync operations...`);
        const queue = [...syncQueue];
        syncQueue = [];

        for (const item of queue) {
            try {
                if (item.operation === 'save') {
                    await saveToFirebase(item.username, item.data);
                }
            } catch (error) {
                console.error('Error processing sync queue item:', error);
            }
        }
    }

    // Sync data to both localStorage and Firebase
    async function syncData(username, userData) {
        // Always save to localStorage first (immediate, synchronous)
        try {
            localStorage.setItem('levelup_users', JSON.stringify(allUsers));
        } catch (error) {
            console.error('localStorage save error:', error);
        }

        // Then sync to Firebase (async, best effort)
        await saveToFirebase(username, userData);
    }

    // Load data with Firebase-first strategy
    async function loadData(username) {
        // Try Firebase first
        const firebaseData = await loadFromFirebase(username);
        
        if (firebaseData) {
            console.log('✅ Loaded user data from Firebase');
            return firebaseData;
        }

        // Fallback to localStorage
        const localData = localStorage.getItem('levelup_users');
        if (localData) {
            try {
                const users = JSON.parse(localData);
                const userData = users[username];
                if (userData) {
                    console.log('⚠️ Loaded user data from localStorage (Firebase unavailable)');
                    // Sync localStorage data to Firebase for future
                    saveToFirebase(username, userData);
                    return userData;
                }
            } catch (error) {
                console.error('Error parsing localStorage data:', error);
            }
        }

        return null;
    }

    // Export functions to global namespace
    window.LevelUp = window.LevelUp || {};
    window.LevelUp.firebase = {
        init: initFirebase,
        saveToFirebase,
        loadFromFirebase,
        loadAllUsersFromFirebase,
        syncData,
        loadData,
        isInitialized: () => isFirebaseInitialized
    };

})();
