const modal = document.getElementById("imageModal");
const modalImg = document.getElementById("expandedImage");


function toggleMenu() {
    document.querySelector("nav").classList.toggle("mobile-open");
    document.body.classList.toggle("menu-open");

    const btn = document.querySelector(".mobile-menu-btn");

    if (document.querySelector("nav").classList.contains("mobile-open")) {
        btn.innerHTML = "✕";
    } else {
        btn.innerHTML = "☰";
    }
}

document.querySelectorAll("nav a").forEach(link => {
    link.addEventListener("click", () => {
        document.querySelector("nav").classList.remove("mobile-open");
        document.body.classList.remove("menu-open");
        document.querySelector(".mobile-menu-btn").innerHTML = "☰";
    });
});

document.querySelectorAll(".grid-port img").forEach(img => {
  img.addEventListener("click", () => {
    modal.style.display = "flex";
    modalImg.src = img.src;
  });
});

document.querySelector(".close-modal").addEventListener("click", () => {
  modal.style.display = "none";
});

modal.addEventListener("click", e => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
});
