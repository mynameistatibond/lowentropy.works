// ===== THEME LOGIC (with HTML/Body sync) =====

// Reference both <html> and <body>
const html = document.documentElement;
const body = document.body;

// System preference
const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

// Saved user preference
const savedTheme = localStorage.getItem("theme");

// Pick initial theme
let initialTheme = savedTheme || (systemPrefersDark ? "dark" : "light");

// Apply to BOTH html and body for CSS variable inheritance
function setTheme(theme) {
  html.setAttribute("data-theme", theme);
  body.setAttribute("data-theme", theme);
  console.log('Theme set to:', theme); // Debug
}

setTheme(initialTheme);

// Small glow pulse
function triggerGlow(btn) {
  if (!btn) return;
  btn.classList.remove("glow");
  void btn.offsetWidth;
  btn.classList.add("glow");
}

// Highlight active button
function setActive(btn, lightBtn, darkBtn) {
  if (!lightBtn || !darkBtn) return;
  lightBtn.classList.remove("active");
  darkBtn.classList.remove("active");
  btn.classList.add("active");
}

// Core binding logic
function initThemeButtons() {
  const lightBtn = document.querySelector(".light-switcher");
  const darkBtn = document.querySelector(".dark-switcher");

  // Bail if header not yet injected
  if (!lightBtn || !darkBtn) return;

  // Set initial active state
  setActive(
    initialTheme === "dark" ? darkBtn : lightBtn,
    lightBtn,
    darkBtn
  );

  // Light click
  lightBtn.addEventListener("click", () => {
    const current = body.getAttribute("data-theme");

    if (current === "light") {
      triggerGlow(darkBtn);
      return;
    }

    setTheme("light");
    localStorage.setItem("theme", "light");
    setActive(lightBtn, lightBtn, darkBtn);
  });

  // Dark click
  darkBtn.addEventListener("click", () => {
    const current = body.getAttribute("data-theme");

    if (current === "dark") {
      triggerGlow(lightBtn);
      return;
    }

    setTheme("dark");
    localStorage.setItem("theme", "dark");
    setActive(darkBtn, lightBtn, darkBtn);
  });
}

// Run when DOM ready
document.addEventListener("DOMContentLoaded", initThemeButtons);

// Run when components get injected
document.addEventListener("componentsLoaded", initThemeButtons);



