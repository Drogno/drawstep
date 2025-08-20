/**
 * ============================================
 * DRAWSTEP - MAIN PAGE FUNCTIONALITY
 * ============================================
 * 
 * This script handles the main page interactions for the Drawstep project:
 * - Hamburger menu navigation
 * - Support modal overlay
 * - Keyboard shortcuts (ESC key)
 * 
 * @author Drawstep Project
 * @version 1.0
 */

// ============================================
// DOM ELEMENT REFERENCES
// ============================================

// Hamburger menu elements
const hamburgerBtn = document.getElementById('hamburgerBtn');
const menuOverlay = document.getElementById('menuOverlay');
const menuClose = document.getElementById('menuClose');

// Support overlay elements
const supportOverlay = document.getElementById('supportOverlay');
const supportClose = document.getElementById('supportClose');
const menuSupportBtn = document.getElementById('menuSupportBtn');

// Auth overlay elements
const loginOverlay = document.getElementById('loginOverlay');
const registerOverlay = document.getElementById('registerOverlay');
const loginClose = document.getElementById('loginClose');
const registerClose = document.getElementById('registerClose');
const menuLoginBtn = document.getElementById('menuLoginBtn');
const menuRegisterBtn = document.getElementById('menuRegisterBtn');
const menuLogoutBtn = document.getElementById('menuLogoutBtn');
const switchToRegister = document.getElementById('switchToRegister');
const switchToLogin = document.getElementById('switchToLogin');

// Auth forms
const mainLoginForm = document.getElementById('mainLoginForm');
const mainRegisterForm = document.getElementById('mainRegisterForm');

// ============================================
// HAMBURGER MENU FUNCTIONALITY
// ============================================

/**
 * Opens the hamburger menu overlay
 * Triggered when hamburger button is clicked
 */
hamburgerBtn.addEventListener('click', () => {
    menuOverlay.classList.add('show');
});

/**
 * Closes the hamburger menu overlay
 * Triggered when close button (×) is clicked
 */
menuClose.addEventListener('click', () => {
    menuOverlay.classList.remove('show');
});

/**
 * Closes hamburger menu when clicking outside the menu content
 * This provides intuitive UX - clicking the dark overlay closes the menu
 */
menuOverlay.addEventListener('click', (e) => {
    // Only close if clicking the overlay itself, not its contents
    if (e.target === menuOverlay) {
        menuOverlay.classList.remove('show');
    }
});

// ============================================
// SUPPORT OVERLAY FUNCTIONALITY
// ============================================

/**
 * Opens the support modal and closes hamburger menu
 * Triggered when "Support the Project" menu item is clicked
 */
menuSupportBtn.addEventListener('click', (e) => {
    e.preventDefault(); // Prevent default link behavior
    menuOverlay.classList.remove('show'); // Close hamburger menu first
    supportOverlay.classList.add('show'); // Open support overlay
});

/**
 * Closes the support overlay
 * Triggered when support modal close button (×) is clicked
 */
supportClose.addEventListener('click', () => {
    supportOverlay.classList.remove('show');
});

/**
 * Closes support overlay when clicking outside the modal content
 * This provides intuitive UX - clicking the dark overlay closes the modal
 */
supportOverlay.addEventListener('click', (e) => {
    // Only close if clicking the overlay itself, not its contents
    if (e.target === supportOverlay) {
        supportOverlay.classList.remove('show');
    }
});

// ============================================
// AUTH MODAL FUNCTIONALITY
// ============================================

/**
 * Opens the login modal and closes hamburger menu
 */
menuLoginBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    menuOverlay.classList.remove('show');
    loginOverlay.classList.add('show');
});

/**
 * Opens the register modal and closes hamburger menu
 */
menuRegisterBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    menuOverlay.classList.remove('show');
    registerOverlay.classList.add('show');
});

/**
 * Logout functionality from hamburger menu
 */
menuLogoutBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    menuOverlay.classList.remove('show');
    if (window.authManager) {
        window.authManager.logout();
    }
});

/**
 * Closes the login modal
 */
loginClose?.addEventListener('click', () => {
    loginOverlay.classList.remove('show');
});

/**
 * Closes the register modal
 */
registerClose?.addEventListener('click', () => {
    registerOverlay.classList.remove('show');
});

/**
 * Switch from login to register modal
 */
switchToRegister?.addEventListener('click', () => {
    loginOverlay.classList.remove('show');
    registerOverlay.classList.add('show');
});

/**
 * Switch from register to login modal
 */
switchToLogin?.addEventListener('click', () => {
    registerOverlay.classList.remove('show');
    loginOverlay.classList.add('show');
});

/**
 * Close auth modals when clicking outside
 */
loginOverlay?.addEventListener('click', (e) => {
    if (e.target === loginOverlay) {
        loginOverlay.classList.remove('show');
    }
});

registerOverlay?.addEventListener('click', (e) => {
    if (e.target === registerOverlay) {
        registerOverlay.classList.remove('show');
    }
});

/**
 * Handle login form submission
 */
mainLoginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (window.authManager) {
        const email = document.getElementById('mainLoginEmail').value;
        const password = document.getElementById('mainLoginPassword').value;
        
        const result = await window.authManager.login(email, password);
        if (result.success) {
            loginOverlay.classList.remove('show');
            updateMainMenuAuth();
        }
    }
});

/**
 * Handle register form submission
 */
mainRegisterForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (window.authManager) {
        const username = document.getElementById('mainRegisterUsername').value;
        const email = document.getElementById('mainRegisterEmail').value;
        const password = document.getElementById('mainRegisterPassword').value;
        
        const result = await window.authManager.register(username, email, password);
        if (result.success) {
            registerOverlay.classList.remove('show');
            updateMainMenuAuth();
        }
    }
});

/**
 * Updates the hamburger menu authentication section
 */
function updateMainMenuAuth() {
    const menuUserInfo = document.getElementById('menuUserInfo');
    const menuLoginOptions = document.getElementById('menuLoginOptions');
    const menuUsername = document.getElementById('menuUsername');

    if (window.authManager && window.authManager.isActive()) {
        const user = window.authManager.getUser();
        if (user) {
            if (user.guest) {
                // Guest mode: show login options instead of user info
                if (menuUserInfo) menuUserInfo.style.display = 'none';
                if (menuLoginOptions) menuLoginOptions.style.display = 'block';
            } else {
                // Logged in user: show user info
                if (menuUserInfo) menuUserInfo.style.display = 'block';
                if (menuLoginOptions) menuLoginOptions.style.display = 'none';
                
                if (menuUsername) {
                    menuUsername.textContent = user.username;
                    menuUsername.style.color = '#FFD34E';
                }
            }
        }
    } else {
        // Not logged in: show login options
        if (menuUserInfo) menuUserInfo.style.display = 'none';
        if (menuLoginOptions) menuLoginOptions.style.display = 'block';
    }
}

// Initialize auth UI when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure authManager is initialized
    setTimeout(updateMainMenuAuth, 100);
});

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

/**
 * Global keyboard event handler
 * Currently handles ESC key to close open overlays
 */
document.addEventListener('keydown', (e) => {
    // ESC key closes any open overlay
    if (e.key === 'Escape') {
        // Close hamburger menu if open
        if (menuOverlay.classList.contains('show')) {
            menuOverlay.classList.remove('show');
        }
        
        // Close support overlay if open
        if (supportOverlay.classList.contains('show')) {
            supportOverlay.classList.remove('show');
        }
        
        // Close auth overlays if open
        if (loginOverlay?.classList.contains('show')) {
            loginOverlay.classList.remove('show');
        }
        
        if (registerOverlay?.classList.contains('show')) {
            registerOverlay.classList.remove('show');
        }
    }
});