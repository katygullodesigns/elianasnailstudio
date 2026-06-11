console.log("login.js loaded");

document.getElementById("loginBtn").addEventListener("click", async function () {
  console.log("login button clicked");

  const email = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const message = document.getElementById("loginMessage");

  try {
    await window.auth.signInWithEmailAndPassword(email, password);
    console.log("login success");
    window.location.href = "appointments.html";
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    message.textContent = error.message;
  }
});
