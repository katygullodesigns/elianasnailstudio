document.addEventListener("DOMContentLoaded", function () {

  const modal = document.getElementById("imageModal");
  const expandedImage = document.getElementById("expandedImage");
  const closeBtn = document.querySelector(".close-modal");

  document.querySelectorAll(".portfolio img").forEach(function (img) {

    img.addEventListener("click", function () {
      expandedImage.src = img.src;
      modal.style.display = "flex";
    });

  });

  closeBtn.addEventListener("click", function () {
    modal.style.display = "none";
  });

  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });

});