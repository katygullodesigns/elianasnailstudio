
// ==========================================
// SUPABASE
// ==========================================

const SUPABASE_URL =
  "https://kyonstvpolakjhrecqcj.supabase.co";

const SUPABASE_ANON_KEY =
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5b25zdHZwb2xha2pocmVjcWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTYxMjUsImV4cCI6MjA5NzI3MjEyNX0.oq6v7gEy8FJPh4NI3ngUYybwJcHF6rW6qkNtepCxr7Y
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

const durations = {
  "Manicure": 1.5,
  "Pedicure": 0.5,
  "Gel": 1.5,
  "Acrylic": 1.5,
  "Basic": 0.5,
  "Minimal Design": 1,
  "Max Design": 2.5
};

let selectedDate = null;
let selectedTime = null;


// ==========================================
// ERROR DISPLAY
// ==========================================

function showSupabaseError(title, error) {

  console.error(title, error);

  alert(
    "SUPABASE ERROR\n\n" +
    "Status: " + (error?.status || "none") + "\n\n" +
    "Code: " + (error?.code || "none") + "\n\n" +
    "Message: " + (error?.message || "none") + "\n\n" +
    "Details: " + (error?.details || "none") + "\n\n" +
    "Hint: " + (error?.hint || "none")
  );
}


// ==========================================
// TIME FUNCTIONS
// ==========================================

