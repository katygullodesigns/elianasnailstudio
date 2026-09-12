const SUPABASE_URL =
  "https://kyonstvpolakjhrecqcj.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5b25zdHZwb2xha2pocmVjcWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTYxMjUsImV4cCI6MjA5NzI3MjEyNX0.oq6v7gEy8FJPh4NI3ngUYybwJcHF6rW6qkNtepCxr7Y";


// ==========================================
// SUPABASE
// ==========================================
//
// The customer booking page does not need a
// Supabase login session.
//
// Disabling session persistence prevents an old
// expired refresh token from causing:
//
// /auth/v1/token?grant_type=refresh_token
// 400 errors
//

const supabaseClient =
  supabase.createClient(
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


// ==========================================
// SERVICE DURATIONS
// ==========================================
//
// Duration is in HOURS.
//

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
  "Max Design": 2.5,

  // Additional services
  "Nail Art": 1

};


// ==========================================
// BOOKING SETTINGS
// ==========================================

const BOOKING_START_MINUTES =
  10 * 60; // 10:00 AM

const BOOKING_END_MINUTES =
  17 * 60; // 5:00 PM

const SLOT_INTERVAL =
  30; // 30 minute increments


// ==========================================
// BOOKING STATE
// ==========================================

let selectedAdditionalServices = [];

let selectedTime = "";

let selectedDate = "";


// ==========================================
// INITIALIZE PAGE
// ==========================================

document.addEventListener(
  "DOMContentLoaded",
  function () {

    initializeDatePicker();

    setupMobileMenu();

  }
);


// ==========================================
// DATE PICKER
// ==========================================

function initializeDatePicker() {

  const dateInput =
    document.getElementById(
      "appointmentDate"
    );

  if (!dateInput) {

    console.error(
      "Could not find #appointmentDate"
    );

    return;
  }

  if (
    typeof flatpickr ===
    "undefined"
  ) {

    console.error(
      "Flatpickr did not load."
    );

    return;
  }


  flatpickr(
    dateInput,
    {

      dateFormat: "Y-m-d",

      minDate: "today",

      disableMobile: true,


      onChange:
        function (
          selectedDates,
          dateStr
        ) {

          selectedDate =
            dateStr;

          selectedTime =
            "";

          console.log(
            "Selected date:",
            dateStr
          );


          const timeSlots =
            document.getElementById(
              "timeSlots"
            );


          if (timeSlots) {

            timeSlots.innerHTML =
              "<p>Loading available times...</p>";

          }


          loadAvailableTimes(
            dateStr
          );

        }

    }
  );

}


// ==========================================
// LOAD AVAILABLE TIMES
// ==========================================

