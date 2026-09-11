
// ==========================================
// SUPABASE
// ==========================================

const SUPABASE_URL =
  "https://kyonstvpolakjhrecqcj.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJr eW9uc3R2cG9sYWtqaHJlY3FjaiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzgxNjk2MTI1LCJleHAiOjIwOTcyNzIxMjV9.oq6v7gEy8FJPh4NI3ngUYybwJcHF6rW6qkNtepCxr7Y";

const supabaseClient =
  supabase.createClient(
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

  "Manicure": 1.5,
  "Pedicure": 0.5,
  "Gel": 1.5,
  "Acrylic": 1.5,

  "Basic": 0.5,
  "Minimal Design": 1,
  "Max Design": 2.5

};


// ==========================================
// BOOKING STATE
// ==========================================

let selectedDate = null;
let selectedTime = null;

let selectedAdditionalServices = [];


// ==========================================
// ERROR DISPLAY
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

  let modifier =
    "AM";

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

  return (
    appointmentDate <
    new Date()
  );
}


// ==========================================
// GET CURRENT USER
// ==========================================

async function getCurrentUser() {

  const result =
    await supabaseClient.auth.getSession();

  const data =
    result.data;

  const error =
    result.error;

  console.log(
    "MY APPOINTMENTS SESSION:",
    data?.session
  );

  if (error) {

    showSupabaseError(
      "SESSION ERROR",
      error
    );

    return null;
  }

  if (!data?.session) {

    console.error(
      "NO SUPABASE SESSION FOUND"
    );

    return null;
  }

  return data.session.user;
}


