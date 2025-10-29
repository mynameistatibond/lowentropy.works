const body = document.body;
const lightBtn = document.querySelector(".light-switcher");
const darkBtn  = document.querySelector(".dark-switcher");

function setActive(btn) {
  lightBtn.classList.remove("active");
  darkBtn.classList.remove("active");
  btn.classList.add("active");
}

// Init from storage (default to light)
const saved = localStorage.getItem("theme");
const initial = saved === "dark" ? "dark" : "light";
body.setAttribute("data-theme", initial);
setActive(initial === "dark" ? darkBtn : lightBtn);

function triggerGlow(btn) {
  btn.classList.remove("glow"); // reset in case animation was still there
  void btn.offsetWidth;         // force reflow so animation can restart
  btn.classList.add("glow");
}

// Handlers

// LIGHT button clicked
lightBtn.addEventListener("click", () => {
  const currentTheme = body.getAttribute("data-theme");

  if (currentTheme === "light") {
    // already in light → hint dark
    triggerGlow(darkBtn);
    return;
  }

  // switch to light
  body.setAttribute("data-theme", "light");
  localStorage.setItem("theme", "light");
  setActive(lightBtn);
});

// DARK button clicked
darkBtn.addEventListener("click", () => {
  const currentTheme = body.getAttribute("data-theme");

  if (currentTheme === "dark") {
    // already in dark → hint light
    triggerGlow(lightBtn);
    return;
  }

  // switch to dark
  body.setAttribute("data-theme", "dark");
  localStorage.setItem("theme", "dark");
  setActive(darkBtn);
});
