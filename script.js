import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
const db = getFirestore(app);

console.log("Eliana's Nail Studio Loaded");

document.addEventListener("DOMContentLoaded", function () {
  let selectedDate = "";
  let selectedTime = "";

  const timeSlots = document.getElementById("timeSlots");

  const allTimes = [
    "8:00 AM", "8:30 AM",
    "9:00 AM", "9:30 AM",
    "10:00 AM", "10:30 AM",
    "11:00 AM", "11:30 AM",
    "12:00 PM", "12:30 PM",
    "1:00 PM", "1:30 PM",
    "2:00 PM", "2:30 PM",
    "3:00 PM", "3:30 PM",
    "4:00 PM", "4:30 PM",
    "5:00 PM", "5:30 PM",
    "6:00 PM", "6:30 PM"
  ];

  const serviceDurations = {
    "Manicure": 1.5,
    "Pedicure": 0.5,
    "Gel": 1.5,
    "Acrylic": 1.5,
    "Basic": 0.5,
    "Minimal Design": 1,
    "Max Design": 2.5
  };

  async function getBookedAppointments() {
    const snapshot = await getDocs(collection(db, "appointments"));

    const bookedAppointments = {};

    snapshot.forEach(function (doc) {
      const appointment = doc.data();

      if (!appointment.date || !appointment.blockedTimes) return;

      if (!bookedAppointments[appointment.date]) {
        bookedAppointments[appointment.date] = [];
      }

      appointment.blockedTimes.forEach(function (time) {
        bookedAppointments[appointment.date].push(time);
      });
    });

    return bookedAppointments;
  }

  if (
    typeof flatpickr !== "undefined" &&
    document.getElementById("appointmentDate")
  ) {
    flatpickr("#appointmentDate", {
      dateFormat: "Y-m-d",
      minDate: "today",

      onChange: async function (selectedDates, dateStr) {
        selectedDate = dateStr;
        selectedTime = "";
        await loadTimes(dateStr);
      }
    });
  }

  async function loadTimes(date) {
    if (!timeSlots) return;

    const bookedAppointments = await getBookedAppointments();

    timeSlots.innerHTML = "";

    const bookedTimes = bookedAppointments[date] || [];

    allTimes.forEach(function (time) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = time;
      button.classList.add("time-slot");

      if (bookedTimes.includes(time)) {
        button.classList.add("booked");
        button.disabled = true;
      }

      button.addEventListener("click", function () {
        if (button.classList.contains("booked")) return;

        document.querySelectorAll(".time-slot").forEach(function (btn) {
          btn.classList.remove("selected");
        });

        button.classList.add("selected");
        selectedTime = time;
      });

      timeSlots.appendChild(button);
    });
  }

  window.closePopup = function () {
    const popup = document.getElementById("bookingPopup");
    if (popup) popup.style.display = "none";
  };

  window.bookAppointment = async function () {
    const name = document.getElementById("clientName").value.trim();
    const phone = document.getElementById("clientPhone").value.trim();

    if (!name) {
      alert("Please enter your name.");
      return;
    }

    if (!phone) {
      alert("Please enter your phone number.");
      return;
    }

    if (!selectedDate || !selectedTime) {
      alert("Please select a date and time.");
      return;
    }

    const service = document.getElementById("serviceSelect").value;
    const design = document.getElementById("designSelect").value;

    if (!service || !design) {
      alert("Please select a service and design.");
      return;
    }

    const duration = Math.max(
      serviceDurations[service] || 1,
      serviceDurations[design] || 1
    );

    const startIndex = allTimes.indexOf(selectedTime);
    const slotsNeeded = duration * 2;

    let timesToBook = allTimes.slice(
      startIndex,
      startIndex + slotsNeeded
    );

    if (
      selectedTime === "8:00 AM" ||
      selectedTime === "6:00 PM" ||
      startIndex === allTimes.length - 1
    ) {
      timesToBook = [selectedTime];
    } else if (timesToBook.length < slotsNeeded) {
      alert("That service requires more time than is available. Please choose an earlier appointment.");
      return;
    }

    const bookedAppointments = await getBookedAppointments();

    if (!bookedAppointments[selectedDate]) {
      bookedAppointments[selectedDate] = [];
    }

    const conflict = timesToBook.some(function (time) {
      return bookedAppointments[selectedDate].includes(time);
    });

    if (conflict) {
      alert("One or more of those time slots are already booked. Please choose another time.");
      await loadTimes(selectedDate);
      return;
    }

    const appointment = {
      name: name,
      phone: phone,
      date: selectedDate,
      time: selectedTime,
      duration: duration,
      blockedTimes: timesToBook,
      service: service,
      design: design,
      notes: "",
      status: "active",
      createdAt: new Date().toISOString()
    };

    await addDoc(collection(db, "appointments"), appointment);

    const popup = document.getElementById("bookingPopup");
    if (popup) popup.style.display = "flex";

    document.getElementById("clientName").value = "";
    document.getElementById("clientPhone").value = "";
    document.getElementById("appointmentDate").value = "";
    document.getElementById("serviceSelect").value = "";
    document.getElementById("designSelect").value = "";

    selectedDate = "";
    selectedTime = "";

    if (timeSlots) {
      timeSlots.innerHTML = "";
    }
  };
});