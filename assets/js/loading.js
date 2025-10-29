document.body.classList.add("loading");

document.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById("loader");

  // Slide the curtain up
  loader.classList.add("hide");

  // Reveal underlying page
  document.body.classList.add("ready");

  // Remove loader from DOM after animation finishes
  setTimeout(() => {
    loader.remove();
  }, 1200);
});
