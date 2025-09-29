// ============================================
// SUPABASE AUTHENTICATION FOR MULLIGAN TRAINER
// ============================================

// Supabase CDN
const SUPABASE_URL = 'https://fzdhmxiqmadldklwelzr.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6ZGhteGlxbWFkbGRrbHdlbHpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjczNjUwNzYsImV4cCI6MjA0Mjk0MTA3Nn0.vnZGIvCtfZ1GjAAE9r7Drc8eWbPZE7ioITrOcCTyPgI'

let supabase = null

class SupabaseAuthManager {
  constructor() {
    this.user = null
    this.guestMode = localStorage.getItem('mulligan_guest_mode') === 'true'

    // Check if user comes from authenticated session (URL parameter)
    const urlParams = new URLSearchParams(window.location.search)
    this.fromAuthenticatedSession = urlParams.has('authenticated')
    this.accessToken = urlParams.get('token')

    console.log('SupabaseAuthManager constructor:', {
      fromAuthenticatedSession: this.fromAuthenticatedSession,
      hasToken: !!this.accessToken,
      guestMode: this.guestMode
    })

    this.init()
  }

  async init() {
    try {
      // Load Supabase library
      await this.loadSupabase()

      // If we have an access token from URL, restore session with it
      if (this.accessToken) {
        console.log('Found access token in URL, restoring session...', this.accessToken.substring(0, 20) + '...')
        try {
          // Try to set the session with the access token
          const { data, error } = await supabase.auth.setSession({
            access_token: this.accessToken,
            refresh_token: 'dummy' // Supabase needs this but we don't have it
          })

          if (error) {
            console.error('Error setting session with token:', error)
            // Fallback: try getUser instead
            const { data: userData, error: userError } = await supabase.auth.getUser(this.accessToken)
            if (userError) {
              console.error('Error getting user with token:', userError)
            } else if (userData.user) {
              console.log('Successfully got user with token:', userData.user.email)
              this.user = userData.user
              this.updateUI()
              return
            }
          } else if (data.user) {
            console.log('Successfully restored session for user:', data.user.email)
            this.user = data.user

            // Clean up URL by removing token parameter
            const url = new URL(window.location)
            url.searchParams.delete('token')
            window.history.replaceState({}, '', url)

            this.updateUI()
            return
          }
        } catch (tokenError) {
          console.error('Token restoration failed:', tokenError)
        }
      }

      // Get current session (fallback)
      const { data: { session } } = await supabase.auth.getSession()
      this.user = session?.user || null

      console.log('Supabase session found:', this.user ? this.user.email : 'No user')

      // Listen for auth changes
      supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        this.user = session?.user || null
        this.updateUI()
      })

      this.setupEventListeners()

