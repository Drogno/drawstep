/**
 * Cookie Consent Management System
 * DSGVO/GDPR compliant cookie banner and consent management
 */

class CookieConsent {
    constructor() {
        this.cookieName = 'drawstep_cookie_consent';
        this.cookieExpiry = 365; // days
        this.consentData = this.loadConsent();
        
        this.init();
    }

    init() {
        this.createBanner();
        this.createSettingsModal();
        this.bindEvents();
        
        // Show banner if no consent given
        if (!this.consentData) {
            this.showBanner();
        } else {
            // Apply current consent settings
            this.applyConsent();
        }
    }

    createBanner() {
        const banner = document.createElement('div');
        banner.className = 'cookie-banner';
        banner.id = 'cookieBanner';
        
        banner.innerHTML = `
            <div class="cookie-banner-content">
                <div class="cookie-banner-text">
                    <h4>🍪 Cookies & Datenschutz</h4>
                    <p>
                        Wir verwenden Cookies, um Ihnen die bestmögliche Erfahrung zu bieten. 
                        Einige sind notwendig für den Betrieb der Website, andere helfen uns bei der Analyse und Verbesserung. 
                        Weitere Informationen finden Sie in unserer <a href="datenschutz.html">Datenschutzerklärung</a>.
                    </p>
                </div>
                <div class="cookie-banner-buttons">
                    <button class="cookie-btn cookie-btn-accept" id="acceptAllCookies">
                        Alle akzeptieren
                    </button>
                    <button class="cookie-btn cookie-btn-settings" id="cookieSettings">
                        Einstellungen
                    </button>
                    <button class="cookie-btn cookie-btn-decline" id="declineAllCookies">
                        Nur notwendige
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(banner);
    }

    createSettingsModal() {
        const modal = document.createElement('div');
        modal.className = 'cookie-settings-overlay';
        modal.id = 'cookieSettingsModal';
        
        modal.innerHTML = `
            <div class="cookie-settings-content">
                <button class="cookie-settings-close" id="closeSettings">×</button>
                <div class="cookie-settings-header">
                    <h3>Cookie Einstellungen</h3>
                    <p>Wählen Sie aus, welche Cookies Sie akzeptieren möchten:</p>
                </div>
                
                <div class="cookie-category">
                    <div class="cookie-category-header">
                        <h4>Notwendige Cookies</h4>
                        <label class="cookie-toggle">
                            <input type="checkbox" id="essentialCookies" checked disabled>
                            <span class="cookie-slider"></span>
                        </label>
                    </div>
                    <p>Diese Cookies sind für das Funktionieren der Website unerlässlich und können nicht deaktiviert werden. Sie speichern Ihre Cookie-Präferenzen und gewährleisten grundlegende Funktionen.</p>
                </div>
                
                <div class="cookie-category">
                    <div class="cookie-category-header">
                        <h4>Funktionale Cookies</h4>
                        <label class="cookie-toggle">
                            <input type="checkbox" id="functionalCookies">
                            <span class="cookie-slider"></span>
                        </label>
                    </div>
                    <p>Diese Cookies ermöglichen erweiterte Funktionen und Personalisierung, wie das Speichern von Benutzerpräferenzen und Login-Status.</p>
                </div>
                
                <div class="cookie-category">
                    <div class="cookie-category-header">
                        <h4>Analyse Cookies</h4>
                        <label class="cookie-toggle">
                            <input type="checkbox" id="analyticsCookies">
                            <span class="cookie-slider"></span>
                        </label>
                    </div>
                    <p>Diese Cookies helfen uns zu verstehen, wie Besucher mit unserer Website interagieren, indem sie Informationen anonym sammeln und melden.</p>
                </div>
                
                <div class="cookie-settings-buttons">
                    <button class="cookie-btn cookie-btn-accept" id="saveSettings">
                        Einstellungen speichern
                    </button>
                    <button class="cookie-btn cookie-btn-decline" id="acceptOnlyEssential">
                        Nur notwendige akzeptieren
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    bindEvents() {
        // Banner buttons
        document.getElementById('acceptAllCookies')?.addEventListener('click', () => {
            this.acceptAll();
        });
        
        document.getElementById('declineAllCookies')?.addEventListener('click', () => {
            this.acceptOnlyEssential();
        });
        
        document.getElementById('cookieSettings')?.addEventListener('click', () => {
            this.showSettings();
        });

        // Settings modal buttons
        document.getElementById('saveSettings')?.addEventListener('click', () => {
            this.saveSettings();
        });
        
        document.getElementById('acceptOnlyEssential')?.addEventListener('click', () => {
            this.acceptOnlyEssential();
        });
        
        document.getElementById('closeSettings')?.addEventListener('click', () => {
            this.hideSettings();
        });

        // Close modal when clicking outside
        document.getElementById('cookieSettingsModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'cookieSettingsModal') {
                this.hideSettings();
            }
        });
    }

    showBanner() {
        const banner = document.getElementById('cookieBanner');
        if (banner) {
            setTimeout(() => banner.classList.add('show'), 100);
        }
    }

    hideBanner() {
        const banner = document.getElementById('cookieBanner');
        if (banner) {
            banner.classList.remove('show');
        }
    }

    showSettings() {
        const modal = document.getElementById('cookieSettingsModal');
        if (modal) {
            // Load current settings
            this.loadSettingsToModal();
            modal.classList.add('show');
        }
    }

    hideSettings() {
        const modal = document.getElementById('cookieSettingsModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    loadSettingsToModal() {
        if (this.consentData) {
            document.getElementById('functionalCookies').checked = this.consentData.functional || false;
            document.getElementById('analyticsCookies').checked = this.consentData.analytics || false;
        }
    }

    acceptAll() {
        const consent = {
            essential: true,
            functional: true,
            analytics: true,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        
        this.saveConsent(consent);
        this.hideBanner();
        this.hideSettings();
        this.applyConsent();
    }

    acceptOnlyEssential() {
        const consent = {
            essential: true,
            functional: false,
            analytics: false,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        
        this.saveConsent(consent);
        this.hideBanner();
        this.hideSettings();
        this.applyConsent();
    }

    saveSettings() {
        const consent = {
            essential: true, // Always true
            functional: document.getElementById('functionalCookies').checked,
            analytics: document.getElementById('analyticsCookies').checked,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        
        this.saveConsent(consent);
        this.hideBanner();
        this.hideSettings();
        this.applyConsent();
    }

    saveConsent(consent) {
        this.consentData = consent;
        
        // Save to localStorage (essential cookie)
        try {
            localStorage.setItem(this.cookieName, JSON.stringify(consent));
        } catch (e) {
            console.warn('Could not save cookie consent to localStorage:', e);
        }
        
        // Also save as cookie for server-side access
        this.setCookie(this.cookieName, JSON.stringify(consent), this.cookieExpiry);
    }

    loadConsent() {
        try {
            const stored = localStorage.getItem(this.cookieName);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.warn('Could not load cookie consent from localStorage:', e);
        }
        
        // Fallback to cookie
        const cookieValue = this.getCookie(this.cookieName);
        if (cookieValue) {
            try {
                return JSON.parse(cookieValue);
            } catch (e) {
                console.warn('Could not parse cookie consent:', e);
            }
        }
        
        return null;
    }

    applyConsent() {
        if (!this.consentData) return;

        // Apply functional cookies
        if (this.consentData.functional) {
            this.enableFunctionalCookies();
        } else {
            this.disableFunctionalCookies();
        }

        // Apply analytics cookies
        if (this.consentData.analytics) {
            this.enableAnalyticsCookies();
        } else {
            this.disableAnalyticsCookies();
        }
    }

    enableFunctionalCookies() {
        // Enable user preferences, login persistence, etc.
        console.log('Functional cookies enabled');
        document.body.classList.add('functional-cookies-enabled');
    }

    disableFunctionalCookies() {
        // Disable functional features that require cookies
        console.log('Functional cookies disabled');
        document.body.classList.remove('functional-cookies-enabled');
    }

    enableAnalyticsCookies() {
        // Enable analytics (Google Analytics, etc.)
        console.log('Analytics cookies enabled');
        document.body.classList.add('analytics-cookies-enabled');
        
        // Here you would initialize Google Analytics or other tracking
        // Example:
        // gtag('consent', 'update', {
        //     'analytics_storage': 'granted'
        // });
    }

    disableAnalyticsCookies() {
        // Disable analytics
        console.log('Analytics cookies disabled');
        document.body.classList.remove('analytics-cookies-enabled');
        
        // Here you would disable Google Analytics or other tracking
        // Example:
        // gtag('consent', 'update', {
        //     'analytics_storage': 'denied'
        // });
    }

    // Cookie utility functions
    setCookie(name, value, days) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
    }

    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    // Public API for managing consent
    hasConsent(type = 'essential') {
        if (!this.consentData) return false;
        return this.consentData[type] === true;
    }

    updateConsent() {
        this.showSettings();
    }

    resetConsent() {
        localStorage.removeItem(this.cookieName);
        this.setCookie(this.cookieName, '', -1);
        this.consentData = null;
        location.reload();
    }
}

// Initialize cookie consent when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.cookieConsent = new CookieConsent();
});

// Export for use in other scripts
window.CookieConsent = CookieConsent;