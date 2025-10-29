// dots.js — JS owns all positions now
const dots = [
  { el: document.querySelector('.dot.midblue'),  start: { top: 20, left: 20 }, end: { top: 80, left: 40 } },
  { el: document.querySelector('.dot.coral'),    start: { top: 40, left: 37 }, end: { top: 80, left: 80 } },
  { el: document.querySelector('.dot.lightblue'),start: { top: 45, left: 75 }, end: { top: 80, left: 60 } },
  { el: document.querySelector('.dot.brightblue'),start:{ top: 74, left: 10 }, end: { top: 80, left: 20 } }
];

const clamp01 = x => Math.max(0, Math.min(1, x));
const lerp = (a, b, t) => a + (b - a) * t;

function scrollFraction() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (max <= 0) return 0;
  return clamp01(window.scrollY / max);
}

function applyPositions(t) {
  dots.forEach(d => {
    d.el.style.top = lerp(d.start.top, d.end.top, t) + '%';
    d.el.style.left = lerp(d.start.left, d.end.left, t) + '%';
    d.el.style.visibility = 'visible';
  });
}

function onUpdate() {
  applyPositions(scrollFraction());
}

document.addEventListener('DOMContentLoaded', () => {
  onUpdate();
  window.addEventListener('scroll', onUpdate, { passive: true });
  window.addEventListener('resize', onUpdate);
});
