// order-from-noise.js
// Subtle field of dots that locally "snaps to order" near the cursor.
// Theme-aware (uses --clr-txt if present). No dependencies.

(function () {
  const host = document.getElementById('about-noise');
  if (!host) return;

  // Use theme var --clr-txt; fallback to computed color
  const styles = getComputedStyle(host);
  const varTxt = (styles.getPropertyValue('--clr-txt') || '').trim();
  const THEME_COLOR = varTxt || styles.color || '#000';

  const c = document.createElement('canvas');
  host.appendChild(c);
  const ctx = c.getContext('2d');
  const dpr = Math.max(1, window.devicePixelRatio || 1);

  // Config (override via data-* on #about-noise)
  const N       = Number(host.dataset.n      || 240);   // number of dots
  const GRID    = Number(host.dataset.grid   || 28);    // grid snap size
  const SNAP_R  = Number(host.dataset.snap   || 100);    // cursor influence radius
  const RELAX   = Number(host.dataset.relax  || 0.3);  // easing toward target
  const R_BASE  = Number(host.dataset.r      || 4);   // dot radius
  const OPACITY = Number(host.dataset.alpha  || 0.5);  // dot opacity
  const DAMP    = Number(host.dataset.damp   || 0.95);  // drift damping (≤1)
  const MARGIN  = Number(host.dataset.margin || 10);     // soft bounds margin (px)
  const HOME    = Number(host.dataset.home   || 0.008); // pull back toward per-dot anchor

  let W = 0, H = 0, pts = [], mouse = null;

  function size() {
    const r = host.getBoundingClientRect();
    W = Math.max(320, Math.floor(r.width));
    H = Math.max(80,  Math.floor(r.height));
    c.width = W * dpr; c.height = H * dpr;
    c.style.width = W + 'px'; c.style.height = H + 'px';

    // Re-seed points on resize to keep density consistent (with per-dot home anchors)
    pts = Array.from({ length: N }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      bx: 0, by: 0,
      hx: Math.random() * W, // home x
      hy: Math.random() * H  // home y
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
    ctx.fillStyle = THEME_COLOR;
    ctx.globalAlpha = OPACITY;

    for (const p of pts) {
      // Damped random drift (prevents runaway)
      p.bx = (p.bx + (Math.random() - 0.5) * 0.6) * DAMP;
      p.by = (p.by + (Math.random() - 0.5) * 0.6) * DAMP;

      // Base target from drift
      let tx = p.x + p.bx, ty = p.y + p.by;

      // Soft reflect when hitting bounds (invert drift), then clamp once
      if (tx < MARGIN || tx > W - MARGIN) p.bx *= -0.6;
      if (ty < MARGIN || ty > H - MARGIN) p.by *= -0.6;
      if (tx < MARGIN) tx = MARGIN; else if (tx > W - MARGIN) tx = W - MARGIN;
      if (ty < MARGIN) ty = MARGIN; else if (ty > H - MARGIN) ty = H - MARGIN;

      // Local order near cursor: snap toward nearest grid point
      if (mouse) {
        const dx = tx - mouse.x, dy = ty - mouse.y;
        const r = Math.hypot(dx, dy);
        if (r < SNAP_R) {
          const gx = Math.round(tx / GRID) * GRID;
          const gy = Math.round(ty / GRID) * GRID;
          const w = 1 - (r / SNAP_R); // stronger near center
          tx = tx * (1 - w) + gx * w;
          ty = ty * (1 - w) + gy * w;
        }
      }

      // Gentle attraction back to each dot's "home" (prevents border accumulation)
      tx += (p.hx - p.x) * HOME;
      ty += (p.hy - p.y) * HOME;

      // Ease position toward target
      p.x += (tx - p.x) * RELAX;
      p.y += (ty - p.y) * RELAX;

      // Draw
      ctx.beginPath();
      ctx.arc(p.x, p.y, R_BASE, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    requestAnimationFrame(step);
  }

  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) step();
})();
