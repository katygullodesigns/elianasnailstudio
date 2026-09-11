// ==========================================
// SUPABASE
// ==========================================

const SUPABASE_URL =
  "https://kyonstvpolakjhrecqcj.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5b25zdHZwb2xha2pocmVjcWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTYxMjUsImV4cCI6MjA5NzI3MjEyNX0.oq6v7gEy8FJPh4NI3ngUYybwJcHF6rW6qkNtepCxr7Y";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


// ==========================================
// BOOKING SETTINGS
// ==========================================

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
  "Max Design": 2.5,

  // Additional services

};


// ==========================================
// BOOKING STATE
// ==========================================

let selectedDate = null;
let selectedTime = null;

let selectedAdditionalServices = [];


// ==========================================
// SUPABASE ERROR
// ==========================================

function showSupabaseError(title, error) {

  console.error(title, error);

  alert(
    "SUPABASE ERROR\n\n" +
    "Status: " +
    (error?.status || "none") +
    "\n\n" +
    "Code: " +
    (error?.code || "none") +
    "\n\n" +
    "Message: " +
    (error?.message || "none") +
    "\n\n" +
    "Details: " +
    (error?.details || "none") +
    "\n\n" +
    "Hint: " +
    (error?.hint || "none")
  );
}


// ==========================================
// TIME FUNCTIONS
// ==========================================

function timeToMinutes(timeString) {

  if (!timeString) {
    return 0;
  }

  const parts = timeString.split(" ");

  const time = parts[0];
  const modifier = parts[1];

  const timeParts = time.split(":");

  let hours = Number(timeParts[0]);

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

  return hours * 60 + minutes;
}


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


function convertTo24Hour(timeString) {

  if (!timeString) {
    return "00:00";
  }

  const parts =
    timeString.split(" ");

  const time = parts[0];
  const modifier = parts[1];

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
    String(hours).padStart(2, "0") +
    ":" +
    String(minutes).padStart(2, "0")
  );
}


