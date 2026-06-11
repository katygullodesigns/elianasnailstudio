import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  doc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { auth } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

onAuthStateChanged(auth, function (user) {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  loadPastAppointments();
});

document.getElementById("logoutBtn").addEventListener("click", logoutOwner);

const pastAppointmentsList =
  document.getElementById("pastAppointmentsList");

let pastAppointments = [];

async function loadPastAppointments() {
  const snapshot = await getDocs(collection(db, "appointments"));

  pastAppointments = [];

  snapshot.forEach(function (document) {
    const appointment = document.data();

    if (appointment.status === "past") {
      pastAppointments.push({
        id: document.id,
        ...appointment
      });
    }
  });
  
  pastAppointmentsList.innerHTML = "";

  if (pastAppointments.length === 0) {
    pastAppointmentsList.innerHTML =
      "<p>No completed appointments.</p>";
    return;
  }

  pastAppointments.forEach(function (appointment, index) {
    const card = document.createElement("div");
    card.classList.add("appointment-card");

    card.innerHTML = `
      <div class="appointment-summary" onclick="togglePastDetails(${index})">
        <h3>${appointment.name}</h3>
        <p>${appointment.date} at ${appointment.time}</p>
      </div>

      <div id="past-details-${index}" class="appointment-details" style="display:none;">
        <p><strong>Date:</strong> ${appointment.date}</p>
        <p><strong>Time:</strong> ${appointment.time}</p>
        <p><strong>Phone:</strong> ${appointment.phone || ""}</p>
        <p><strong>Service:</strong> ${appointment.service || "N/A"}</p>
        <p><strong>Design:</strong> ${appointment.design || "N/A"}</p>
        <p><strong>Notes:</strong> ${appointment.notes || "No notes."}</p>
        <p><strong>Completed:</strong> ${appointment.completedDate || ""}</p>

        <div class="button-group">
          <button onclick="deletePastAppointment(${index})">
            Delete
          </button>
        </div>
      </div>
    `;

    pastAppointmentsList.appendChild(card);
  });
}

window.togglePastDetails = function (index) {
  const details = document.getElementById(`past-details-${index}`);

  details.style.display =
    details.style.display === "none" ? "block" : "none";
};

window.deletePastAppointment = async function (index) {
  const appointment = pastAppointments[index];

  await deleteDoc(doc(db, "appointments", appointment.id));

  loadPastAppointments();
};

window.logoutOwner = async function () {
  await signOut(auth);
  window.location.href = "login.html";
};