// Main app initialization
class App {
    constructor() {
        this.init();
    }

    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.start());
        } else {
            this.start();
        }
    }

    start() {
        console.log('tiMely Horizons App Starting...');

        // Initialize all managers
        this.managers = {
            theme: window.themeManager,
            ui: window.ui,
            profile: window.profileManager,
            tasks: window.taskManager,
            timer: window.timerManager,
            calendar: window.calendarManager,
            flashcards: window.flashcardManager
        };

        // Load last active tab
        ui.loadActiveTab();

        // Set up keyboard shortcuts
        this.setupKeyboardShortcuts();

        // Initialize service worker for offline support (optional)
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js').catch(() => {
                // Service worker registration failed, app will still work
            });
        }

        console.log('tiMely Horizons App Ready!');
        ui.showNotification('Welcome to tiMely Horizons!', 'success', 2000);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Cmd/Ctrl + S to save profile
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (window.profileManager) {
                    window.profileManager.saveProfile();
                }
            }

            // Cmd/Ctrl + N to add new task
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                const tab = document.querySelector('[data-tab="tasks"]');
                if (tab) {
                    tab.click();
                    document.getElementById('taskTitle').focus();
                }
            }

            // Cmd/Ctrl + D to add new deck
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                const tab = document.querySelector('[data-tab="flashcards"]');
                if (tab) {
                    tab.click();
                    document.getElementById('newDeckInput').focus();
                }
            }

            // Cmd/Ctrl + T for timer
            if ((e.ctrlKey || e.metaKey) && e.key === 't') {
                e.preventDefault();
                const tab = document.querySelector('[data-tab="timer"]');
                if (tab) {
                    tab.click();
                }
            }

            // Space to flip card in study mode
            if (e.code === 'Space' && window.flashcardManager && window.flashcardManager.isStudyMode) {
                e.preventDefault();
                window.flashcardManager.flipCard();
            }

            // Arrow keys to navigate cards
            if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && 
                window.flashcardManager && window.flashcardManager.isStudyMode) {
                e.preventDefault();
                if (e.key === 'ArrowRight') {
                    window.flashcardManager.nextCard();
                } else {
                    window.flashcardManager.previousCard();
                }
            }
        });
    }
}

// Start app when this script loads
const app = new App();

// Handle page visibility changes for timer
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden
    } else {
        // Page is visible again
        if (window.timerManager) {
            window.timerManager.updateDisplay();
        }
    }
});

// Handle beforeunload to warn about unsaved changes
window.addEventListener('beforeunload', (e) => {
    // You can add logic here to check for unsaved changes
});

// Error handling
window.addEventListener('error', (event) => {
    console.error('An error occurred:', event.error);
    ui.showNotification('An error occurred. Please check the console.', 'error');
});

// Unhandled promise rejection
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled rejection:', event.reason);
});
