// ===== THEME LOGIC =====

// Reference <html> element
const root = document.documentElement;

// Buttons (if missing on a page, fail silently)
const lightBtn = document.querySelector(".light-switcher");
const darkBtn  = document.querySelector(".dark-switcher");

// System preference
const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

// Saved user preference
const savedTheme = localStorage.getItem("theme");

// Pick initial theme
let initialTheme = savedTheme || (systemPrefersDark ? "dark" : "light");

// Apply to root <html>
root.setAttribute("data-theme", initialTheme);

// Highlight active button
function setActive(btn) {
  if (!lightBtn || !darkBtn) return;
  lightBtn.classList.remove("active");
  darkBtn.classList.remove("active");
  btn.classList.add("active");
}

setActive(initialTheme === "dark" ? darkBtn : lightBtn);

// Small glow pulse
function triggerGlow(btn) {
  btn.classList.remove("glow");
  void btn.offsetWidth;
  btn.classList.add("glow");
}

// Light button
lightBtn?.addEventListener("click", () => {
  const current = root.getAttribute("data-theme");

  if (current === "light") {
    triggerGlow(darkBtn);
    return;
  }

  root.setAttribute("data-theme", "light");
  localStorage.setItem("theme", "light");
  setActive(lightBtn);
});

// Dark button
darkBtn?.addEventListener("click", () => {
  const current = root.getAttribute("data-theme");

  if (current === "dark") {
    triggerGlow(lightBtn);
    return;
  }

  root.setAttribute("data-theme", "dark");
  localStorage.setItem("theme", "dark");
  setActive(darkBtn);
});
