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
    }
});