async function loadAvailableTimes(
  date
) {

  const timeSlots =
    document.getElementById(
      "timeSlots"
    );

  if (!timeSlots) {

    console.error(
      "Could not find #timeSlots"
    );

    return;
  }


  timeSlots.innerHTML =
    "<p>Loading available times...</p>";


  try {

    // Get all appointments for this date
    const {
      data,
      error
    } =
      await supabaseClient
        .from("appointments")
        .select(
          "id,date,time,duration,blocked_times,status"
        )
        .eq(
          "date",
          date
        );


    if (error) {

      console.error(
        "Error loading appointments:",
        error
      );

      timeSlots.innerHTML =
        "<p>Unable to load available times.</p>";

      return;
    }


    const appointments =
      data || [];


    console.log(
      "Appointments for",
      date,
      appointments
    );


    // Create the time buttons
    renderAvailableTimeSlots(
      date,
      appointments
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


// ==========================================
// RENDER TIME SLOTS
// ==========================================

function renderAvailableTimeSlots(
  date,
  appointments
) {

  const timeSlots =
    document.getElementById(
      "timeSlots"
    );

  if (!timeSlots) {
    return;
  }


  timeSlots.innerHTML = "";


  // ----------------------------------------
  // Get current selected service duration
  // ----------------------------------------

  const duration =
    calculateBookingDuration();


  console.log(
    "CURRENT BOOKING DURATION:",
    duration,
    "hours"
  );


  // ----------------------------------------
  // Create every 30-minute start time
  // ----------------------------------------

  for (
    let start =
      BOOKING_START_MINUTES;

    start <
      BOOKING_END_MINUTES;

    start += SLOT_INTERVAL
  ) {

    const time =
      minutesToTime(start);


    // --------------------------------------
    // Determine whether this time is available
    // --------------------------------------

    const available =
      isTimeAvailable(
        start,
        duration,
        appointments
      );


    const button =
      document.createElement(
        "button"
      );


    button.type =
      "button";

    button.className =
      "time-slot";

    button.textContent =
      time;


    if (!available) {

      button.disabled =
        true;

      button.classList.add(
        "unavailable"
      );

    }
    else {

      button.addEventListener(
        "click",
        function () {

          selectTimeSlot(
            time,
            button
          );

        }
      );

    }


    timeSlots.appendChild(
      button
    );

  }


  // ----------------------------------------
  // If there are no usable times
  // ----------------------------------------

  const availableButtons =
    timeSlots.querySelectorAll(
      "button:not(:disabled)"
    );


  if (
    availableButtons.length ===
    0
  ) {

    timeSlots.innerHTML =
      "<p>No available times for this date.</p>";

  }

}


// ==========================================
// CHECK WHETHER A TIME IS AVAILABLE
// ==========================================

function isTimeAvailable(
  startMinutes,
  duration,
  appointments
) {

  // If there is no service selected yet,
  // still show the time slots.
  //
  // Use 30 minutes as the minimum check.
  //

  const requiredDuration =
    duration > 0
      ? duration
      : 0.5;


  const appointmentMinutes =
    Math.round(
      requiredDuration * 60
    );


  const newStart =
    startMinutes;

  const newEnd =
    startMinutes +
    appointmentMinutes;


  // Appointment cannot extend past 5 PM

  if (
    newEnd >
    BOOKING_END_MINUTES
  ) {

    return false;

  }


  // Check every existing appointment

  for (
    const appointment of
    appointments
  ) {

    // Ignore completed/past appointments

    if (
      appointment.status ===
        "past" ||
      appointment.status ===
        "completed"
    ) {

      continue;

    }


    const blocked =
      getExistingBlockedMinutes(
        appointment
      );


    // Check for overlap

    for (
      const blockedTime of
      blocked
    ) {

      if (
        newStart <
          blockedTime.end &&
        newEnd >
          blockedTime.start
      ) {

        return false;

      }

    }

  }


  return true;

}


// ==========================================
// GET EXISTING BLOCKED TIME RANGE
// ==========================================

function getExistingBlockedMinutes(
  appointment
) {

  const ranges = [];


  const appointmentStart =
    timeToMinutes(
      appointment.time
    );


  // ----------------------------------------
  // If blocked_times exists, use it
  // ----------------------------------------

  if (
    Array.isArray(
      appointment.blocked_times
    ) &&
    appointment.blocked_times.length
  ) {

    appointment.blocked_times.forEach(
      function (time) {

        const start =
          timeToMinutes(
            time
          );

        ranges.push({
          start: start,
          end: start + 30
        });

      }
    );


    return ranges;

  }


  // ----------------------------------------
  // Otherwise calculate from duration
  // ----------------------------------------

  const duration =
    Number(
      appointment.duration
    ) || 0.5;


  const durationMinutes =
    Math.round(
      duration * 60
    );


  ranges.push({

    start:
      appointmentStart,

    end:
      appointmentStart +
      durationMinutes

  });


  return ranges;

}


// ==========================================
// SELECT TIME SLOT
// ==========================================

function selectTimeSlot(
  time,
  button
) {

  selectedTime =
    time;


  // Remove selected class from all buttons

  document
    .querySelectorAll(
      ".time-slot"
    )
    .forEach(
      function (slot) {

        slot.classList.remove(
          "selected"
        );

      }
    );


  // Select clicked button

  button.classList.add(
    "selected"
  );


  console.log(
    "Selected time:",
    selectedTime
  );

}


// ==========================================
// CALCULATE MAIN BOOKING DURATION
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
function bookAnotherAppointment() {

  // Close success popup
  closePopup();

  // Clear appointment-specific selections
  selectedTime = "";
  selectedDate = "";

  selectedAdditionalServices = [];

  // Clear date
  const dateInput = document.getElementById("appointmentDate");
  if (dateInput) {
    dateInput.value = "";
  }

  // Clear service selections
  const serviceSelect = document.getElementById("serviceSelect");
  if (serviceSelect) {
    serviceSelect.value = "";
  }

  const polishSelect = document.getElementById("polishSelect");
  if (polishSelect) {
    polishSelect.value = "";
  }

  const designSelect = document.getElementById("designSelect");
  if (designSelect) {
    designSelect.value = "";
  }

  // Clear additional services
  renderSelectedAdditionalServices();

  // Clear available times
  const timeSlots = document.getElementById("timeSlots");

  if (timeSlots) {
    timeSlots.innerHTML = "";
  }

  // Scroll back to booking form
  document.getElementById("book")?.scrollIntoView({
    behavior: "smooth"
  });
}

// ==========================================
// CALCULATE ADDITIONAL SERVICE DURATION
// ==========================================

function getAdditionalServicesDuration() {

  let totalDuration =
    0;


  selectedAdditionalServices
    .forEach(
      function (item) {

        if (!item) {
          return;
        }


        totalDuration +=
          durations[
            item.service
          ] || 0;

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


  return totalDuration;

}


// ==========================================
// CALCULATE BOOKING DURATION FROM FORM
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
// TIME TO MINUTES
// ==========================================

function timeToMinutes(
  timeString
) {

  if (!timeString) {
    return 0;
  }


  const parts =
    timeString
      .trim()
      .split(/\s+/);


  if (
    parts.length <
    2
  ) {

    return 0;

  }


  const time =
    parts[0];


  const modifier =
    parts[1]
      .toUpperCase();


  const timeParts =
    time.split(":");


  let hours =
    Number(
      timeParts[0]
    );


  const minutes =
    Number(
      timeParts[1]
    );


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

function minutesToTime(
  totalMinutes
) {

  let hours =
    Math.floor(
      totalMinutes /
        60
    );


  const minutes =
    totalMinutes %
    60;


  let modifier =
    "AM";


  if (
    hours >= 12
  ) {

    modifier =
      "PM";

  }


  if (
    hours > 12
  ) {

    hours -= 12;

  }


  if (
    hours === 0
  ) {

    hours = 12;

  }


  return (
    hours +
    ":" +
    String(
      minutes
    ).padStart(
      2,
      "0"
    ) +
    " " +
    modifier
  );

}


// ==========================================
// GET BLOCKED TIMES
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
    Math.round(
      duration * 60
    );


  const blockedTimes =
    [];


  for (
    let minutes = 0;

    minutes <
      totalMinutes;

    minutes += 30
  ) {

    blockedTimes.push(
      minutesToTime(
        startMinutes +
        minutes
      )
    );

  }


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


  return minutesToTime(
    startMinutes +
    Math.round(
      duration * 60
    )
  );

}


// ==========================================
// ADDITIONAL SERVICE POPUP
// ==========================================

function openAdditionalServicePopup() {

  const popup =
    document.getElementById(
      "additionalServicePopup"
    );


  if (popup) {

    popup.classList.add(
      "active"
    );

  }

}


function closeAdditionalServicePopup() {

  const popup =
    document.getElementById(
      "additionalServicePopup"
    );


  if (popup) {

    popup.classList.remove(
      "active"
    );

  }

}


// ==========================================
// SAVE ADDITIONAL SERVICE
// ==========================================

function saveAdditionalServiceOptions() {

  const service =
    document.getElementById(
      "additionalServiceType"
    )?.value || "";


  const polish =
    document.getElementById(
      "additionalPolishSelect"
    )?.value || "";


  const design =
    document.getElementById(
      "additionalDesignSelect"
    )?.value || "";


  const designDetails =
    document.getElementById(
      "additionalDesignDetails"
    )?.value || "";


  if (!service) {

    alert(
      "Please select an additional service."
    );

    return;

  }


  addAdditionalService(
    service,
    polish,
    design,
    designDetails
  );


  renderSelectedAdditionalServices();


  closeAdditionalServicePopup();


  // Recalculate available times
  // because appointment duration changed.

  if (selectedDate) {

    loadAvailableTimes(
      selectedDate
    );

  }

}


// ==========================================
// RENDER SELECTED ADDITIONAL SERVICES
// ==========================================

function renderSelectedAdditionalServices() {

  const container =
    document.getElementById(
      "selectedAdditionalServices"
    );


  if (!container) {
    return;
  }


  container.innerHTML = "";


  selectedAdditionalServices
    .forEach(
      function (
        item,
        index
      ) {

        const wrapper =
          document.createElement(
            "div"
          );


        wrapper.className =
          "selected-additional-service";


        const text =
          document.createElement(
            "span"
          );


        let description =
          item.service;


        if (
          item.polish
        ) {

          description +=
            " • " +
            item.polish;

        }


        if (
          item.design
        ) {

          description +=
            " • " +
            item.design;

        }


        text.textContent =
          description;


        const removeButton =
          document.createElement(
            "button"
          );


        removeButton.type =
          "button";


        removeButton.textContent =
          "×";


        removeButton.addEventListener(
          "click",
          function () {

            removeAdditionalService(
              index
            );

            renderSelectedAdditionalServices();


            if (selectedDate) {

              loadAvailableTimes(
                selectedDate
              );

            }

          }
        );


        wrapper.appendChild(
          text
        );


        wrapper.appendChild(
          removeButton
        );


        container.appendChild(
          wrapper
        );

      }
    );

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

    service:
      service,

    polish:
      polish,

    design:
      design,

    designDetails:
      designDetails

  });

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

}


function clearAdditionalServices() {

  selectedAdditionalServices =
    [];


  renderSelectedAdditionalServices();

}


// ==========================================
// BOOK APPOINTMENT
// ==========================================

async function bookAppointment() {

  const name =
    document.getElementById(
      "clientName"
    )?.value.trim();


  const phone =
    document.getElementById(
      "clientPhone"
    )?.value.trim();


  const date =
    document.getElementById(
      "appointmentDate"
    )?.value;


  const service =
    document.getElementById(
      "serviceSelect"
    )?.value;


  const polish =
    document.getElementById(
      "polishSelect"
    )?.value;


  const design =
    document.getElementById(
      "designSelect"
    )?.value;


  const message =
    document.getElementById(
      "message"
    );


  // ----------------------------------------
  // Validate required fields
  // ----------------------------------------

  if (!name) {

    alert(
      "Please enter your name."
    );

    return;

  }


  if (!phone) {

    alert(
      "Please enter your phone number."
    );

    return;

  }


  if (!date) {

    alert(
      "Please select a date."
    );

    return;

  }


  if (!selectedTime) {

    alert(
      "Please select a time."
    );

    return;

  }


  if (!service) {

    alert(
      "Please select a service."
    );

    return;

  }


  // ----------------------------------------
  // Calculate appointment information
  // ----------------------------------------

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


  console.log(
    "BOOKING:",
    {
      name,
      phone,
      date,
      selectedTime,
      service,
      polish,
      design,
      duration,
      endTime,
      blockedTimes,
      additionalServices:
        selectedAdditionalServices
    }
  );


  // ----------------------------------------
  // Prevent booking if time is no longer
  // available
  // ----------------------------------------

  const {
    data: existingAppointments,
    error:
      availabilityError
  } =
    await supabaseClient
      .from("appointments")
      .select(
        "id,date,time,duration,blocked_times,status"
      )
      .eq(
        "date",
        date
      );


  if (
    availabilityError
  ) {

    console.error(
      "Availability error:",
      availabilityError
    );

    if (message) {

      message.textContent =
        "Unable to check availability. Please try again.";

    }

    return;

  }


  if (
    !isTimeAvailable(
      timeToMinutes(
        selectedTime
      ),
      duration,
      existingAppointments ||
        []
    )
  ) {

    alert(
      "That time is no longer available. Please choose another time."
    );


    loadAvailableTimes(
      date
    );


    selectedTime =
      "";


    return;

  }


  // ----------------------------------------
  // Disable button while saving
  // ----------------------------------------

  const buttons =
    document.querySelectorAll(
      'button[onclick="bookAppointment()"]'
    );


  buttons.forEach(
    function (button) {

      button.disabled =
        true;

      button.textContent =
        "Booking...";

    }
  );


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("appointments")
        .insert([
          {

            name:
              name,

            phone:
              phone,

            date:
              date,

            time:
              selectedTime,

            service:
              service,

            polish:
              polish || "",

            design:
              design || "",

            duration:
              duration,

            blocked_times:
              blockedTimes,

            additional_services:
              selectedAdditionalServices,

            status:
              "upcoming"

          }
        ])
        .select();


    if (error) {

      console.error(
        "Booking error:",
        error
      );


      console.error(
        "Code:",
        error.code
      );


      console.error(
        "Message:",
        error.message
      );


      console.error(
        "Details:",
        error.details
      );


      console.error(
        "Hint:",
        error.hint
      );


      if (message) {

        message.textContent =
          error.message ||
          "Unable to book appointment.";

      }


      alert(
        "Unable to book appointment.\n\n" +
        (
          error.message ||
          "Please try again."
        )
      );


      return;

    }


    console.log(
      "Appointment booked:",
      data
    );


    // --------------------------------------
    // Show success popup
    // --------------------------------------

    openBookingPopup();


    // --------------------------------------
    // Clear form
    // --------------------------------------

    document.getElementById(
      "clientName"
    ).value = "";


    document.getElementById(
      "clientPhone"
    ).value = "";


    document.getElementById(
      "serviceSelect"
    ).value = "";


    document.getElementById(
      "polishSelect"
    ).value = "";


    document.getElementById(
      "designSelect"
    ).value = "";


    selectedAdditionalServices =
      [];


    selectedTime =
      "";


    renderSelectedAdditionalServices();


    const timeSlots =
      document.getElementById(
        "timeSlots"
      );


    if (timeSlots) {

      timeSlots.innerHTML =
        "";

    }


  }
  catch (error) {

    console.error(
      "Unexpected booking error:",
      error
    );


    alert(
      "Something went wrong while booking. Please try again."
    );

  }
  finally {

    buttons.forEach(
      function (button) {

        button.disabled =
          false;

        button.textContent =
          "Book Appointment";

      }
    );

  }

}


// ==========================================
// BOOKING SUCCESS POPUP
// ==========================================

function openBookingPopup() {

  const popup =
    document.getElementById(
      "bookingPopup"
    );


  if (popup) {

    popup.classList.add(
      "active"
    );

  }

}


function closePopup() {

  const popup =
    document.getElementById(
      "bookingPopup"
    );


  if (popup) {

    popup.classList.remove(
      "active"
    );

  }

}


// ==========================================
// MOBILE MENU
// ==========================================

function setupMobileMenu() {

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


// ==========================================
// MOBILE MENU TOGGLE
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
