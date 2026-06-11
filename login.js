console.log("login.js loaded");

document.getElementById("loginBtn").addEventListener("click", async function () {
  console.log("login button clicked");

  const email = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  console.log("Email:", email);

  try {
    const result = await window.auth.signInWithEmailAndPassword(email, password);

    console.log("LOGIN SUCCESS", result);

    window.location.href = "appointments.html";

  } catch (error) {
    console.error("LOGIN FAILED");
    console.error("Code:", error.code);
    console.error("Message:", error.message);
  }
});
