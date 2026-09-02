// ==========================================
// SUPABASE
// ==========================================

const SUPABASE_URL =
  "https://kyonstvpolakjhrecqcj.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFub24iLCJpYXQiOjE3ODE2OTYxMjUsImV4cCI6MjA5NzI3MjEyNX0.oq6v7gEy8FPh4NI3ngUYybwJcHF6rW6qkNtepCxr7Y";

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
// TIME FUNCTIONS
// ==========================================

function timeToMinutes(timeString) {

  const [time, modifier] =
    timeString.split(" ");

  let [hours, minutes] =
    time.split(":").map(Number);

  if (modifier === "PM" && hours !== 12) {
    hours += 12;
  }

  if (modifier === "AM" && hours === 12) {
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

  return `${hours}:${String(minutes).padStart(2, "0")} ${modifier}`;
}


function isPastDateTime(dateString, timeString) {

  const appointmentDate =
    new Date(
      `${dateString}T${convertTo24Hour(timeString)}:00`
    );

  return appointmentDate < new Date();
}


function convertTo24Hour(timeString) {

  const [time, modifier] =
    timeString.split(" ");

  let [hours, minutes] =
    time.split(":").map(Number);

  if (modifier === "PM" && hours !== 12) {
    hours += 12;
  }

  if (modifier === "AM" && hours === 12) {
    hours = 0;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}


// ==========================================
// GET CURRENT USER
// ==========================================

async function getCurrentUser() {

  const {
    data,
    error
  } = await supabaseClient.auth.getSession();

  console.log("MY APPOINTMENTS SESSION:", data?.session);
  console.log("MY APPOINTMENTS SESSION ERROR:", error);

  if (error) {
    console.error("Session error:", error);
    return null;
  }

  return data?.session?.user || null;
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


  const {
    data,
    error
  } = await supabaseClient
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

    console.error(
      "APPOINTMENTS ERROR:",
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
// GET BOOKED TIMES FOR A DATE
// ==========================================

async function getBookedAppointments(dateString) {

  const {
    data,
    error
  } = await supabaseClient
    .from("appointments")
    .select("*")
    .eq("date", dateString);


  if (error) {

    console.error(
      "BOOKED APPOINTMENTS ERROR:",
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
    await getBookedAppointments(dateString);


  const bookedTimes = [];


  appointments.forEach(function (appointment) {

    let blocked =
      appointment.blocked_times ||
      appointment.blockedTimes ||
      [];


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


    // Already booked
    if (bookedTimes.includes(time)) {

      button.disabled = true;

      button.classList.add("booked");

      return;
    }


    // Past time today
    if (isPastDateTime(dateString, time)) {

      button.disabled = true;

      button.classList.add("booked");

      return;
    }


    // Available time
    button.addEventListener(
      "click",
      function () {

        document
          .querySelectorAll(".time-slot")
          .forEach(function (btn) {

            btn.classList.remove("selected");

          });


        button.classList.add("selected");

        selectedTime = time;

        console.log(
          "Selected time:",
          selectedTime
        );
      }
    );


    timeSlots.appendChild(button);
  });


  if (timeSlots.children.length === 0) {

    timeSlots.innerHTML =
      "<p>No times available for this date.</p>";
  }
}


// ==========================================
// INITIALIZE CALENDAR
// ==========================================

function initializeCalendar() {

  const dateInput =
    document.getElementById("appointmentDate");


  if (!dateInput) {

    console.error(
      "appointmentDate input was not found."
    );

    return;
  }


  if (typeof flatpickr === "undefined") {

    console.error(
      "Flatpickr is not loaded."
    );

    return;
  }


  flatpickr(
    dateInput,
    {

      dateFormat: "Y-m-d",

      minDate: "today",

      // BLOCK SUNDAYS
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

          selectedDate = dateStr;

          selectedTime = null;

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
    "Calendar initialized successfully."
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
    // CHECK LOGIN
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
    // GET FORM VALUES
    // --------------------------------------

    const name =
      document
        .getElementById("clientName")
        ?.value.trim();


    const phone =
      document
        .getElementById("clientPhone")
        ?.value.trim();


    const service =
      document
        .getElementById("serviceSelect")
        ?.value;


    const polish =
      document
        .getElementById("polishSelect")
        ?.value;


    const design =
      document
        .getElementById("designSelect")
        ?.value;


    const additionalService =
      document
        .getElementById("additionalServiceSelect")
        ?.value;


    // --------------------------------------
    // VALIDATION
    // --------------------------------------

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


    // --------------------------------------
    // CHECK PAST TIME
    // --------------------------------------

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


    // Additional service
    if (
      additionalService &&
      additionalService !== "No"
    ) {

      duration +=
        durations[additionalService] || 0;
    }


    // --------------------------------------
    // CREATE BLOCKED TIMES
    // --------------------------------------

    const startMinutes =
      timeToMinutes(selectedTime);


    const numberOfSlots =
      Math.ceil(duration * 2);


    const timesToBook = [];


    for (
      let i = 0;
      i < numberOfSlots;
      i++
    ) {

      timesToBook.push(
        minutesToTime(
          startMinutes + i * 30
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
          appointment.blocked_times ||
          appointment.blockedTimes ||
          [];


        if (
          typeof blocked === "string"
        ) {

          try {

            blocked =
              JSON.parse(blocked);

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
    // SAVE TO SUPABASE
    // --------------------------------------

    const {
      data,
      error
    } = await supabaseClient
      .from("appointments")
      .insert([{

        user_id: user.id,

        name: name,

        phone: phone,

        date: selectedDate,

        time: selectedTime,

        duration: duration,

        blocked_times: timesToBook,

        service: service,

        polish: polish,

        design: design,

        notes:
          additionalService &&
          additionalService !== "No"
            ? `Additional service: ${additionalService}`
            : "",

        status: "active",

        created_at:
          new Date().toISOString()

      }])
      .select();


    // --------------------------------------
    // DATABASE ERROR
    // --------------------------------------

    if (error) {

      console.error(
        "SUPABASE BOOKING ERROR:",
        error
      );

      alert(
        "There was a problem booking your appointment. Please try again."
      );

      return;
    }


    console.log(
      "APPOINTMENT CREATED:",
      data
    );


    // --------------------------------------
    // SUCCESS POPUP
    // --------------------------------------

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

    const clientName =
      document.getElementById(
        "clientName"
      );

    const clientPhone =
      document.getElementById(
        "clientPhone"
      );

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

    const additionalServiceSelect =
      document.getElementById(
        "additionalServiceSelect"
      );


    if (clientName) {
      clientName.value = "";
    }

    if (clientPhone) {
      clientPhone.value = "";
    }

    if (serviceSelect) {
      serviceSelect.selectedIndex = 0;
    }

    if (polishSelect) {
      polishSelect.selectedIndex = 0;
    }

    if (designSelect) {
      designSelect.selectedIndex = 0;
    }

    if (additionalServiceSelect) {
      additionalServiceSelect.selectedIndex = 0;
    }


    selectedDate = null;

    selectedTime = null;


    const timeSlots =
      document.getElementById(
        "timeSlots"
      );


    if (timeSlots) {

      timeSlots.innerHTML = "";
    }


    // Refresh customer's appointments
    await loadMyAppointments(user);
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
// LOGOUT
// ==========================================

async function logout() {

  const {
    error
  } = await supabaseClient.auth.signOut();


  if (error) {

    console.error(
      "LOGOUT ERROR:",
      error
    );

    alert(
      "There was a problem logging out. Please try again."
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
    // SHOW EMAIL
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
    // LOGOUT BUTTON
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
