
// ==========================================================
// SUPABASE
// ==========================================================

const SUPABASE_URL =
  "https://kyonstvpolakjhrecqcj.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5b25zdHZwb2xha2pocmVjcWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTYxMjUsImV4cCI6MjA5NzI3MjEyNX0.oq6v7gEy8FJPh4NI3ngUYybwJcHF6rW6qkNtepCxr7Y";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
);


// ==========================================================
// SERVICE DURATIONS
// ==========================================================

const durations = {
  Manicure: 1.5,
  Pedicure: 2.0,

  Gel: 1.5,
  Acrylic: 1.5,

  Basic: 0.5,
  "Minimal Design": 1.0,
  "Max Design": 2.5,

  "Nail Art": 1.0
};


// ==========================================================
// BOOKING SETTINGS
// ==========================================================

const BOOKING_START_MINUTES = 10 * 60; // 10:00 AM
const BOOKING_END_MINUTES = 17 * 60;   // 5:00 PM
const SLOT_INTERVAL = 30;


// ==========================================================
// BOOKING STATE
// ==========================================================

let selectedAdditionalServices = [];
let selectedTime = "";
let selectedDate = "";
let bookingInProgress = false;
let datePicker = null;


// ==========================================================
// PAGE INITIALIZATION
// ==========================================================

document.addEventListener("DOMContentLoaded", function () {

  console.log("Eliana's Nail Studio booking page loaded.");

  initializeDatePicker();
  setupMobileMenu();
  setupBookingFieldListeners();
  renderSelectedAdditionalServices();

});


// ==========================================================
// DATE PICKER
// ==========================================================

function initializeDatePicker() {

  const dateInput =
    document.getElementById("appointmentDate");

  if (!dateInput) {
    console.error("Could not find #appointmentDate.");
    return;
  }

  if (typeof flatpickr === "undefined") {
    console.error("Flatpickr did not load.");
    return;
  }

  datePicker = flatpickr(dateInput, {

    dateFormat: "Y-m-d",

    minDate: "today",

    disableMobile: true,

    onChange: function (selectedDates, dateStr) {

      selectedDate = dateStr;
      selectedTime = "";

      const timeSlots =
        document.getElementById("timeSlots");

      if (timeSlots) {
        timeSlots.innerHTML =
          "<p>Loading available times...</p>";
      }

      if (dateStr) {
        loadAvailableTimes(dateStr);
      }

    }

  });

}


// ==========================================================
// BOOKING FIELD LISTENERS
// ==========================================================

function setupBookingFieldListeners() {

  const fields = [
    "serviceSelect",
    "polishSelect",
    "designSelect"
  ];

  fields.forEach(function (id) {

    const element =
      document.getElementById(id);

    if (!element) {
      return;
    }

    element.addEventListener("change", function () {

      selectedTime = "";

      if (selectedDate) {
        loadAvailableTimes(selectedDate);
      }

    });

  });

}


// ==========================================================
// LOAD AVAILABLE TIMES
// ==========================================================

async function loadAvailableTimes(date) {

  const timeSlots =
    document.getElementById("timeSlots");

  if (!timeSlots) {
    return;
  }

  if (!date) {
    timeSlots.innerHTML = "";
    return;
  }

  timeSlots.innerHTML =
    "<p>Loading available times...</p>";

  try {

    const {
      data,
      error
    } = await supabaseClient
      .from("appointments")
      .select(
        "id,date,time,duration,blocked_times,status"
      )
      .eq("date", date);

    if (error) {

      console.error(
        "Error loading appointments:",
        error
      );

      timeSlots.innerHTML =
        "<p>Unable to load available times.</p>";

      return;
    }

    renderAvailableTimeSlots(
      date,
      Array.isArray(data) ? data : []
    );

  }
  catch (error) {

    console.error(
      "Unexpected error loading times:",
      error
    );

    timeSlots.innerHTML =
      "<p>Unable to load available times.</p>";

  }

}


// ==========================================================
// RENDER AVAILABLE TIME SLOTS
// ==========================================================

function renderAvailableTimeSlots(
  date,
  appointments
) {

  const timeSlots =
    document.getElementById("timeSlots");

  if (!timeSlots) {
    return;
  }

  timeSlots.innerHTML = "";

  const duration =
    calculateBookingDuration();

  for (
    let start = BOOKING_START_MINUTES;
    start < BOOKING_END_MINUTES;
    start += SLOT_INTERVAL
  ) {

    const time =
      minutesToTime(start);

    const available =
      isTimeAvailable(
        start,
        duration,
        appointments
      );

    const button =
      document.createElement("button");

    button.type = "button";
    button.className = "time-slot";
    button.textContent = time;

    if (!available) {

      button.disabled = true;
      button.classList.add("unavailable");

    }
    else {

      button.addEventListener(
        "click",
        function () {
          selectTimeSlot(time, button);
        }
      );

    }

    timeSlots.appendChild(button);

  }

  const availableButtons =
    timeSlots.querySelectorAll(
      "button:not(:disabled)"
    );

  if (availableButtons.length === 0) {

    timeSlots.innerHTML =
      "<p>No available times for this date.</p>";

  }

}


// ==========================================================
// CHECK TIME AVAILABILITY
// ==========================================================

