const firebaseConfig = {
  apiKey: "...",
  authDomain: "elianasnailstudio.firebaseapp.com",
  projectId: "elianasnailstudio",
  storageBucket: "elianasnailstudio.firebasestorage.app",
  messagingSenderId: "414202013471",
  appId: "1:414202013471:web:78cdf850b270cf6d1fb22a"
};

firebase.initializeApp(firebaseConfig);

window.auth = firebase.auth();

console.log("firebase.js loaded", window.auth);
