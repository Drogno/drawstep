class AdminPanel {
    constructor() {
        this.authToken = localStorage.getItem('adminToken');
        this.metaDecks = {};
        this.currentEditingDeck = null;
        this.users = [];
        this.filteredUsers = [];
        this.currentUser = null;
        this.currentSessionsPage = 1;
        this.init();
    }
    
    init() {
        // Hide all modals initially
        this.hideAllModals();
        
        if (!this.authToken) {
            this.showLoginModal();
        } else {
            this.initializePanel();
        }
        
        this.bindEvents();
    }
    
    showLoginModal() {
        // Hide all other modals first
        this.hideUserModal();
        this.hideConfirmModal();
        
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
            
            if (data.success) {
                this.authToken = data.token;
                localStorage.setItem('adminToken', this.authToken);
                this.hideLoginModal();
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
    
    logout() {
        localStorage.removeItem('adminToken');
        this.authToken = null;
        location.reload();
    }
    
    async apiRequest(url, options = {}) {
        const headers = {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        const response = await fetch(url, {
            ...options,
            headers
        });
        
        if (response.status === 401) {
            this.logout();
            throw new Error('Authentication failed');
        }
        
        return response.json();
    }
    
    async initializePanel() {
        await this.loadDashboardStats();
        await this.loadMetaDecks();
        await this.loadUsers();
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
                    <p>${this.getDeckCardCount(deck.list)} cards • ID: ${id}</p>
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
                } else if (section === 'users') {
                    this.loadUsers();
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

        // User management event listeners
        this.setupUserEventListeners();
    }

    // ============================================
    // USER MANAGEMENT METHODS
    // ============================================

    setupUserEventListeners() {
        // Search and filter
        const userSearch = document.getElementById('userSearch');
        const userStatusFilter = document.getElementById('userStatusFilter');
        
        if (userSearch) {
            userSearch.addEventListener('input', () => this.filterUsers());
        }
        
        if (userStatusFilter) {
            userStatusFilter.addEventListener('change', () => this.filterUsers());
        }

        // User detail modal
        const closeUserModal = document.getElementById('closeUserModal');
        if (closeUserModal) {
            closeUserModal.addEventListener('click', () => this.hideUserModal());
        }

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        // User edit form
        const userEditForm = document.getElementById('userEditForm');
        if (userEditForm) {
            userEditForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateUser();
            });
        }

        // User actions
        const toggleUserStatus = document.getElementById('toggleUserStatus');
        const deleteUser = document.getElementById('deleteUser');
        
        if (toggleUserStatus) {
            toggleUserStatus.addEventListener('click', () => this.toggleUserStatus());
        }
        
        if (deleteUser) {
            deleteUser.addEventListener('click', () => this.deleteUser());
        }

        // Confirmation modal
        const confirmCancel = document.getElementById('confirmCancel');
        const confirmOk = document.getElementById('confirmOk');
        
        if (confirmCancel) {
            confirmCancel.addEventListener('click', () => this.hideConfirmModal());
        }
        
        if (confirmOk) {
            confirmOk.addEventListener('click', () => this.confirmAction());
        }

        // Sessions pagination
        const prevSessionsPage = document.getElementById('prevSessionsPage');
        const nextSessionsPage = document.getElementById('nextSessionsPage');
        
        if (prevSessionsPage) {
            prevSessionsPage.addEventListener('click', () => this.loadUserSessions(this.currentSessionsPage - 1));
        }
        
        if (nextSessionsPage) {
            nextSessionsPage.addEventListener('click', () => this.loadUserSessions(this.currentSessionsPage + 1));
        }
    }

    async loadUsers() {
        try {
            this.users = await this.apiRequest('/admin/api/users');
            this.filteredUsers = [...this.users];
            this.renderUsers();
        } catch (error) {
            console.error('Failed to load users:', error);
            document.getElementById('usersTableBody').innerHTML = 
                '<tr><td colspan="7" class="loading">Error loading users</td></tr>';
        }
    }

    filterUsers() {
        const searchTerm = document.getElementById('userSearch')?.value.toLowerCase() || '';
        const statusFilter = document.getElementById('userStatusFilter')?.value || '';
        
        this.filteredUsers = this.users.filter(user => {
            const matchesSearch = !searchTerm || 
                user.username.toLowerCase().includes(searchTerm) ||
                user.email.toLowerCase().includes(searchTerm);
            
            const matchesStatus = !statusFilter || 
                (statusFilter === 'active' && user.is_active) ||
                (statusFilter === 'inactive' && !user.is_active);
            
            return matchesSearch && matchesStatus;
        });
        
        this.renderUsers();
    }

    renderUsers() {
        const tbody = document.getElementById('usersTableBody');
        
        if (this.filteredUsers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="loading">No users found</td></tr>';
            return;
        }
        
        tbody.innerHTML = this.filteredUsers.map(user => `
            <tr onclick="admin.showUserDetails(${user.id})" style="cursor: pointer;">
                <td>${user.id}</td>
                <td>${this.escapeHtml(user.username)}</td>
                <td>${this.escapeHtml(user.email)}</td>
                <td>
                    <span class="status-badge ${user.is_active ? 'active' : 'inactive'}">
                        ${user.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>${this.formatDate(user.created_at)}</td>
                <td>${user.last_login ? this.formatDate(user.last_login) : 'Never'}</td>
                <td onclick="event.stopPropagation()">
                    <div class="action-buttons">
                        <button class="btn-icon view" onclick="admin.showUserDetails(${user.id})" title="View Details">
                            👁️ View
                        </button>
                        <button class="btn-icon toggle" onclick="admin.quickToggleStatus(${user.id})" title="Toggle Status">
                            ${user.is_active ? '🔒' : '🔓'} ${user.is_active ? 'Disable' : 'Enable'}
                        </button>
                        <button class="btn-icon delete" onclick="admin.quickDeleteUser(${user.id})" title="Delete User">
                            🗑️ Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async showUserDetails(userId) {
        try {
            // Load user details
            const user = await this.apiRequest(`/admin/api/users/${userId}`);
            this.currentUser = user;
            
            // Populate form
            document.getElementById('editUserId').value = user.id;
            document.getElementById('editUsername').value = user.username;
            document.getElementById('editEmail').value = user.email;
            document.getElementById('editStatus').value = user.is_active ? '1' : '0';
            document.getElementById('userCreatedDate').textContent = this.formatDate(user.created_at);
            document.getElementById('userLastLogin').textContent = user.last_login ? this.formatDate(user.last_login) : 'Never';
            
            // Update modal title
            document.getElementById('userModalTitle').textContent = `User: ${user.username}`;
            
            // Show modal and load stats
            this.showUserModal();
            this.switchTab('info');
            await this.loadUserStats(userId);
            
        } catch (error) {
            console.error('Failed to load user details:', error);
            this.showError('Failed to load user details');
        }
    }

    async loadUserStats(userId) {
        try {
            console.log(`Loading stats for user ${userId}...`);
            const statsData = await this.apiRequest(`/admin/api/users/${userId}/stats`);
            console.log('Stats data received:', statsData);
            
            // Update statistics
            document.getElementById('userTotalSessions').textContent = statsData.stats.total_sessions;
            document.getElementById('userTotalHands').textContent = statsData.stats.total_hands_practiced;
            document.getElementById('userTotalMulligans').textContent = statsData.stats.total_mulligans;
            document.getElementById('userAvgDuration').textContent = 
                statsData.stats.avg_session_duration ? `${Math.round(statsData.stats.avg_session_duration)} min` : 'N/A';
            document.getElementById('userLastSession').textContent = 
                statsData.stats.last_session_date ? this.formatDate(statsData.stats.last_session_date) : 'Never';
            
            // Render recent sessions
            this.renderRecentSessions(statsData.recent_sessions);
            
        } catch (error) {
            console.error('Failed to load user stats:', error);
            console.error('Error details:', error.message);
            document.getElementById('userRecentSessions').innerHTML = '<p>Error loading statistics</p>';
        }
    }

    renderRecentSessions(sessions) {
        const container = document.getElementById('userRecentSessions');
        
        if (!sessions || sessions.length === 0) {
            container.innerHTML = '<p>No sessions found</p>';
            return;
        }
        
        container.innerHTML = sessions.map(session => `
            <div class="session-item">
                <div class="session-header">
                    <span class="session-deck">${this.escapeHtml(session.deck_name || 'Unknown Deck')}</span>
                    <span class="session-date">${this.formatDate(session.session_date)}</span>
                </div>
                <div class="session-stats">
                    <span>Hands: ${session.total_hands}</span>
                    <span>Mulligans: ${session.total_mulligans}</span>
                    <span>Duration: ${session.session_duration || 0} min</span>
                </div>
            </div>
        `).join('');
    }

    async loadUserSessions(page = 1) {
        if (!this.currentUser) return;
        
        try {
            const sessionData = await this.apiRequest(`/admin/api/users/${this.currentUser.id}/sessions?page=${page}&limit=10`);
            this.currentSessionsPage = page;
            
            // Render all sessions
            const container = document.getElementById('userAllSessions');
            if (!sessionData.sessions || sessionData.sessions.length === 0) {
                container.innerHTML = '<p>No sessions found</p>';
            } else {
                container.innerHTML = sessionData.sessions.map(session => `
                    <div class="session-item">
                        <div class="session-header">
                            <span class="session-deck">${this.escapeHtml(session.deck_name || 'Unknown Deck')}</span>
                            <span class="session-date">${this.formatDate(session.session_date)}</span>
                        </div>
                        <div class="session-stats">
                            <span>Hands: ${session.total_hands}</span>
                            <span>Mulligans: ${session.total_mulligans}</span>
                            <span>Cards Exchanged: ${session.total_cards_exchanged}</span>
                            <span>Duration: ${session.session_duration || 0} min</span>
                        </div>
                        ${session.notes ? `<div class="session-notes">${this.escapeHtml(session.notes)}</div>` : ''}
                    </div>
                `).join('');
            }
            
            // Update pagination
            this.updateSessionsPagination(sessionData.pagination);
            
        } catch (error) {
            console.error('Failed to load user sessions:', error);
            document.getElementById('userAllSessions').innerHTML = '<p>Error loading sessions</p>';
        }
    }

    updateSessionsPagination(pagination) {
        const prevBtn = document.getElementById('prevSessionsPage');
        const nextBtn = document.getElementById('nextSessionsPage');
        const pageInfo = document.getElementById('sessionsPageInfo');
        
        if (prevBtn) prevBtn.disabled = pagination.page <= 1;
        if (nextBtn) nextBtn.disabled = pagination.page >= pagination.pages;
        if (pageInfo) pageInfo.textContent = `Page ${pagination.page} of ${pagination.pages}`;
    }

    async updateUser() {
        try {
            const userId = document.getElementById('editUserId').value;
            const username = document.getElementById('editUsername').value.trim();
            const email = document.getElementById('editEmail').value.trim();
            const isActive = document.getElementById('editStatus').value === '1';
            
            if (!username || !email) {
                this.showError('Username and email are required');
                return;
            }
            
            const result = await this.apiRequest(`/admin/api/users/${userId}`, {
                method: 'PUT',
                body: JSON.stringify({ username, email, is_active: isActive })
            });
            
            this.showSuccess(result.message);
            await this.loadUsers();
            this.hideUserModal();
            
        } catch (error) {
            console.error('Failed to update user:', error);
            this.showError('Failed to update user: ' + error.message);
        }
    }

    async toggleUserStatus() {
        if (!this.currentUser) return;
        
        try {
            const result = await this.apiRequest(`/admin/api/users/${this.currentUser.id}/toggle-status`, {
                method: 'POST'
            });
            
            this.showSuccess(result.message);
            await this.loadUsers();
            await this.loadUserStats(this.currentUser.id);
            
            // Update form
            document.getElementById('editStatus').value = result.is_active ? '1' : '0';
            
        } catch (error) {
            console.error('Failed to toggle user status:', error);
            this.showError('Failed to toggle user status');
        }
    }

    deleteUser() {
        if (!this.currentUser) return;
        
        this.showConfirmModal(
            'Delete User',
            `Are you sure you want to delete user "${this.currentUser.username}"? This action cannot be undone and will delete all associated data.`,
            async () => {
                try {
                    const result = await this.apiRequest(`/admin/api/users/${this.currentUser.id}`, {
                        method: 'DELETE'
                    });
                    
                    this.showSuccess(result.message);
                    await this.loadUsers();
                    this.hideUserModal();
                    
                } catch (error) {
                    console.error('Failed to delete user:', error);
                    this.showError('Failed to delete user');
                }
            }
        );
    }

    async quickToggleStatus(userId) {
        event.stopPropagation();
        
        try {
            const result = await this.apiRequest(`/admin/api/users/${userId}/toggle-status`, {
                method: 'POST'
            });
            
            this.showSuccess(result.message);
            await this.loadUsers();
            
        } catch (error) {
            console.error('Failed to toggle user status:', error);
            this.showError('Failed to toggle user status');
        }
    }

    quickDeleteUser(userId) {
        event.stopPropagation();
        
        const user = this.users.find(u => u.id === userId);
        if (!user) return;
        
        this.showConfirmModal(
            'Delete User',
            `Are you sure you want to delete user "${user.username}"?`,
            async () => {
                try {
                    const result = await this.apiRequest(`/admin/api/users/${userId}`, {
                        method: 'DELETE'
                    });
                    
                    this.showSuccess(result.message);
                    await this.loadUsers();
                    
                } catch (error) {
                    console.error('Failed to delete user:', error);
                    this.showError('Failed to delete user');
                }
            }
        );
    }

    // ============================================
    // UI HELPER METHODS
    // ============================================

    showUserModal() {
        document.getElementById('userDetailModal').style.display = 'flex';
    }

    hideUserModal() {
        document.getElementById('userDetailModal').style.display = 'none';
        this.currentUser = null;
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
        
        // Load data for specific tabs
        if (tabName === 'sessions' && this.currentUser) {
            this.loadUserSessions(1);
        }
    }

    showConfirmModal(title, message, onConfirm) {
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        document.getElementById('confirmModal').style.display = 'flex';
        
        this.pendingConfirmAction = onConfirm;
    }

    hideConfirmModal() {
        document.getElementById('confirmModal').style.display = 'none';
        this.pendingConfirmAction = null;
    }

    async confirmAction() {
        if (this.pendingConfirmAction) {
            await this.pendingConfirmAction();
        }
        this.hideConfirmModal();
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        // Reuse existing success message system but with error styling
        const errorDiv = document.createElement('div');
        errorDiv.className = 'success-message error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4444;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1001;
            font-weight: 500;
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    hideAllModals() {
        // Hide all modals on page load
        const modals = ['loginModal', 'userDetailModal', 'confirmModal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'none';
            }
        });
    }
}

const admin = new AdminPanel();
window.admin = admin;