// ============================================
// PROFILE PAGE FUNCTIONALITY
// ============================================
// Handles user profile display and interaction

class ProfileManager {
  constructor() {
    this.init();
  }

  async init() {
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.setupEventListeners();
        // Wait a bit for authManager to initialize
        setTimeout(() => this.checkAuthenticationState(), 100);
      });
    } else {
      this.setupEventListeners();
      // Wait a bit for authManager to initialize
      setTimeout(() => this.checkAuthenticationState(), 100);
    }

    // Listen for auth state changes
    window.addEventListener('authStateChanged', () => {
      this.checkAuthenticationState();
    });
  }

  setupEventListeners() {
    // Profile-specific login/register buttons
    const profileLoginBtn = document.getElementById('profileLoginBtn');
    const profileRegisterBtn = document.getElementById('profileRegisterBtn');
    const refreshProfileStatsBtn = document.getElementById('refreshProfileStatsBtn');

    if (profileLoginBtn) {
      profileLoginBtn.addEventListener('click', () => {
        if (window.authManager) {
          window.authManager.showLoginModal();
        }
      });
    }

    if (profileRegisterBtn) {
      profileRegisterBtn.addEventListener('click', () => {
        if (window.authManager) {
          window.authManager.showRegisterModal();
        }
      });
    }

    // Refresh stats button
    if (refreshProfileStatsBtn) {
      refreshProfileStatsBtn.addEventListener('click', () => {
        this.refreshStatistics();
      });
    }
  }

  async checkAuthenticationState() {
    const profileNotLoggedIn = document.getElementById('profileNotLoggedIn');
    const profileContent = document.getElementById('profileContent');

    console.log('Profile: Checking auth state...');
    console.log('Profile: authManager exists:', !!window.authManager);
    console.log('Profile: isLoggedIn:', window.authManager ? window.authManager.isLoggedIn() : false);
    console.log('Profile: user:', window.authManager ? window.authManager.getUser() : null);

    if (window.authManager && window.authManager.isLoggedIn()) {
      // User is logged in - show profile content
      console.log('Profile: User is logged in, showing profile content');
      if (profileNotLoggedIn) profileNotLoggedIn.style.display = 'none';
      if (profileContent) profileContent.style.display = 'block';

      // Load profile data
      await this.loadProfileData();
    } else {
      // User is not logged in - show login prompt
      console.log('Profile: User is not logged in, showing login prompt');
      if (profileNotLoggedIn) profileNotLoggedIn.style.display = 'block';
      if (profileContent) profileContent.style.display = 'none';
    }
  }

  async loadProfileData() {
    try {
      // Load user info
      await this.loadUserInfo();

      // Load statistics
      await this.loadStatistics();

      // Load recent sessions
      await this.loadRecentSessions();

    } catch (error) {
      console.error('Error loading profile data:', error);
      this.showError('Failed to load profile data. Please try refreshing the page.');
    }
  }

  async loadUserInfo() {
    const user = window.authManager.getUser();
    if (!user) return;

    // Update user info display
    const profileUsername = document.getElementById('profileUsername');
    const profileEmail = document.getElementById('profileEmail');
    const profileMemberSince = document.getElementById('profileMemberSince');
    const profileLastLogin = document.getElementById('profileLastLogin');

    if (profileUsername) {
      profileUsername.textContent = user.username || '-';
    }

    if (profileEmail) {
      profileEmail.textContent = user.email || '-';
    }

    // Try to get more detailed user info from API
    try {
      const response = await window.authManager.apiRequest('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        const userDetails = data.user;

        if (profileMemberSince && userDetails.created_at) {
          const memberDate = new Date(userDetails.created_at);
          profileMemberSince.textContent = memberDate.toLocaleDateString();
        }

        if (profileLastLogin && userDetails.last_login) {
          const lastLoginDate = new Date(userDetails.last_login);
          profileLastLogin.textContent = lastLoginDate.toLocaleDateString();
        }
      }
    } catch (error) {
      console.error('Error fetching detailed user info:', error);
    }
  }

  async loadStatistics() {
    try {
      const response = await window.authManager.apiRequest('/api/stats/user');

      if (response.ok) {
        const stats = await response.json();
        this.displayStatistics(stats);
      } else {
        console.error('Failed to load statistics');
        this.displayStatistics(null);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
      this.displayStatistics(null);
    }
  }

  displayStatistics(stats) {
    const statElements = {
      profileStatTotalHands: document.getElementById('profileStatTotalHands'),
      profileStatTotalMulligans: document.getElementById('profileStatTotalMulligans'),
      profileStatTotalSessions: document.getElementById('profileStatTotalSessions'),
      profileStatAvgDuration: document.getElementById('profileStatAvgDuration'),
      profileStatFavoriteDeck: document.getElementById('profileStatFavoriteDeck'),
      profileStatCurrentStreak: document.getElementById('profileStatCurrentStreak')
    };

    if (!stats) {
      // Show default values if stats couldn't be loaded
      Object.values(statElements).forEach(el => {
        if (el && el.id.includes('Duration')) {
          el.textContent = '0m';
        } else if (el && el.id.includes('Deck')) {
          el.textContent = 'None';
        } else if (el) {
          el.textContent = '0';
        }
      });
      return;
    }

    // Update statistics display
    if (statElements.profileStatTotalHands) {
      statElements.profileStatTotalHands.textContent = stats.total_hands_practiced || 0;
    }

    if (statElements.profileStatTotalMulligans) {
      statElements.profileStatTotalMulligans.textContent = stats.total_mulligans || 0;
    }

    if (statElements.profileStatTotalSessions) {
      statElements.profileStatTotalSessions.textContent = stats.total_sessions || 0;
    }

    if (statElements.profileStatAvgDuration) {
      const avgMinutes = Math.round((stats.average_session_duration || 0) / 60);
      statElements.profileStatAvgDuration.textContent = `${avgMinutes}m`;
    }

    if (statElements.profileStatFavoriteDeck) {
      statElements.profileStatFavoriteDeck.textContent = stats.favorite_deck || 'None';
    }

    if (statElements.profileStatCurrentStreak) {
      statElements.profileStatCurrentStreak.textContent = stats.current_streak || 0;
    }
  }

  async loadRecentSessions() {
    const container = document.getElementById('recentSessionsContainer');
    if (!container) return;

    try {
      const response = await window.authManager.apiRequest('/api/stats/sessions?limit=5');

      if (response.ok) {
        const data = await response.json();
        this.displayRecentSessions(data.sessions || []);
      } else {
        this.displayRecentSessions([]);
      }
    } catch (error) {
      console.error('Error loading recent sessions:', error);
      this.displayRecentSessions([]);
    }
  }

  displayRecentSessions(sessions) {
    const container = document.getElementById('recentSessionsContainer');
    if (!container) return;

    if (!sessions || sessions.length === 0) {
      container.innerHTML = `
        <div class="no-sessions-message">
          <p style="text-align: center; color: #888; font-style: italic;">
            📝 No training sessions yet. Start practicing in the Mulligan Trainer to see your sessions here!
          </p>
        </div>
      `;
      return;
    }

    const sessionsHTML = sessions.map(session => {
      const sessionDate = new Date(session.session_date);
      const duration = Math.round(session.session_duration / 60);

      return `
        <div class="session-card">
          <div class="session-header">
            <div class="session-deck-name">${session.deck_name || 'Unknown Deck'}</div>
            <div class="session-date">${sessionDate.toLocaleDateString()}</div>
          </div>
          <div class="session-stats">
            <span class="session-stat">🎯 ${session.total_hands} hands</span>
            <span class="session-stat">🎲 ${session.total_mulligans} mulligans</span>
            <span class="session-stat">⏱️ ${duration}m</span>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = sessionsHTML;
  }

  async refreshStatistics() {
    const refreshBtn = document.getElementById('refreshProfileStatsBtn');
    if (refreshBtn) {
      const originalText = refreshBtn.textContent;
      refreshBtn.textContent = '🔄 Loading...';
      refreshBtn.disabled = true;
    }

    try {
      await this.loadStatistics();
      await this.loadRecentSessions();
    } catch (error) {
      console.error('Error refreshing statistics:', error);
    } finally {
      if (refreshBtn) {
        refreshBtn.textContent = '🔄 Refresh Stats';
        refreshBtn.disabled = false;
      }
    }
  }

  showError(message) {
    // Create or update error message
    let errorContainer = document.getElementById('profileErrorMessage');
    if (!errorContainer) {
      errorContainer = document.createElement('div');
      errorContainer.id = 'profileErrorMessage';
      errorContainer.style.cssText = `
        background: rgba(255, 68, 68, 0.1);
        border: 1px solid #ff4444;
        border-radius: 8px;
        padding: 15px;
        margin: 20px 0;
        color: #ff4444;
        text-align: center;
      `;

      const profileContent = document.getElementById('profileContent');
      if (profileContent) {
        profileContent.insertBefore(errorContainer, profileContent.firstChild);
      }
    }

    errorContainer.innerHTML = `⚠️ ${message}`;

    // Remove error after 10 seconds
    setTimeout(() => {
      if (errorContainer && errorContainer.parentNode) {
        errorContainer.parentNode.removeChild(errorContainer);
      }
    }, 10000);
  }
}

// Initialize profile manager when the page loads
const profileManager = new ProfileManager();