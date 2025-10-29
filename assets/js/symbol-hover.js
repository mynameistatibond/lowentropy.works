document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".col-right-symbols");
  if (!container) return;

  const items = document.querySelectorAll(".artifact-section li");
  const glyphs = ["✦", "☽", "Σ", "Ψ", "Ł", "Ѻ", "✧", "🜃", "∋", "∀", "⋱", "λ",
    "Ϟ", "⟐", "∴", "⋯", "𝔚", "𐌍", "Ŧ", "Ȑ", "Θ", "ℙ", "∷", "∷", "∵", "∿", "∉", "⋗" ];

  function spawnSymbol() {
    const rect = container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    // Random position within the *visible* slice of the column
    const pad = 24; // keep away from hard edges
    const x = pad + Math.random() * Math.max(1, rect.width  - pad * 2);
    const y = pad + Math.random() * Math.max(1, rect.height - pad * 2);

    const el = document.createElement("div");
    el.className = "symbol";
    el.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];

    // Place relative to the container box (absolute inside .col-right-symbols)
    el.style.left = `${x}px`;
    el.style.top  = `${y}px`;

    container.appendChild(el);

    // Animate in
    requestAnimationFrame(() => el.classList.add("show"));

    // Fade out, then remove
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 2000);
    }, 1100);
  }

  // Hover-driven (recommended: responsive + noticeable)
  items.forEach((li) => {
    li.addEventListener("mouseenter", spawnSymbol);
  });

  // OPTIONAL: ambient mode (uncomment to enable periodic spawns)
  // setInterval(spawnSymbol, 2200);

  // OPTIONAL: also spawn on scroll to refresh the “alive” feeling
  // let last = 0;
  // window.addEventListener("scroll", () => {
  //   const now = performance.now();
  //   if (now - last > 500) { spawnSymbol(); last = now; }
  // }, { passive: true });
});
