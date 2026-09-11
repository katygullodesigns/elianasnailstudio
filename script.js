const SUPABASE_URL =
  "https://kyonstvpolakjhrecqcj.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5b25zdHZwb2xha2pocmVjcWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTYxMjUsImV4cCI6MjA5NzI3MjEyNX0.oq6v7gEy8FJPh4NI3ngUYybwJcHF6rW6qkNtepCxr7Y";

const supabaseClient =
  supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );

// ==========================================
// DATE PICKER / CALENDAR
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

  const dateInput =
    document.getElementById("appointmentDate");

  if (!dateInput) {
    console.error(
      "Could not find #appointmentDate"
    );
    return;
  }

  if (typeof flatpickr === "undefined") {
    console.error(
      "Flatpickr did not load."
    );
    return;
  }

  flatpickr(dateInput, {
    dateFormat: "Y-m-d",
    minDate: "today",
    disableMobile: true,

    onChange: function (
      selectedDates,
      dateStr
    ) {
      console.log(
        "Selected date:",
        dateStr
      );

      // Clear previously selected time
      const timeSlots =
        document.getElementById(
          "timeSlots"
        );

      if (timeSlots) {
        timeSlots.innerHTML = "";
      }

      // If your existing script has a function
      // that loads available times for a date,
      // call it here.
      if (
        typeof loadAvailableTimes ===
        "function"
      ) {
        loadAvailableTimes(dateStr);
      }
    }
  });

});

// ==========================================
// SERVICE DURATIONS
// ==========================================

const durations = {

  // Main services
  "Manicure": 1.5,
  "Pedicure": 0.5,

  // Polish
  "Gel": 1.5,
  "Acrylic": 1.5,

  // Design
  "Basic": 0.5,
  "Minimal Design": 1,
  "Max Design": 2.5,

  // Additional services
  "Nail Art": 1

};


// ==========================================
// BOOKING STATE
// ==========================================

let selectedAdditionalServices = [];


// ==========================================
// CALCULATE MAIN SERVICE DURATION
// ==========================================

function getMainBookingDuration(
  service,
  polish,
  design
) {

  return Math.max(

    durations[service] || 0,

    durations[polish] || 0,

    durations[design] || 0

  );
}


// ==========================================
// CALCULATE ADDITIONAL SERVICE DURATION
// ==========================================

function getAdditionalServicesDuration() {

  let totalDuration = 0;

  selectedAdditionalServices.forEach(
    function (item) {

      totalDuration +=
        durations[item.service] || 0;

    }
  );

  return totalDuration;
}


// ==========================================
// CALCULATE TOTAL APPOINTMENT DURATION
// ==========================================

function getTotalAppointmentDuration(
  service,
  polish,
  design
) {

  const mainDuration =
    getMainBookingDuration(
      service,
      polish,
      design
    );

  const additionalDuration =
    getAdditionalServicesDuration();

  const totalDuration =
    mainDuration +
    additionalDuration;

  console.log(
    "MAIN DURATION:",
    mainDuration
  );

  console.log(
    "ADDITIONAL DURATION:",
    additionalDuration
  );

  console.log(
    "TOTAL DURATION:",
    totalDuration
  );

  return totalDuration;
}


// ==========================================
// TIME FUNCTIONS
// ==========================================

function timeToMinutes(timeString) {

  if (!timeString) {
    return 0;
  }

  const parts =
    timeString.split(" ");

  const time =
    parts[0];

  const modifier =
    parts[1];

  const timeParts =
    time.split(":");

  let hours =
    Number(timeParts[0]);

  const minutes =
    Number(timeParts[1]);

  if (
    modifier === "PM" &&
    hours !== 12
  ) {
    hours += 12;
  }

  if (
    modifier === "AM" &&
    hours === 12
  ) {
    hours = 0;
  }

  return (
    hours * 60 +
    minutes
  );
}


function minutesToTime(totalMinutes) {

  let hours =
    Math.floor(
      totalMinutes / 60
    );

  const minutes =
    totalMinutes % 60;

  let modifier = "AM";

  if (hours >= 12) {
    modifier = "PM";
  }

  if (hours > 12) {
    hours -= 12;
  }

  if (hours === 0) {
    hours = 12;
  }

  return (
    hours +
    ":" +
    String(minutes).padStart(
      2,
      "0"
    ) +
    " " +
    modifier
  );
}


// ==========================================
// CALCULATE BLOCKED TIMES
// ==========================================

function getBlockedTimes(
  selectedTime,
  duration
) {

  if (
    !selectedTime ||
    !duration
  ) {
    return [];
  }

  const startMinutes =
    timeToMinutes(
      selectedTime
    );

  const totalMinutes =
    duration * 60;

  const blockedTimes = [];


  for (
    let minutes = 0;
    minutes < totalMinutes;
    minutes += 30
  ) {

    blockedTimes.push(
      minutesToTime(
        startMinutes +
        minutes
      )
    );

  }


  console.log(
    "BLOCKED TIMES:",
    blockedTimes
  );

  return blockedTimes;
}


// ==========================================
// ADDITIONAL SERVICE MANAGEMENT
// ==========================================

function addAdditionalService(
  service,
  polish = "",
  design = "",
  designDetails = ""
) {

  if (!service) {
    return;
  }

  selectedAdditionalServices.push({

    service,
    polish,
    design,
    designDetails

  });

  console.log(
    "ADDITIONAL SERVICES:",
    selectedAdditionalServices
  );
}


function removeAdditionalService(
  index
) {

  if (
    index < 0 ||
    index >=
      selectedAdditionalServices.length
  ) {
    return;
  }

  selectedAdditionalServices.splice(
    index,
    1
  );

  console.log(
    "ADDITIONAL SERVICES:",
    selectedAdditionalServices
  );
}


function clearAdditionalServices() {

  selectedAdditionalServices = [];

}


// ==========================================
// MOBILE MENU
// ==========================================

function toggleMenu() {

  const nav =
    document.querySelector("nav");

  const btn =
    document.querySelector(
      ".mobile-menu-btn"
    );

  if (!nav) {
    return;
  }

  nav.classList.toggle(
    "mobile-open"
  );

  document.body.classList.toggle(
    "menu-open"
  );

  if (btn) {

    btn.innerHTML =
      nav.classList.contains(
        "mobile-open"
      )
        ? "✕"
        : "☰";
  }
}


document
  .querySelectorAll("nav a")
  .forEach(
    function (link) {

      link.addEventListener(
        "click",
        function () {

          const nav =
            document.querySelector(
              "nav"
            );

          const btn =
            document.querySelector(
              ".mobile-menu-btn"
            );

          if (nav) {

            nav.classList.remove(
              "mobile-open"
            );
          }

          document.body.classList.remove(
            "menu-open"
          );

          if (btn) {

            btn.innerHTML = "☰";
          }

        }
      );

    }
  );
