/**
 * AI Studio — Shared Navbar Loader
 *
 * Fetches _navbar.html (which contains its own <style> block)
 * and injects it into .app-shell, then marks the correct
 * nav item active based on the current page filename.
 *
 * ONE file to rule them all. Edit _navbar.html, all pages update.
 */
(function () {
    // Map filename → data-navkey value
    const PAGE_MAP = {
        'AI Studio MVP Prototype.html': 'home',
        'AI Studio KB Prototype.html': 'kb',
        'AI Studio Advisor.html': 'advisor',
    };

    // IMPORTANT: decode %20 etc. so the filename matches the map
    const currentFile = decodeURIComponent(window.location.pathname.split('/').pop());
    const activeKey = PAGE_MAP[currentFile] || 'home';

    const shell = document.querySelector('.app-shell');
    if (!shell) { console.warn('[_navbar] .app-shell not found'); return; }

    // Resolve URL to _navbar.html relative to this script
    const me = document.querySelector('script[src*="_navbar.js"]');
    const base = me ? me.src.replace('_navbar.js', '') : './';
    const navURL = base + '_navbar.html';

    fetch(navURL)
        .then(r => { if (!r.ok) throw new Error('[_navbar] HTTP ' + r.status); return r.text(); })
        .then(html => {
            // Parse the fetched HTML
            const tmp = document.createElement('div');
            tmp.innerHTML = html;

            // Insert all nodes before the first child of app-shell (before <main>)
            const firstChild = shell.firstChild;
            while (tmp.firstChild) {
                shell.insertBefore(tmp.firstChild, firstChild);
            }

            // ── Mark the current page active ──────────────────────────
            shell.querySelectorAll('.nav-item[data-navkey]').forEach(a => {
                const isActive = (a.dataset.navkey === activeKey);
                a.classList.toggle('active', isActive);
                if (isActive) a.setAttribute('aria-current', 'page');
                else a.removeAttribute('aria-current');
            });

            // ── Close dropdown on outside click ───────────────────────
            document.addEventListener('click', e => {
                const dd = document.getElementById('account-dropdown');
                const trigger = document.getElementById('account-trigger');
                if (dd && trigger && !trigger.contains(e.target) && !dd.contains(e.target)) {
                    dd.classList.remove('open');
                    trigger.setAttribute('aria-expanded', 'false');
                }
            });
        })
        .catch(err => console.error(err));
})();
