document.addEventListener('DOMContentLoaded', () => {
      const proxyUrl = 'https://monstersink.team/proxy.php?name=';
      let deck = [];
      let currentHand = [];
      const selectedIndices = new Set();

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

        // Reset buttons and state
        mulliganBtn.style.display = 'none';
        newHandBtn.style.display = 'none';
        drawHandBtn.style.display = 'inline-block';
        handDiv.innerHTML = '';
        currentHand = [];
        selectedIndices.clear();
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
        currentHand = keptCards.concat(newCards);
        showHand(currentHand);
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

        statusDiv.textContent = 'Neue Starthand gezogen. Klicke Karten für Mulligan an.';
        mulliganBtn.style.display = 'inline-block';
        newHandBtn.style.display = 'none';
      });
    });