function isTimeAvailable(
  startMinutes,
  duration,
  appointments
) {

  const requiredDuration =
    duration > 0
      ? duration
      : 0.5;

  const appointmentMinutes =
    Math.round(requiredDuration * 60);

  const newStart =
    startMinutes;

  const newEnd =
    startMinutes + appointmentMinutes;

  // Appointment cannot extend past 5 PM.
  if (newEnd > BOOKING_END_MINUTES) {
    return false;
  }

  for (const appointment of appointments) {

    if (!appointment) {
      continue;
    }

    // Ignore completed appointments.
    if (
      appointment.status === "past" ||
      appointment.status === "completed"
    ) {
      continue;
    }

    const blockedRanges =
      getExistingBlockedMinutes(
        appointment
      );

    for (const blockedRange of blockedRanges) {

      if (
        newStart < blockedRange.end &&
        newEnd > blockedRange.start
      ) {
        return false;
      }

    }

  }

  return true;

}


// ==========================================================
// GET EXISTING APPOINTMENT BLOCKED TIMES
// ==========================================================

function getExistingBlockedMinutes(
  appointment
) {

  const ranges = [];

  if (!appointment) {
    return ranges;
  }

  const appointmentStart =
    timeToMinutes(appointment.time);

  // Use saved blocked_times if available.
  if (
    Array.isArray(appointment.blocked_times) &&
    appointment.blocked_times.length > 0
  ) {

    appointment.blocked_times.forEach(function (time) {

      const start =
        timeToMinutes(time);

      if (Number.isFinite(start)) {

        ranges.push({
          start: start,
          end: start + 30
        });

      }

    });

    if (ranges.length > 0) {
      return ranges;
    }

  }

  // Fall back to appointment duration.
  const duration =
    Number(appointment.duration) || 0.5;

  const durationMinutes =
    Math.round(duration * 60);

  if (Number.isFinite(appointmentStart)) {

    ranges.push({
      start: appointmentStart,
      end: appointmentStart + durationMinutes
    });

  }

  return ranges;

}


// ==========================================================
// SELECT TIME SLOT
// ==========================================================

function selectTimeSlot(
  time,
  button
) {

  selectedTime = time;

  document
    .querySelectorAll(".time-slot")
    .forEach(function (slot) {
      slot.classList.remove("selected");
    });

  if (button) {
    button.classList.add("selected");
  }

}


// ==========================================================
// MAIN BOOKING DURATION
// ==========================================================

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


// ==========================================================
// ADDITIONAL SERVICES DURATION
// ==========================================================

function getAdditionalServicesDuration() {

  let totalDuration = 0;

  selectedAdditionalServices.forEach(function (item) {

    if (!item) {
      return;
    }

    totalDuration +=
      durations[item.service] || 0;

  });

  return totalDuration;

}


// ==========================================================
// TOTAL APPOINTMENT DURATION
// ==========================================================

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

  return mainDuration + additionalDuration;

}


// ==========================================================
// CALCULATE BOOKING DURATION FROM FORM
// ==========================================================

function calculateBookingDuration() {

  const service =
    document.getElementById(
      "serviceSelect"
    )?.value || "";

  const polish =
    document.getElementById(
      "polishSelect"
    )?.value || "";

  const design =
    document.getElementById(
      "designSelect"
    )?.value || "";

  return getTotalAppointmentDuration(
    service,
    polish,
    design
  );

}


// ==========================================================
// TIME → MINUTES
// ==========================================================

function timeToMinutes(timeString) {

  if (
    !timeString ||
    typeof timeString !== "string"
  ) {
    return NaN;
  }

  const parts =
    timeString.trim().split(/\s+/);

  if (parts.length < 2) {
    return NaN;
  }

  const time = parts[0];
  const modifier = parts[1].toUpperCase();

  const timeParts =
    time.split(":");

  if (timeParts.length !== 2) {
    return NaN;
  }

  let hours =
    Number(timeParts[0]);

  const minutes =
    Number(timeParts[1]);

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes)
  ) {
    return NaN;
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

  return hours * 60 + minutes;

}


// ==========================================================
// MINUTES → TIME
// ==========================================================

function minutesToTime(totalMinutes) {

  let hours =
    Math.floor(totalMinutes / 60);

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
    String(minutes).padStart(2, "0") +
    " " +
    modifier
  );

}


// ==========================================================
// GET BLOCKED TIMES FOR NEW APPOINTMENT
// ==========================================================

function getBlockedTimes(
  selectedTime,
  duration
) {

  if (!selectedTime || !duration) {
    return [];
  }

  const startMinutes =
    timeToMinutes(selectedTime);

  if (!Number.isFinite(startMinutes)) {
    return [];
  }

  const totalMinutes =
    Math.round(duration * 60);

  const blockedTimes = [];

  for (
    let minutes = 0;
    minutes < totalMinutes;
    minutes += 30
  ) {

    blockedTimes.push(
      minutesToTime(
        startMinutes + minutes
      )
    );

  }

  return blockedTimes;

}


// ==========================================================
// GET APPOINTMENT END TIME
// ==========================================================

function getAppointmentEndTime(
  selectedTime,
  duration
) {

  if (!selectedTime || !duration) {
    return "";
  }

  const startMinutes =
    timeToMinutes(selectedTime);

  if (!Number.isFinite(startMinutes)) {
    return "";
  }

  return minutesToTime(
    startMinutes +
    Math.round(duration * 60)
  );

}


// ==========================================================
// ADDITIONAL SERVICE POPUP
// ==========================================================

function openAdditionalServicePopup() {

  const popup =
    document.getElementById(
      "additionalServicePopup"
    );

  if (!popup) {
    console.error(
      "Could not find #additionalServicePopup."
    );
    return;
  }

  const service =
    document.getElementById(
      "additionalServiceType"
    );

  const polish =
    document.getElementById(
      "additionalPolishSelect"
    );

  const design =
    document.getElementById(
      "additionalDesignSelect"
    );

  const details =
    document.getElementById(
      "additionalDesignDetails"
    );

  if (service) {
    s