function timeToMinutes(timeString) {

  const parts = timeString.split(" ");
  const time = parts[0];
  const modifier = parts[1];

  let timeParts = time.split(":");
  let hours = Number(timeParts[0]);
  let minutes = Number(timeParts[1]);

  if (modifier === "PM" && hours !== 12) {
    hours += 12;
  }

  if (modifier === "AM" && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}


function minutesToTime(totalMinutes) {

  let hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

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

  const parts = timeString.split(" ");
  const time = parts[0];
  const modifier = parts[1];

  let timeParts = time.split(":");
  let hours = Number(timeParts[0]);
  let minutes = Number(timeParts[1]);

  if (modifier === "PM" && hours !== 12) {
    hours += 12;
  }

  if (modifier === "AM" && hours === 12) {
    hours = 0;
  }

  return (
    String(hours).padStart(2, "0") +
    ":" +
    String(minutes).padStart(2, "0")
  );
}


function isPastDateTime(dateString, timeString) {

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

  const result =
    await supabaseClient.auth.getSession();

  const data = result.data;
  const error = result.error;

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
    document.getElementById("appointments");

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

  const data = result.data;
  const error = result.error;

  if (error) {

    showSupabaseError(
      "LOADING APPOINTMENTS",
      error
    );

    container.innerHTML =
      "<p>Unable to load your appointments.</p>";

    return;
  }

  if (!data || data.length === 0) {

    container.innerHTML =
      "<p>You don't have any appointments scheduled.</p>";

    return;
  }

  container.innerHTML = "";

  data.forEach(function (appointment) {

    const card =
      document.createElement("div");

    card.className =
      "appointment-card";

    let formattedDate =
      appointment.date || "";

    if (appointment.date) {

      const date =
        new Date(
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

    card.innerHTML = `
      <h3>${appointment.service || "Appointment"}</h3>

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
          ? `<p><strong>Polish:</strong> ${appointment.polish}</p>`
          : ""
      }

      ${
        appointment.design
          ? `<p><strong>Design:</strong> ${appointment.design}</p>`
          : ""
      }

      ${
        appointment.duration
          ? `<p><strong>Duration:</strong> ${appointment.duration} hour(s)</p>`
          : ""
      }

      <p>
        <strong>Status:</strong>
        ${appointment.status || "Active"}
      </p>
    `;

    container.appendChild(card);
  });
}


// ==========================================
// GET BOOKED APPOINTMENTS
// ==========================================

async function getBookedAppointments(dateString) {

  const result =
    await supabaseClient
      .from("appointments")
      .select("*")
      .eq("date", dateString);

  const data = result.data;
  const error = result.error;

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

async function loadTimes(dateString) {

  const timeSlots =
    document.getElementById("timeSlots");

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

  appointments.forEach(function (appointment) {

    let blocked =
      appointment.blocked_times || [];

    if (typeof blocked === "string") {

      try {
        blocked = JSON.parse(blocked);
      } catch (error) {
        blocked = [];
      }
    }

    if (Array.isArray(blocked)) {

      blocked.forEach(function (time) {
        bookedTimes.push(time);
      });
    }
  });

  timeSlots.innerHTML = "";

  allTimes.forEach(function (time) {

    const button =
      document.createElement("button");

    button.type = "button";

    button.textContent = time;

    button.className =
      "time-slot";

    if (bookedTimes.includes(time)) {

      button.disabled = true;

      button.classList.add("booked");

      timeSlots.appendChild(button);

      return;
    }

    if (
      isPastDateTime(
        dateString,
        time
      )
    ) {

      button.disabled = true;

      button.classList.add("booked");

      timeSlots.appendChild(button);

      return;
    }

    button.addEventListener(
      "click",
      function () {

        document
          .querySelectorAll(".time-slot")
          .forEach(function (btn) {

            btn.classList.remove(
              "selected"
            );

          });

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

    timeSlots.appendChild(button);
  });

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
// BOOK APPOINTMENT
// ==========================================

window.bookAppointment =
  async function () {

    console.log(
      "BOOK APPOINTMENT CLICKED"
    );

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

    const name =
      document
        .getElementById("clientName")
        .value
        .trim();

    const phone =
      document
        .getElementById("clientPhone")
        .value
        .trim();

    const service =
      document
        .getElementById("serviceSelect")
        .value;

    const polish =
      document
        .getElementById("polishSelect")
        .value;

    const design =
      document
        .getElementById("designSelect")
        .value;

    const additionalService =
      document
        .getElementById("additionalServiceSelect")
        .value;


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


    // --------------------------------------
    // CALCULATE DURATION
    // --------------------------------------

    let duration =
      Math.max(
        durations[service] || 0,
        durations[polish] || 0,
        durations[design] || 0
      );

    if (
      additionalService &&
      additionalService !== "No"
    ) {

      duration +=
        durations[
          additionalService
        ] || 0;
    }


    // --------------------------------------
    // CALCULATE BLOCKED TIMES
    // --------------------------------------

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


    // --------------------------------------
    // CHECK FOR CONFLICT
    // --------------------------------------

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


    // --------------------------------------
    // INSERT APPOINTMENT
    // --------------------------------------

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
            additionalService &&
            additionalService !== "No"
              ? `Additional service: ${additionalService}`
              : "",

          status:
            "active",

          created_at:
            new Date().toISOString()

        }])
        .select();

    const data = result.data;
    const error = result.error;


    // --------------------------------------
    // DATABASE ERROR
    // --------------------------------------

    if (error) {

      showSupabaseError(
        "SUPABASE BOOKING ERROR",
        error
      );

      return;
    }


    // --------------------------------------
    // SUCCESS
    // --------------------------------------

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


    // --------------------------------------
    // CLEAR FORM
    // --------------------------------------

    document
      .getElementById(
        "clientName"
      )
      .value = "";

    document
      .getElementById(
        "clientPhone"
      )
      .value = "";

    document
      .getElementById(
        "serviceSelect"
      )
      .selectedIndex = 0;

    document
      .getElementById(
        "polishSelect"
      )
      .selectedIndex = 0;

    document
      .getElementById(
        "designSelect"
      )
      .selectedIndex = 0;

    document
      .getElementById(
        "additionalServiceSelect"
      )
      .selectedIndex = 0;

    selectedDate = null;
    selectedTime = null;

    const timeSlots =
      document.getElementById(
        "timeSlots"
      );

    if (timeSlots) {
      timeSlots.innerHTML = "";
    }

    await loadMyAppointments(
      user
    );
  };


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
// ADDITIONAL SERVICE POPUP
// ==========================================

window.saveAdditionalServiceOptions =
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
// LOGOUT
// ==========================================

async function logout() {

  const result =
    await supabaseClient
      .auth
      .signOut();

  const error = result.error;

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

  });
