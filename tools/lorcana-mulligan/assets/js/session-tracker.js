// ============================================
// SESSION TRACKING FOR MULLIGAN TRAINER
// ============================================
// Tracks training sessions and sends data to backend

class SessionTracker {
    constructor() {
        this.currentSession = null;
        this.sessionStartTime = null;
        this.mulliganHistory = [];
        this.currentMulliganNumber = 0;
        this.deckData = null;
        this.isLoggedIn = false;
        this.authToken = null;
        this.userId = null;
        
        this.init();
    }

    async init() {
        // Check if user is logged in (from main auth system)
        this.authToken = localStorage.getItem('drawstep_token');
        this.isLoggedIn = !!this.authToken;
        
        if (this.isLoggedIn) {
            await this.getCurrentUser();
        }
        
        console.log('Session Tracker initialized:', this.isLoggedIn ? `User ID: ${this.userId}` : 'Guest mode');
    }

    async getCurrentUser() {
        try {
            const response = await fetch('/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.userId = data.user.id;
                console.log('User authenticated for session tracking:', data.user.username);
            } else {
                this.isLoggedIn = false;
                this.authToken = null;
                localStorage.removeItem('drawstep_token');
            }
        } catch (error) {
            console.error('Failed to get current user:', error);
            this.isLoggedIn = false;
        }
    }

    // ============================================
    // SESSION MANAGEMENT
    // ============================================

    startSession(deckName, deckList) {
        this.currentSession = {
            deck_name: deckName || 'Unknown Deck',
            deck_list: deckList || [],
            total_hands: 0,
            total_mulligans: 0,
            total_cards_exchanged: 0,
            total_unink_before: 0,
            total_unink_after: 0,
            total_ink_cost_before: 0,
            total_ink_cost_after: 0,
            session_duration: 0,
            notes: ''
        };
        
        this.sessionStartTime = Date.now();
        this.mulliganHistory = [];
        this.currentMulliganNumber = 0;
        this.deckData = deckList;
        
        console.log('Training session started:', this.currentSession.deck_name);
        
        // Update UI if callback exists
        if (window.updateSessionInfo) {
            window.updateSessionInfo(this.currentSession);
        }
    }

    recordHand(hand, situation = { role: 'practice', opponent: 'unknown' }) {
        if (!this.currentSession) {
            console.warn('No active session to record hand');
            return;
        }

        this.currentSession.total_hands++;
        this.currentMulliganNumber++;
        
        // Calculate hand statistics
        const handStats = this.calculateHandStats(hand);
        
        // Store hand data for potential mulligan
        this.currentHandData = {
            hand: hand.map(card => ({
                name: card.Name || card.name,
                cost: card.Cost || card.cost,
                inkable: card.inkwell !== false
            })),
            situation: situation,
            stats: handStats
        };
        
        console.log(`Hand recorded: ${this.currentSession.total_hands} hands total`);
    }

    recordMulligan(selectedCards, newCards, keptCards) {
        if (!this.currentSession || !this.currentHandData) {
            console.warn('No active session or hand data to record mulligan');
            return;
        }

        const cardsExchanged = selectedCards.length;
        
        // Only count as a mulligan if cards were actually exchanged
        if (cardsExchanged > 0) {
            this.currentSession.total_mulligans++;
        }
        
        this.currentSession.total_cards_exchanged += cardsExchanged;
        
        // Calculate statistics
        const beforeStats = this.calculateHandStats(this.currentHandData.hand);
        const afterHand = keptCards.concat(newCards);
        const afterStats = this.calculateHandStats(afterHand);
        
        this.currentSession.total_unink_before += beforeStats.uninkCount;
        this.currentSession.total_unink_after += afterStats.uninkCount;
        this.currentSession.total_ink_cost_before += beforeStats.avgInkCost;
        this.currentSession.total_ink_cost_after += afterStats.avgInkCost;
        
        // Record detailed mulligan history
        const mulliganRecord = {
            mulligan_number: this.currentMulliganNumber,
            situation_role: this.currentHandData.situation.role,
            situation_opponent: this.currentHandData.situation.opponent,
            hand_before: this.currentHandData.hand,
            hand_after: afterHand.map(card => ({
                name: card.Name || card.name,
                cost: card.Cost || card.cost,
                inkable: card.inkwell !== false
            })),
            cards_exchanged: selectedCards.map((_, index) => index), // Which positions were exchanged
            unink_count_before: beforeStats.uninkCount,
            unink_count_after: afterStats.uninkCount,
            avg_ink_cost_before: beforeStats.avgInkCost,
            avg_ink_cost_after: afterStats.avgInkCost,
            decision_time: 0, // Could be implemented later
            timestamp: new Date().toISOString()
        };
        
        this.mulliganHistory.push(mulliganRecord);
        
        console.log(`Mulligan recorded: ${cardsExchanged} cards exchanged`);
        
        // Update UI if callback exists
        if (window.updateSessionInfo) {
            window.updateSessionInfo(this.currentSession);
        }
    }