function isPastDateTime(
  dateString,
  timeString
) {

  if (
    !dateString ||
    !timeString
  ) {
    return false;
  }

  const appointmentDate =
    new Date(
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

  const result =
    await supabaseClient.auth.getSession();

  if (result.error) {

    showSupabaseError(
      "SESSION ERROR",
      result.error
    );

    return null;
  }

  if (!result.data?.session) {

    console.error(
      "NO SUPABASE SESSION FOUND"
    );

    return null;
  }

  return result.data.session.user;
}


// ==========================================
// LOAD MY APPOINTMENTS
// ==========================================

async function loadMyAppointments(user) {

  const container =
    document.getElementById(
      "appointments"
    );

  if (!container) {
    return;
  }

  container.innerHTML =
    "<p>Loading appointments...</p>";

  const result =
    await supabaseClient
      .from("appointments")
      .select("*")
      .eq("user_id", user.id)
      .order("date", {
        ascending: true
      })
      .order("time", {
        ascending: true
      });

  if (result.error) {

    showSupabaseError(
      "LOADING APPOINTMENTS",
      result.error
    );

    container.innerHTML =
      "<p>Unable to load your appointments.</p>";

    return;
  }

  const appointments =
    result.data || [];

  if (appointments.length === 0) {

    container.innerHTML =
      "<p>You don't have any appointments scheduled.</p>";

    return;
  }

  container.innerHTML = "";

  appointments.forEach(
    function (appointment) {

      const card =
        document.createElement("div");

      card.className =
        "appointment-card";

      let formattedDate =
        appointment.date || "";

      if (appointment.date) {

        const date =
          new Date(
            appointment.date +
            "T00:00:00"
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

      let additionalHTML = "";

      if (appointment.notes) {

        additionalHTML = `
          <p>
            <strong>Additional Services:</strong><br>
            ${escapeHtml(
              appointment.notes
            ).replace(
              /\n/g,
              "<br>"
            )}
          </p>
        `;
      }

      const duration =
        Number(
          appointment.duration
        ) || 0;

      const endTime =
        getEndTime(
          appointment.time,
          duration
        );

      card.innerHTML = `

        <h3>
          ${escapeHtml(
            appointment.service ||
            "Appointment"
          )}
        </h3>

        <p>
          <strong>Date:</strong>
          ${escapeHtml(
            formattedDate
          )}
        </p>

        <p>
          <strong>Time:</strong>
          ${escapeHtml(
            appointment.time ||
            ""
          )}
          ${
            endTime
              ? " - " +
                escapeHtml(
                  endTime
                )
              : ""
          }
        </p>

        ${
          appointment.polish
            ? `
              <p>
                <strong>Polish:</strong>
                ${escapeHtml(
                  appointment.polish
                )}
              </p>
            `
            : ""
        }

        ${
          appointment.design
            ? `
              <p>
                <strong>Design:</strong>
                ${escapeHtml(
                  appointment.design
                )}
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
                  formatDuration(
                    duration
                  )
                )}
              </p>
            `
            : ""
        }

        ${additionalHTML}

        <p>
          <strong>Status:</strong>
          ${escapeHtml(
            appointment.status ||
            "Active"
          )}
        </p>

      `;

      container.appendChild(card);
    }
  );
}


// ==========================================
// GET BOOKED APPOINTMENTS
// ==========================================

async function getBookedAppointments(
  dateString
) {

  const result =
    await supabaseClient
      .from("appointments")
      .select("*")
      .eq("date", dateString);

  if (result.error) {

    showSupabaseError(
      "GET BOOKED APPOINTMENTS",
      result.error
    );

    return [];
  }

  return result.data || [];
}


// ==========================================
// LOAD TIME SLOTS
// ==========================================

async function loadTimes(dateString) {

  const timeSlots =
    document.getElementById(
      "timeSlots"
    );

  if (!timeSlots) {
    return;
  }

  timeSlots.innerHTML =
    "<p>Loading times...</p>";

  selectedTime = null;

  const appointments =
    await getBookedAppointments(
      dateString
    );

  const bookedTimes = [];

  appointments.forEach(
    function (appointment) {

      let blocked =
        appointment.blocked_times || [];

      if (typeof blocked === "string") {

        try {

          blocked =
            JSON.parse(blocked);

        } catch {

          blocked = [];

        }
      }

      if (Array.isArray(blocked)) {

        blocked.forEach(
          function (time) {

            if (
              !bookedTimes.includes(time)
            ) {

              bookedTimes.push(time);

            }

          }
        );
      }
    }
  );

  timeSlots.innerHTML = "";

  allTimes.forEach(
    function (time) {

      const button =
        document.createElement(
          "button"
        );

      button.type = "button";

      button.textContent = time;

      button.className =
        "time-slot";


      // Already booked
      if (
        bookedTimes.includes(time)
      ) {

        button.disabled = true;

        button.classList.add(
          "booked"
        );

        timeSlots.appendChild(
          button
        );

        return;
      }


      // Time has already passed
      if (
        isPastDateTime(
          dateString,
          time
        )
      ) {

        button.disabled = true;

        button.classList.add(
          "booked"
        );

        timeSlots.appendChild(
          button
        );

        return;
      }


      // Available
      button.addEventListener(
        "click",
        function () {

          document
            .querySelectorAll(
              ".time-slot"
            )
            .forEach(
              function (btn) {

                btn.classList.remove(
                  "selected"
                );

              }
            );

          button.classList.add(
            "selected"
          );

          selectedTime = time;

          console.log(
            "Selected time:",
            selectedTime
          );
        }
      );

      timeSlots.appendChild(
        button
      );

    }
  );

  if (
    timeSlots.children.length === 0
  ) {

    timeSlots.innerHTML =
      "<p>No times available for this date.</p>";
  }
}


// ==========================================
// CALENDAR
// ==========================================

function initializeCalendar() {

  const dateInput =
    document.getElementById(
      "appointmentDate"
    );

  if (!dateInput) {

    console.error(
      "appointmentDate input not found."
    );

    return;
  }

  if (
    typeof flatpickr === "undefined"
  ) {

    console.error(
      "Flatpickr is NOT loaded."
    );

    alert(
      "Calendar could not load because Flatpickr is missing."
    );

    return;
  }

  flatpickr(
    dateInput,
    {

      dateFormat: "Y-m-d",

      minDate: "today",

      disable: [

        function (date) {

          return date.getDay() === 0;

        }

      ],

      onChange:
        async function (
          selectedDates,
          dateStr
        ) {

          selectedDate =
            dateStr;

          selectedTime =
            null;

          console.log(
            "Selected date:",
            selectedDate
          );

          await loadTimes(
            selectedDate
          );
        }

    }
  );

  console.log(
    "CALENDAR INITIALIZED"
  );
}


// ==========================================
// ADDITIONAL SERVICE POPUP
// ==========================================

window.openAdditionalServicePopup =
  function () {

    const popup =
      document.getElementById(
        "additionalServicePopup"
      );

    if (popup) {

      popup.style.display =
        "flex";
    }
  };


window.closeAdditionalServicePopup =
  function () {

    const popup =
      document.getElementById(
        "additionalServicePopup"
      );

    if (popup) {

      popup.style.display =
        "none";
    }
  };


// ==========================================
// SAVE ADDITIONAL SERVICE
// ==========================================

window.saveAdditionalServiceOptions =
  function () {

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


    closeAdditionalServicePopup();
  };


// ==========================================
// DISPLAY ADDITIONAL SERVICES
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

  selectedAdditionalServices.forEach(
    function (item, index) {

      const service =
        document.createElement(
          "div"
        );

      service.className =
        "selected-additional-service";


      let details = "";

      if (item.polish) {

        details +=
          " • " +
          item.polish;
      }

      if (item.design) {

        details +=
          " • " +
          item.design;
      }

      if (item.designDetails) {

        details +=
          " • " +
          item.designDetails;
      }


      const serviceDuration =
        getAdditionalServiceDuration(
          item
        );


      service.innerHTML = `

        <div class="additional-service-info">

          <strong>
            ${escapeHtml(
              item.service
            )}
          </strong>

          <span>
            ${escapeHtml(
              details
            )}
          </span>

          <small>
            ${formatDuration(
              serviceDuration
            )}
          </small>

        </div>

        <button
          type="button"
          onclick="removeAdditionalService(${index})"
          aria-label="Remove ${escapeHtml(
            item.service
          )}"
        >
          ×
        </button>

      `;

      container.appendChild(
        service
      );
    }
  );
}


