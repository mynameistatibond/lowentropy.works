document.body.classList.add("loading");

document.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById("loader");
  loader.classList.add("hide");
  document.body.classList.remove("loading");

  setTimeout(() => {
    loader.remove();
  }, 700);
});