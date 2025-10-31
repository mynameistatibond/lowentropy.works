(() => {



let play = 1;            // current motion (0..1)
let targetPlay = 1;      // where we want to go
let phase = 0;           // accumulated animation phase
let lastT = 0;           // last timestamp (ms)

  const host = document.querySelector('.voronoi-breathe');
  if (!host || !window.d3) return;

  // Config
  const CELLS = 120;          // density
  const SPEED = 0.05;        // breathing speed
  const AMP   = 20;          // px amplitude of motion
  const WIDTH_MIN = 480;     // reduce cells on small widths

  // SVG
  const NS  = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  host.appendChild(svg);

  // --- Per-cell vignette gradient (soft center -> fade to edges) ---
  const defs = document.createElementNS(NS, 'defs');
  const grad = document.createElementNS(NS, 'radialGradient');
  grad.id = 'cellShade';
  grad.setAttribute('gradientUnits', 'objectBoundingBox'); // 0..1 per cell bbox
  grad.setAttribute('cx', '50%');
  grad.setAttribute('cy', '50%');
  grad.setAttribute('r',  '85%');
  grad.setAttribute('spreadMethod', 'pad');

  const sA = document.createElementNS(NS, 'stop'); // center
  sA.setAttribute('offset', '0%');
  sA.setAttribute('stop-color', 'currentColor');
  sA.setAttribute('stop-opacity', '0.25');

  const sB = document.createElementNS(NS, 'stop'); // mid
  sB.setAttribute('offset', '30%');
  sB.setAttribute('stop-color', 'currentColor');
  sB.setAttribute('stop-opacity', '0.1');

  const sC = document.createElementNS(NS, 'stop'); // edge
  sC.setAttribute('offset', '65%');
  sC.setAttribute('stop-color', 'currentColor');
  sC.setAttribute('stop-opacity', '0.85');

  grad.appendChild(sA); grad.appendChild(sB); grad.appendChild(sC);
  defs.appendChild(grad);
  svg.appendChild(defs);
  // ------------------------------------------------------------------

  // Responsive setup
  let W=0, H=0, sites=[], base=[], phases=[], rafId=null, running=true;
  const ro = new ResizeObserver(setup);
  ro.observe(host);

  function setup(){
    const rect = host.getBoundingClientRect();
    W = Math.max(1, Math.floor(rect.width));
    H = Math.max(1, Math.floor(rect.height));
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    const n = W < WIDTH_MIN ? Math.max(36, Math.floor(CELLS * 0.8)) : CELLS;

    base   = Array.from({length:n}, () => ({ x: Math.random()*W, y: Math.random()*H }));
    phases = base.map(() => ({
      px: Math.random()*Math.PI*2, py: Math.random()*Math.PI*2,
      fx: 0.6 + Math.random()*0.8, fy: 0.6 + Math.random()*0.8
    }));

    // (Re)build paths
    svg.querySelectorAll('path').forEach(p => p.remove());
    for (let i=0; i<n; i++){
      const p = document.createElementNS(NS, 'path');
      // tint for gradient via currentColor; tracks theme var --v-shade
      p.style.color = getComputedStyle(host).getPropertyValue('--v-shade') || '#222';
      // ensure gradient fill is applied even if CSS didn't
      p.setAttribute('fill', 'url(#cellShade)');
      svg.appendChild(p);
    }

    cancelAnimationFrame(rafId);
    running = true;
    tick(0);
  }

  // Polygon -> path data
  function toPath(poly){
    if (!poly || poly.length === 0) return '';
    let d = `M${poly[0][0]},${poly[0][1]}`;
    for (let i=1; i<poly.length; i++) d += `L${poly[i][0]},${poly[i][1]}`;
    return d + 'Z';
  }

  function tick(t){
    if (!running) return;
    const tt = (t/1000) * (0.5 + SPEED);

    // tiny sinusoidal offsets = “breathing”
    sites = base.map((b,i) => {
      const ph = phases[i];
      return {
        x: b.x + AMP * Math.sin(tt * ph.fx + ph.px),
        y: b.y + AMP * Math.cos(tt * ph.fy + ph.py)
      };
    });

    const delaunay = d3.Delaunay.from(sites, p => p.x, p => p.y);
    const v = delaunay.voronoi([0,0,W,H]);

    const nodes = svg.querySelectorAll('path');
    for (let i=0; i<nodes.length; i++){
      nodes[i].setAttribute('d', toPath(v.cellPolygon(i)));
      // keep vignette tint synced to CSS var (theme toggle)
      nodes[i].style.color = getComputedStyle(host).getPropertyValue('--v-shade') || '#222';
    }

    rafId = requestAnimationFrame(tick);
  }

  // Respect reduced motion
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  function motion(){ running = !mq.matches; if (running) tick(0); }
  mq.addEventListener ? mq.addEventListener('change', motion) : mq.addListener(motion);
  motion();










  function tick(t){
  // time delta in seconds
  const dt = lastT ? (t - lastT) / 1000 : 0;
  lastT = t;

  // ease play toward target (0.12 ≈ 120ms-ish feel; lower is slower)
  play += (targetPlay - play) * 0.025;
  if (play < 0.0005 && targetPlay === 0) play = 0; // snap tiny residue

  // advance phase only by the current play amount
  phase += dt * (0.5 + SPEED) * play;

  // use `phase` (not raw time) for the trig
  sites = base.map((b, i) => {
    const ph = phases[i];
    return {
      x: b.x + AMP * play * Math.sin(phase * ph.fx + ph.px),
      y: b.y + AMP * play * Math.cos(phase * ph.fy + ph.py)
    };
  });

  const delaunay = d3.Delaunay.from(sites, p => p.x, p => p.y);
  const v = delaunay.voronoi([0,0,W,H]);

  const nodes = svg.querySelectorAll('path');
  for (let i=0; i<nodes.length; i++){
    nodes[i].setAttribute('d', toPath(v.cellPolygon(i)));
    nodes[i].style.color = getComputedStyle(host).getPropertyValue('--v-shade') || '#222';
  }

  requestAnimationFrame(tick);
}


// Hover: fade OUT to pause, fade IN to resume
host.addEventListener('mouseenter', () => { targetPlay = 0; });
host.addEventListener('mouseleave', () => { targetPlay = 1; });



document.addEventListener('visibilitychange', () => {
  targetPlay = document.hidden ? 0 : 1;
  if (!document.hidden) requestAnimationFrame(tick); // ensure restart
});




// Stop when tab is hidden; resume when visible
document.addEventListener('visibilitychange', () => {
  running = !document.hidden;
  if (running) tick(0);
});






})();