// ==========================================
// REMOVE ADDITIONAL SERVICE
// ==========================================

window.removeAdditionalService =
  function (index) {

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
  };


// ==========================================
// GET ADDITIONAL SERVICE DURATION
// ==========================================
//
// IMPORTANT:
//
// Each additional service is calculated
// independently.
//
// Example:
//
// Additional service:
// Pedicure
// Polish: Gel
// Design: Max Design
//
// Duration becomes:
// max(
//   Pedicure,
//   Gel,
//   Max Design
// )
//
// Then that ENTIRE duration is added
// on top of the main appointment.
//
// ==========================================

function getAdditionalServiceDuration(
  item
) {

  if (!item) {
    return 0;
  }

  return Math.max(

    durations[item.service] || 0,

    durations[item.polish] || 0,

    durations[item.design] || 0

  );
}


// ==========================================
// ADDITIONAL SERVICE DURATION
// ==========================================

function getAdditionalServicesDuration() {

  let totalDuration = 0;

  selectedAdditionalServices.forEach(
    function (item) {

      const serviceDuration =
        getAdditionalServiceDuration(
          item
        );

      totalDuration +=
        serviceDuration;

    }
  );

  console.log(
    "ADDITIONAL SERVICE TOTAL:",
    totalDuration
  );

  return totalDuration;
}


// ==========================================
// ADDITIONAL SERVICE NOTES
// ==========================================

function getAdditionalServicesNotes() {

  if (
    selectedAdditionalServices.length === 0
  ) {

    return "";
  }


  const lines = [];


  selectedAdditionalServices.forEach(
    function (item) {

      let line =
        item.service;


      if (item.polish) {

        line +=
          " - Polish: " +
          item.polish;
      }


      if (item.design) {

        line +=
          " - Design: " +
          item.design;
      }


      if (item.designDetails) {

        line +=
          " - Details: " +
          item.designDetails;
      }


      lines.push(line);
    }
  );


  return lines.join("\n");
}


// ==========================================
// BOOKING SUCCESS POPUP
// ==========================================

window.closePopup =
  function () {

    const popup =
      document.getElementById(
        "bookingPopup"
      );

    if (popup) {

      popup.style.display =
        "none";
    }
  };


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


// ==========================================
// FORMAT DURATION
// ==========================================

function formatDuration(duration) {

  const totalMinutes =
    Math.round(
      Number(duration) * 60
    );

  const hours =
    Math.floor(
      totalMinutes / 60
    );

  const minutes =
    totalMinutes % 60;

  if (
    hours > 0 &&
    minutes > 0
  ) {

    return (
      `${hours} hr ${minutes} min`
    );
  }

  if (hours > 0) {

    return (
      `${hours} hr`
    );
  }

  return (
    `${minutes} min`
  );
}


// ==========================================
// BOOK APPOINTMENT
// ==========================================

