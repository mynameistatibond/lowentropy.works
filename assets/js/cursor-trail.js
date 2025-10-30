(() => {
  const c = document.getElementById('cursor-trail');
  const ctx = c.getContext('2d', { alpha: true });

  // Fit canvas to screen (retina-aware)
  function fit() {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    c.width  = Math.floor(innerWidth  * dpr);
    c.height = Math.floor(innerHeight * dpr);
    c.style.width  = innerWidth + 'px';
    c.style.height = innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener('resize', fit, { passive: true });
  fit();

  // Trail particles
  const trail = [];
  const MAX_PARTICLES = 400;        // cap for perf
  const BASE_SIZE = 3;              // px
  const LIFE = 3500;                 // ms lifespan per particle
  const FADE = 0.35 / LIFE;            // fade per ms

  // pick color based on your theme variable (fallback to #fff/#000)
  function pickColor() {
    const varColor = getComputedStyle(document.body)
      .getPropertyValue('--clr-text').trim();
    if (varColor) return varColor;
    const theme = document.documentElement.getAttribute('data-theme');
    return theme === 'dark' ? '#ffffff' : '#000000';
  }
  let COLOR = pickColor();
  // update on theme change (if you toggle data-theme)
  const mo = new MutationObserver(() => { COLOR = pickColor(); });
mo.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

  // Cursor → spawn particles
  let lastT = performance.now();
  addEventListener('mousemove', (e) => {
    const now = performance.now();
    const dt = Math.max(1, now - lastT);
    lastT = now;

    // spawn rate scales with speed a bit
    const vx = (e.movementX || 0);
    const vy = (e.movementY || 0);
    const speed = Math.hypot(vx, vy);
    const count = Math.min(6, 1 + Math.floor(speed / 6));

    if (speed < 4) return; // ignore slow micro-wiggles


    for (let i = 0; i < count; i++) {
  const angle = Math.random() * Math.PI * 9;
  const radius = 10 + Math.random() * 10; // distance from cursor centre
  const jitter = (Math.random() - 0.5) * 10; // optional micro-noise
  trail.push({
    x: e.clientX + Math.cos(angle) * radius + jitter,
    y: e.clientY + Math.sin(angle) * radius + jitter,
    r: BASE_SIZE + Math.random() * 10,
    life: LIFE,
    vx: -vx * 0.08 + (Math.random() - 0.5) * 0.8, // slight drift
    vy: -vy * 0.08 + (Math.random() - 0.5) * 0.8,
  });
}

    // cap
    if (trail.length > MAX_PARTICLES) trail.splice(0, trail.length - MAX_PARTICLES);
  }, { passive: true });

  // Render loop
  function tick(ts) {
    // fade canvas a bit each frame → smooth trail without hard clears
    ctx.fillStyle = 'rgba(0,0,0,0)'; // no background fill (transparent)
    ctx.clearRect(0, 0, c.width, c.height);

    // draw particles
    for (let i = trail.length - 1; i >= 0; i--) {
      const p = trail[i];
      p.life -= 16.7;                 // ~60fps
      if (p.life <= 0) { trail.splice(i, 1); continue; }

      p.x += p.vx;
      p.y += p.vy;

      const a = Math.max(0, p.life * FADE * 0.9); // opacity
      ctx.globalAlpha = a;
      ctx.fillStyle = COLOR;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 8);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();