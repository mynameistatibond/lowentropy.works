document.addEventListener('DOMContentLoaded', async () => {
  // detect if current page is inside /pages/
  const isPages = window.location.pathname.includes('/pages/');
  const base = isPages ? '..' : '.';

  const targets = document.querySelectorAll('[data-include]');
  const map = {
    header: `${base}/assets/components/header.html`,
    footer: `${base}/assets/components/footer.html`,
    'theme-switcher': `${base}/assets/components/theme-switcher.html`
  };

  await Promise.all([...targets].map(async (el) => {
    const key = el.getAttribute('data-include');
    const url = map[key];
    if (!url) return;
    const res = await fetch(url, { cache: 'no-cache' });
    el.outerHTML = await res.text();

// notify that components changed
document.dispatchEvent(new Event('componentsLoaded'));
  }));
});