window.bookAppointment =
  async function () {

    console.log(
      "BOOK APPOINTMENT CLICKED"
    );


    // --------------------------------------
    // USER
    // --------------------------------------

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


    // --------------------------------------
    // FORM ELEMENTS
    // --------------------------------------

    const nameElement =
      document.getElementById(
        "clientName"
      );

    const phoneElement =
      document.getElementById(
        "clientPhone"
      );

    const serviceElement =
      document.getElementById(
        "serviceSelect"
      );

    const polishElement =
      document.getElementById(
        "polishSelect"
      );

    const designElement =
      document.getElementById(
        "designSelect"
      );


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


    // --------------------------------------
    // VALUES
    // --------------------------------------

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


    // --------------------------------------
    // VALIDATION
    // --------------------------------------

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


    if (!selectedDate) {

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


    if (!polish) {

      alert(
        "Please select a polish."
      );

      return;
    }


    if (!design) {

      alert(
        "Please select a design."
      );

      return;
    }


    if (
      isPastDateTime(
        selectedDate,
        selectedTime
      )
    ) {

      alert(
        "Please select a future appointment time."
      );

      return;
    }


    // ======================================
    // CALCULATE TOTAL DURATION
    // ======================================

    const mainDuration =
      getMainBookingDuration(
        service,
        polish,
        design
      );


    const additionalDuration =
      getAdditionalServicesDuration();


    const duration =
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
      "TOTAL APPOINTMENT DURATION:",
      duration
    );


    if (duration <= 0) {

      alert(
        "Unable to calculate the appointment duration."
      );

      return;
    }


    // ======================================
    // CALCULATE BLOCKED TIMES
    // ======================================

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


    // ======================================
    // CHECK EXISTING BOOKINGS
    // ======================================

    const existingAppointments =
      await getBookedAppointments(
        selectedDate
      );


    let conflict = false;


    existingAppointments.forEach(
      function (appointment) {

        let blocked =
          appointment.blocked_times || [];


        if (
          typeof blocked === "string"
        ) {

          try {

            blocked =
              JSON.parse(blocked);

          } catch {

            blocked = [];

          }
        }


        if (
          !Array.isArray(blocked)
        ) {

          return;
        }


        blockedTimes.forEach(
          function (time) {

            if (
              blocked.includes(time)
            ) {

              conflict = true;

            }
          }
        );
      }
    );


    if (conflict) {

      alert(
        "That time is no longer available. Please choose another time."
      );


      await loadTimes(
        selectedDate
      );


      return;
    }


    // ======================================
    // ADDITIONAL NOTES
    // ======================================

    const additionalNotes =
      getAdditionalServicesNotes();


    // ======================================
    // INSERT APPOINTMENT
    // ======================================

    const result =
      await supabaseClient
        .from("appointments")
        .insert([
          {

            user_id:
              user.id,

            name:
              name,

            phone:
              phone,

            date:
              selectedDate,

            time:
              selectedTime,

            duration:
              duration,

            blocked_times:
              blockedTimes,

            service:
              service,

            polish:
              polish,

            design:
              design,

            notes:
              additionalNotes,

            status:
              "active",

            created_at:
              new Date().toISOString()

          }
        ])
        .select();


    if (result.error) {

      showSupabaseError(
        "SUPABASE BOOKING ERROR",
        result.error
      );

      return;
    }


    console.log(
      "APPOINTMENT CREATED:",
      result.data
    );


    // ======================================
    // SUCCESS POPUP
    // ======================================

    const popup =
      document.getElementById(
        "bookingPopup"
      );


    if (popup) {

      popup.style.display =
        "flex";

    } else {

      alert(
        "Your appointment has been booked successfully!"
      );
    }


    // ======================================
    // RESET FORM
    // ======================================

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


    const timeSlots =
      document.getElementById(
        "timeSlots"
      );


    if (timeSlots) {

      timeSlots.innerHTML = "";

    }


    // ======================================
    // REFRESH APPOINTMENTS
    // ======================================

    await loadMyAppointments(
      user
    );
  };


// ==========================================
// GET END TIME
// ==========================================

function getEndTime(
  startTime,
  duration
) {

  if (
    !startTime ||
    !duration
  ) {

    return "";
  }

  const startMinutes =
    timeToMinutes(
      startTime
    );

  return minutesToTime(
    startMinutes +
    duration * 60
  );
}


// ==========================================
// LOGOUT
// ==========================================

async function logout() {

  const result =
    await supabaseClient
      .auth
      .signOut();


  if (result.error) {

    showSupabaseError(
      "LOGOUT ERROR",
      result.error
    );

    return;
  }


  window.location.href =
    "login.html";
}


// ==========================================
// PAGE STARTUP
// ==========================================

document.addEventListener(
  "DOMContentLoaded",
  async function () {

    console.log(
      "MY APPOINTMENTS PAGE LOADED"
    );


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


    const userEmail =
      document.getElementById(
        "userEmail"
      );


    if (userEmail) {

      userEmail.textContent =
        user.email || "";

    }


    await loadMyAppointments(
      user
    );


    initializeCalendar();


    const logoutBtn =
      document.getElementById(
        "logoutBtn"
      );


    if (logoutBtn) {

      logoutBtn.addEventListener(
        "click",
        logout
      );
    }


    renderSelectedAdditionalServices();

  }
);


// ==========================================
// HTML ESCAPE
// ==========================================

function escapeHtml(value) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}
