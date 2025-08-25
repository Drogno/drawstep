// ============================================
// AUTHENTICATION FRONTEND
// ============================================
// Handles user authentication in the frontend

class AuthManager {
  constructor() {
    this.token = localStorage.getItem('drawstep_token');
    this.user = null;
    this.guestMode = localStorage.getItem('drawstep_guest_mode') === 'true';
    this.init();
  }

  async init() {
    if (this.token) {
      await this.validateToken();
    } else if (this.guestMode) {
      // User previously chose guest mode
      this.user = { username: 'Guest', guest: true };
    }
    
    // Wait for DOM to be fully loaded before setting up listeners
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.setupEventListeners();
        // Only update UI if we're not on the mulligan page with authContainer
        this.conditionalUpdateUI();
      });
    } else {
      this.setupEventListeners();
      // Only update UI if we're not on the mulligan page with authContainer
      this.conditionalUpdateUI();
    }
  }

  conditionalUpdateUI() {
    const authContainer = document.getElementById('authContainer');
    
    // If authContainer exists and user hasn't made a choice yet, don't hide it
    if (authContainer && !this.token && !this.guestMode) {
      // Don't update UI - let the user see the welcome screen
      return;
    }
    
    // Otherwise, proceed with normal UI update
    this.updateUI();
  }

  // ============================================
  // TOKEN MANAGEMENT
  // ============================================

  async validateToken() {
    try {
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (response.ok) {
        await this.getCurrentUser();
        return true;
      } else {
        this.logout();
        return false;
      }
    } catch (error) {
      console.error('Token validation error:', error);
      this.logout();
      return false;
    }
  }

  async getCurrentUser() {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.user = data.user;
        return this.user;
      }
    } catch (error) {
      console.error('Get user error:', error);
    }
    return null;
  }

  // ============================================
  // AUTHENTICATION METHODS
  // ============================================

  async register(username, email, password) {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();

      if (response.ok) {
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('drawstep_token', this.token);
        this.updateUI();
        this.showMessage('Registration successful! Welcome to DRAWSTEP!', 'success');
        return { success: true, data };
      } else {
        this.showMessage(data.error || 'Registration failed', 'error');
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Registration error:', error);
      this.showMessage('Registration failed. Please try again.', 'error');
      return { success: false, error: error.message };
    }
  }

  async login(email, password) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('drawstep_token', this.token);
        this.updateUI();
        this.showMessage(`Welcome back, ${data.user.username}!`, 'success');
        return { success: true, data };
      } else {
        this.showMessage(data.error || 'Login failed', 'error');
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showMessage('Login failed. Please try again.', 'error');
      return { success: false, error: error.message };
    }
  }

  async logout() {
    try {
      if (this.token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    }

    this.token = null;
    this.user = null;
    this.guestMode = false;
    localStorage.removeItem('drawstep_token');
    localStorage.removeItem('drawstep_guest_mode');
    this.updateUI();
    this.showMessage('Logged out successfully', 'success');
  }

  // Enable guest mode
  enableGuestMode() {
    this.guestMode = true;
    this.user = { username: 'Guest', guest: true };
    localStorage.setItem('drawstep_guest_mode', 'true');
    this.updateUI();
    this.showMessage('Welcome! Using guest mode - progress will not be saved.', 'info');
  }

  // ============================================
  // UI MANAGEMENT
  // ============================================

  setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Guest mode and login options (main buttons)
    const continueAsGuestBtn = document.getElementById('continueAsGuest');
    const showLoginOptionsBtn = document.getElementById('showLoginOptions');
    
    // Menu-based auth buttons (global navigation)
    const menuGuestBtn = document.getElementById('menuGuestBtn');
    const menuLoginBtn = document.getElementById('menuLoginBtn');
    const menuRegisterBtn = document.getElementById('menuRegisterBtn');
    const menuLogoutBtn = document.getElementById('menuLogoutBtn');
    
    console.log('Guest button found:', !!continueAsGuestBtn);
    console.log('Login options button found:', !!showLoginOptionsBtn);
    console.log('Menu guest button found:', !!menuGuestBtn);
    console.log('Menu login button found:', !!menuLoginBtn);
    console.log('Menu register button found:', !!menuRegisterBtn);
    
    if (continueAsGuestBtn) {
      continueAsGuestBtn.addEventListener('click', () => {
        console.log('Guest button clicked!');
        this.enableGuestMode();
      });
    }
    
    if (showLoginOptionsBtn) {
      showLoginOptionsBtn.addEventListener('click', () => {
        console.log('Show login options clicked!');
        this.showLoginOptionsContainer();
      });
    }

    // Menu auth buttons
    if (menuGuestBtn) {
      menuGuestBtn.addEventListener('click', () => {
        console.log('Menu guest button clicked!');
        this.enableGuestMode();
        this.closeMenu();
      });
    }

    if (menuLoginBtn) {
      menuLoginBtn.addEventListener('click', () => {
        console.log('Menu login button clicked!');
        this.showLoginModal();
        this.closeMenu();
      });
    }

    if (menuRegisterBtn) {
      menuRegisterBtn.addEventListener('click', () => {
        console.log('Menu register button clicked!');
        this.showRegisterModal();
        this.closeMenu();
      });
    }

    if (menuLogoutBtn) {
      menuLogoutBtn.addEventListener('click', () => {
        console.log('Menu logout button clicked!');
        this.logout();
        this.closeMenu();
      });
    }

    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        await this.login(email, password);
      });
    }

    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        await this.register(username, email, password);
      });
    }

    // Main page login/register forms (modals)
    const mainLoginForm = document.getElementById('mainLoginForm');
    if (mainLoginForm) {
      mainLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('mainLoginEmail').value;
        const password = document.getElementById('mainLoginPassword').value;
        await this.login(email, password);
        this.hideLoginModal();
      });
    }

    const mainRegisterForm = document.getElementById('mainRegisterForm');
    if (mainRegisterForm) {
      mainRegisterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('mainRegisterUsername').value;
        const email = document.getElementById('mainRegisterEmail').value;
        const password = document.getElementById('mainRegisterPassword').value;
        await this.register(username, email, password);
        this.hideRegisterModal();
      });
    }

    // Modal close buttons
    const loginClose = document.getElementById('loginClose');
    if (loginClose) {
      loginClose.addEventListener('click', () => this.hideLoginModal());
    }

    const registerClose = document.getElementById('registerClose');
    if (registerClose) {
      registerClose.addEventListener('click', () => this.hideRegisterModal());
    }

    // Modal switching
    const switchToRegister = document.getElementById('switchToRegister');
    if (switchToRegister) {
      switchToRegister.addEventListener('click', () => {
        this.hideLoginModal();
        this.showRegisterModal();
      });
    }

    const switchToLogin = document.getElementById('switchToLogin');
    if (switchToLogin) {
      switchToLogin.addEventListener('click', () => {
        this.hideRegisterModal();
        this.showLoginModal();
      });
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }

    // Upgrade to account button (for guests)
    const upgradeBtn = document.getElementById('upgradeToAccountBtn');
    if (upgradeBtn) {
      upgradeBtn.addEventListener('click', () => this.showUpgradeToAccount());
    }

    // Show register/login toggles
    const showRegisterBtn = document.getElementById('showRegister');
    const showLoginBtn = document.getElementById('showLogin');
    
    if (showRegisterBtn) {
      showRegisterBtn.addEventListener('click', () => this.showRegisterForm());
    }
    
    if (showLoginBtn) {
      showLoginBtn.addEventListener('click', () => this.showLoginForm());
    }
  }

  updateUI() {
    const authContainer = document.getElementById('authContainer');
    const userContainer = document.getElementById('userContainer');
    const mainContent = document.getElementById('mainContent');

    if (this.isLoggedIn() || this.guestMode) {
      // User is logged in or using guest mode
      if (authContainer) authContainer.style.display = 'none';
      if (userContainer) {
        userContainer.style.display = 'block';
        this.updateUserDisplay();
      }
      if (mainContent) mainContent.style.display = 'block';
    } else {
      // User is not logged in and not in guest mode - show auth container
      if (authContainer) authContainer.style.display = 'block';
      if (userContainer) userContainer.style.display = 'none';
      if (mainContent) mainContent.style.display = 'none';
    }

    // Update global menu auth section
    this.updateMenuAuthSection();

    // Also update main menu auth section if function exists
    if (typeof updateMainMenuAuth === 'function') {
      updateMainMenuAuth();
    }
    
    // Also update mulligan menu auth section if function exists
    if (typeof updateMulliganMenuAuth === 'function') {
      updateMulliganMenuAuth();
    }
  }

  updateMenuAuthSection() {
    const menuUserInfo = document.getElementById('menuUserInfo');
    const menuLoginOptions = document.getElementById('menuLoginOptions');
    const menuUsernameSpan = document.getElementById('menuUsername');

    if (this.isLoggedIn() || this.guestMode) {
      // Show user info, hide login options
      if (menuUserInfo) menuUserInfo.style.display = 'block';
      if (menuLoginOptions) menuLoginOptions.style.display = 'none';
      
      // Update username display
      if (menuUsernameSpan && this.user) {
        menuUsernameSpan.textContent = this.user.username;
        if (this.user.guest) {
          menuUsernameSpan.textContent += ' (Guest)';
        }
      }
    } else {
      // Show login options, hide user info
      if (menuUserInfo) menuUserInfo.style.display = 'none';
      if (menuLoginOptions) menuLoginOptions.style.display = 'block';
    }
  }

  updateUserDisplay() {
    if (this.user) {
      const usernameDisplay = document.getElementById('usernameDisplay');
      const userEmailDisplay = document.getElementById('userEmailDisplay');
      const upgradeBtn = document.getElementById('upgradeToAccountBtn');
      
      if (usernameDisplay) {
        usernameDisplay.textContent = this.user.username;
        // Add guest indicator
        if (this.user.guest) {
          usernameDisplay.style.color = '#FFD34E';
          usernameDisplay.textContent += ' (Guest Mode)';
          // Show upgrade button for guests
          if (upgradeBtn) upgradeBtn.style.display = 'inline';
        } else {
          // Hide upgrade button for logged in users
          if (upgradeBtn) upgradeBtn.style.display = 'none';
        }
      }
      if (userEmailDisplay && this.user.email) {
        userEmailDisplay.textContent = this.user.email;
      }
    }
  }

  showUpgradeToAccount() {
    this.guestMode = false;
    localStorage.removeItem('drawstep_guest_mode');
    this.user = null;
    this.updateUI();
    this.showMessage('Please create an account to save your progress permanently', 'info');
  }

  showLoginOptionsContainer() {
    const loginOptionsContainer = document.getElementById('loginOptionsContainer');
    if (loginOptionsContainer) {
      loginOptionsContainer.style.display = 'block';
    }
  }

  showLoginForm() {
    const loginContainer = document.getElementById('loginContainer');
    const registerContainer = document.getElementById('registerContainer');
    
    if (loginContainer) loginContainer.style.display = 'block';
    if (registerContainer) registerContainer.style.display = 'none';
  }

  showRegisterForm() {
    const loginContainer = document.getElementById('loginContainer');
    const registerContainer = document.getElementById('registerContainer');
    
    if (loginContainer) loginContainer.style.display = 'none';
    if (registerContainer) registerContainer.style.display = 'block';
  }

  // Modal management methods
  showLoginModal() {
    const modal = document.getElementById('loginOverlay');
    if (modal) {
      modal.style.display = 'flex';
    }
  }

  hideLoginModal() {
    const modal = document.getElementById('loginOverlay');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  showRegisterModal() {
    const modal = document.getElementById('registerOverlay');
    if (modal) {
      modal.style.display = 'flex';
    }
  }

  hideRegisterModal() {
    const modal = document.getElementById('registerOverlay');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  closeMenu() {
    const menuOverlay = document.getElementById('menuOverlay');
    if (menuOverlay) {
      menuOverlay.classList.remove('show');
    }
  }

  showMessage(message, type = 'info') {
    // Create or get message container
    let messageContainer = document.getElementById('authMessages');
    if (!messageContainer) {
      messageContainer = document.createElement('div');
      messageContainer.id = 'authMessages';
      messageContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        max-width: 400px;
      `;
      document.body.appendChild(messageContainer);
    }

    // Create message element
    const messageEl = document.createElement('div');
    messageEl.style.cssText = `
      background: ${type === 'error' ? '#ff4444' : type === 'success' ? '#44ff44' : '#4444ff'};
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 8px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      animation: slideIn 0.3s ease;
    `;
    messageEl.textContent = message;

    // Add CSS animation
    if (!document.getElementById('authMessageStyles')) {
      const style = document.createElement('style');
      style.id = 'authMessageStyles';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    messageContainer.appendChild(messageEl);

    // Remove message after 5 seconds
    setTimeout(() => {
      messageEl.remove();
    }, 5000);
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  isLoggedIn() {
    return !!(this.token && this.user && !this.user.guest);
  }

  isActive() {
    return this.isLoggedIn() || this.guestMode;
  }

  getToken() {
    return this.token;
  }

  getUser() {
    return this.user;
  }

  // Make authenticated API requests
  async apiRequest(url, options = {}) {
    const defaultHeaders = {
      'Content-Type': 'application/json'
    };

    if (this.token) {
      defaultHeaders['Authorization'] = `Bearer ${this.token}`;
    }

    const mergedOptions = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, mergedOptions);
      
      if (response.status === 401) {
        // Token expired or invalid
        this.logout();
        throw new Error('Session expired. Please log in again.');
      }

      return response;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }
}

// Create global auth manager instance
window.authManager = new AuthManager();