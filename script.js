const SUPABASE_URL = "https://kyonstvpolakjhrecqcj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5b25zdHZwb2xha2pocmVjcWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTYxMjUsImV4cCI6MjA5NzI3MjEyNX0.oq6v7gEy8FJPh4NI3ngUYybwJcHF6rW6qkNtepCxr7Y";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("Eliana's Nail Studio Loaded");

if (document.body.classList.contains("home-page")) {
  document.body.style.overflow = "auto";
}

const scrollArrow = document.getElementById("scrollArrow");

if (scrollArrow) {
  scrollArrow.addEventListener("click", function () {
    document.body.style.overflow = "auto";
    document.body.classList.remove("lock-scroll");
  });
}

function toggleMenu() {
  const nav = document.querySelector("nav");
  const btn = document.querySelector(".mobile-menu-btn");

  if (!nav) return;

  nav.classList.toggle("mobile-open");
  document.body.classList.toggle("menu-open");

  if (btn) {
    btn.innerHTML = nav.classList.contains("mobile-open") ? "✕" : "☰";
  }
}

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("nav a").forEach(function (link) {
    link.addEventListener("click", function () {
      const nav = document.querySelector("nav");
      const btn = document.querySelector(".mobile-menu-btn");

      if (nav) nav.classList.remove("mobile-open");

      document.body.classList.remove("menu-open");

      if (btn) btn.innerHTML = "☰";
    });
  });

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

  function timeToMinutes(time) {
    const match = time.match(/(\d+):(\d+)\s(AM|PM)/);

    if (!match) return 0;

    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const ampm = match[3];

    if (ampm === "PM" && hour !== 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;

    return hour * 60 + minute;
  }

  function getTodayString() {
    const today = new Date();

    return (
      today.getFullYear() +
      "-" +
      String(today.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(today.getDate()).padStart(2, "0")
    );
  }

  function isPastTime(date, time) {
    if (!date || !time) return false;

    const todayString = getTodayString();

    if (date < todayString) return true;
    if (date > todayString) return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const slotMinutes = timeToMinutes(time);

    return slotMinutes <= currentMinutes;
  }

  async function getBookedAppointments() {
    const { data, error } = await supabaseClient
      .from("appointments")
      .select("*")
      .or("status.is.null,status.neq.past");

    if (error) {
      console.error("Supabase read error:", error);
      return {};
    }

    const bookedAppointments = {};

    data.forEach(function (appointment) {
      const blockedTimes =
        appointment.blockedTimes || appointment.blocked_times || [];

      if (!appointment.date || !blockedTimes) return;

      if (!bookedAppointments[appointment.date]) {
        bookedAppointments[appointment.date] = [];
      }

      blockedTimes.forEach(function (time) {
        bookedAppointments[appointment.date].push(time);
      });
    });

    return bookedAppointments;
  }

  function renderTimeButtons(bookedTimes) {
    if (!timeSlots) return;

    timeSlots.innerHTML = "";

    allTimes.forEach(function (time) {
      const button = document.createElement("button");

      button.type = "button";
      button.textContent = time;
      button.classList.add("time-slot");

      const timeAlreadyPassed = isPastTime(selectedDate, time);
      const alreadyBooked = bookedTimes.includes(time);

      if (timeAlreadyPassed || alreadyBooked) {
        button.classList.add("booked");
        button.disabled = true;
      }

      button.addEventListener("click", function () {
        if (button.disabled || button.classList.contains("booked")) return;

        document.querySelectorAll(".time-slot").forEach(function (btn) {
          btn.classList.remove("selected");
        });

        button.classList.add("selected");
        selectedTime = time;
      });

      timeSlots.appendChild(button);
    });
  }

  async function loadTimes(date) {
    selectedTime = "";

    const bookedAppointments = await getBookedAppointments();
    const bookedTimes = bookedAppointments[date] || [];

    renderTimeButtons(bookedTimes);
  }

  if (typeof flatpickr !== "undefined" && document.getElementById("appointmentDate")) {
    flatpickr("#appointmentDate", {
      dateFormat: "Y-m-d",
      minDate: "today",
      onChange: async function (selectedDates, dateStr) {
        selectedDate = dateStr;
        await loadTimes(dateStr);
      }
    });
  }

  window.closePopup = function () {
    const popup = document.getElementById("bookingPopup");
    if (popup) popup.style.display = "none";
  };

  window.bookAppointment = async function () {
    const name = document.getElementById("clientName").value.trim();
    const phone = document.getElementById("clientPhone").value.trim();
    const service = document.getElementById("serviceSelect").value;
    const polish = document.getElementById("polishSelect").value;
    const design = document.getElementById("designSelect").value;

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

    if (!service || !design) {
      alert("Please select a service and design.");
      return;
    }

    if (isPastTime(selectedDate, selectedTime)) {
      alert("That time has already passed. Please choose another time.");
      await loadTimes(selectedDate);
      return;
    }

    const duration = Math.max(
      serviceDurations[service] || 1,
      serviceDurations[polish] || 1,
      serviceDurations[design] || 1
    );

    const startIndex = allTimes.indexOf(selectedTime);
    const slotsNeeded = duration * 2;

    let timesToBook = allTimes.slice(startIndex, startIndex + slotsNeeded);

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
      blocked_times: timesToBook,
      service: service,
      polish: polish,
      design: design,
      notes: "",
      status: "active",
      created_at: new Date().toISOString()
    };

    const { error } = await supabaseClient
      .from("appointments")
      .insert([appointment]);

    if (error) {
      console.error("Supabase insert error:", error);
      alert(error.message);
      return;
    }

    const popup = document.getElementById("bookingPopup");
    if (popup) popup.style.display = "flex";

    document.getElementById("clientName").value = "";
    document.getElementById("clientPhone").value = "";
    document.getElementById("appointmentDate").value = "";
    document.getElementById("serviceSelect").value = "";
    document.getElementById("polishSelect").value = "";
    document.getElementById("designSelect").value = "";

    selectedDate = "";
    selectedTime = "";

    if (timeSlots) {
      timeSlots.innerHTML = "";
    }
  };
});
