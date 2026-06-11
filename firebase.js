import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAuth
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

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);