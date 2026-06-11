import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc
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

  loadAppointments();
});

const appointmentsList = document.getElementById("appointmentsList");
const appointmentCounter = document.getElementById("appointmentCounter");

let appointments = [];

function convertTime(time) {
  const [hourMin, period] = time.split(" ");
  let [hours, minutes] = hourMin.split(":");

  hours = parseInt(hours);

  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  return `${hours}:${minutes}`;
}

async function loadAppointments() {
  const snapshot = await getDocs(collection(db, "appointments"));

  appointments = [];

  snapshot.forEach(function (document) {
    const appointment = document.data();

    if (appointment.status !== "past") {
      appointments.push({
        id: document.id,
        ...appointment
      });
    }
  });

  appointments.sort(function (a, b) {
    const aDateTime = new Date(`${a.date} ${convertTime(a.time)}`);
    const bDateTime = new Date(`${b.date} ${convertTime(b.time)}`);
    return aDateTime - bDateTime;
  });

  appointmentCounter.textContent =
    `Total Appointments: ${appointments.length}`;

  appointmentsList.innerHTML = "";

  if (appointments.length === 0) {
    appointmentsList.innerHTML = "<p>No appointments booked yet.</p>";
    return;
  }

  appointments.forEach(function (appointment, index) {
    const card = document.createElement("div");
    card.classList.add("appointment-card");

    card.innerHTML = `
      <div class="appointment-summary" onclick="toggleDetails(${index})">
        <h3>${appointment.name}</h3>
        <p>${appointment.date} at ${appointment.time}</p>
      </div>

      <div id="details-${index}" class="appointment-details" style="display:none;">
        <p><strong>Phone:</strong> ${appointment.phone || ""}</p>
        <p><strong>Service:</strong> ${appointment.service || "N/A"}</p>
        <p><strong>Design:</strong> ${appointment.design || "N/A"}</p>
        <p><strong>Duration:</strong> ${appointment.duration || 1} hours</p>

        <p><strong>Owner Notes:</strong></p>
        <p class="owner-notes">${appointment.notes || "No notes yet."}</p>

        <div class="button-group">
          <button onclick="editAppointment(${index})">Edit</button>
          <button onclick="deleteAppointment(${index})">Delete</button>
          <button onclick="completeAppointment(${index})">Complete</button>
        </div>
      </div>

      <div id="edit-${index}" class="appointment-edit" style="display:none;">
        <input type="text" id="name-${index}" value="${appointment.name || ""}">
        <input type="text" id="phone-${index}" value="${appointment.phone || ""}">
        <input type="text" id="date-${index}" value="${appointment.date || ""}">
        <input type="text" id="time-${index}" value="${appointment.time || ""}">
        <input type="text" id="service-${index}" value="${appointment.service || ""}">
        <input type="text" id="design-${index}" value="${appointment.design || ""}">

        <textarea id="notes-${index}" placeholder="Owner notes">${appointment.notes || ""}</textarea>

        <div class="button-group">
          <button onclick="saveAppointment(${index})">Save</button>
          <button onclick="cancelEdit(${index})">Cancel</button>
        </div>
      </div>
    `;

    appointmentsList.appendChild(card);
  });
}

window.toggleDetails = function (index) {
  const details = document.getElementById(`details-${index}`);

  details.style.display =
    details.style.display === "none" ? "block" : "none";
};

window.editAppointment = function (index) {
  document.getElementById(`details-${index}`).style.display = "none";
  document.getElementById(`edit-${index}`).style.display = "block";
};

window.cancelEdit = function (index) {
  document.getElementById(`edit-${index}`).style.display = "none";
  document.getElementById(`details-${index}`).style.display = "block";
};

window.saveAppointment = async function (index) {
  const appointment = appointments[index];

  await updateDoc(doc(db, "appointments", appointment.id), {
    name: document.getElementById(`name-${index}`).value,
    phone: document.getElementById(`phone-${index}`).value,
    date: document.getElementById(`date-${index}`).value,
    time: document.getElementById(`time-${index}`).value,
    service: document.getElementById(`service-${index}`).value,
    design: document.getElementById(`design-${index}`).value,
    notes: document.getElementById(`notes-${index}`).value
  });

  loadAppointments();
};

window.deleteAppointment = async function (index) {
  const appointment = appointments[index];

  await deleteDoc(doc(db, "appointments", appointment.id));

  loadAppointments();
};

window.completeAppointment = async function (index) {
  const appointment = appointments[index];

  await updateDoc(doc(db, "appointments", appointment.id), {
    status: "past",
    completedDate: new Date().toLocaleDateString()
  });

  loadAppointments();
};

window.logoutOwner = async function () {
  await signOut(auth);
  window.location.href = "login.html";
};