    async endSession(notes = '') {
        if (!this.currentSession) {
            console.warn('No active session to end');
            return;
        }

        // Calculate session duration
        if (this.sessionStartTime) {
            this.currentSession.session_duration = Math.round((Date.now() - this.sessionStartTime) / 60000); // in minutes
        }
        
        this.currentSession.notes = notes;
        
        console.log('Session ended:', this.currentSession);
        
        // Save to backend if user is logged in
        if (this.isLoggedIn && this.userId) {
            try {
                await this.saveSessionToBackend();
            } catch (error) {
                console.error('Failed to save session to backend:', error);
                // Could show user notification here
            }
        } else {
            console.log('Session not saved - user not logged in');
        }
        
        // Reset session
        const completedSession = { ...this.currentSession };
        this.currentSession = null;
        this.sessionStartTime = null;
        this.mulliganHistory = [];
        this.currentMulliganNumber = 0;
        this.currentHandData = null;
        
        return completedSession;
    }

    // ============================================
    // BACKEND INTEGRATION
    // ============================================

    async saveSessionToBackend() {
        if (!this.currentSession || !this.isLoggedIn) return;

        try {
            // Save training session
            const sessionData = {
                user_id: this.userId,
                ...this.currentSession,
                deck_list: this.deckData
            };

            const sessionResponse = await fetch('/api/stats/session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify(sessionData)
            });

            if (!sessionResponse.ok) {
                throw new Error(`Failed to save session: ${sessionResponse.status}`);
            }

            const sessionResult = await sessionResponse.json();
            const sessionId = sessionResult.session_id;

            // Save mulligan history
            for (const mulligan of this.mulliganHistory) {
                const mulliganData = {
                    session_id: sessionId,
                    ...mulligan
                };

                await fetch('/api/stats/mulligan', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.authToken}`
                    },
                    body: JSON.stringify(mulliganData)
                });
            }

            console.log(`Session saved to backend with ID: ${sessionId}`);
            
        } catch (error) {
            console.error('Error saving session to backend:', error);
            throw error;
        }
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    calculateHandStats(hand) {
        let uninkCount = 0;
        let totalCost = 0;
        let validCards = 0;

        hand.forEach(card => {
            if (card.inkable === false || card.inkwell === false) {
                uninkCount++;
            }
            
            const cost = card.cost || card.Cost || 0;
            if (typeof cost === 'number') {
                totalCost += cost;
                validCards++;
            }
        });

        return {
            uninkCount,
            avgInkCost: validCards > 0 ? totalCost / validCards : 0,
            totalInkCost: totalCost
        };
    }

    // ============================================
    // PUBLIC API
    // ============================================

    getSessionStats() {
        return this.currentSession ? { ...this.currentSession } : null;
    }

    isSessionActive() {
        return !!this.currentSession;
    }

    getMulliganHistory() {
        return [...this.mulliganHistory];
    }

    addSessionNote(note) {
        if (this.currentSession) {
            this.currentSession.notes = note;
        }
    }
}

// ============================================
// GLOBAL INSTANCE
// ============================================

window.sessionTracker = new SessionTracker();

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SessionTracker;
}