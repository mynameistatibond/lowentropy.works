

document.body.classList.add("loading");

window.addEventListener("load", () => {
  const loader = document.getElementById("loader");

  loader.classList.add("hide");
  document.body.classList.add("ready");

  setTimeout(() => loader.remove(), 1200);
});