// include-components.js (load with `defer`)
document.addEventListener('DOMContentLoaded', async () => {
  // Use root-absolute paths so it works from anywhere
  const ROOT = '/';

  // Known components; you can still pass a full URL in data-include
  const map = {
    header:         `${ROOT}assets/components/header.html`,
    footer:         `${ROOT}assets/components/footer.html`,
    'theme-switcher': `${ROOT}assets/components/theme-switcher.html`,
    blank:          `${ROOT}assets/components/blank.html`,
  };

  const targets = [...document.querySelectorAll('[data-include]')];

  await Promise.all(targets.map(async el => {
    try {
      let spec = el.getAttribute('data-include').trim();

      // Allow absolute/URL specs or map keys or fallback to /assets/components/<name>.html
      const url = spec.startsWith('/') || spec.startsWith('http')
        ? spec
        : (map[spec] ?? `${ROOT}assets/components/${spec}.html`);

      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

      const html = await res.text();
      el.outerHTML = html;             // Note: replaces the element (any listeners on it are lost)
    } catch (err) {
      console.warn('Include failed:', err);
    }
  }));

  // Fire once when all includes are done
  document.dispatchEvent(new Event('componentsLoaded'));
});
