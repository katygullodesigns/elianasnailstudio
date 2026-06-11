import { auth } from "./firebase.js";

import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCKIRvUsp8Ysv5iqzNUkySwZP2lEmB66JY",
  authDomain: "elianasnailstudio.firebaseapp.com",
  projectId: "elianasnailstudio",
  storageBucket: "elianasnailstudio.firebasestorage.app",
  messagingSenderId: "414202013471",
  appId: "1:414202013471:web:78cdf850b270cf6d1fb22a",
  measurementId: "G-JP9J414SLM"
};

window.loginOwner = async function () {
  const email = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const message = document.getElementById("loginMessage");

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "appointments.html";
  } catch (error) {
    message.textContent = "Incorrect email or password.";
  }
};