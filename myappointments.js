// ==========================================
// ELIANA'S NAIL STUDIO
// BOOKING + CUSTOMER APPOINTMENTS
// ==========================================


// ==========================================
// SUPABASE
// ==========================================

const SUPABASE_URL =
  "https://kyonstvpolakjhrecqcj.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5b25zdHZwb2xha2pocmVjcWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTYxMjUsImV4cCI6MjA5NzI3MjEyNX0.oq6v7gEy8FJPh4NI3ngUYybwJcHF6rW6qkNtepCxr7Y";

if (!window.supabase) {
  console.error(
    "Supabase JS library is not loaded."
  );
}

const supabaseClient = window.supabase
  ? window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    )
  : null;


// ==========================================
// BOOKING SETTINGS
// ==========================================

// Supabase availability blocks are applied
// separately. Keep 12:00 and 12:30 here.

const allTimes = [
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "4:30 PM",
  "5:00 PM",
  "5:30 PM",
  "6:00 PM"
];


// Sundays are unavailable.

const PERMANENTLY_BLOCKED_WEEKDAYS = [0];


// Previously specified unavailable dates.

const PERMANENTLY_BLOCKED_DATES = [
  "2026-10-14",
  "2026-10-15",
  "2026-10-28"
];


// Service durations are in hours.

const durations = {
  "Manicure": 1.5,
  "Pedicure": 2.0,
  "Gel": 1.5,
  "Acrylic": 2.5,
  "Basic": 0.5,
  "Minimal Design": 1,
  "Max Design": 2.5
};


// Each additional service adds two hours.

const ADDITIONAL_SERVICE_DURATION = 2;


// ==========================================
// BOOKING STATE
// ==========================================

let selectedDate = null;
let selectedTime = null;

let selectedAdditionalServices = [];

let availabilityBlocks = [];

let calendarInstance = null;


// ==========================================
// SUPABASE ERROR
// ==========================================

function showSupabaseError(title, error) {

  console.error(title, error);

  alert(
    "SUPABASE ERROR\n\n" +
    "Status: " +
    (error?.status || "none") +
    "\n\nCode: " +
    (error?.code || "none") +
    "\n\nMessage: " +
    (error?.message || "none") +
    "\n\nDetails: " +
    (error?.details || "none") +
    "\n\nHint: " +
    (error?.hint || "none")
  );
}


// ==========================================
// TIME AND DATE HELPERS
// ==========================================

