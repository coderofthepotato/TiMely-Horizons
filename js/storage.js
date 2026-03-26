// Storage management with JSON serialization
class StorageManager {
    constructor() {
        this.prefix = 'timely_';
    }

    // Get item from local storage
    getItem(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error retrieving item:', error);
            return defaultValue;
        }
    }

    // Set item in local storage
    setItem(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error saving item:', error);
            return false;
        }
    }

    // Remove item from local storage
    removeItem(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (error) {
            console.error('Error removing item:', error);
            return false;
        }
    }

    // Clear all storage for this app
    clearAll() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('Error clearing storage:', error);
            return false;
        }
    }

    // Get profile data
    getProfile() {
        return this.getItem('profile', {
            name: 'User Name',
            title: 'Student',
            bio: 'Add your bio here...',
            avatar: null,
            goals: []
        });
    }

    // Set profile data
    setProfile(profile) {
        return this.setItem('profile', profile);
    }

    // Get all tasks
    getTasks() {
        return this.getItem('tasks', []);
    }

    // Set all tasks
    setTasks(tasks) {
        return this.setItem('tasks', tasks);
    }

    // Get all categories
    getCategories() {
        return this.getItem('categories', [
            { id: 'default', name: 'General', color: '#6c63ff' },
            { id: 'work', name: 'Work', color: '#f093fb' },
            { id: 'personal', name: 'Personal', color: '#4ade80' }
        ]);
    }

    // Set all categories
    setCategories(categories) {
        return this.setItem('categories', categories);
    }

    // Get timer settings
    getTimerSettings() {
        return this.getItem('timerSettings', {
            workDuration: 25,
            breakDuration: 5,
            longBreakDuration: 15,
            sessionsUntilLongBreak: 4
        });
    }

    // Set timer settings
    setTimerSettings(settings) {
        return this.setItem('timerSettings', settings);
    }

    // Get timer sessions
    getTimerSessions() {
        return this.getItem('timerSessions', []);
    }

    // Set timer sessions
    setTimerSessions(sessions) {
        return this.setItem('timerSessions', sessions);
    }

    // Get all flashcard decks
    getFlashcardDecks() {
        return this.getItem('flashcardDecks', []);
    }

    // Set all flashcard decks
    setFlashcardDecks(decks) {
        return this.setItem('flashcardDecks', decks);
    }

    // Add a new deck
    addDeck(deck) {
        const decks = this.getFlashcardDecks();
        deck.id = 'deck_' + Date.now();
        deck.cards = deck.cards || [];
        deck.createdAt = new Date().toISOString();
        decks.push(deck);
        this.setFlashcardDecks(decks);
        return deck;
    }

    // Update a deck
    updateDeck(deckId, updates) {
        const decks = this.getFlashcardDecks();
        const deck = decks.find(d => d.id === deckId);
        if (deck) {
            Object.assign(deck, updates);
            this.setFlashcardDecks(decks);
        }
        return deck;
    }

    // Delete a deck
    deleteDeck(deckId) {
        const decks = this.getFlashcardDecks();
        const filtered = decks.filter(d => d.id !== deckId);
        this.setFlashcardDecks(filtered);
    }

    // Get a specific deck
    getDeck(deckId) {
        const decks = this.getFlashcardDecks();
        return decks.find(d => d.id === deckId);
    }

    // Add a card to a deck
    addCardToDeck(deckId, card) {
        const deck = this.getDeck(deckId);
        if (deck) {
            card.id = 'card_' + Date.now();
            card.createdAt = new Date().toISOString();
            card.correct = false;
            deck.cards.push(card);
            this.updateDeck(deckId, { cards: deck.cards });
        }
        return card;
    }

    // Update a card in a deck
    updateCardInDeck(deckId, cardId, updates) {
        const deck = this.getDeck(deckId);
        if (deck) {
            const card = deck.cards.find(c => c.id === cardId);
            if (card) {
                Object.assign(card, updates);
                this.updateDeck(deckId, { cards: deck.cards });
            }
            return card;
        }
    }

    // Delete a card from a deck
    deleteCardFromDeck(deckId, cardId) {
        const deck = this.getDeck(deckId);
        if (deck) {
            deck.cards = deck.cards.filter(c => c.id !== cardId);
            this.updateDeck(deckId, { cards: deck.cards });
        }
    }

    // Get study stats
    getStudyStats() {
        return this.getItem('studyStats', {
            tasksCompleted: 0,
            studyStreak: 0,
            totalStudyTime: 0,
            lastStudyDate: null
        });
    }

    // Update study stats
    updateStudyStats(stats) {
        return this.setItem('studyStats', stats);
    }
}

// Create global storage instance
const storage = new StorageManager();
