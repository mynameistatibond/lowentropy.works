/**
 * Low Entropy Works - Cookie Consent System
 * Compliant with GDPR/ePrivacy ("implied rejection" by default).
 */

(function () {
    // --- Config ---
    const COOKIE_NAME = 'le_consent_v1';
    const COOKIE_DAYS = 180;

    // Default state: Only Essential is true.
    const DEFAULTS = {
        v: 1,
        essential: true,
        analytics: false,
        replay: false,
        ts: null
    };

    // Global State
    window.LE_CONSENT = { ...DEFAULTS };

    // --- Helpers ---

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    function setCookie(name, value, days) {
        const d = new Date();
        d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
        let expires = "expires=" + d.toUTCString();
        // Secure flag for HTTPS; SameSite=Lax for general navigation
        let secure = window.location.protocol === 'https:' ? '; Secure' : '';
        document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))}; ${expires}; path=/; SameSite=Lax${secure}`;
    }

    function loadConsent() {
        const raw = getCookie(COOKIE_NAME);
        if (raw) {
            try {
                const parsed = JSON.parse(decodeURIComponent(raw));
                // Basic validation: check version or keys
                if (parsed && typeof parsed.v === 'number') {
                    window.LE_CONSENT = parsed;
                    return true; // Found and valid
                }
            } catch (e) {
                console.warn('Consent cookie malformed, resetting.');
            }
        }
        return false; // Not found or invalid
    }

    function saveConsent(state) {
        state.ts = new Date().toISOString();
        state.v = DEFAULTS.v;
        window.LE_CONSENT = state;
        setCookie(COOKIE_NAME, state, COOKIE_DAYS);

        // Dispatch event for other scripts
        window.dispatchEvent(new CustomEvent('le:consent_updated', { detail: state }));

        // Hide UI
        hideBanner();
        hideModal();
    }

    // --- Analytics Gating ---
    // Helpers for other scripts to check permission
    window.LE_CAN_RUN_ANALYTICS = () => !!(window.LE_CONSENT && window.LE_CONSENT.analytics);
    window.LE_CAN_RUN_REPLAY = () => !!(window.LE_CONSENT && window.LE_CONSENT.replay);


    // --- UI Construction ---

    function createBanner() {
        if (document.getElementById('le-consent-banner')) return;

        const banner = document.createElement('div');
        banner.id = 'le-consent-banner';
        banner.innerHTML = `
            <div class="consent-wrapper">
                <div class="consent-content">
                    <div class="consent-title">Privacy & Cookies</div>
                    <p class="consent-text">
                        We process data to understand how the site is used. 
                        "Essential" cookies are needed for the site to work. 
                        Others help us improve the experience.
                    </p>
                </div>
                <div class="consent-actions">
                    <button id="btn-consent-manage" class="btn-consent">Customize</button>
                    <button id="btn-consent-essential" class="btn-consent">Reject Non-Essential</button>
                    <button id="btn-consent-accept" class="btn-consent primary">Accept All</button>
                </div>
            </div>
        `;
        document.body.appendChild(banner);

        // Bind events
        document.getElementById('btn-consent-accept').addEventListener('click', () => {
            saveConsent({ ...window.LE_CONSENT, analytics: true, replay: true });
        });

        document.getElementById('btn-consent-essential').addEventListener('click', () => {
            saveConsent({ ...window.LE_CONSENT, analytics: false, replay: false });
        });

        document.getElementById('btn-consent-manage').addEventListener('click', () => {
            showModal();
        });

        // Small delay for animation
        setTimeout(() => banner.classList.add('visible'), 100);
    }

    function hideBanner() {
        const banner = document.getElementById('le-consent-banner');
        if (banner) {
            banner.classList.remove('visible');
            setTimeout(() => banner.remove(), 350);
        }
    }

    function createModal() {
        if (document.getElementById('le-consent-modal-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'le-consent-modal-overlay';

        const isAnalytic = window.LE_CONSENT.analytics;
        const isReplay = window.LE_CONSENT.replay;

        overlay.innerHTML = `
            <div id="le-consent-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                <div class="modal-header">
                    <h2 id="modal-title">Privacy Preferences</h2>
                    <button class="modal-close" aria-label="Close">&times;</button>
                </div>
                <div class="modal-body">
                    <!-- Essential -->
                    <div class="consent-option">
                        <div class="option-info">
                            <h3>Essential</h3>
                            <p>Required for the website to function (e.g. remembering these settings).</p>
                        </div>
                        <div class="toggle-switch">
                            <input type="checkbox" checked disabled>
                            <span class="slider"></span>
                        </div>
                    </div>

                    <!-- Analytics -->
                    <div class="consent-option">
                        <div class="option-info">
                            <h3>Analytics</h3>
                            <p>Helps us understand visitor numbers and basic usage patterns (PostHog).</p>
                        </div>
                        <div class="toggle-switch">
                            <input type="checkbox" id="toggle-analytics" ${isAnalytic ? 'checked' : ''}>
                            <span class="slider"></span>
                        </div>
                    </div>

                    <!-- Replay -->
                    <div class="consent-option">
                        <div class="option-info">
                            <h3>Session Replay</h3>
                            <p>Allows us to debug issues by replaying sessions anonymously.</p>
                        </div>
                        <div class="toggle-switch">
                            <input type="checkbox" id="toggle-replay" ${isReplay ? 'checked' : ''}>
                            <span class="slider"></span>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-consent" id="modal-save">Save Preferences</button>
                    <button class="btn-consent primary" id="modal-accept-all">Accept All</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Bind events
        const closeBtn = overlay.querySelector('.modal-close');
        closeBtn.onclick = hideModal;

        // Close on backdrop click
        overlay.onclick = (e) => {
            if (e.target === overlay) hideModal();
        };

        // Save
        document.getElementById('modal-save').onclick = () => {
            const ana = document.getElementById('toggle-analytics').checked;
            const rep = document.getElementById('toggle-replay').checked;
            saveConsent({ ...window.LE_CONSENT, analytics: ana, replay: rep });
        };

        // Accept All inside modal
        document.getElementById('modal-accept-all').onclick = () => {
            saveConsent({ ...window.LE_CONSENT, analytics: true, replay: true });
        };

        // Accessibility Focus
        setTimeout(() => {
            overlay.classList.add('visible');
            closeBtn.focus();
        }, 50);
    }

    function showModal() {
        createModal();
    }

    function hideModal() {
        const overlay = document.getElementById('le-consent-modal-overlay');
        if (overlay) {
            overlay.classList.remove('visible');
            setTimeout(() => overlay.remove(), 250);
        }
    }


    // --- Initialization ---

    function init() {
        const hasConsent = loadConsent();

        // If we don't have a valid cookie, show banner
        if (!hasConsent) {
            // Wait for DOM to be safe
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', createBanner);
            } else {
                createBanner();
            }
        }

        // Attach to Footer Link (handled via polling/event because footer might be loaded async)
        // We observe the body for the footer link appearing, or use the custom 'componentsLoaded' event
        document.addEventListener('componentsLoaded', attachPrivacyLink);
        // Fallback in case it's already there
        if (document.readyState !== 'loading') attachPrivacyLink();
    }

    function attachPrivacyLink() {
        const link = document.getElementById('privacy-settings');
        if (link) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                showModal();
            });
        }
    }

    // Run immediately
    init();

})();
