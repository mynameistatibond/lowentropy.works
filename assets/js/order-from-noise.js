// order-from-noise.js
(function () {
  const host = document.getElementById('about-noise');
  if (!host) return;

  const c = document.createElement('canvas');
  host.appendChild(c);
  const ctx = c.getContext('2d');
  const dpr = Math.max(1, window.devicePixelRatio || 1);

  // ---- dynamic theme color (updates on theme switch) ----
  let THEME_COLOR = '#000';
  function computeThemeColor() {
    const s = getComputedStyle(host);
    // Try both tokens; fall back to computed text color
    const v =
      (s.getPropertyValue('--clr-txt')  || '').trim() ||
      (s.getPropertyValue('--clr-text') || '').trim() ||
      s.color || '#000';
    THEME_COLOR = v;
  }
  computeThemeColor();

  // Watch <html>/<body> for data-theme changes
  const mo = new MutationObserver(() => computeThemeColor());
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  mo.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

  // Config
  const N       = Number(host.dataset.n      || 240);
  const GRID    = Number(host.dataset.grid   || 28);
  const SNAP_R  = Number(host.dataset.snap   || 100);
  const RELAX   = Number(host.dataset.relax  || 0.3);
  const R_BASE  = Number(host.dataset.r      || 5);
  const OPACITY = Number(host.dataset.alpha  || 0.3);
  const DAMP    = Number(host.dataset.damp   || 0.95);
  const MARGIN  = Number(host.dataset.margin || 10);
  const HOME    = Number(host.dataset.home   || 0.008);

  let W = 0, H = 0, pts = [], mouse = null;

  function size() {
    const r = host.getBoundingClientRect();
    W = Math.max(320, Math.floor(r.width));
    H = Math.max(80,  Math.floor(r.height));
    c.width = W * dpr; c.height = H * dpr;
    c.style.width = W + 'px'; c.style.height = H + 'px';

    pts = Array.from({ length: N }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      bx: 0, by: 0,
      hx: Math.random() * W,
      hy: Math.random() * H
    }));
  }
  size();
  new ResizeObserver(size).observe(host);

  host.addEventListener('mousemove', (e) => {
    const rect = host.getBoundingClientRect();
    mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  });
  host.addEventListener('mouseleave', () => (mouse = null));

  function step() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = THEME_COLOR;   // ← now always current
    ctx.globalAlpha = OPACITY;

    for (const p of pts) {
      p.bx = (p.bx + (Math.random() - 0.5) * 0.6) * DAMP;
      p.by = (p.by + (Math.random() - 0.5) * 0.6) * DAMP;

      let tx = p.x + p.bx, ty = p.y + p.by;

      if (tx < MARGIN || tx > W - MARGIN) p.bx *= -0.6;
      if (ty < MARGIN || ty > H - MARGIN) p.by *= -0.6;
      if (tx < MARGIN) tx = MARGIN; else if (tx > W - MARGIN) tx = W - MARGIN;
      if (ty < MARGIN) ty = MARGIN; else if (ty > H - MARGIN) ty = H - MARGIN;

      if (mouse) {
        const dx = tx - mouse.x, dy = ty - mouse.y;
        const r = Math.hypot(dx, dy);
        if (r < SNAP_R) {
          const gx = Math.round(tx / GRID) * GRID;
          const gy = Math.round(ty / GRID) * GRID;
          const w = 1 - (r / SNAP_R);
          tx = tx * (1 - w) + gx * w;
          ty = ty * (1 - w) + gy * w;
        }
      }

      tx += (p.hx - p.x) * HOME;
      ty += (p.hy - p.y) * HOME;

      p.x += (tx - p.x) * RELAX;
      p.y += (ty - p.y) * RELAX;

      ctx.beginPath();
      ctx.arc(p.x, p.y, R_BASE, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    requestAnimationFrame(step);
  }

  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) step();
})();
