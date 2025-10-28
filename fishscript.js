document.addEventListener("mousemove", (e) => {
  const x = (e.clientX - window.innerWidth / 3) / window.innerWidth;
  const y = (e.clientY - window.innerHeight / 3) / window.innerHeight;

  const layer1 = document.querySelector(".layer-1");
  const layer2 = document.querySelector(".layer-2");
  const layer3 = document.querySelector(".layer-3");
  const layer4 = document.querySelector(".layer-4");

  if (layer1) layer1.style.transform = `translate(${x * 25}px, ${y * 60}px)`;
  if (layer2) layer2.style.transform = `translate(${x * 90}px, ${y * 300}px)`;
  if (layer3) layer3.style.transform = `translate(${x * 250}px, ${y * 600}px)`;

  // slow and deeper movement
  if (layer4) layer4.style.transform = `translate(${x * 150}px, ${y * 250}px)`;
});
