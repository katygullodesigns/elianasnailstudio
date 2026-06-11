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

const firebaseConfig = {
  apiKey: "AIzaSyCKIRvUsp8Ysv5iqzNUkySwZP2lEmB66JY",
  authDomain: "elianasnailstudio.firebaseapp.com",
  projectId: "elianasnailstudio",
  storageBucket: "elianasnailstudio.firebasestorage.app",
  messagingSenderId: "414202013471",
  appId: "1:414202013471:web:78cdf850b270cf6d1fb22a"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
