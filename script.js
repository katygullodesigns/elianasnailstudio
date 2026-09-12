// ==========================================================
// SUPABASE
// ==========================================================

const SUPABASE_URL =
  "https://kyonstvpolakjhrecqcj.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5b25zdHZwb2xha2pocmVjcWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTYxMjUsImV4cCI6MjA5NzI3MjEyNX0.oq6v7gEy8FJPh4NI3ngUYybwJcHF6rW6qkNtepCxr7Y";

let supabaseClient = null;

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
// INITIALIZE SUPABASE
// ==========================================================

function initializeSupabase() {

  try {

    if (
      typeof window.supabase === "undefined" ||
      typeof window.supabase.createClient !== "function"
    ) {

      console.error(
        "Supabase library did not load."
      );

      return false;
    }

    supabaseClient =
      window.supabase.createClient(
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

    console.log(
      "Supabase initialized successfully."
    );

    return true;

  }
  catch (error) {

    console.error(
      "Supabase initialization failed:",
      error
    );

    supabaseClient = null;

    return false;

  }

}


// ==========================================================
// PAGE INITIALIZATION
// ==========================================================

document.addEventListener(
  "DOMContentLoaded",
  function () {

    console.log(
      "Eliana's Nail Studio booking page loaded."
    );


    // ------------------------------------------------------
    // SUPABASE
    // ------------------------------------------------------

    initializeSupabase();

    // ------------------------------------------------------
    // DATE PICKER
    // ------------------------------------------------------

    try {

      initializeDatePicker();

    }
    catch (error) {

      console.error(
        "Date picker initialization failed:",
        error
      );

    }


    // ------------------------------------------------------
    // MOBILE MENU
    // ------------------------------------------------------

    try {

      setupMobileMenu();

    }
    catch (error) {

      console.error(
        "Mobile menu initialization failed:",
        error
      );

    }


    // ------------------------------------------------------
    // BOOKING LISTENERS
    // ------------------------------------------------------

    try {

      setupBookingFieldListeners();

    }
    catch (error) {

      console.error(
        "Booking listener initialization failed:",
        error
      );

    }


    // ------------------------------------------------------
    // ADDITIONAL SERVICES
    // ------------------------------------------------------

    try {

      renderSelectedAdditionalServices();

    }
    catch (error) {

      console.error(
        "Additional service initialization failed:",
        error
      );

    }

  }
);


// ==========================================================
// DATE PICKER
// ==========================================================

function initializeDatePicker() {

  const dateInput =
    document.getElementById(
      "appointmentDate"
    );

  if (!dateInput) {

    console.error(
      "Could not find #appointmentDate."
    );

    return;

  }


  if (typeof flatpickr === "undefined") {

    console.error(
      "Flatpickr did not load."
    );

    return;

  }


  datePicker =
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

            selectedDate = dateStr;

            selectedTime = "";


            const timeSlots =
              document.getElementById(
                "timeSlots"
              );


            if (timeSlots) {

              timeSlots.innerHTML =
                "<p>Loading available times...</p>";

            }


            if (dateStr) {

              loadAvailableTimes(
                dateStr
              );

            }

          }

      }
    );

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


  fields.forEach(
    function (id) {

      const element =
        document.getElementById(id);


      if (!element) {
        return;
      }


      element.addEventListener(
        "change",
        function () {

          selectedTime = "";


          if (selectedDate) {

            loadAvailableTimes(
              selectedDate
            );

          }

        }
      );

    }
  );

}


// ==========================================================
// LOAD AVAILABLE TIMES
// ==========================================================

