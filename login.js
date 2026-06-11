window.loginOwner = async function () {
  const email = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const message = document.getElementById("loginMessage");

  try {
    await auth.signInWithEmailAndPassword(email, password);
    window.location.href = "appointments.html";
  } catch (error) {
    console.error(error);
    message.textContent = error.message;
  }
};