      // If user is logged in, immediately hide welcome screen
      if (this.user) {
        console.log('User is logged in, hiding welcome screen immediately')
        this.updateUI()
      } else {
        this.conditionalUpdateUI()
      }
    } catch (error) {
      console.error('Failed to initialize Supabase auth:', error)
      // Fallback to guest mode
      this.enableGuestMode()
    }
  }

  async loadSupabase() {
    if (window.supabase) {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      return
    }

    // Load Supabase from CDN
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
      script.onload = () => {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
        resolve()
      }
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  conditionalUpdateUI() {
    // Welcome screen is now disabled by default, always proceed with UI update
    console.log('Welcome screen disabled, proceeding with UI update')

    // Check if user came from authenticated session via localStorage
    if (!this.user && !this.guestMode) {
      const tempUser = localStorage.getItem('drawstep_temp_user')
      if (tempUser) {
        try {
          const userData = JSON.parse(tempUser)
          // Check if the data is recent (within 5 minutes)
          if (Date.now() - userData.timestamp < 5 * 60 * 1000) {
            console.log('Found recent user data in localStorage:', userData.email)
            this.user = { email: userData.email, id: userData.id, guest: false }
            localStorage.removeItem('drawstep_temp_user') // Clean up
            this.updateUI()
            return
          } else {
            console.log('User data in localStorage is too old, removing')
            localStorage.removeItem('drawstep_temp_user')
          }
        } catch (e) {
          console.error('Error parsing temp user data:', e)
          localStorage.removeItem('drawstep_temp_user')
        }
      }

      // If no user and no token, enable guest mode automatically
      if (!this.user && !this.accessToken) {
        console.log('No user found, enabling guest mode automatically')
        this.enableGuestMode()
        return
      }
    }

    this.updateUI()
  }

  setupEventListeners() {
    // Login button handler
    document.addEventListener('click', (e) => {
      if (e.target.id === 'loginBtn' || e.target.closest('#loginBtn')) {
        e.preventDefault()
        this.redirectToLogin()
      }

      if (e.target.id === 'registerBtn' || e.target.closest('#registerBtn')) {
        e.preventDefault()
        this.redirectToRegister()
      }

      if (e.target.id === 'guestBtn' || e.target.closest('#guestBtn')) {
        e.preventDefault()
        this.enableGuestMode()
      }

      if (e.target.id === 'logoutBtn' || e.target.closest('#logoutBtn')) {
        e.preventDefault()
        this.logout()
      }
    })
  }

  redirectToLogin() {
    // Check if user is already logged in before redirecting
    if (this.user) {
      console.log('User already logged in, no need to redirect')
      this.updateUI()
      return
    }
    console.log('Redirecting to login page')
    window.location.href = 'http://localhost:3005/login'
  }

  redirectToRegister() {
    // Check if user is already logged in before redirecting
    if (this.user) {
      console.log('User already logged in, no need to redirect')
      this.updateUI()
      return
    }
    console.log('Redirecting to register page')
    window.location.href = 'http://localhost:3005/register'
  }

  enableGuestMode() {
    console.log('Enabling guest mode for mulligan trainer')
    this.guestMode = true
    this.user = { email: 'Guest', guest: true }
    localStorage.setItem('mulligan_guest_mode', 'true')
    this.updateUI()
  }

  async logout() {
    try {
      if (supabase) {
        await supabase.auth.signOut()
      }
    } catch (error) {
      console.error('Logout error:', error)
    }

    this.user = null
    this.guestMode = false
    localStorage.removeItem('mulligan_guest_mode')
    this.updateUI()
  }

  updateUI() {
    const authContainer = document.getElementById('authContainer')
    const userContainer = document.getElementById('userContainer')

    // Always keep welcome screen hidden
    if (authContainer) {
      authContainer.style.display = 'none'
    }

    // Show user status using the existing userContainer
    if (userContainer) {
      const displayName = this.user?.email || 'Guest'
      const isGuest = this.guestMode || !this.user

      userContainer.innerHTML = `
        <div style="background: rgba(63, 208, 201, 0.1); padding: 8px 16px; border-radius: 8px; border: 1px solid rgba(63, 208, 201, 0.3); display: inline-block;">
          <span style="color: #3FD0C9; font-weight: bold; font-size: 0.9rem;">Welcome, </span>
          <span style="color: #FFD34E; font-weight: bold; font-size: 0.9rem;">${displayName}</span>
          ${isGuest ? '<span style="color: #666; font-size: 0.8rem; margin-left: 8px;">(Guest)</span>' : ''}
          <span style="color: #D0D0D0; margin-left: 8px;">|</span>
          ${this.user ? '<button id="logoutBtn" style="background: none; border: none; color: #ff6b6b; cursor: pointer; font-size: 0.8rem; margin-left: 8px;">Logout</button>' : '<button id="loginBtn" style="background: none; border: none; color: #3FD0C9; cursor: pointer; font-size: 0.8rem; margin-left: 8px;">Login</button>'}
        </div>
      `
      userContainer.style.display = 'block'
    }

    console.log('UI updated - User:', this.user?.email || 'Guest', 'Guest mode:', this.guestMode)
  }

  isLoggedIn() {
    return !!(this.user || this.guestMode)
  }

  getCurrentUser() {
    return this.user || (this.guestMode ? { email: 'Guest', guest: true } : null)
  }

  getAuthToken() {
    return supabase?.auth?.getSession()?.then(({ data: { session } }) =>
      session?.access_token
    )
  }
}

// Initialize auth manager
window.authManager = new SupabaseAuthManager()

// Make functions globally available for backward compatibility
window.handleLoginClick = function() {
  console.log('Login button clicked')
  window.authManager.redirectToLogin()
}

window.handleGuestClick = function() {
  console.log('Guest button clicked')
  window.authManager.enableGuestMode()
}

console.log('Supabase Auth Manager loaded for Mulligan Trainer')