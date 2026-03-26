// Flashcard management
class FlashcardManager {
    constructor() {
        this.decks = storage.getFlashcardDecks();
        this.currentDeckId = null;
        this.currentCardIndex = 0;
        this.editingDeckId = null;
        this.isStudyMode = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderDecks();
    }

    setupEventListeners() {
        // Add deck
        document.getElementById('addDeckBtn').addEventListener('click', () => {
            this.addDeck();
        });

        document.getElementById('newDeckInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addDeck();
            }
        });

        // Deck edit modal
        document.getElementById('saveDeckEditBtn').addEventListener('click', () => {
            this.saveDeckEdit();
        });

        document.getElementById('deleteDeckBtn').addEventListener('click', () => {
            if (confirm('Delete this deck and all its cards?')) {
                this.deleteDeck(this.editingDeckId);
            }
        });

        document.getElementById('cancelDeckEditBtn').addEventListener('click', () => {
            ui.closeModalById('deckEditModal');
        });

        // Card add modal
        document.getElementById('saveCardBtn').addEventListener('click', () => {
            this.saveCard();
        });

        document.getElementById('cancelCardAddBtn').addEventListener('click', () => {
            ui.closeModalById('cardAddModal');
        });

        // Study mode controls
        document.getElementById('flipCardBtn').addEventListener('click', () => {
            this.flipCard();
        });

        document.getElementById('prevCardBtn').addEventListener('click', () => {
            this.previousCard();
        });

        document.getElementById('nextCardBtn').addEventListener('click', () => {
            this.nextCard();
        });

        document.getElementById('markCorrectBtn').addEventListener('click', () => {
            this.markCorrect();
        });

        document.getElementById('markIncorrectBtn').addEventListener('click', () => {
            this.markIncorrect();
        });

        document.getElementById('exitStudyBtn').addEventListener('click', () => {
            this.exitStudyMode();
        });
    }

    addDeck() {
        const input = document.getElementById('newDeckInput');
        const name = input.value.trim();

        if (!name) {
            ui.showNotification('Please enter a deck name', 'error');
            return;
        }

        const deck = storage.addDeck({
            name: name,
            description: ''
        });

        this.decks = storage.getFlashcardDecks();
        input.value = '';
        this.renderDecks();
        ui.showNotification('Deck created!', 'success');
    }

    deleteDeck(deckId) {
        storage.deleteDeck(deckId);
        this.decks = storage.getFlashcardDecks();
        this.currentDeckId = null;
        this.exitStudyMode();
        this.renderDecks();
        ui.showNotification('Deck deleted!', 'info');
    }

    editDeck(deckId) {
        const deck = storage.getDeck(deckId);
        if (deck) {
            document.getElementById('editDeckName').value = deck.name;
            document.getElementById('editDeckDescription').value = deck.description || '';
            this.editingDeckId = deckId;
            ui.openModal('deckEditModal');
        }
    }

    saveDeckEdit() {
        const deck = storage.getDeck(this.editingDeckId);
        if (deck) {
            deck.name = document.getElementById('editDeckName').value;
            deck.description = document.getElementById('editDeckDescription').value;
            storage.updateDeck(this.editingDeckId, deck);
            this.decks = storage.getFlashcardDecks();
            this.renderDecks();
            ui.closeModalById('deckEditModal');
            ui.showNotification('Deck updated!', 'success');
        }
    }

    renderDecks() {
        const decksList = document.getElementById('decksList');
        const deckView = document.getElementById('deckView');
        deckView.innerHTML = '';

        if (this.decks.length === 0) {
            decksList.innerHTML = '<li style="color: var(--text-tertiary); text-align: center; padding: 1rem;">No decks yet</li>';
            deckView.innerHTML = '<p class="empty-state">Create a deck to get started</p>';
            return;
        }

        decksList.innerHTML = '';
        this.decks.forEach(deck => {
            const li = document.createElement('li');
            li.className = `deck-item ${this.currentDeckId === deck.id ? 'active' : ''}`;
            li.innerHTML = `
                <span>${deck.name}</span>
                <div class="deck-item-actions">
                    <button data-action="edit" data-deck-id="${deck.id}" title="Edit">✏️</button>
                    <button data-action="delete" data-deck-id="${deck.id}" title="Delete">🗑️</button>
                </div>
            `;

            li.addEventListener('click', (e) => {
                if (!e.target.closest('.deck-item-actions')) {
                    this.selectDeck(deck.id);
                }
            });

            li.querySelector('[data-action="edit"]').addEventListener('click', (e) => {
                e.stopPropagation();
                this.editDeck(deck.id);
            });

            li.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Delete this deck?')) {
                    this.deleteDeck(deck.id);
                }
            });

            decksList.appendChild(li);
        });

        // Update deck view
        if (this.currentDeckId) {
            this.renderDeckView();
        }
    }

    selectDeck(deckId) {
        this.currentDeckId = deckId;
        this.currentCardIndex = 0;
        this.renderDecks();
    }

    renderDeckView() {
        const deck = storage.getDeck(this.currentDeckId);
        if (!deck) return;

        const deckView = document.getElementById('deckView');
        deckView.innerHTML = '';

        const deckCard = document.createElement('div');
        deckCard.className = 'deck-card';
        deckCard.innerHTML = `
            <div class="deck-card-header">
                <div>
                    <div class="deck-card-title">${deck.name}</div>
                    ${deck.description ? `<div class="deck-card-description">${deck.description}</div>` : ''}
                </div>
            </div>
            <div class="deck-card-stats">
                <span>${deck.cards.length} cards</span>
                <span>${deck.cards.filter(c => c.correct).length} correct</span>
            </div>
            <div class="deck-card-buttons">
                <button id="addCardToDeckBtn" class="btn-study">Add Card</button>
                <button id="startStudyBtn" class="btn-study">Study</button>
            </div>
        `;

        deckView.appendChild(deckCard);

        document.getElementById('addCardToDeckBtn').addEventListener('click', () => {
            ui.openModal('cardAddModal');
        });

        document.getElementById('startStudyBtn').addEventListener('click', () => {
            this.startStudyMode();
        });
    }

    saveCard() {
        const front = document.getElementById('cardFrontInput').value.trim();
        const back = document.getElementById('cardBackInput').value.trim();

        if (!front || !back) {
            ui.showNotification('Please enter both front and back of the card', 'error');
            return;
        }

        storage.addCardToDeck(this.currentDeckId, {
            front: front,
            back: back
        });

        document.getElementById('cardFrontInput').value = '';
        document.getElementById('cardBackInput').value = '';
        ui.closeModalById('cardAddModal');
        this.renderDeckView();
        ui.showNotification('Card added!', 'success');
    }

    startStudyMode() {
        const deck = storage.getDeck(this.currentDeckId);
        if (!deck || deck.cards.length === 0) {
            ui.showNotification('Add some cards to study', 'error');
            return;
        }

        this.isStudyMode = true;
        this.currentCardIndex = 0;
        document.getElementById('deckView').classList.add('hidden');
        document.getElementById('studyView').classList.remove('hidden');
        document.getElementById('studyDeckName').textContent = deck.name;

        this.renderCard();
    }

    exitStudyMode() {
        this.isStudyMode = false;
        document.getElementById('studyView').classList.add('hidden');
        document.getElementById('deckView').classList.remove('hidden');
        document.getElementById('flashcard').classList.remove('flipped');
        this.renderDeckView();
    }

    renderCard() {
        const deck = storage.getDeck(this.currentDeckId);
        if (!deck || deck.cards.length === 0) return;

        const totalCards = deck.cards.length;
        document.getElementById('cardCounter').textContent = `${this.currentCardIndex + 1}/${totalCards}`;

        const card = deck.cards[this.currentCardIndex];
        document.getElementById('cardFront').textContent = card.front;
        document.getElementById('cardBack').textContent = card.back;

        const flashcardEl = document.getElementById('flashcard');
        flashcardEl.classList.remove('flipped');
    }

    flipCard() {
        document.getElementById('flashcard').classList.toggle('flipped');
    }

    nextCard() {
        const deck = storage.getDeck(this.currentDeckId);
        if (this.currentCardIndex < deck.cards.length - 1) {
            this.currentCardIndex++;
            this.renderCard();
        }
    }

    previousCard() {
        if (this.currentCardIndex > 0) {
            this.currentCardIndex--;
            this.renderCard();
        }
    }

    markCorrect() {
        const deck = storage.getDeck(this.currentDeckId);
        const card = deck.cards[this.currentCardIndex];
        card.correct = true;
        storage.updateCardInDeck(this.currentDeckId, card.id, { correct: true });

        ui.showNotification('Good job! 👏', 'success');
        this.nextCard();
    }

    markIncorrect() {
        const deck = storage.getDeck(this.currentDeckId);
        const card = deck.cards[this.currentCardIndex];
        card.correct = false;
        storage.updateCardInDeck(this.currentDeckId, card.id, { correct: false });

        ui.showNotification('Keep practicing! 💪', 'info');
        this.nextCard();
    }
}

// Initialize flashcard manager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.flashcardManager = new FlashcardManager();
    });
} else {
    window.flashcardManager = new FlashcardManager();
}