function timeToMinutes(timeString) {

  if (!timeString) return 0;

  const value = String(timeString).trim();

  // Supabase TIME format: 13:00:00 or 13:00

  const sqlMatch = value.match(
    /^(\d{1,2}):(\d{2})(?::\d{2})?$/
  );

  if (sqlMatch) {

    return (
      Number(sqlMatch[1]) * 60 +
      Number(sqlMatch[2])
    );
  }

  // Display format: 1:00 PM

  const displayMatch = value.match(
    /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
  );

  if (!displayMatch) return 0;

  let hours = Number(displayMatch[1]);

  const minutes = Number(displayMatch[2]);

  const modifier =
    displayMatch[3].toUpperCase();

  if (modifier === "PM" && hours !== 12) {
    hours += 12;
  }

  if (modifier === "AM" && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}


function minutesToTime(totalMinutes) {

  const hours24 = Math.floor(
    totalMinutes / 60
  );

  const minutes = totalMinutes % 60;

  const modifier =
    hours24 >= 12 ? "PM" : "AM";

  let hours12 = hours24 % 12;

  if (hours12 === 0) {
    hours12 = 12;
  }

  return (
    hours12 +
    ":" +
    String(minutes).padStart(2, "0") +
    " " +
    modifier
  );
}


function convertTo24Hour(timeString) {

  const totalMinutes =
    timeToMinutes(timeString);

  const hours = Math.floor(
    totalMinutes / 60
  );

  const minutes = totalMinutes % 60;

  return (
    String(hours).padStart(2, "0") +
    ":" +
    String(minutes).padStart(2, "0")
  );
}


function getDateString(date) {

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}


function isPastDateTime(dateString, timeString) {

  if (!dateString || !timeString) {
    return false;
  }

  const appointmentDate = new Date(
    dateString +
    "T" +
    convertTo24Hour(timeString) +
    ":00"
  );

  return appointmentDate < new Date();
}


// ==========================================
// GET CURRENT USER
// ==========================================

async function getCurrentUser() {

  if (!supabaseClient) return null;

  const result =
    await supabaseClient.auth.getSession();

  if (result.error) {

    showSupabaseError(
      "SESSION ERROR",
      result.error
    );

    return null;
  }

  return result.data?.session?.user || null;
}


// ==========================================
// AVAILABILITY BLOCKS
// ==========================================

// Load unavailable dates and times from Supabase.

async function loadAvailabilityBlocks() {

  if (!supabaseClient) {
    throw new Error("Supabase is not connected.");
  }

  const { data, error } = await supabaseClient
    .from("availability_blocks")
    .select(
      "blocked_date, start_time, end_time, all_day"
    );

  if (error) {

    showSupabaseError(
      "LOADING AVAILABILITY BLOCKS",
      error
    );

    throw error;
  }

  availabilityBlocks = data || [];

  if (calendarInstance) {
    calendarInstance.redraw();
  }

  return availabilityBlocks;
}


// Check whether an entire date is unavailable.

function isDateBlocked(dateString) {

  if (!dateString) return false;

  const date = new Date(
    dateString + "T00:00:00"
  );

  if (
    PERMANENTLY_BLOCKED_WEEKDAYS.includes(
      date.getDay()
    )
  ) {
    return true;
  }

  if (
    PERMANENTLY_BLOCKED_DATES.includes(
      dateString
    )
  ) {
    return true;
  }

  return availabilityBlocks.some(block =>
    block.blocked_date === dateString &&
    block.all_day === true
  );
}


// Check whether an appointment overlaps
// with a Supabase unavailable time block.

function isTimeRangeBlocked(
  dateString,
  startMinutes,
  endMinutes
) {

  return availabilityBlocks.some(block => {

    if (block.blocked_date !== dateString) {
      return false;
    }

    if (block.all_day === true) {
      return true;
    }

    if (!block.start_time || !block.end_time) {
      return false;
    }

    const blockStart =
      timeToMinutes(block.start_time);

    const blockEnd =
      timeToMinutes(block.end_time);

    return (
      startMinutes < blockEnd &&
      endMinutes > blockStart
    );

  });
}


// Check an individual half-hour slot.

function isSlotBlocked(dateString, timeString) {

  const start = timeToMinutes(timeString);

  return isTimeRangeBlocked(
    dateString,
    start,
    start + 30
  );
}


// ==========================================
// APPOINTMENT DURATION
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


function getAdditionalServiceDuration(item) {

  if (!item) return 0;

  return ADDITIONAL_SERVICE_DURATION;
}


function getAdditionalServicesDuration() {

  return selectedAdditionalServices.reduce(
    (total, item) =>
      total + getAdditionalServiceDuration(item),
    0
  );
}


function calculateTotalDuration(
  service,
  polish,
  design
) {

  return (
    getMainBookingDuration(
      service,
      polish,
      design
    ) +
    getAdditionalServicesDuration()
  );
}


function formatDuration(duration) {

  const totalMinutes = Math.round(
    Number(duration) * 60
  );

  const hours = Math.floor(
    totalMinutes / 60
  );

  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours} hr ${minutes} min`;
  }

  if (hours > 0) {
    return `${hours} hr`;
  }

  return `${minutes} min`;
}


function getEndTime(startTime, duration) {

  if (!startTime || !duration) {
    return "";
  }

  return minutesToTime(
    timeToMinutes(startTime) +
    Number(duration) * 60
  );
}


// Generate all half-hour slots occupied
// by an appointment.

function getAppointmentSlots(
  startTime,
  durationHours
) {

  const startMinutes =
    timeToMinutes(startTime);

  const totalMinutes = Math.ceil(
    Number(durationHours) * 60
  );

  const slots = [];

  for (
    let offset = 0;
    offset < totalMinutes;
    offset += 30
  ) {

    slots.push(
      minutesToTime(
        startMinutes + offset
      )
    );
  }

  return slots;
}


// ==========================================
// GET BOOKED APPOINTMENTS
// ==========================================

async function getBookedAppointments(dateString) {

  const { data, error } = await supabaseClient
    .from("appointments")
    .select(
      "date, time, duration, blocked_times, status"
    )
    .eq("date", dateString);

  if (error) {

    showSupabaseError(
      "GET BOOKED APPOINTMENTS",
      error
    );

    throw error;
  }

  // Cancelled appointments should not reserve time.

  return (data || []).filter(appointment => {

    const status = String(
      appointment.status || "active"
    ).toLowerCase();

    return ![
      "cancelled",
      "canceled",
      "deleted"
    ].includes(status);

  });
}


// Collect all occupied appointment times.

function getBlockedTimesForAppointments(
  appointments
) {

  const bookedTimes = new Set();

  appointments.forEach(appointment => {

    let blocked =
      appointment.blocked_times || [];

    if (typeof blocked === "string") {

      try {
        blocked = JSON.parse(blocked);
      } catch {
        blocked = [];
      }
    }

    if (
      Array.isArray(blocked) &&
      blocked.length > 0
    ) {

      blocked.forEach(time => {

        bookedTimes.add(
          minutesToTime(
            timeToMinutes(time)
          )
        );

      });

      return;
    }

    // Older appointments without blocked_times
    // are reconstructed using their duration.

    if (
      appointment.time &&
      Number(appointment.duration) > 0
    ) {

      getAppointmentSlots(
        appointment.time,
        Number(appointment.duration)
      ).forEach(time => {
        bookedTimes.add(time);
      });

    } else if (appointment.time) {

      bookedTimes.add(
        minutesToTime(
          timeToMinutes(appointment.time)
        )
      );

    }

  });

  return bookedTimes;
}


// ==========================================
// MY APPOINTMENTS
// ==========================================

async function loadMyAppointments(user) {

  const container =
    document.getElementById("appointments");

  if (!container) return;

  container.innerHTML =
    "<p>Loading appointments...</p>";

  const { data, error } = await supabaseClient
    .from("appointments")
    .select("*")
    .eq("user_id", user.id)
    .order("date", {
      ascending: true
    })
    .order("time", {
      ascending: true
    });

  if (error) {

    showSupabaseError(
      "LOADING APPOINTMENTS",
      error
    );

    container.innerHTML =
      "<p>Unable to load your appointments.</p>";

    return;
  }

  const appointments = data || [];

  if (appointments.length === 0) {

    container.innerHTML =
      "<p>You don't have any appointments scheduled.</p>";

    return;
  }

  container.innerHTML = "";

  appointments.forEach(appointment => {

    const card =
      document.createElement("div");

    card.className = "appointment-card";

    let formattedDate =
      appointment.date || "";

    if (appointment.date) {

      const date = new Date(
        appointment.date + "T00:00:00"
      );

      if (!isNaN(date.getTime())) {

        formattedDate =
          date.toLocaleDateString(
            "en-US",
            {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric"
            }
          );
      }
    }

    const duration =
      Number(appointment.duration) || 0;

    const endTime =
      getEndTime(
        appointment.time,
        duration
      );

    const additionalHTML =
      appointment.notes
        ? `
          <p>
            <strong>Additional Services:</strong><br>
            ${escapeHtml(
              appointment.notes
            ).replace(/\n/g, "<br>")}
          </p>
        `
        : "";

    card.innerHTML = `

      <h3>
        ${escapeHtml(
          appointment.service || "Appointment"
        )}
      </h3>

      <p>
        <strong>Date:</strong>
        ${escapeHtml(formattedDate)}
      </p>

      <p>
        <strong>Time:</strong>
        ${escapeHtml(appointment.time || "")}
        ${
          endTime
            ? " - " + escapeHtml(endTime)
            : ""
        }
      </p>

      ${
        appointment.polish
          ? `
            <p>
              <strong>Polish:</strong>
              ${escapeHtml(appointment.polish)}
            </p>
          `
          : ""
      }

      ${
        appointment.design
          ? `
            <p>
              <strong>Design:</strong>
              ${escapeHtml(appointment.design)}
            </p>
          `
          : ""
      }

      ${
        duration
          ? `
            <p>
              <strong>Duration:</strong>
              ${escapeHtml(
                formatDuration(duration)
              )}
            </p>
          `
          : ""
      }

      ${additionalHTML}

      <p>
        <strong>Status:</strong>
        ${escapeHtml(
          appointment.status || "Active"
        )}
      </p>

    `;

    container.appendChild(card);

  });
}


// ==========================================
// LOAD AVAILABLE TIME SLOTS
// ==========================================

async function loadTimes(dateString) {

  const timeSlots =
    document.getElementById("timeSlots");

  if (!timeSlots) return;

  selectedTime = null;

  timeSlots.innerHTML =
    "<p>Loading times...</p>";

  if (!dateString) {

    timeSlots.innerHTML = "";

    return;
  }

  try {

    // Refresh availability blocks from Supabase.

    await loadAvailabilityBlocks();

    if (isDateBlocked(dateString)) {

      timeSlots.textContent =
        "This date is unavailable. Please choose another date.";

      return;
    }

    const appointments =
      await getBookedAppointments(dateString);

    const bookedTimes =
      getBlockedTimesForAppointments(
        appointments
      );

    timeSlots.innerHTML = "";

    allTimes.forEach(time => {

      const button =
        document.createElement("button");

      button.type = "button";

      button.textContent = time;

      button.className = "time-slot";

      const unavailable =
        bookedTimes.has(time) ||
        isSlotBlocked(dateString, time) ||
        isPastDateTime(dateString, time);

      if (unavailable) {

        button.disabled = true;

        button.classList.add("booked");

      } else {

        button.addEventListener(
          "click",
          () => {

            document
              .querySelectorAll(".time-slot")
              .forEach(slot => {
                slot.classList.remove("selected");
              });

            button.classList.add("selected");

            selectedTime = time;

            console.log(
              "Selected time:",
              selectedTime
            );

          }
        );

      }

      timeSlots.appendChild(button);

    });

    if (timeSlots.children.length === 0) {

      timeSlots.innerHTML =
        "<p>No times available for this date.</p>";

    }

  } catch (error) {

    console.error(
      "Unable to load available times:",
      error
    );

    timeSlots.innerHTML =
      "<p>Unable to load appointment times. Please refresh and try again.</p>";

  }
}


// ==========================================
// CALENDAR
// ==========================================

function initializeCalendar() {

  const dateInput =
    document.getElementById("appointmentDate");

  if (!dateInput) {

    console.error(
      "appointmentDate input not found."
    );

    return;
  }

  if (typeof flatpickr === "undefined") {

    console.error(
      "Flatpickr is not loaded."
    );

    alert(
      "Calendar could not load because Flatpickr is missing."
    );

    return;
  }

  if (calendarInstance) {
    calendarInstance.destroy();
  }

  calendarInstance = flatpickr(
    dateInput,
    {

      dateFormat: "Y-m-d",

      minDate: "today",

      disable: [

        function(date) {

          const dateString =
            getDateString(date);

          return (
            PERMANENTLY_BLOCKED_WEEKDAYS.includes(
              date.getDay()
            ) ||

            PERMANENTLY_BLOCKED_DATES.includes(
              dateString
            ) ||

            isDateBlocked(dateString)
          );

        }

      ],

      onChange: async function(
        selectedDates,
        dateString
      ) {

        selectedDate =
          dateString || null;

        selectedTime = null;

        console.log(
          "Selected date:",
          selectedDate
        );

        await loadTimes(selectedDate);

      }

    }
  );

}


// ==========================================
// ADDITIONAL SERVICE POPUP
// ==========================================

window.openAdditionalServicePopup =
  function() {

    const popup =
      document.getElementById(
        "additionalServicePopup"
      );

    if (popup) {
      popup.style.display = "flex";
    }

  };


window.closeAdditionalServicePopup =
  function() {

    const popup =
      document.getElementById(
        "additionalServicePopup"
      );

    if (popup) {
      popup.style.display = "none";
    }

  };


// ==========================================
// SAVE ADDITIONAL SERVICE
// ==========================================

window.saveAdditionalServiceOptions =
  function() {

    const serviceElement =
      document.getElementById(
        "additionalServiceType"
      );

    const polishElement =
      document.getElementById(
        "additionalPolishSelect"
      );

    const designElement =
      document.getElementById(
        "additionalDesignSelect"
      );

    const detailsElement =
      document.getElementById(
        "additionalDesignDetails"
      );

    if (!serviceElement) {

      console.error(
        "additionalServiceType element not found."
      );

      return;
    }

    const service =
      serviceElement.value;

    const polish =
      polishElement
        ? polishElement.value
        : "";

    const design =
      designElement
        ? designElement.value
        : "";

    const designDetails =
      detailsElement
        ? detailsElement.value.trim()
        : "";

    if (!service) {

      alert(
        "Please select an additional service."
      );

      return;
    }

    selectedAdditionalServices.push({

      service,
      polish,
      design,
      designDetails

    });

    renderSelectedAdditionalServices();

    serviceElement.value = "";

    if (polishElement) {
      polishElement.value = "";
    }

    if (designElement) {
      designElement.value = "";
    }

    if (detailsElement) {
      detailsElement.value = "";
    }

    window.closeAdditionalServicePopup();

  };


// ==========================================
// DISPLAY ADDITIONAL SERVICES
// ==========================================

function renderSelectedAdditionalServices() {

  const container =
    document.getElementById(
      "selectedAdditionalServices"
    );

  if (!container) return;

  container.innerHTML = "";

  selectedAdditionalServices.forEach(
    (item, index) => {

      const wrapper =
        document.createElement("div");

      wrapper.className =
        "selected-additional-service";

      const info =
        document.createElement("div");

      info.className =
        "additional-service-info";

      const title =
        document.createElement("strong");

      title.textContent =
        item.service;

      const details =
        document.createElement("span");

      const detailParts = [
        item.polish,
        item.design,
        item.designDetails
      ].filter(Boolean);

      details.textContent =
        detailParts.length
          ? " • " + detailParts.join(" • ")
          : "";

      const duration =
        document.createElement("small");

      duration.textContent =
        formatDuration(
          getAdditionalServiceDuration(item)
        );

      const removeButton =
        document.createElement("button");

      removeButton.type = "button";

      removeButton.textContent = "×";

      removeButton.setAttribute(
        "aria-label",
        `Remove ${item.service}`
      );

      removeButton.addEventListener(
        "click",
        () => {
          window.removeAdditionalService(index);
        }
      );

      info.append(
        title,
        details,
        duration
      );

      wrapper.append(
        info,
        removeButton
      );

      container.appendChild(wrapper);

    }
  );

}


// ==========================================
// REMOVE ADDITIONAL SERVICE
// ==========================================

window.removeAdditionalService =
  function(index) {

    if (
      index < 0 ||
      index >= selectedAdditionalServices.length
    ) {
      return;
    }

    selectedAdditionalServices.splice(
      index,
      1
    );

    renderSelectedAdditionalServices();

  };


// ==========================================
// ADDITIONAL SERVICE NOTES
// ==========================================

function getAdditionalServicesNotes() {

  if (
    selectedAdditionalServices.length === 0
  ) {
    return "";
  }

  return selectedAdditionalServices.map(
    item => {

      let line = item.service;

      if (item.polish) {
        line += " - Polish: " + item.polish;
      }

      if (item.design) {
        line += " - Design: " + item.design;
      }

      if (item.designDetails) {
        line += " - Details: " + item.designDetails;
      }

      return line;

    }
  ).join("\n");

}


// ==========================================
// BOOKING SUCCESS POPUP
// ==========================================

window.closePopup = function() {

  const popup =
    document.getElementById("bookingPopup");

  if (popup) {
    popup.style.display = "none";
  }

};


// ==========================================
// BOOK APPOINTMENT
// ==========================================

window.bookAppointment =
  async function() {

    console.log(
      "BOOK APPOINTMENT CLICKED"
    );

    if (!supabaseClient) {

      alert(
        "The booking system is not connected. Please refresh and try again."
      );

      return;
    }

    try {

      // ------------------------------------
      // USER
      // ------------------------------------

      const user =
        await getCurrentUser();

      if (!user) {

        alert(
          "Please log in or create an account before booking an appointment."
        );

        window.location.href =
          "login.html";

        return;
      }


      // ------------------------------------
      // FORM ELEMENTS
      // ------------------------------------

      const nameElement =
        document.getElementById("clientName");

      const phoneElement =
        document.getElementById("clientPhone");

      const serviceElement =
        document.getElementById("serviceSelect");

      const polishElement =
        document.getElementById("polishSelect");

      const designElement =
        document.getElementById("designSelect");


      if (
        !nameElement ||
        !phoneElement ||
        !serviceElement ||
        !polishElement ||
        !designElement
      ) {

        console.error(
          "One or more booking form elements are missing."
        );

        alert(
          "There is a problem with the booking form. Please refresh the page and try again."
        );

        return;
      }


      // ------------------------------------
      // FORM VALUES
      // ------------------------------------

      const name =
        nameElement.value.trim();

      const phone =
        phoneElement.value.trim();

      const service =
        serviceElement.value;

      const polish =
        polishElement.value;

      const design =
        designElement.value;


      // ------------------------------------
      // VALIDATION
      // ------------------------------------

      if (!name) {
        alert("Please enter your name.");
        return;
      }

      if (!phone) {
        alert("Please enter your phone number.");
        return;
      }

      if (!selectedDate) {
        alert("Please select a date.");
        return;
      }

      if (!selectedTime) {
        alert("Please select a time.");
        return;
      }

      if (!service) {
        alert("Please select a service.");
        return;
      }

      if (!polish) {
        alert("Please select a polish.");
        return;
      }

      if (!design) {
        alert("Please select a design.");
        return;
      }


      // ------------------------------------
      // PAST APPOINTMENT CHECK
      // ------------------------------------

      if (
        isPastDateTime(
          selectedDate,
          selectedTime
        )
      ) {

        alert(
          "Please select a future appointment time."
        );

        await loadTimes(selectedDate);

        return;
      }


      // ====================================
      // REFRESH AVAILABILITY
      // ====================================

      await loadAvailabilityBlocks();

      if (isDateBlocked(selectedDate)) {

        alert(
          "This date is unavailable. Please choose another date."
        );

        await loadTimes(selectedDate);

        return;
      }


      // ====================================
      // CALCULATE TOTAL DURATION
      // ====================================

      const duration =
        calculateTotalDuration(
          service,
          polish,
          design
        );

      if (duration <= 0) {

        alert(
          "Unable to calculate the appointment duration."
        );

        return;
      }


      // ====================================
      // CHECK BLOCKED BUSINESS HOURS
      // ====================================

      const startMinutes =
        timeToMinutes(selectedTime);

      const endMinutes =
        startMinutes + duration * 60;

      // Prevents an appointment from starting
      // before 1 PM but continuing into blocked hours.

      if (
        isTimeRangeBlocked(
          selectedDate,
          startMinutes,
          endMinutes
        )
      ) {

        alert(
          "This appointment would overlap with unavailable hours. Please choose an earlier time or another date."
        );

        await loadTimes(selectedDate);

        return;
      }


      // ====================================
      // CALCULATE BOOKED TIME SLOTS
      // ====================================

      const blockedTimes =
        getAppointmentSlots(
          selectedTime,
          duration
        );


      // ====================================
      // CHECK EXISTING APPOINTMENTS
      // ====================================

      const existingAppointments =
        await getBookedAppointments(
          selectedDate
        );

      const bookedTimes =
        getBlockedTimesForAppointments(
          existingAppointments
        );

      const conflict =
        blockedTimes.some(
          time => bookedTimes.has(time)
        );

      if (conflict) {

        alert(
          "That time is no longer available. Please choose another time."
        );

        await loadTimes(selectedDate);

        return;
      }


      // ====================================
      // ADDITIONAL SERVICE NOTES
      // ====================================

      const additionalNotes =
        getAdditionalServicesNotes();


      // ====================================
      // INSERT APPOINTMENT
      // ====================================

      const appointment = {

        user_id: user.id,

        name,

        phone,

        date: selectedDate,

        time: selectedTime,

        duration,

        blocked_times: blockedTimes,

        service,

        polish,

        design,

        notes: additionalNotes,

        status: "active",

        created_at: new Date().toISOString()

      };


      const { data, error } =
        await supabaseClient
          .from("appointments")
          .insert([appointment])
          .select();


      if (error) {

        showSupabaseError(
          "SUPABASE BOOKING ERROR",
          error
        );

        return;
      }


      console.log(
        "APPOINTMENT CREATED:",
        data
      );


      // ====================================
      // SUCCESS POPUP
      // ====================================

      const popup =
        document.getElementById(
          "bookingPopup"
        );

      if (popup) {

        popup.style.display = "flex";

      } else {

        alert(
          "Your appointment has been booked successfully!"
        );

      }


      // ====================================
      // RESET FORM
      // ====================================

      nameElement.value = "";

      phoneElement.value = "";

      serviceElement.selectedIndex = 0;

      polishElement.selectedIndex = 0;

      designElement.selectedIndex = 0;

      selectedAdditionalServices = [];

      renderSelectedAdditionalServices();

      selectedDate = null;

      selectedTime = null;


      const dateInput =
        document.getElementById(
          "appointmentDate"
        );

      if (dateInput) {
        dateInput.value = "";
      }

      if (calendarInstance) {
        calendarInstance.clear();
      }

      const timeSlots =
        document.getElementById("timeSlots");

      if (timeSlots) {
        timeSlots.innerHTML = "";
      }


      // ====================================
      // REFRESH CUSTOMER APPOINTMENTS
      // ====================================

      await loadMyAppointments(user);

    } catch (error) {

      console.error(
        "Booking error:",
        error
      );

      alert(
        "Something went wrong while booking. Please refresh the page and try again."
      );

    }

  };


// ==========================================
// LOGOUT
// ==========================================

async function logout() {

  if (!supabaseClient) return;

  const { error } =
    await supabaseClient.auth.signOut();

  if (error) {

    showSupabaseError(
      "LOGOUT ERROR",
      error
    );

    return;
  }

  window.location.href = "login.html";

}


// ==========================================
// HTML ESCAPE
// ==========================================

function escapeHtml(value) {

  return String(value ?? "")

    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;")

    .replace(/'/g, "&#039;");

}


// ==========================================
// PAGE STARTUP
// ==========================================

document.addEventListener(
  "DOMContentLoaded",
  async function() {

    console.log(
      "MY APPOINTMENTS PAGE LOADED"
    );

    if (!supabaseClient) {

      alert(
        "Supabase could not connect. Check that the Supabase library is loaded."
      );

      return;
    }

    try {

      // ------------------------------------
      // GET CURRENT USER
      // ------------------------------------

      const user =
        await getCurrentUser();

      if (!user) {

        alert(
          "Please log in to view your appointments."
        );

        window.location.href =
          "login.html";

        return;
      }


      // ------------------------------------
      // DISPLAY USER EMAIL
      // ------------------------------------

      const userEmail =
        document.getElementById("userEmail");

      if (userEmail) {
        userEmail.textContent =
          user.email || "";
      }


      // ------------------------------------
      // LOAD APPOINTMENTS
      // ------------------------------------

      await loadMyAppointments(user);


      // ------------------------------------
      // LOAD AVAILABILITY BEFORE CALENDAR
      // ------------------------------------

      await loadAvailabilityBlocks();


      // ------------------------------------
      // INITIALIZE CALENDAR
      // ------------------------------------

      initializeCalendar();


      // ------------------------------------
      // LOGOUT BUTTON
      // ------------------------------------

      const logoutButton =
        document.getElementById("logoutBtn");

      if (logoutButton) {

        logoutButton.addEventListener(
          "click",
          logout
        );

      }


      // ------------------------------------
      // ADDITIONAL SERVICES
      // ------------------------------------

      renderSelectedAdditionalServices();


      console.log(
        "Booking system initialized successfully."
      );

    } catch (error) {

      console.error(
        "Page initialization error:",
        error
      );

      alert(
        "The booking page could not finish loading. Please refresh and try again."
      );

    }

  }
);
