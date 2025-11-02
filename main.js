document.addEventListener("DOMContentLoaded", () => {
  // Loader Elements
  const loader = document.getElementById("loader");
  const mainContent = document.getElementById("main-content");
  const loadingText = document.getElementById("loading-text");

  const creativeLines = [
    "Empowering creativity — your support brings stories to life.",
    "Join the mission — every contribution fuels a dream.",
    "Together, we make imagination real.",
    "Fueling art, passion, and purpose — one donation at a time."
  ];

  const line = creativeLines[Math.floor(Math.random() * creativeLines.length)];
  let i = 0;

  // Typing animation
  function typeLine() {
    if (i < line.length) {
      loadingText.textContent += line.charAt(i);
      i++;
      setTimeout(typeLine, 80);
    }
  }
  typeLine();

  // Show loader for 2.8 seconds, then reveal site
  setTimeout(() => {
    loader.style.display = "none";
    mainContent.classList.remove("hidden");
  }, 2800);
});