// ==========================================
// LOAD CUSTOMER APPOINTMENTS
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

  const data =
    result.data;

  const error =
    result.error;

  if (error) {

    showSupabaseError(
      "LOADING APPOINTMENTS",
      error
    );

    container.innerHTML =
      "<p>Unable to load your appointments.</p>";

    return;
  }

  if (
    !data ||
    data.length === 0
  ) {

    container.innerHTML =
      "<p>You don't have any appointments scheduled.</p>";

    return;
  }

  container.innerHTML = "";


  data.forEach(
    function (appointment) {

      const card =
        document.createElement(
          "div"
        );

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

        if (
          !isNaN(
            date.getTime()
          )
        ) {

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


      let additionalHTML =
        "";


      if (
        appointment.notes
      ) {

        additionalHTML = `
          <p>
            <strong>Additional Services:</strong>
            ${appointment.notes}
          </p>
        `;
      }


      card.innerHTML = `

        <h3>
          ${appointment.service || "Appointment"}
        </h3>

        <p>
          <strong>Date:</strong>
          ${formattedDate}
        </p>

        <p>
          <strong>Time:</strong>
          ${appointment.time || ""}
        </p>

        ${
          appointment.polish
            ? `
              <p>
                <strong>Polish:</strong>
                ${appointment.polish}
              </p>
            `
            : ""
        }

        ${
          appointment.design
            ? `
              <p>
                <strong>Design:</strong>
                ${appointment.design}
              </p>
            `
            : ""
        }

        ${
          appointment.duration
            ? `
              <p>
                <strong>Duration:</strong>
                ${appointment.duration}
                hour(s)
              </p>
            `
            : ""
        }

        ${additionalHTML}

        <p>
          <strong>Status:</strong>
          ${appointment.status || "Active"}
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

  const data =
    result.data;

  const error =
    result.error;

  if (error) {

    showSupabaseError(
      "GET BOOKED APPOINTMENTS",
      error
    );

    return [];
  }

  return data || [];
}


// ==========================================
// LOAD TIME SLOTS
// ==========================================

async function loadTimes(
  dateString
) {

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


      if (
        typeof blocked ===
        "string"
      ) {

        try {

          blocked =
            JSON.parse(
              blocked
            );

        } catch (error) {

          blocked = [];

        }
      }


      if (
        Array.isArray(blocked)
      ) {

        blocked.forEach(
          function (time) {

            bookedTimes.push(
              time
            );

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

      button.type =
        "button";

      button.textContent =
        time;

      button.className =
        "time-slot";


      // BOOKED

      if (
        bookedTimes.includes(
          time
        )
      ) {

        button.disabled =
          true;

        button.classList.add(
          "booked"
        );

        timeSlots.appendChild(
          button
        );

        return;
      }


      // PAST

      if (
        isPastDateTime(
          dateString,
          time
        )
      ) {

        button.disabled =
          true;

        button.classList.add(
          "booked"
        );

        timeSlots.appendChild(
          button
        );

        return;
      }


      // AVAILABLE

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


          selectedTime =
            time;


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
    typeof flatpickr ===
    "undefined"
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

      dateFormat:
        "Y-m-d",

      minDate:
        "today",

      disable: [

        function (date) {

          return (
            date.getDay() === 0
          );

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
// ADDITIONAL SERVICES
// ==========================================


// ------------------------------------------
// OPEN POPUP
// ------------------------------------------

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


// ------------------------------------------
// CLOSE POPUP
// ------------------------------------------

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


// ------------------------------------------
// SAVE ADDITIONAL SERVICE
// ------------------------------------------

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


    // ADD TO ARRAY

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


    // UPDATE DISPLAY

    renderSelectedAdditionalServices();


    // CLEAR POPUP

    serviceElement.value =
      "";


    if (polishElement) {

      polishElement.value =
        "";

    }


    if (designElement) {

      designElement.value =
        "";

    }


    if (detailsElement) {

      detailsElement.value =
        "";

    }


    // CLOSE

    window.closeAdditionalServicePopup();

  };


// ------------------------------------------
// DISPLAY SELECTED SERVICES
// ------------------------------------------

function renderSelectedAdditionalServices() {

  const container =
    document.getElementById(
      "selectedAdditionalServices"
    );


  if (!container) {
    return;
  }


  container.innerHTML =
    "";


  selectedAdditionalServices.forEach(
    function (item, index) {

      const service =
        document.createElement(
          "div"
        );


      service.className =
        "selected-additional-service";


      let details =
        "";


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


      service.innerHTML = `

        <div class="additional-service-info">

          <strong>
            ${item.service}
          </strong>

          <span>
            ${details}
          </span>

        </div>

        <button
          type="button"
          onclick="removeAdditionalService(${index})"
          aria-label="Remove ${item.service}">
          ×
        </button>

      `;


      container.appendChild(
        service
      );

    }
  );

}


// ------------------------------------------
// REMOVE ADDITIONAL SERVICE
// ------------------------------------------

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
// CALCULATE ADDITIONAL SERVICE DURATION
// ==========================================

function getAdditionalServicesDuration() {

  let totalDuration =
    0;


  selectedAdditionalServices.forEach(
    function (item) {

      totalDuration +=
        durations[item.service] || 0;

    }
  );


  return totalDuration;
}


// ==========================================
// CREATE ADDITIONAL SERVICE NOTES
// ==========================================

function getAdditionalServicesNotes() {

  if (
    selectedAdditionalServices.length ===
    0
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


      lines.push(
        line
      );

    }
  );


  return lines.join(
    "\n"
  );
}


// ==========================================
// CLOSE BOOKING POPUP
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
// BOOK APPOINTMENT
// ==========================================

window.bookAppointment =
  async function () {

    console.log(
      "BOOK APPOINTMENT CLICKED"
    );


    // --------------------------------------
    // GET USER
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


    console.log(
      "BOOKING USER:",
      user.id
    );


    // --------------------------------------
    // GET FORM ELEMENTS
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


    // --------------------------------------
    // CHECK ELEMENTS
    // --------------------------------------

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
    // GET VALUES
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
    // CALCULATE DURATION
    // ======================================

    let duration =
      durations[service] || 0;


    // ADDITIONAL SERVICES

    duration +=
      getAdditionalServicesDuration();


    console.log(
      "TOTAL APPOINTMENT DURATION:",
      duration,
      "hours"
    );


    // --------------------------------------
    // MAKE SURE DURATION EXISTS
    // --------------------------------------

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


    const numberOfSlots =
      Math.ceil(
        duration * 2
      );


    const timesToBook = [];


    for (
      let i = 0;
      i < numberOfSlots;
      i++
    ) {

      timesToBook.push(
        minutesToTime(
          startMinutes +
          i * 30
        )
      );

    }


    console.log(
      "TIMES TO BOOK:",
      timesToBook
    );


    // ======================================
    // CHECK FOR CONFLICT
    // ======================================

    const existingAppointments =
      await getBookedAppointments(
        selectedDate
      );


    let conflict =
      false;


    existingAppointments.forEach(
      function (appointment) {

        let blocked =
          appointment.blocked_times ||
          [];


        if (
          typeof blocked ===
          "string"
        ) {

          try {

            blocked =
              JSON.parse(
                blocked
              );

          } catch (error) {

            blocked = [];

          }
        }


        if (
          !Array.isArray(blocked)
        ) {

          return;

        }


        timesToBook.forEach(
          function (time) {

            if (
              blocked.includes(
                time
              )
            ) {

              conflict =
                true;

            }

          }
        );

      }
    );


    // --------------------------------------
    // CONFLICT FOUND
    // --------------------------------------

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
    // ADDITIONAL SERVICE NOTES
    // ======================================

    const additionalNotes =
      getAdditionalServicesNotes();


    console.log(
      "ADDITIONAL SERVICES:",
      selectedAdditionalServices
    );


    console.log(
      "ADDITIONAL NOTES:",
      additionalNotes
    );


    // ======================================
    // INSERT APPOINTMENT
    // ======================================

    console.log(
      "SENDING APPOINTMENT TO SUPABASE..."
    );


    const result =
      await supabaseClient
        .from("appointments")
        .insert([{

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
            timesToBook,

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

        }])
        .select();


    const data =
      result.data;


    const error =
      result.error;


    // ======================================
    // DATABASE ERROR
    // ======================================

    if (error) {

      showSupabaseError(
        "SUPABASE BOOKING ERROR",
        error
      );


      return;
    }


    // ======================================
    // SUCCESS
    // ======================================

    console.log(
      "APPOINTMENT CREATED:",
      data
    );


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
    // CLEAR FORM
    // ======================================

    if (nameElement) {
      nameElement.value = "";
    }


    if (phoneElement) {
      phoneElement.value = "";
    }


    if (serviceElement) {
      serviceElement.selectedIndex = 0;
    }


    if (polishElement) {
      polishElement.selectedIndex = 0;
    }


    if (designElement) {
      designElement.selectedIndex = 0;
    }


    // --------------------------------------
    // CLEAR ADDITIONAL SERVICES
    // --------------------------------------

    selectedAdditionalServices = [];


    renderSelectedAdditionalServices();


    // --------------------------------------
    // CLEAR DATE/TIME
    // --------------------------------------

    selectedDate =
      null;


    selectedTime =
      null;


    const dateInput =
      document.getElementById(
        "appointmentDate"
      );


    if (dateInput) {

      dateInput.value =
        "";

    }


    const timeSlots =
      document.getElementById(
        "timeSlots"
      );


    if (timeSlots) {

      timeSlots.innerHTML =
        "";

    }


    // ======================================
    // REFRESH CUSTOMER APPOINTMENTS
    // ======================================

    await loadMyAppointments(
      user
    );

  };


// ==========================================
// LOGOUT
// ==========================================

async function logout() {

  const result =
    await supabaseClient
      .auth
      .signOut();


  const error =
    result.error;


  if (error) {

    showSupabaseError(
      "LOGOUT ERROR",
      error
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
      "BOOKING PAGE LOADED"
    );


    // --------------------------------------
    // GET USER
    // --------------------------------------

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


    // --------------------------------------
    // EMAIL
    // --------------------------------------

    const userEmail =
      document.getElementById(
        "userEmail"
      );


    if (userEmail) {

      userEmail.textContent =
        user.email || "";

    }


    // --------------------------------------
    // LOAD APPOINTMENTS
    // --------------------------------------

    await loadMyAppointments(
      user
    );


    // --------------------------------------
    // INITIALIZE CALENDAR
    // --------------------------------------

    initializeCalendar();


    // --------------------------------------
    // LOGOUT
    // --------------------------------------

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


    // --------------------------------------
    // INITIALIZE ADDITIONAL SERVICES
    // --------------------------------------

    renderSelectedAdditionalServices();

  }
);
