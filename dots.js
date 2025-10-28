// dots.js
const dots = [
  { el: document.querySelector('.dot.green'), start: { top: 20, left: 20 }, end: { top: 80, left: 40 } },
  { el: document.querySelector('.dot.coral'), start: { top: 40, left: 37 }, end: { top: 80, left: 80 } },
  { el: document.querySelector('.dot.blue'),  start: { top: 45, left: 75 }, end: { top: 80, left: 60 } },
  { el: document.querySelector('.dot.blue2'), start: { top: 74, left: 10 }, end: { top: 80, left: 20 } }
];

function lerp(a, b, t) { return a + (b - a) * t; }

function updateDots() {
  // how much scroll drives the animation (tweak 0.8 to feel)
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const t = Math.min(Math.max(window.scrollY / maxScroll, 0), 1); // clamp 0..1

  dots.forEach(d => {
    d.el.style.top  = lerp(d.start.top,  d.end.top,  t) + '%';
    d.el.style.left = lerp(d.start.left, d.end.left, t) + '%';
  });
}

window.addEventListener('scroll', updateDots);
window.addEventListener('resize', updateDots);
document.addEventListener('DOMContentLoaded', updateDots);
