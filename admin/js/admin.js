class AdminPanel {
    constructor() {
        this.authToken = localStorage.getItem('adminToken');
        this.metaDecks = {};
        this.currentEditingDeck = null;

        if (this.authToken && this.isTokenExpired(this.authToken)) {
            this.clearStoredToken();
        } else if (this.authToken) {
            this.rememberTokenExpiry(this.authToken);
        }

        this.init();
    }

    clearStoredToken() {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminTokenExpiresAt');
        this.authToken = null;
    }

    decodeToken(token) {
        try {
            const parts = token.split('.');
            if (parts.length < 2) {
                return null;
            }

            const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
            return JSON.parse(atob(padded));
        } catch (error) {
            console.warn('Failed to decode admin token payload:', error);
            return null;
        }
    }

    rememberTokenExpiry(token) {
        const payload = this.decodeToken(token);
        if (payload && payload.exp) {
            localStorage.setItem('adminTokenExpiresAt', String(payload.exp * 1000));
        } else {
            localStorage.removeItem('adminTokenExpiresAt');
        }
    }

    isTokenExpired(token) {
        const payload = this.decodeToken(token);
        if (!payload || !payload.exp) {
            return false;
        }
        return payload.exp * 1000 <= Date.now();
    }

    storeToken(token) {
        this.authToken = token;
        localStorage.setItem('adminToken', token);
        this.rememberTokenExpiry(token);
    }

    init() {
        if (!this.authToken) {
            this.showLoginModal();
        } else {
            this.initializePanel();
        }
        
        this.bindEvents();
    }
    
    showLoginModal() {
        const modal = document.getElementById('loginModal');
        modal.style.display = 'flex';
    }
    
    hideLoginModal() {
        const modal = document.getElementById('loginModal');
        modal.style.display = 'none';
    }
    
    async login(password) {
        try {
            const response = await fetch('/admin/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password })
            });
            
            // Check if response is JSON before parsing
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                throw new Error(`Server returned non-JSON response (${response.status})`);
            }
            
            const data = await response.json();
            
            if (data.success && data.token) {
                this.storeToken(data.token);
                this.hideLoginModal();
                const loginError = document.getElementById('loginError');
                if (loginError) {
                    loginError.textContent = '';
                }
                this.initializePanel();
                return true;
            } else {
                throw new Error(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            document.getElementById('loginError').textContent = error.message;
            return false;
        }
    }
    
    logout({ silent = false, message } = {}) {
        this.clearStoredToken();

        if (silent) {
            if (message) {
                const loginError = document.getElementById('loginError');
                if (loginError) {
                    loginError.textContent = message;
                }
            }
            this.showLoginModal();
            return;
        }

        location.reload();
    }
    
    async apiRequest(url, options = {}) {
        if (this.authToken && this.isTokenExpired(this.authToken)) {
            this.logout({ silent: true, message: 'Session expired. Please sign in again.' });
            throw new Error('Session expired');
        }

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.authToken) {
            headers.Authorization = `Bearer ${this.authToken}`;
        }
        
        const response = await fetch(url, {
            ...options,
            headers
        });

        if (response.status === 401) {
            this.logout({ silent: true, message: 'Authentication failed. Please sign in again.' });
            throw new Error('Authentication failed');
        }

        let data = null;
        try {
            data = await response.json();
        } catch (error) {
            data = null;
        }

        if (!response.ok) {
            const errorMessage = (data && data.error) ? data.error : 'Request failed';
            throw new Error(errorMessage);
        }

        return data || {};
    }
    
    async initializePanel() {
        await this.loadDashboardStats();
        await this.loadMetaDecks();
        this.showSection('dashboard');
    }
    
    async loadDashboardStats() {
        try {
            const stats = await this.apiRequest('/admin/api/stats');
            document.getElementById('totalUsers').textContent = stats.totalUsers;
            document.getElementById('totalMetaDecks').textContent = stats.totalMetaDecks;
            document.getElementById('totalSessions').textContent = stats.totalSessions;
        } catch (error) {
            console.error('Failed to load dashboard stats:', error);
        }
    }
    
    async loadMetaDecks() {
        try {
            this.metaDecks = await this.apiRequest('/admin/api/metadecks');
            this.renderMetaDecks();
        } catch (error) {
            console.error('Failed to load meta decks:', error);
            document.getElementById('deckList').innerHTML = '<p>Error loading meta decks</p>';
        }
    }
    
    renderMetaDecks() {
        const deckList = document.getElementById('deckList');
        const entries = Object.entries(this.metaDecks);
        
        if (entries.length === 0) {
            deckList.innerHTML = '<p>No meta decks found</p>';
            return;
        }
        
        deckList.innerHTML = entries.map(([id, deck], index) => `
            <div class="deck-item" data-deck-id="${id}" data-index="${index}" draggable="true">
                <div class="deck-info">
                    <h4>${deck.name || id}</h4>
                    <p>${this.getDeckCardCount(deck.list)} cards &bull; ID: ${id}</p>
                </div>
                <div class="deck-actions">
                    <button class="btn btn-sm btn-secondary" onclick="admin.editDeck('${id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="admin.deleteDeck('${id}')">Delete</button>
                </div>
            </div>
        `).join('');
        
        this.initializeDragAndDrop();
    }
    
    getDeckCardCount(deckList) {
        if (!deckList) return 0;
        return deckList.split('\n')
            .filter(line => line.trim())
            .reduce((total, line) => {
                const match = line.match(/^(\d+)/);
                return total + (match ? parseInt(match[1]) : 0);
            }, 0);
    }
    
    showSection(sectionName) {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        document.querySelectorAll('.nav-item').forEach(nav => {
            nav.classList.remove('active');
        });
        
        document.getElementById(`${sectionName}-section`).classList.add('active');
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
        
        const titles = {
            dashboard: 'Dashboard',
            metadecks: 'Meta Deck Management',
            users: 'User Management',
            stats: 'Statistics'
        };
        document.getElementById('sectionTitle').textContent = titles[sectionName];
    }
    
    editDeck(deckId) {
        this.currentEditingDeck = deckId;
        const deck = this.metaDecks[deckId];
        
        document.getElementById('deckId').value = deckId;
        document.getElementById('deckName').value = deck.name || '';
        document.getElementById('deckListInput').value = deck.list || '';
        document.getElementById('deckEditor').style.display = 'block';
        
        document.querySelectorAll('.deck-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-deck-id="${deckId}"]`).classList.add('active');
    }
    
    cancelEdit() {
        this.currentEditingDeck = null;
        document.getElementById('deckEditor').style.display = 'none';
        document.getElementById('deckForm').reset();
        document.querySelectorAll('.deck-item').forEach(item => {
            item.classList.remove('active');
        });
    }
    
    async saveDeck() {
        const deckId = document.getElementById('deckId').value.trim();
        const deckName = document.getElementById('deckName').value.trim();
        const deckList = document.getElementById('deckListInput').value.trim();
        
        if (!deckId || !deckName || !deckList) {
            alert('Please fill in all fields');
            return;
        }
        
        if (this.currentEditingDeck && this.currentEditingDeck !== deckId) {
            delete this.metaDecks[this.currentEditingDeck];
        }
        
        this.metaDecks[deckId] = {
            name: deckName,
            list: deckList
        };
        
        try {
            await this.apiRequest('/admin/api/metadecks', {
                method: 'POST',
                body: JSON.stringify({ metaDecks: this.metaDecks })
            });
            
            this.renderMetaDecks();
            this.cancelEdit();
            this.showSuccess('Deck saved successfully!');
            await this.loadDashboardStats();
        } catch (error) {
            console.error('Failed to save deck:', error);
            alert('Failed to save deck: ' + error.message);
        }
    }
    
    async deleteDeck(deckId) {
        if (!confirm(`Are you sure you want to delete "${this.metaDecks[deckId].name}"?`)) {
            return;
        }
        
        delete this.metaDecks[deckId];
        
        try {
            await this.apiRequest('/admin/api/metadecks', {
                method: 'POST',
                body: JSON.stringify({ metaDecks: this.metaDecks })
            });
            
            this.renderMetaDecks();
            this.cancelEdit();
            this.showSuccess('Deck deleted successfully!');
            await this.loadDashboardStats();
        } catch (error) {
            console.error('Failed to delete deck:', error);
            alert('Failed to delete deck: ' + error.message);
        }
    }
    
    addNewDeck() {
        const newId = 'New_Deck_' + Date.now();
        this.metaDecks[newId] = {
            name: 'New Deck',
            list: '4 Card Name\n3 Another Card\n2 Third Card\n1 Fourth Card'
        };
        this.renderMetaDecks();
        this.editDeck(newId);
    }
    
    initializeDragAndDrop() {
        const deckItems = document.querySelectorAll('.deck-item');
        
        deckItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', item.dataset.deckId);
                item.classList.add('dragging');
            });
            
            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
            });
            
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                item.classList.add('drag-over');
            });
            
            item.addEventListener('dragleave', () => {
                item.classList.remove('drag-over');
            });
            
            item.addEventListener('drop', async (e) => {
                e.preventDefault();
                item.classList.remove('drag-over');
                
                const draggedId = e.dataTransfer.getData('text/plain');
                const targetId = item.dataset.deckId;
                
                if (draggedId !== targetId) {
                    await this.reorderDecks(draggedId, targetId);
                }
            });
        });
    }
    
    async reorderDecks(draggedId, targetId) {
        const entries = Object.entries(this.metaDecks);
        const draggedIndex = entries.findIndex(([id]) => id === draggedId);
        const targetIndex = entries.findIndex(([id]) => id === targetId);
        
        const [draggedEntry] = entries.splice(draggedIndex, 1);
        entries.splice(targetIndex, 0, draggedEntry);
        
        this.metaDecks = Object.fromEntries(entries);
        
        try {
            await this.apiRequest('/admin/api/metadecks', {
                method: 'POST',
                body: JSON.stringify({ metaDecks: this.metaDecks })
            });
            
            this.renderMetaDecks();
            this.showSuccess('Deck order updated successfully!');
        } catch (error) {
            console.error('Failed to reorder decks:', error);
            alert('Failed to reorder decks: ' + error.message);
        }
    }
    
    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #30d158;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1001;
            font-weight: 500;
        `;
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }
    
    bindEvents() {
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('adminPassword').value;
            await this.login(password);
        });
        
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });
        
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.showSection(section);
                
                if (section === 'metadecks') {
                    this.loadMetaDecks();
                }
            });
        });
        
        document.getElementById('addDeckBtn').addEventListener('click', () => {
            this.addNewDeck();
        });
        
        document.getElementById('deckForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveDeck();
        });
        
        document.getElementById('cancelEdit').addEventListener('click', () => {
            this.cancelEdit();
        });
        
        document.getElementById('deleteDeck').addEventListener('click', () => {
            if (this.currentEditingDeck) {
                this.deleteDeck(this.currentEditingDeck);
            }
        });
    }
}

const admin = new AdminPanel();
window.admin = admin;