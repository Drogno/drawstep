document.addEventListener('DOMContentLoaded', () => {
      const proxyUrl = 'https://monstersink.team/proxy.php?name=';
      let deck = [];
      let currentHand = [];
      const selectedIndices = new Set();
      let currentDeckName = '';
      let currentDeckList = [];

      const deckInput = document.getElementById('deckInput');
      const importBtn = document.getElementById('importDeckBtn');
      const drawHandBtn = document.getElementById('drawHandBtn');
      const mulliganBtn = document.getElementById('mulliganBtn');
      const newHandBtn = document.getElementById('newHandBtn');
      const deckList = document.getElementById('deckList');
      const statusDiv = document.getElementById('status');
      const handDiv = document.getElementById('hand');

      function shuffle(array) {
        for (let i = array.length -1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i+1));
          [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
      }

      function updateDeckDisplay() {
        deckList.innerHTML = '';
        deck.forEach(card => {
          const li = document.createElement('li');
          li.textContent = card.Name || '(unbekannte Karte)';
          deckList.appendChild(li);
        });
      }

      importBtn.addEventListener('click', async () => {
        const rawText = deckInput.value.trim();
        if (!rawText) {
          statusDiv.textContent = 'Bitte Deck einfügen.';
          return;
        }
        statusDiv.textContent = 'Karten werden geladen...';

        const lines = rawText.split('\n');
        deck = [];
        let totalCards = 0;

        for (const line of lines) {
          const match = line.match(/^(\d+)\s+(.+)$/);
          if (!match) continue;

          const count = parseInt(match[1]);
          const name = match[2];

          try {
            const res = await fetch(proxyUrl + encodeURIComponent(name));
            if (!res.ok) throw new Error('API antwortete nicht OK');
            const data = await res.json();
            if (!data || data.length === 0) {
              console.warn(`Keine Karte gefunden: ${name}`);
              continue;
            }

            const card = data[0];
            for (let i = 0; i < count; i++) {
              deck.push(card);
              totalCards++;
            }
          } catch (e) {
            console.warn('Fehler bei', name, e);
          }
        }

        updateDeckDisplay();
        statusDiv.textContent = `${totalCards} Karten importiert.`;
        drawHandBtn.disabled = deck.length < 7;

        // Store deck info for session tracking
        currentDeckList = [...deck];
        currentDeckName = extractDeckName(rawText) || 'Imported Deck';

        // Reset buttons and state
        mulliganBtn.style.display = 'none';
        newHandBtn.style.display = 'none';
        drawHandBtn.style.display = 'inline-block';
        handDiv.innerHTML = '';
        currentHand = [];
        selectedIndices.clear();
        
        // Start new training session if deck is valid
        if (deck.length >= 7 && window.sessionTracker) {
            window.sessionTracker.startSession(currentDeckName, currentDeckList);
        }
      });

      function showHand(hand) {
        handDiv.innerHTML = '';
        hand.forEach((card, i) => {
          const img = document.createElement('img');
          img.src = card.Image || '';
          img.alt = card.Name || '(unbekannte Karte)';
          img.title = card.Name || '';
          img.dataset.index = i;
          if (selectedIndices.has(i)) img.classList.add('selected');

          img.addEventListener('click', () => {
            if (selectedIndices.has(i)) {
              selectedIndices.delete(i);
              img.classList.remove('selected');
            } else {
              selectedIndices.add(i);
              img.classList.add('selected');
            }
            statusDiv.textContent = `${selectedIndices.size} Karte(n) für Mulligan ausgewählt.`;
          });

          handDiv.appendChild(img);
        });
      }

      drawHandBtn.addEventListener('click', () => {
        if (deck.length < 7) {
          statusDiv.textContent = 'Nicht genug Karten im Deck.';
          return;
        }

        deck = shuffle(deck);
        currentHand = deck.splice(0,7);
        showHand(currentHand);
        statusDiv.textContent = 'Starthand gezogen. Klicke Karten an, die du mulliganen möchtest.';
        selectedIndices.clear();

        // Track hand draw
        if (window.sessionTracker) {
            window.sessionTracker.recordHand(currentHand);
        }

        mulliganBtn.style.display = 'inline-block';
        newHandBtn.style.display = 'none';
        drawHandBtn.style.display = 'none';
      });

      mulliganBtn.addEventListener('click', () => {
        if (selectedIndices.size === 0) {
          statusDiv.textContent = 'Bitte mindestens eine Karte für Mulligan auswählen.';
          return;
        }

        // Statistik: Uninkable vor Mulligan
        let uninkBefore = 0;
        currentHand.forEach(card => {
          if (card.inkwell === false) uninkBefore++;
        });

        const mulliganCards = [];
        const keptCards = [];
        currentHand.forEach((card, i) => {
          if (selectedIndices.has(i)) {
            mulliganCards.push(card);
          } else {
            keptCards.push(card);
          }
        });

        deck = deck.concat(mulliganCards);
        deck = shuffle(deck);

        const newCards = deck.splice(0, selectedIndices.size);
        const oldHand = [...currentHand];
        currentHand = keptCards.concat(newCards);
        showHand(currentHand);

        // Track mulligan
        if (window.sessionTracker) {
            window.sessionTracker.recordMulligan(mulliganCards, newCards, keptCards);
        }

        selectedIndices.clear();

        // Statistik: Uninkable nach Mulligan
        let uninkAfter = 0;
        currentHand.forEach(card => {
          if (card.inkwell === false) uninkAfter++;
        });

        // Update Statistik-Objekt
        if (window.trainingStats) {
          window.trainingStats.totalHands = (window.trainingStats.totalHands || 0) + 1;
          window.trainingStats.totalCardsExchanged = (window.trainingStats.totalCardsExchanged || 0) + newCards.length;
          window.trainingStats.totalUninkBefore = (window.trainingStats.totalUninkBefore || 0) + uninkBefore;
          window.trainingStats.totalUninkAfter = (window.trainingStats.totalUninkAfter || 0) + uninkAfter;
          if (window.updateStatistics) window.updateStatistics();
        }

        statusDiv.textContent = `Mulligan durchgeführt: ${newCards.length} Karte(n) getauscht.`;
        mulliganBtn.style.display = 'none';
        newHandBtn.style.display = 'inline-block';
      });

      newHandBtn.addEventListener('click', () => {
        if (deck.length < 7) {
          statusDiv.textContent = 'Nicht genug Karten im Deck für neue Starthand.';
          return;
        }

        deck = deck.concat(currentHand);
        deck = shuffle(deck);
        currentHand = deck.splice(0, 7);
        showHand(currentHand);
        selectedIndices.clear();

        // Track new hand draw
        if (window.sessionTracker) {
            window.sessionTracker.recordHand(currentHand);
        }

        statusDiv.textContent = 'Neue Starthand gezogen. Klicke Karten für Mulligan an.';
        mulliganBtn.style.display = 'inline-block';
        newHandBtn.style.display = 'none';
      });

      // ============================================
      // HELPER FUNCTIONS FOR SESSION TRACKING
      // ============================================

      function extractDeckName(deckText) {
        // Try to extract deck name from common formats
        const lines = deckText.split('\n');
        const firstLine = lines[0]?.trim();
        
        // Check for common deck name patterns
        if (firstLine && !firstLine.match(/^\d+\s+/)) {
          // First line doesn't start with a number, probably deck name
          return firstLine;
        }
        
        // Look for lines that look like titles
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.match(/^\d+\s+/) && trimmed.length < 50) {
            return trimmed;
          }
        }
        
        return null;
      }

      // Session management functions
      window.endCurrentSession = function(notes = '') {
        if (window.sessionTracker && window.sessionTracker.isSessionActive()) {
          return window.sessionTracker.endSession(notes);
        }
        return null;
      };

      window.getSessionStats = function() {
        if (window.sessionTracker) {
          return window.sessionTracker.getSessionStats();
        }
        return null;
      };

      // Auto-save session when page is about to close
      window.addEventListener('beforeunload', (event) => {
        if (window.sessionTracker && window.sessionTracker.isSessionActive()) {
          // Try to save session
          window.sessionTracker.endSession('Session ended by page close');
        }
      });

      // Update UI with session info if callback exists
      window.updateSessionInfo = function(sessionData) {
        console.log('Session update:', sessionData);
        updateSessionDisplay(sessionData);
      };

      function updateSessionDisplay(sessionData) {
        if (!sessionData) return;

        const deckStatsDiv = document.getElementById('deckStats');
        if (!deckStatsDiv) return;

        // Create session stats HTML
        const sessionHTML = `
          <div class="session-tracker-panel" style="
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 1rem;
            border-radius: 12px;
            margin-top: 1rem;
            font-size: 0.9rem;
            border: 2px solid #FFD34E;
          ">
            <div style="color: #FFD34E; font-weight: bold; margin-bottom: 0.5rem;">
              📊 Training Session
            </div>
            <div style="margin-bottom: 0.5rem;">
              <strong>Deck:</strong> ${sessionData.deck_name}
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.5rem;">
              <div><strong>Hands:</strong> ${sessionData.total_hands}</div>
              <div><strong>Mulligans:</strong> ${sessionData.total_mulligans}</div>
            </div>
            <div style="margin-bottom: 0.5rem;">
              <strong>Cards Exchanged:</strong> ${sessionData.total_cards_exchanged}
            </div>
            ${sessionData.total_hands > 0 ? `
            <div style="font-size: 0.8rem; color: #ccc;">
              Mulligan Rate: ${Math.round((sessionData.total_mulligans / sessionData.total_hands) * 100)}%
            </div>
            ` : ''}
            <div style="margin-top: 0.5rem; font-size: 0.8rem; color: #FFD34E;">
              ${window.sessionTracker?.isLoggedIn ? '✅ Saving to account' : '⚠️ Guest mode - not saved'}
            </div>
          </div>
        `;

        // Check if session panel already exists
        let sessionPanel = deckStatsDiv.querySelector('.session-tracker-panel');
        if (sessionPanel) {
          sessionPanel.outerHTML = sessionHTML;
        } else {
          deckStatsDiv.insertAdjacentHTML('beforeend', sessionHTML);
        }

        // Make sure the deckStats div is visible if we have session data
        if (sessionData.total_hands > 0) {
          deckStatsDiv.style.display = 'flex';
        }
      }
    });