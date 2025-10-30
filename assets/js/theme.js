// ===== THEME LOGIC =====

// Reference <body> (fallback to <html>)
const root = document.body || document.documentElement;

// System preference
const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

// Saved user preference
const savedTheme = localStorage.getItem("theme");

// Pick initial theme
let initialTheme = savedTheme || (systemPrefersDark ? "dark" : "light");

// Apply to <body>/<html>
root.setAttribute("data-theme", initialTheme);

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

// core binding logic
function initThemeButtons() {
  const lightBtn = document.querySelector(".light-switcher");
  const darkBtn  = document.querySelector(".dark-switcher");

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
    const current = root.getAttribute("data-theme");

    if (current === "light") {
      triggerGlow(darkBtn);
      return;
    }

    root.setAttribute("data-theme", "light");
    localStorage.setItem("theme", "light");
    setActive(lightBtn, lightBtn, darkBtn);
  });

  // Dark click
  darkBtn.addEventListener("click", () => {
    const current = root.getAttribute("data-theme");

    if (current === "dark") {
      triggerGlow(lightBtn);
      return;
    }

    root.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", "dark");
    setActive(darkBtn, lightBtn, darkBtn);
  });
}

// run when DOM ready
document.addEventListener("DOMContentLoaded", initThemeButtons);

// run when components get injected
document.addEventListener("componentsLoaded", initThemeButtons);