async function loadAvailableTimes(date) {

  const timeSlots =
    document.getElementById(
      "timeSlots"
    );


  if (!timeSlots) {
    return;
  }


  if (!date) {

    timeSlots.innerHTML = "";

    return;

  }


  if (!supabaseClient) {

    console.error(
      "Supabase is not initialized."
    );

    timeSlots.innerHTML =
      "<p>Booking system unavailable. Please refresh the page.</p>";

    return;

  }


  timeSlots.innerHTML =
    "<p>Loading available times...</p>";


  try {

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


    renderAvailableTimeSlots(
      date,
      Array.isArray(data)
        ? data
        : []
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
    document.getElementById(
      "timeSlots"
    );


  if (!timeSlots) {
    return;
  }


  timeSlots.innerHTML = "";


  const duration =
    calculateBookingDuration();


  // If no service has been selected yet,
  // use the smallest possible appointment.
  const bookingDuration =
    duration > 0
      ? duration
      : 0.5;


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
        bookingDuration,
        appointments
      );


    const button =
      document.createElement(
        "button"
      );


    button.type = "button";

    button.className =
      "time-slot";

    button.textContent =
      time;


    if (!available) {

      button.disabled = true;

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


  const availableButtons =
    timeSlots.querySelectorAll(
      "button:not(:disabled)"
    );


  if (
    availableButtons.length === 0
  ) {

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
    Number(duration) > 0
      ? Number(duration)
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


  // Cannot go past 5 PM.
  if (
    newEnd >
    BOOKING_END_MINUTES
  ) {

    return false;

  }


  if (
    !Array.isArray(appointments)
  ) {

    return true;

  }


  for (
    const appointment
    of appointments
  ) {

    if (!appointment) {
      continue;
    }


    // Completed appointments
    // do not block availability.
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


    for (
      const blockedRange
      of blockedRanges
    ) {

      if (
        newStart <
        blockedRange.end
        &&
        newEnd >
        blockedRange.start
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
    timeToMinutes(
      appointment.time
    );


  // --------------------------------------------------------
  // USE SAVED BLOCKED TIMES
  // --------------------------------------------------------

  if (
    Array.isArray(
      appointment.blocked_times
    )
    &&
    appointment.blocked_times.length > 0
  ) {

    appointment.blocked_times.forEach(
      function (time) {

        const start =
          timeToMinutes(time);


        if (
          Number.isFinite(start)
        ) {

          ranges.push({

            start: start,

            end:
              start + 30

          });

        }

      }
    );


    if (ranges.length > 0) {

      return ranges;

    }

  }


  // --------------------------------------------------------
  // FALL BACK TO DURATION
  // --------------------------------------------------------

  const duration =
    Number(
      appointment.duration
    ) || 0.5;


  const durationMinutes =
    Math.round(
      duration * 60
    );


  if (
    Number.isFinite(
      appointmentStart
    )
  ) {

    ranges.push({

      start:
        appointmentStart,

      end:
        appointmentStart +
        durationMinutes

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

  selectedTime =
    time;


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


  if (button) {

    button.classList.add(
      "selected"
    );

  }


  console.log(
    "Selected appointment time:",
    selectedTime
  );

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
// ADDITIONAL SERVICE DURATION
// ==========================================================

function getAdditionalServicesDuration() {

  let totalDuration =
    0;


  if (
    !Array.isArray(
      selectedAdditionalServices
    )
  ) {

    return 0;

  }


  selectedAdditionalServices.forEach(
    function (item) {

      if (!item) {
        return;
      }


      totalDuration +=
        durations[item.service] || 0;

    }
  );


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


  return (
    mainDuration +
    additionalDuration
  );

}


// ==========================================================
// CALCULATE BOOKING DURATION
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

function timeToMinutes(
  timeString
) {

  if (
    !timeString ||
    typeof timeString !== "string"
  ) {

    return NaN;

  }


  const parts =
    timeString
      .trim()
      .split(/\s+/);


  if (
    parts.length < 2
  ) {

    return NaN;

  }


  const time =
    parts[0];


  const modifier =
    parts[1].toUpperCase();


  const timeParts =
    time.split(":");


  if (
    timeParts.length !== 2
  ) {

    return NaN;

  }


  let hours =
    Number(
      timeParts[0]
    );


  const minutes =
    Number(
      timeParts[1]
    );


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


  return (
    hours * 60 +
    minutes
  );

}


// ==========================================================
// MINUTES → TIME
// ==========================================================

function minutesToTime(
  totalMinutes
) {

  let hours =
    Math.floor(
      totalMinutes / 60
    );


  const minutes =
    totalMinutes % 60;


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
    String(minutes)
      .padStart(2, "0") +
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


  if (
    !Number.isFinite(
      startMinutes
    )
  ) {

    return [];

  }


  const totalMinutes =
    Math.round(
      Number(duration) * 60
    );


  const blockedTimes =
    [];


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


  return blockedTimes;

}


// ==========================================================
// GET APPOINTMENT END TIME
// ==========================================================

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


  if (
    !Number.isFinite(
      startMinutes
    )
  ) {

    return "";

  }


  return minutesToTime(

    startMinutes +
    Math.round(
      Number(duration) * 60
    )

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

  if (service) service.value = "";
  if (polish) polish.value = "";
  if (design) design.value = "";
  if (details) details.value = "";

  popup.classList.add("active");

  document.body.style.overflow = "hidden";
}


function closeAdditionalServicePopup() {

  const popup =
    document.getElementById(
      "additionalServicePopup"
    );

  if (!popup) {
    return;
  }

  popup.classList.remove("active");

  document.body.style.overflow = "";
}


// ==========================================================
// CLOSE ADDITIONAL SERVICE POPUP
// ==========================================================

function closeAdditionalServicePopup() {

  const popup =
    document.getElementById(
      "additionalServicePopup"
    );


  if (!popup) {

    return;

  }


  popup.style.display = "none";

  popup.classList.remove(
    "active"
  );

}



// ==========================================================
// SAVE ADDITIONAL SERVICE
// ==========================================================

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
    )?.value.trim() || "";


  if (!service) {

    alert(
      "Please select an additional service."
    );

    return false;

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


  renderSelectedAdditionalServices();


  closeAdditionalServicePopup();


  selectedTime = "";


  if (selectedDate) {

    loadAvailableTimes(
      selectedDate
    );

  }


  return true;

}


// ==========================================================
// RENDER ADDITIONAL SERVICES
// ==========================================================

function renderSelectedAdditionalServices() {

  const container =
    document.getElementById(
      "selectedAdditionalServices"
    );


  if (!container) {
    return;
  }


  container.innerHTML = "";


  selectedAdditionalServices.forEach(
    function (
      item,
      index
    ) {

      if (!item) {
        return;
      }


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


      if (item.polish) {

        description +=
          " • " +
          item.polish;

      }


      if (
        item.design &&
        item.design !== "None"
      ) {

        description +=
          " • " +
          item.design;

      }


      if (item.designDetails) {

        description +=
          " • " +
          item.designDetails;

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


      removeButton.setAttribute(
        "aria-label",
        "Remove additional service"
      );


      removeButton.addEventListener(
        "click",
        function () {

          removeAdditionalService(
            index
          );

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


// ==========================================================
// REMOVE ADDITIONAL SERVICE
// ==========================================================

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


  renderSelectedAdditionalServices();


  selectedTime = "";


  if (selectedDate) {

    loadAvailableTimes(
      selectedDate
    );

  }

}


// ==========================================================
// CLEAR ADDITIONAL SERVICES
// ==========================================================

function clearAdditionalServices() {

  selectedAdditionalServices =
    [];


  renderSelectedAdditionalServices();


  selectedTime = "";


  if (selectedDate) {

    loadAvailableTimes(
      selectedDate
    );

  }

}


// ==========================================================
// BOOK APPOINTMENT
// ==========================================================

async function bookAppointment() {

  console.log(
    "Book Appointment button clicked."
  );


  if (bookingInProgress) {
    return;
  }


  if (!supabaseClient) {

    alert(
      "The booking system is unavailable. Please refresh the page and try again."
    );

    return;

  }


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


  // --------------------------------------------------------
  // VALIDATION
  // --------------------------------------------------------

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


  if (!service) {

    alert(
      "Please select a service."
    );

    return;

  }


  if (!selectedTime) {

    alert(
      "Please select a time."
    );

    return;

  }


  // --------------------------------------------------------
  // CALCULATE DURATION
  // --------------------------------------------------------

  const duration =
    getTotalAppointmentDuration(
      service,
      polish,
      design
    );


  if (
    !duration ||
    duration <= 0
  ) {

    alert(
      "Unable to calculate appointment duration."
    );

    return;

  }


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
    "Booking information:",
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


  try {

    // ------------------------------------------------------
    // CHECK AVAILABILITY AGAIN
    // ------------------------------------------------------

    const {

      data:
        existingAppointments,

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


    if (availabilityError) {

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


    const requestedStart =
      timeToMinutes(
        selectedTime
      );


    const available =
      isTimeAvailable(

        requestedStart,

        duration,

        existingAppointments || []

      );


    if (!available) {

      alert(
        "That time is no longer available. Please choose another time."
      );


      selectedTime = "";


      await loadAvailableTimes(
        date
      );


      return;

    }


    // ------------------------------------------------------
    // DISABLE BOOKING BUTTON
    // ------------------------------------------------------

    bookingInProgress =
      true;


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


    // ------------------------------------------------------
    // INSERT APPOINTMENT
    // ------------------------------------------------------

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
      "Appointment successfully booked:",
      data
    );


    // ------------------------------------------------------
    // SHOW SUCCESS POPUP
    // ------------------------------------------------------

    openBookingPopup();


    // ------------------------------------------------------
    // RESET FORM
    // ------------------------------------------------------

    resetBookingForm();

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

    bookingInProgress =
      false;


    const buttons =
      document.querySelectorAll(
        'button[onclick="bookAppointment()"]'
      );


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


// ==========================================================
// RESET BOOKING FORM
// ==========================================================

function resetBookingForm() {

  const name =
    document.getElementById(
      "clientName"
    );


  const phone =
    document.getElementById(
      "clientPhone"
    );


  const service =
    document.getElementById(
      "serviceSelect"
    );


  const polish =
    document.getElementById(
      "polishSelect"
    );


  const design =
    document.getElementById(
      "designSelect"
    );


  const message =
    document.getElementById(
      "message"
    );


  if (name) {
    name.value = "";
  }


  if (phone) {
    phone.value = "";
  }


  if (service) {
    service.value = "";
  }


  if (polish) {
    polish.value = "";
  }


  if (design) {
    design.value = "";
  }


  if (datePicker) {

    datePicker.clear();

  }


  selectedDate =
    "";

  selectedTime =
    "";

  selectedAdditionalServices =
    [];


  renderSelectedAdditionalServices();


  const timeSlots =
    document.getElementById(
      "timeSlots"
    );


  if (timeSlots) {

    timeSlots.innerHTML =
      "";

  }


  if (message) {

    message.textContent =
      "";

  }

}


// ==========================================================
// BOOKING SUCCESS POPUP
// ==========================================================

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


// ==========================================================
// CLOSE BOOKING SUCCESS POPUP
// ==========================================================

function closeBookingPopup() {

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


// ==========================================================
// MOBILE MENU
// ==========================================================

function setupMobileMenu() {

  const links =
    document.querySelectorAll(
      "nav a"
    );


  links.forEach(
    function (link) {

      link.addEventListener(
        "click",
        function () {

          closeMobileMenu();

        }
      );

    }
  );

}


// ==========================================================
// TOGGLE MOBILE MENU
// ==========================================================

function toggleMenu() {

  console.log(
    "Mobile menu button clicked."
  );


  const nav =
    document.querySelector(
      "nav"
    );


  const button =
    document.querySelector(
      ".mobile-menu-btn"
    );


  if (!nav) {
    return;
  }


  const isOpen =
    nav.classList.toggle(
      "mobile-open"
    );


  document.body.classList.toggle(
    "menu-open",
    isOpen
  );


  if (button) {

    button.innerHTML =
      isOpen
        ? "✕"
        : "☰";

  }

}


// ==========================================================
// CLOSE MOBILE MENU
// ==========================================================

function closeMobileMenu() {

  const nav =
    document.querySelector(
      "nav"
    );


  const button =
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


  if (button) {

    button.innerHTML =
      "☰";

  }

}


// ==========================================================
// CLOSE POPUPS WHEN CLICKING OUTSIDE
// ==========================================================

document.addEventListener(
  "click",
  function (event) {

    const additionalPopup =
      document.getElementById(
        "additionalServicePopup"
      );


    if (
      additionalPopup &&
      event.target ===
        additionalPopup
    ) {

      closeAdditionalServicePopup();

    }


    const bookingPopup =
      document.getElementById(
        "bookingPopup"
      );


    if (
      bookingPopup &&
      event.target ===
        bookingPopup
    ) {

      closeBookingPopup();

    }

  }
);


// ==========================================================
// GLOBAL ERROR LOGGING
// ==========================================================

window.addEventListener(
  "error",
  function (event) {

    console.error(
      "JavaScript error:",
      event.error || event.message
    );

  }
);


window.addEventListener(
  "unhandledrejection",
  function (event) {

    console.error(
      "Unhandled promise rejection:",
      event.reason
    );

  }
);
