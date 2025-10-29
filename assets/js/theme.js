const body = document.body;
const lightBtn = document.querySelector(".light-switcher");
const darkBtn  = document.querySelector(".dark-switcher");

// Determine system preference
const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

// Look for saved preference
const savedTheme = localStorage.getItem("theme");

// Decide initial theme
let initialTheme = savedTheme || (systemPrefersDark ? "dark" : "light");

// Apply theme to document
body.setAttribute("data-theme", initialTheme);

// Apply active button state
function setActive(btn) {
  lightBtn.classList.remove("active");
  darkBtn.classList.remove("active");
  btn.classList.add("active");
}

setActive(initialTheme === "dark" ? darkBtn : lightBtn);

function triggerGlow(btn) {
  btn.classList.remove("glow");
  void btn.offsetWidth;
  btn.classList.add("glow");
}

// LIGHT button clicked
lightBtn.addEventListener("click", () => {
  const current = body.getAttribute("data-theme");

  if (current === "light") {
    triggerGlow(darkBtn);
    return;
  }

  body.setAttribute("data-theme", "light");
  localStorage.setItem("theme", "light");
  setActive(lightBtn);
});

// DARK button clicked
darkBtn.addEventListener("click", () => {
  const current = body.getAttribute("data-theme");

  if (current === "dark") {
    triggerGlow(lightBtn);
    return;
  }

  body.setAttribute("data-theme", "dark");
  localStorage.setItem("theme", "dark");
  setActive(darkBtn);
});
