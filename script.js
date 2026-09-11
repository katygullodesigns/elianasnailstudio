
const SUPABASE_URL =
  "https://kyonstvpolakjhrecqcj.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5b25zdHZwb2xha2pocmVjcWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTYxMjUsImV4cCI6MjA5NzI3MjEyNX0.oq6v7gEy8FJPh4NI3ngUYybwJcHF6rW6qkNtepCxr7Y";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


// ==========================================
// SERVICE DURATIONS
// ==========================================

const durations = {
  // Main services
  "Manicure": 1.5,
  "Pedicure": 2.0,

  // Polish
  "Gel": 1.5,
  "Acrylic": 1.5,

  // Design
  "Basic": 0.5,
  "Minimal Design": 1,
  "Max Design": 2.5
};


// ==========================================
// BOOKING STATE
// ==========================================

let selectedAdditionalServices = [];


// ==========================================
// MAIN BOOKING DURATION
// ==========================================
//
// Service, polish and design are all part of
// the SAME main appointment.
//
// Only the longest duration is used.
//
// Example:
//
// Manicure = 1.5
// Gel = 1.5
// Max Design = 2.5
//
// Main duration = 2.5 hours
//

function getMainBookingDuration(
  service,
  polish,
  design
) {
  const serviceDuration =
    durations[service] || 0;

  const polishDuration =
    durations[polish] || 0;

  const designDuration =
    durations[design] || 0;

  return Math.max(
    serviceDuration,
    polishDuration,
    designDuration
  );
}


// ==========================================
// ADDITIONAL SERVICE DURATION
// ==========================================
//
// Additional services are ADDED together.
//
// Example:
//
// Main appointment = 1.5 hours
// Additional Pedicure = 2 hours
// Additional Design = 1 hour
//
// Total = 4.5 hours
//

function getAdditionalServicesDuration() {
  let totalDuration = 0;

  selectedAdditionalServices.forEach(
    function (item) {
      if (!item) {
        return;
      }

      const serviceDuration =
        durations[item.service] || 0;

      totalDuration += serviceDuration;
    }
  );

  return totalDuration;
}


// ==========================================
// TOTAL APPOINTMENT DURATION
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
    "=============================="
  );

  console.log(
    "MAIN DURATION:",
    mainDuration,
    "hours"
  );

  console.log(
    "ADDITIONAL DURATION:",
    additionalDuration,
    "hours"
  );

  console.log(
    "TOTAL DURATION:",
    totalDuration,
    "hours"
  );

  console.log(
    "=============================="
  );

  return totalDuration;
}


// ==========================================
// TIME TO MINUTES
// ==========================================

function timeToMinutes(timeString) {
  if (!timeString) {
    return 0;
  }

  const parts =
    timeString.trim().split(/\s+/);

  if (parts.length < 2) {
    return 0;
  }

  const time =
    parts[0];

  const modifier =
    parts[1].toUpperCase();

  const timeParts =
    time.split(":");

  if (timeParts.length !== 2) {
    return 0;
  }

  let hours =
    Number(timeParts[0]);

  const minutes =
    Number(timeParts[1]);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return 0;
  }

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


// ==========================================
// MINUTES TO TIME
// ==========================================

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
//
// Every 30-minute period occupied by the
// appointment is added to blocked_times.
//
// Example:
//
// Start: 10:00 AM
// Duration: 2.5 hours
//
// 10:00 AM
// 10:30 AM
// 11:00 AM
// 11:30 AM
// 12:00 PM
//
// Appointment ends at 12:30 PM.
//

function getBlockedTimes(
  selectedTime,
  duration
) {
  if (
    !selectedTime ||
    !duration ||
    duration <= 0
  ) {
    return [];
  }

  const startMinutes =
    timeToMinutes(
      selectedTime
    );

  const totalMinutes =
    Math.round(
      duration * 60
    );

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
// GET APPOINTMENT END TIME
// ==========================================

function getAppointmentEndTime(
  selectedTime,
  duration
) {
  if (
    !selectedTime ||
    !duration
  ) {
    return "";
  }

  const startMinutes =
    timeToMinutes(
      selectedTime
    );

  const durationMinutes =
    Math.round(
      duration * 60
    );

  return minutesToTime(
    startMinutes +
    durationMinutes
  );
}


// ==========================================
// ADD ADDITIONAL SERVICE
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

  const additionalService = {
    service: service,
    polish: polish,
    design: design,
    designDetails: designDetails
  };

  selectedAdditionalServices.push(
    additionalService
  );

  console.log(
    "ADDED ADDITIONAL SERVICE:",
    additionalService
  );

  console.log(
    "ALL ADDITIONAL SERVICES:",
    selectedAdditionalServices
  );

  console.log(
    "ADDITIONAL SERVICE DURATION:",
    getAdditionalServicesDuration(),
    "hours"
  );
}


// ==========================================
// REMOVE ADDITIONAL SERVICE
// ==========================================

function removeAdditionalService(index) {
  if (
    index < 0 ||
    index >=
      selectedAdditionalServices.length
  ) {
    return;
  }

  const removedService =
    selectedAdditionalServices[index];

  selectedAdditionalServices.splice(
    index,
    1
  );

  console.log(
    "REMOVED ADDITIONAL SERVICE:",
    removedService
  );

  console.log(
    "ALL ADDITIONAL SERVICES:",
    selectedAdditionalServices
  );

  console.log(
    "NEW ADDITIONAL DURATION:",
    getAdditionalServicesDuration(),
    "hours"
  );
}


// ==========================================
// CLEAR ADDITIONAL SERVICES
// ==========================================

function clearAdditionalServices() {
  selectedAdditionalServices = [];

  console.log(
    "Additional services cleared."
  );
}


// ==========================================
// GET ADDITIONAL SERVICE COUNT
// ==========================================

function getAdditionalServiceCount() {
  return selectedAdditionalServices.length;
}


// ==========================================
// GET BOOKING DURATION FROM FORM
// ==========================================

function calculateBookingDuration() {
  const serviceSelect =
    document.getElementById(
      "serviceSelect"
    );

  const polishSelect =
    document.getElementById(
      "polishSelect"
    );

  const designSelect =
    document.getElementById(
      "designSelect"
    );

  const service =
    serviceSelect
      ? serviceSelect.value
      : "";

  const polish =
    polishSelect
      ? polishSelect.value
      : "";

  const design =
    designSelect
      ? designSelect.value
      : "";

  return getTotalAppointmentDuration(
    service,
    polish,
    design
  );
}


// ==========================================
// GET COMPLETE BOOKING INFORMATION
// ==========================================
//
// This helper gives the booking process
// everything it needs in one object.
//
// ==========================================

function getBookingTiming(
  service,
  polish,
  design,
  selectedTime
) {
  const duration =
    getTotalAppointmentDuration(
      service,
      polish,
      design
    );

  const endTime =
    getAppointmentEndTime(
      selectedTime,
      duration
    );

  const blockedTimes =
    getBlockedTimes(
      selectedTime,
      duration
    );

  return {
    duration: duration,
    endTime: endTime,
    blockedTimes: blockedTimes
  };
}


// ==========================================
// MOBILE MENU
// ==========================================

function toggleMenu() {
  const nav =
    document.querySelector(
      "nav"
    );

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


// ==========================================
// CLOSE MOBILE MENU WHEN LINK IS CLICKED
// ==========================================

document.addEventListener(
  "DOMContentLoaded",
  function () {
    document
      .querySelectorAll(
        "nav a"
      )
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
                btn.innerHTML =
                  "☰";
              }
            }
          );
        }
      );
  }
);
