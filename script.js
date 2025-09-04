class FlashcardApp {
    constructor() {
        this.allCards = [];
        this.currentCards = [];
        this.currentCardIndex = 0;
        this.currentFilter = 'all';
        this.currentTheme = '';
        this.searchTerm = '';
        this.cardProgress = {}; // Track which cards need review
        this.isFlipped = false;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.isDragging = false;
        this.recentTouch = false;
        
        this.init();
    }

    async init() {
        try {
            await this.loadFlashcards();
            this.loadProgress();
            this.setupEventListeners();
            this.loadSessionState();
            this.populateThemeDropdown();
            this.populateWordTypeDropdown();
            this.applyFilters();
        } catch (error) {
            console.error('Error initializing app:', error);
            this.showError('Failed to load flashcards. Please try refreshing the page.');
        }
    }

    async loadFlashcards() {
        try {
            const response = await fetch('cards.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.allCards = await response.json();
            
            // Add unique IDs to cards for tracking
            this.allCards.forEach((card, index) => {
                card.id = card.id || `card_${index}_${card.term.replace(/\s+/g, '_')}`;
            });
            
            this.currentCards = [...this.allCards];
        } catch (error) {
            console.error('Error loading flashcards:', error);
            throw error;
        }
    }

    loadProgress() {
        try {
            const saved = localStorage.getItem('flashcardProgress');
            if (saved) {
                this.cardProgress = JSON.parse(saved);
            }
        } catch (error) {
            console.warn('Could not load progress:', error);
            this.cardProgress = {};
        }
    }

    saveProgress() {
        try {
            localStorage.setItem('flashcardProgress', JSON.stringify(this.cardProgress));
        } catch (error) {
            console.warn('Could not save progress:', error);
        }
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.saveSessionState();
            this.applyFilters();
        });

        // Filter buttons
        document.getElementById('allBtn').addEventListener('click', () => {
            this.setFilter('all');
        });

        document.getElementById('needReviewBtn').addEventListener('click', () => {
            this.setFilter('needReview');
        });

        document.getElementById('randomBtn').addEventListener('click', () => {
            this.setFilter('random');
        });

        // Theme dropdown
        const themeDropdown = document.getElementById('themeDropdown');
        const themeDropdownContent = document.getElementById('themeDropdownContent');
        
        // Word Type dropdown
        const wordTypeDropdown = document.getElementById('wordTypeDropdown');
        const wordTypeDropdownContent = document.getElementById('wordTypeDropdownContent');

        themeDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            themeDropdownContent.classList.toggle('show');
            // Close word type dropdown if open
            wordTypeDropdownContent.classList.remove('show');
        });

        wordTypeDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            wordTypeDropdownContent.classList.toggle('show');
            // Close theme dropdown if open
            themeDropdownContent.classList.remove('show');
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', () => {
            themeDropdownContent.classList.remove('show');
            wordTypeDropdownContent.classList.remove('show');
        });

        themeDropdownContent.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        wordTypeDropdownContent.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Card flip - will be set up when card is displayed
        // This is handled in displayCurrentCard method

        // Action buttons
        document.getElementById('needMorePractice').addEventListener('click', () => {
            this.markCard(false);
        });

        document.getElementById('gotIt').addEventListener('click', () => {
            this.markCard(true);
        });

        // Navigation buttons
        document.getElementById('prevCard').addEventListener('click', () => {
            this.previousCard();
        });

        document.getElementById('nextCard').addEventListener('click', () => {
            this.nextCard();
        });

        // Restart study button
        document.getElementById('restartStudy').addEventListener('click', () => {
            this.restartStudy();
        });

        // Global mouse events for drag (desktop)
        document.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        });

        document.addEventListener('mouseup', (e) => {
            this.handleMouseUp(e);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.markCard(false); // Need more practice
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.markCard(true); // Got it
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.previousCard();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.nextCard();
            } else if (e.key === ' ') {
                e.preventDefault();
                this.flipCard();
            }
        });
    }

    populateThemeDropdown() {
        const themes = [...new Set(this.allCards.map(card => card.theme))].sort();
        const themeDropdownContent = document.getElementById('themeDropdownContent');
        
        themeDropdownContent.innerHTML = '';
        
        themes.forEach(theme => {
            const button = document.createElement('button');
            button.className = 'theme-btn';
            button.textContent = theme;
            button.addEventListener('click', () => {
                this.setThemeFilter(theme);
                document.getElementById('themeDropdownContent').classList.remove('show');
            });
            themeDropdownContent.appendChild(button);
        });
    }

    populateWordTypeDropdown() {
        const wordTypes = [...new Set(this.allCards.map(card => card.wordType))].sort();
        const wordTypeDropdownContent = document.getElementById('wordTypeDropdownContent');
        
        wordTypeDropdownContent.innerHTML = '';
        
        wordTypes.forEach(wordType => {
            const button = document.createElement('button');
            button.className = 'theme-btn word-type-btn';
            button.textContent = wordType.charAt(0).toUpperCase() + wordType.slice(1) + 's';
            button.addEventListener('click', () => {
                this.setWordTypeFilter(wordType);
                document.getElementById('wordTypeDropdownContent').classList.remove('show');
            });
            wordTypeDropdownContent.appendChild(button);
        });
    }

    setFilter(filterType) {
        this.currentFilter = filterType;
        this.currentTheme = '';
        this.updateActiveButtons();
        this.saveSessionState();
        this.applyFilters();
    }

    setThemeFilter(theme) {
        this.currentFilter = 'theme';
        this.currentTheme = theme;
        this.updateActiveButtons();
        this.saveSessionState();
        this.applyFilters();
    }

    setWordTypeFilter(wordType) {
        this.currentFilter = 'wordType';
        this.currentTheme = wordType;
        this.updateActiveButtons();
        this.saveSessionState();
        this.applyFilters();
    }

    updateActiveButtons() {
        // Remove active class from all filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Remove active class from theme buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Add active class to current filter
        if (this.currentFilter === 'all') {
            document.getElementById('allBtn').classList.add('active');
        } else if (this.currentFilter === 'needReview') {
            document.getElementById('needReviewBtn').classList.add('active');
        } else if (this.currentFilter === 'random') {
            document.getElementById('randomBtn').classList.add('active');
        } else if (this.currentFilter === 'theme') {
            document.getElementById('themeDropdown').classList.add('active');
            // Also highlight the specific theme button
            const themeButtons = document.querySelectorAll('#themeDropdownContent .theme-btn');
            themeButtons.forEach(btn => {
                if (btn.textContent === this.currentTheme) {
                    btn.classList.add('active');
                }
            });
        } else if (this.currentFilter === 'wordType') {
            document.getElementById('wordTypeDropdown').classList.add('active');
            // Also highlight the specific word type button
            const wordTypeButtons = document.querySelectorAll('#wordTypeDropdownContent .theme-btn');
            wordTypeButtons.forEach(btn => {
                if (btn.textContent === this.currentTheme.charAt(0).toUpperCase() + this.currentTheme.slice(1) + 's') {
                    btn.classList.add('active');
                }
            });
        }
    }

    applyFilters() {
        let filteredCards = [...this.allCards];

        // Apply search filter
        if (this.searchTerm) {
            filteredCards = filteredCards.filter(card => 
                card.term.toLowerCase().includes(this.searchTerm) ||
                card.theme.toLowerCase().includes(this.searchTerm) ||
                card.simpleGerman.toLowerCase().includes(this.searchTerm) ||
                card.simpleEnglish.toLowerCase().includes(this.searchTerm) ||
                card.examples.some(example => 
                    example.german.toLowerCase().includes(this.searchTerm) ||
                    example.english.toLowerCase().includes(this.searchTerm) ||
                    example.context.toLowerCase().includes(this.searchTerm)
                )
            );
        }

        // Apply type filter
        if (this.currentFilter === 'theme' && this.currentTheme) {
            filteredCards = filteredCards.filter(card => card.theme === this.currentTheme);
        } else if (this.currentFilter === 'wordType' && this.currentTheme) {
            filteredCards = filteredCards.filter(card => card.wordType === this.currentTheme);
        } else if (this.currentFilter === 'needReview') {
            filteredCards = filteredCards.filter(card => 
                this.cardProgress[card.id] && this.cardProgress[card.id].needsReview
            );
        } else if (this.currentFilter === 'random') {
            const randomCount = Math.min(5, filteredCards.length);
            filteredCards = this.shuffleArray(filteredCards).slice(0, randomCount);
        }

        this.currentCards = filteredCards;
        this.currentCardIndex = 0;
        this.displayCurrentCard();
        this.updateStats();
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    displayCurrentCard() {
        const studyContainer = document.getElementById('cardStudyContainer');
        const noResults = document.getElementById('noResults');
        const studyComplete = document.getElementById('studyComplete');

        if (this.currentCards.length === 0) {
            studyContainer.style.display = 'none';
            studyComplete.style.display = 'none';
            noResults.style.display = 'block';
            this.updatePageBackground(null);
            return;
        }

        if (this.currentCardIndex >= this.currentCards.length) {
            studyContainer.style.display = 'none';
            noResults.style.display = 'none';
            studyComplete.style.display = 'block';
            this.updatePageBackground(null);
            return;
        }

        noResults.style.display = 'none';
        studyComplete.style.display = 'none';
        studyContainer.style.display = 'block';

        const card = this.currentCards[this.currentCardIndex];
        this.updatePageBackground(card);
        // Only reset card flip when actually changing to a new card
        this.resetCardFlipForNewCard();
        this.populateCard(card);
        this.updateNavigationButtons();
    }

    updatePageBackground(card) {
        const body = document.body;
        // Remove all existing background classes
        const classesToRemove = Array.from(body.classList).filter(c => c.startsWith('bg-'));
        body.classList.remove(...classesToRemove);

        if (!card) {
            body.classList.add('bg-default');
            return;
        }

        let bgClass = '';
        if (card.wordType === 'noun' && card.gender) {
            bgClass = `bg-gender-${card.gender}`;
        } else if (card.wordType === 'verb' || card.wordType === 'adjective') {
            bgClass = `bg-wordtype-${card.wordType}`;
        }

        if (bgClass) {
            body.classList.add(bgClass);
        } else {
            body.classList.add('bg-default');
        }
    }

    populateCard(card) {
        document.getElementById('cardTerm').textContent = card.term;
        document.getElementById('cardTheme').textContent = card.theme;
        document.getElementById('cardGermanExplanation').textContent = card.simpleGerman;
        document.getElementById('cardEnglishExplanation').textContent = card.simpleEnglish;
        
        // Populate grammatical information
        const grammarInfo = document.getElementById('grammarInfo');
        let grammarHTML = '';
        
        if (card.wordType === 'noun') {
            const genderClass = card.gender ? `gender-${card.gender}` : '';
            grammarHTML = `
                <div class="word-type">Noun</div>
                <div class="grammar-details ${genderClass}">
                    <span class="gender">Gender: ${card.gender || 'N/A'}</span>
                    <span class="plural">Plural: ${card.plural || 'N/A'}</span>
                </div>
            `;
        } else if (card.wordType === 'verb') {
            grammarHTML = `
                <div class="word-type">Verb</div>
                <div class="grammar-details">
                    <span class="participle">Participle: ${card.participle || 'N/A'}</span>
                    <span class="preteritum">Preteritum: ${card.preteritum || 'N/A'}</span>
                </div>
            `;
        } else {
            grammarHTML = `
                <div class="word-type">${card.wordType ? card.wordType.charAt(0).toUpperCase() + card.wordType.slice(1) : 'N/A'}</div>
            `;
        }
        
        grammarInfo.innerHTML = grammarHTML;
        
        // Apply gender-based border color to the card
        const cardContent = document.querySelector('.card-content');
        cardContent.classList.remove('gender-masculine', 'gender-feminine', 'gender-neutral');
        if (card.wordType === 'noun' && card.gender) {
            cardContent.classList.add(`gender-${card.gender}`);
        }

        // Apply gradient background to card sides
        const cardSides = document.querySelectorAll('.card-side');
        cardSides.forEach(side => {
            side.classList.remove('word-type-noun', 'word-type-verb', 'word-type-adjective', 'gender-masculine', 'gender-feminine', 'gender-neutral');
            if (card.wordType) {
                side.classList.add(`word-type-${card.wordType}`);
            }
            if (card.gender) {
                side.classList.add(`gender-${card.gender}`);
            }
        });
        
        const examplesContainer = document.getElementById('cardExamples');
        examplesContainer.innerHTML = card.examples.map(example => `
            <div class="example">
                <div class="example-context">${this.escapeHtml(example.context)}</div>
                <div class="example-text">
                    <div class="example-german">${this.escapeHtml(example.german)}</div>
                    <div class="example-english">${this.escapeHtml(example.english)}</div>
                </div>
            </div>
        `).join('');

        // Add click handler for theme badge
        const themeBadge = document.getElementById('cardTheme');
        // Remove existing listeners
        const newThemeBadge = themeBadge.cloneNode(true);
        themeBadge.parentNode.replaceChild(newThemeBadge, themeBadge);
        
        newThemeBadge.addEventListener('click', (e) => {
            e.stopPropagation();
            this.setThemeFilter(card.theme);
        });

        // Set up card events with a completely fresh approach
        this.setupCardEventsSimple();
    }

    setupCardEvents() {
        const cardContent = document.querySelector('.card-content');
        if (!cardContent) return;
        
        // Use a flag to prevent duplicate setup
        if (cardContent.dataset.eventsSet === 'true') {
            return;
        }
        
        // Clear ALL event handlers by setting them to null first
        cardContent.onclick = null;
        cardContent.ontouchstart = null;
        cardContent.ontouchmove = null;
        cardContent.ontouchend = null;
        cardContent.onmousedown = null;
        
        // Use a single interaction approach - detect touch vs mouse
        let interactionType = null;
        
        // Touch events (mobile devices)
        cardContent.addEventListener('touchstart', (e) => {
            interactionType = 'touch';
            this.handleTouchStart(e);
        }, { passive: true });
        
        cardContent.addEventListener('touchmove', (e) => {
            if (interactionType === 'touch') {
                this.handleTouchMove(e);
            }
        }, { passive: false });
        
        cardContent.addEventListener('touchend', (e) => {
            if (interactionType === 'touch') {
                this.handleTouchEndNew(e);
                setTimeout(() => { interactionType = null; }, 100);
            }
        }, { passive: true });
        
        // Mouse events (desktop) - only if no touch capability
        if (!('ontouchstart' in window) && navigator.maxTouchPoints === 0) {
            cardContent.addEventListener('mousedown', (e) => {
                if (interactionType !== 'touch') {
                    interactionType = 'mouse';
                    this.handleMouseDown(e);
                }
            });
            
            cardContent.addEventListener('click', (e) => {
                if (interactionType === 'mouse' || interactionType === null) {
                    this.handleCardClick(e);
                }
            });
        } else {
            // For touch devices, also handle click but only if not from touch
            cardContent.addEventListener('click', (e) => {
                if (interactionType !== 'touch') {
                    this.handleCardClick(e);
                }
            });
        }
        
        // Mark as events set
        cardContent.dataset.eventsSet = 'true';
    }

    setupCardEventsSimple() {
        const cardContent = document.querySelector('.card-content');
        if (!cardContent) return;
        
        // Completely replace the card element to ensure no duplicate event listeners
        const newCardContent = cardContent.cloneNode(true);
        cardContent.parentNode.replaceChild(newCardContent, cardContent);
        
        // Simple approach: Just use one event type based on device capability
        let hasInteracted = false;
        
        // For touch devices
        if ('ontouchstart' in window) {
            newCardContent.addEventListener('touchstart', (e) => {
                if (hasInteracted) return;
                this.handleTouchStart(e);
            }, { passive: true });
            
            newCardContent.addEventListener('touchmove', (e) => {
                this.handleTouchMove(e);
            }, { passive: false });
            
            newCardContent.addEventListener('touchend', (e) => {
                if (hasInteracted) return;
                hasInteracted = true;
                this.handleTouchEndSimple(e);
                setTimeout(() => { hasInteracted = false; }, 300);
            }, { passive: true });
        } else {
            // For mouse/desktop devices
            newCardContent.addEventListener('click', (e) => {
                if (hasInteracted) return;
                hasInteracted = true;
                this.handleCardClickSimple(e);
                setTimeout(() => { hasInteracted = false; }, 300);
            });
        }
    }

    removeCardEvents() {
        // This method is no longer needed since we use cloneNode to remove all events
        // Keeping it for backward compatibility
    }

    updateStats() {
        const currentCardEl = document.getElementById('currentCard');
        const totalCardsEl = document.getElementById('totalCards');
        const needReviewCountEl = document.getElementById('needReviewCount');

        if (this.currentCards.length === 0) {
            currentCardEl.textContent = '0';
            totalCardsEl.textContent = '0';
        } else {
            currentCardEl.textContent = Math.min(this.currentCardIndex + 1, this.currentCards.length);
            totalCardsEl.textContent = this.currentCards.length;
        }

        const needReviewCount = this.allCards.filter(card => 
            this.cardProgress[card.id] && this.cardProgress[card.id].needsReview
        ).length;
        needReviewCountEl.textContent = needReviewCount;
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prevCard');
        const nextBtn = document.getElementById('nextCard');

        prevBtn.disabled = this.currentCardIndex === 0;
        nextBtn.disabled = this.currentCardIndex >= this.currentCards.length - 1;
    }

    flipCard() {
        const cardContent = document.querySelector('.card-content');
        this.isFlipped = !this.isFlipped;
        cardContent.classList.toggle('flipped', this.isFlipped);
        console.log('Card flipped:', this.isFlipped, 'Classes:', cardContent.className);
    }

    resetCardFlip() {
        const cardContent = document.querySelector('.card-content');
        this.isFlipped = false;
        cardContent.classList.remove('flipped');
        // Reset drag state
        this.isDragging = false;
        this.touchStartX = 0;
        this.touchStartY = 0;
        // Remove swipe indicators
        cardContent.classList.remove('swiping-left', 'swiping-right');
    }

    resetCardFlipForNewCard() {
        // Only reset if we're actually changing cards, not just refreshing the display
        const cardContent = document.querySelector('.card-content');
        if (cardContent) {
            this.isFlipped = false;
            cardContent.classList.remove('flipped');
            // Reset drag state
            this.isDragging = false;
            this.touchStartX = 0;
            this.touchStartY = 0;
            // Remove swipe indicators
            cardContent.classList.remove('swiping-left', 'swiping-right');
            // Clear the events flag so new events can be attached
            cardContent.dataset.eventsSet = 'false';
        }
    }

    markCard(gotIt) {
        if (this.currentCards.length === 0) return;

        const card = this.currentCards[this.currentCardIndex];
        
        // Initialize progress if not exists
        if (!this.cardProgress[card.id]) {
            this.cardProgress[card.id] = {
                attempts: 0,
                correct: 0,
                needsReview: false,
                lastReviewed: Date.now()
            };
        }

        const progress = this.cardProgress[card.id];
        progress.attempts++;
        progress.lastReviewed = Date.now();

        if (gotIt) {
            progress.correct++;
            progress.needsReview = false;
            this.showSwipeIndicator(true);
        } else {
            progress.needsReview = true;
            this.showSwipeIndicator(false);
        }

        this.saveProgress();
        this.updateStats();

        // Auto advance to next card after a delay
        setTimeout(() => {
            this.nextCard();
        }, 800);
    }

    showSwipeIndicator(isRight) {
        const cardContent = document.querySelector('.card-content');
        cardContent.classList.remove('swiping-left', 'swiping-right');
        
        if (isRight) {
            cardContent.classList.add('swiping-right');
        } else {
            cardContent.classList.add('swiping-left');
        }

        setTimeout(() => {
            cardContent.classList.remove('swiping-left', 'swiping-right');
        }, 600);
    }

    nextCard() {
        if (this.currentCardIndex < this.currentCards.length - 1) {
            this.currentCardIndex++;
            this.displayCurrentCard();
        } else {
            // Show completion screen
            document.getElementById('cardStudyContainer').style.display = 'none';
            document.getElementById('studyComplete').style.display = 'block';
        }
    }

    previousCard() {
        if (this.currentCardIndex > 0) {
            this.currentCardIndex--;
            this.displayCurrentCard();
        }
    }

    restartStudy() {
        this.currentCardIndex = 0;
        this.applyFilters();
    }

    // Touch and mouse event handlers for swipe
    handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
        this.isDragging = false;
    }

    handleTouchMove(e) {
        if (!this.touchStartX || !this.touchStartY) return;

        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const diffX = this.touchStartX - currentX;
        const diffY = this.touchStartY - currentY;

        // If we've moved more than a small threshold, consider it dragging/scrolling
        if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
            this.isDragging = true;
        }

        // This part is for visual feedback during horizontal swipe
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 30) {
            e.preventDefault(); // Prevent vertical scroll during horizontal swipe
            
            const cardContent = document.querySelector('.card-content');
            if (diffX > 0) {
                cardContent.classList.add('swiping-left');
                cardContent.classList.remove('swiping-right');
            } else {
                cardContent.classList.add('swiping-right');
                cardContent.classList.remove('swiping-left');
            }
        }
    }

    handleTouchEnd(e) {
        if (!this.touchStartX || !this.touchStartY) return;

        const currentX = e.changedTouches[0].clientX;
        const diffX = this.touchStartX - currentX;

        if (Math.abs(diffX) > 100) {
            if (diffX > 0) {
                this.markCard(false); // Swipe left = need practice
            } else {
                this.markCard(true);  // Swipe right = got it
            }
        } else {
            // Remove swipe indicators if not enough distance
            const cardContent = document.querySelector('.card-content');
            cardContent.classList.remove('swiping-left', 'swiping-right');
            
            // If not dragging, treat as a tap to flip
            if (!this.isDragging) {
                this.flipCard();
            }
        }

        this.touchStartX = 0;
        this.touchStartY = 0;
        this.isDragging = false;
    }

    handleTouchEndNew(e) {
        if (!this.touchStartX || !this.touchStartY) return;

        const currentX = e.changedTouches[0].clientX;
        const diffX = this.touchStartX - currentX;

        if (Math.abs(diffX) > 100) {
            if (diffX > 0) {
                this.markCard(false); // Swipe left = need practice
            } else {
                this.markCard(true);  // Swipe right = got it
            }
        } else {
            // Remove swipe indicators if not enough distance
            const cardContent = document.querySelector('.card-content');
            cardContent.classList.remove('swiping-left', 'swiping-right');
            
            // If not dragging, treat as a tap to flip
            if (!this.isDragging) {
                console.log('Touch tap detected, flipping card');
                this.flipCard();
            }
        }

        this.touchStartX = 0;
        this.touchStartY = 0;
        this.isDragging = false;
    }

    handleCardClick(e) {
        // Don't flip if clicking on the theme badge or action buttons
        if (e.target.closest('.theme-badge') || e.target.closest('.action-btn')) {
            return;
        }
        
        // If we're currently dragging, don't flip
        if (this.isDragging) {
            return;
        }
        
        // Prevent multiple rapid clicks with a stronger check
        const now = Date.now();
        if (this.lastClickTime && now - this.lastClickTime < 500) {
            console.log('Click blocked - too rapid');
            return;
        }
        this.lastClickTime = now;
        
        e.preventDefault();
        e.stopPropagation();
        
        console.log('Click handler triggered, current flip state:', this.isFlipped);
        
        this.flipCard();
    }

    handleTouchEndSimple(e) {
        if (!this.touchStartX || !this.touchStartY) return;

        const currentX = e.changedTouches[0].clientX;
        const diffX = this.touchStartX - currentX;

        if (Math.abs(diffX) > 100) {
            if (diffX > 0) {
                this.markCard(false); // Swipe left = need practice
            } else {
                this.markCard(true);  // Swipe right = got it
            }
        } else {
            // Remove swipe indicators if not enough distance
            const cardContent = document.querySelector('.card-content');
            cardContent.classList.remove('swiping-left', 'swiping-right');
            
            // If not dragging, treat as a tap to flip
            if (!this.isDragging) {
                console.log('Simple touch tap detected, flipping card');
                this.flipCard();
            }
        }

        this.touchStartX = 0;
        this.touchStartY = 0;
        this.isDragging = false;
    }

    handleCardClickSimple(e) {
        // Don't flip if clicking on the theme badge or action buttons
        if (e.target.closest('.theme-badge') || e.target.closest('.action-btn')) {
            return;
        }
        
        // If we're currently dragging, don't flip
        if (this.isDragging) {
            return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        console.log('Simple click handler triggered, current flip state:', this.isFlipped);
        
        this.flipCard();
    }

    handleMouseDown(e) {
        this.touchStartX = e.clientX;
        this.isDragging = false;
    }

    handleMouseMove(e) {
        if (!this.touchStartX) return;

        const diffX = this.touchStartX - e.clientX;
        
        if (Math.abs(diffX) > 30) {
            this.isDragging = true;
            const cardContent = document.querySelector('.card-content');
            if (diffX > 0) {
                cardContent.classList.add('swiping-left');
                cardContent.classList.remove('swiping-right');
            } else {
                cardContent.classList.add('swiping-right');
                cardContent.classList.remove('swiping-left');
            }
        }
    }

    handleMouseUp(e) {
        if (!this.touchStartX) return;

        const diffX = this.touchStartX - e.clientX;

        if (Math.abs(diffX) > 100) {
            if (diffX > 0) {
                this.markCard(false);
            } else {
                this.markCard(true);
            }
        } else {
            const cardContent = document.querySelector('.card-content');
            cardContent.classList.remove('swiping-left', 'swiping-right');
            
            if (!this.isDragging) {
                this.flipCard();
            }
        }

        this.touchStartX = 0;
        this.isDragging = false;
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    saveSessionState() {
        const state = {
            filter: this.currentFilter,
            theme: this.currentTheme,
            search: this.searchTerm,
            cardIndex: this.currentCardIndex,
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem('flashcardAppState', JSON.stringify(state));
        } catch (error) {
            console.warn('Could not save session state:', error);
        }
    }

    loadSessionState() {
        try {
            const saved = localStorage.getItem('flashcardAppState');
            if (!saved) return;

            const state = JSON.parse(saved);
            
            // Only restore state if it's less than 24 hours old
            const twentyFourHours = 24 * 60 * 60 * 1000;
            if (Date.now() - state.timestamp > twentyFourHours) {
                localStorage.removeItem('flashcardAppState');
                return;
            }

            // Restore search term
            if (state.search) {
                this.searchTerm = state.search;
                document.getElementById('searchInput').value = state.search;
            }

            // Restore card index
            if (typeof state.cardIndex === 'number') {
                this.currentCardIndex = state.cardIndex;
            }

            // Restore filter state
            if (state.filter === 'theme' && state.theme) {
                this.setThemeFilter(state.theme);
            } else if (state.filter === 'wordType' && state.theme) {
                this.setWordTypeFilter(state.theme);
            } else if (state.filter === 'needReview') {
                this.setFilter('needReview');
            } else if (state.filter === 'random') {
                this.setFilter('random');
            } else {
                this.setFilter('all');
            }

        } catch (error) {
            console.warn('Could not load session state:', error);
            localStorage.removeItem('flashcardAppState');
        }
    }

    showError(message) {
        const studyContainer = document.getElementById('cardStudyContainer');
        const studyStats = document.getElementById('studyStats');
        
        studyStats.innerHTML = '<div class="stat-item" style="color: #ff6b6b;">Error loading flashcards</div>';
        
        studyContainer.innerHTML = `
            <div style="text-align: center; color: white; padding: 40px;">
                <h3 style="margin-bottom: 15px;">⚠️ Error</h3>
                <p>${this.escapeHtml(message)}</p>
            </div>
        `;
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FlashcardApp();
});
