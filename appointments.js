
const SUPABASE_URL =
  "https://kyonstvpolakjhrecqcj.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5b25zdHZwb2xha2pocWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTYxMjUsImV4cCI6MjA5NzI3MjEyNX0.oq6v7gEy8FJPh4NI3ngUYybwJcHF6rW6qkNtepCxr7Y";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


// ==========================================
// OWNER
// ==========================================

const OWNER_EMAIL = "enavejas005@gmail.com";


// ==========================================
// VARIABLES
// ==========================================

let appointments = [];

let currentDate = new Date();

let selectedDate = null;


// ==========================================
// CHECK OWNER LOGIN
// ==========================================

async function checkOwnerLogin() {

  const {
    data: { user },
    error
  } = await supabaseClient.auth.getUser();


  if (error || !user) {

    window.location.href = "login.html";

    return false;
  }


  if (
    user.email.toLowerCase() !==
    OWNER_EMAIL.toLowerCase()
  ) {

    alert(
      "You do not have permission to access the owner page."
    );

    await supabaseClient.auth.signOut();

    window.location.href = "login.html";

    return false;
  }


  return true;
}


// ==========================================
// LOAD APPOINTMENTS
// ==========================================

async function loadAppointments() {

  console.log("Loading appointments...");


  const {
    data,
    error
  } = await supabaseClient
    .from("appointments")
    .select("*")
    .neq("status", "past");


  if (error) {

    console.error(
      "Supabase appointment error:",
      error
    );

    alert(
      "Could not load appointments:\n\n" +
      error.message
    );

    return;
  }


  appointments = data || [];


  console.log(
    "Appointments loaded:",
    appointments
  );


  // Sort by date and time

  appointments.sort(function (a, b) {

    const dateA =
      new Date(
        `${a.date} ${a.time}`
      );

    const dateB =
      new Date(
        `${b.date} ${b.time}`
      );

    return dateA - dateB;

  });


  updateCounter();

  renderCalendar();

}


// ==========================================
// COUNTER
// ==========================================

function updateCounter() {

  const counter =
    document.getElementById(
      "appointmentCounter"
    );


  if (!counter) return;


  counter.textContent =
    `Total Appointments: ${appointments.length}`;

}


// ==========================================
// RENDER CALENDAR
// ==========================================

function renderCalendar() {

  const grid =
    document.getElementById(
      "calendarGrid"
    );

  const monthYear =
    document.getElementById(
      "monthYear"
    );


  if (!grid || !monthYear) {

    console.error(
      "Calendar elements not found."
    );

    return;
  }


  grid.innerHTML = "";


  const year =
    currentDate.getFullYear();

  const month =
    currentDate.getMonth();


  const monthName =
    currentDate.toLocaleString(
      "default",
      {
        month: "long"
      }
    );


  monthYear.textContent =
    `${monthName} ${year}`;


  const firstDay =
    new Date(
      year,
      month,
      1
    ).getDay();


  const daysInMonth =
    new Date(
      year,
      month + 1,
      0
    ).getDate();


  // Empty spaces before month starts

  for (
    let i = 0;
    i < firstDay;
    i++
  ) {

    const empty =
      document.createElement("div");

    empty.className =
      "calendar-day empty";

    grid.appendChild(empty);

  }


  // Days

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {

    const dateString =
      `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;


    const dayElement =
      document.createElement("div");


    dayElement.className =
      "calendar-day";


    dayElement.textContent =
      day;


    // Appointments on this day

    const dayAppointments =
      appointments.filter(
        function (appointment) {

          return (
            appointment.date ===
            dateString
          );

        }
      );


    if (
      dayAppointments.length > 0
    ) {

      dayElement.classList.add(
        "has-appointments"
      );


      const count =
        document.createElement("span");


      count.className =
        "appointment-count";


      count.textContent =
        dayAppointments.length;


      dayElement.appendChild(
        count
      );

    }


    // Selected day

    if (
      selectedDate ===
      dateString
    ) {

      dayElement.classList.add(
        "selected"
      );

    }


    dayElement.addEventListener(
      "click",
      function () {

        selectedDate =
          dateString;


        renderCalendar();


        showAppointmentsForDate(
          dateString
        );

        clearDetails();

      }
    );


    grid.appendChild(
      dayElement
    );

  }

}


// ==========================================
// SHOW APPOINTMENTS FOR DAY
// ==========================================

function showAppointmentsForDate(
  dateString
) {

  const title =
    document.getElementById(
      "selectedDateTitle"
    );


  const container =
    document.getElementById(
      "dailyAppointments"
    );


  if (!title || !container) {
    return;
  }


  const dayAppointments =
    appointments.filter(
      function (appointment) {

        return (
          appointment.date ===
          dateString
        );

      }
    );


  const date =
    new Date(
      `${dateString}T12:00:00`
    );


  title.textContent =
    date.toLocaleDateString(
      "en-US",
      {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
      }
    );


  container.innerHTML = "";


  if (
    dayAppointments.length === 0
  ) {

    container.innerHTML =
      `<p class="no-selection">
        No appointments on this day.
      </p>`;

    return;
  }


  dayAppointments.forEach(
    function (appointment) {

      const index =
        appointments.indexOf(
          appointment
        );


      const card =
        document.createElement(
          "div"
        );


      card.className =
        "appointment-card";


      card.innerHTML = `

        <button
          type="button"
          class="appointment-button"
        >

          <strong>
            ${escapeHTML(
              appointment.time || ""
            )}
          </strong>

          <br>

          ${escapeHTML(
            appointment.name ||
            "Unnamed Client"
          )}

          <br>

          <small>
            ${escapeHTML(
              appointment.service ||
              "Appointment"
            )}
          </small>

        </button>

      `;


      card
        .querySelector(
          ".appointment-button"
        )
        .addEventListener(
          "click",
          function () {

            showAppointmentDetails(
              index
            );

          }
        );


      container.appendChild(
        card
      );

    }
  );

}


// ==========================================
// SHOW DETAILS
// ==========================================

function showAppointmentDetails(
  index
) {

  const appointment =
    appointments[index];


  const details =
    document.getElementById(
      "appointmentDetails"
    );


  if (!appointment || !details) {
    return;
  }


  details.innerHTML = `

    <h3>
      ${escapeHTML(
        appointment.name ||
        "Appointment"
      )}
    </h3>

    <p>
      <strong>Phone:</strong>
      ${escapeHTML(
        appointment.phone || "N/A"
      )}
    </p>

    <p>
      <strong>Date:</strong>
      ${escapeHTML(
        appointment.date || "N/A"
      )}
    </p>

    <p>
      <strong>Time:</strong>
      ${escapeHTML(
        appointment.time || "N/A"
      )}
    </p>

    <p>
      <strong>Service:</strong>
      ${escapeHTML(
        appointment.service || "N/A"
      )}
    </p>

    <p>
      <strong>Polish:</strong>
      ${escapeHTML(
        appointment.polish || "N/A"
      )}
    </p>

    <p>
      <strong>Design:</strong>
      ${escapeHTML(
        appointment.design || "N/A"
      )}
    </p>

    <p>
      <strong>Duration:</strong>
      ${appointment.duration || 1}
      hours
    </p>

    <p>
      <strong>Owner Notes:</strong>
    </p>

    <p class="owner-notes">
      ${escapeHTML(
        appointment.notes ||
        "No notes yet."
      )}
    </p>


    <div class="button-group">

      <button
        type="button"
        onclick="editAppointment(${index})"
      >
        Edit
      </button>

      <button
        type="button"
        onclick="deleteAppointment(${index})"
      >
        Delete
      </button>

      <button
        type="button"
        onclick="completeAppointment(${index})"
      >
        Complete
      </button>

    </div>

  `;

}


// ==========================================
// CLEAR DETAILS
// ==========================================

function clearDetails() {

  const details =
    document.getElementById(
      "appointmentDetails"
    );


  if (!details) return;


  details.innerHTML =
    `<p class="no-selection">
      Select an appointment.
    </p>`;

}


// ==========================================
// EDIT
// ==========================================

window.editAppointment =
  function (index) {

    const appointment =
      appointments[index];


    const details =
      document.getElementById(
        "appointmentDetails"
      );


    if (!appointment || !details) {
      return;
    }


    details.innerHTML = `

      <h3>Edit Appointment</h3>

      <input
        id="editName"
        type="text"
        value="${escapeAttribute(
          appointment.name || ""
        )}"
        placeholder="Name"
      >

      <input
        id="editPhone"
        type="text"
        value="${escapeAttribute(
          appointment.phone || ""
        )}"
        placeholder="Phone"
      >

      <input
        id="editDate"
        type="text"
        value="${escapeAttribute(
          appointment.date || ""
        )}"
        placeholder="Date"
      >

      <input
        id="editTime"
        type="text"
        value="${escapeAttribute(
          appointment.time || ""
        )}"
        placeholder="Time"
      >

      <input
        id="editService"
        type="text"
        value="${escapeAttribute(
          appointment.service || ""
        )}"
        placeholder="Service"
      >

      <input
        id="editPolish"
        type="text"
        value="${escapeAttribute(
          appointment.polish || ""
        )}"
        placeholder="Polish"
      >

      <input
        id="editDesign"
        type="text"
        value="${escapeAttribute(
          appointment.design || ""
        )}"
        placeholder="Design"
      >

      <textarea
        id="editNotes"
        placeholder="Owner notes"
      >${escapeHTML(
        appointment.notes || ""
      )}</textarea>


      <div class="button-group">

        <button
          type="button"
          onclick="saveAppointment(${index})"
        >
          Save
        </button>

        <button
          type="button"
          onclick="showAppointmentDetails(${index})"
        >
          Cancel
        </button>

      </div>

    `;

  };


// ==========================================
// SAVE
// ==========================================

window.saveAppointment =
  async function (index) {

    const appointment =
      appointments[index];


    if (!appointment) return;


    const updatedAppointment = {

      name:
        document.getElementById(
          "editName"
        ).value.trim(),

      phone:
        document.getElementById(
          "editPhone"
        ).value.trim(),

      date:
        document.getElementById(
          "editDate"
        ).value.trim(),

      time:
        document.getElementById(
          "editTime"
        ).value.trim(),

      service:
        document.getElementById(
          "editService"
        ).value.trim(),

      polish:
        document.getElementById(
          "editPolish"
        ).value.trim(),

      design:
        document.getElementById(
          "editDesign"
        ).value.trim(),

      notes:
        document.getElementById(
          "editNotes"
        ).value.trim()

    };


    const {
      error
    } = await supabaseClient
      .from("appointments")
      .update(
        updatedAppointment
      )
      .eq(
        "id",
        appointment.id
      );


    if (error) {

      console.error(
        "Save error:",
        error
      );

      alert(
        "Could not save appointment:\n\n" +
        error.message
      );

      return;
    }


    await loadAppointments();


    selectedDate =
      updatedAppointment.date;


    showAppointmentsForDate(
      selectedDate
    );

  };


// ==========================================
// DELETE
// ==========================================

window.deleteAppointment =
  async function (index) {

    const appointment =
      appointments[index];


    if (!appointment) return;


    if (
      !confirm(
        `Delete the appointment for ${
          appointment.name ||
          "this client"
        }?`
      )
    ) {
      return;
    }


    const {
      error
    } = await supabaseClient
      .from("appointments")
      .delete()
      .eq(
        "id",
        appointment.id
      );


    if (error) {

      console.error(
        "Delete error:",
        error
      );

      alert(
        "Could not delete appointment:\n\n" +
        error.message
      );

      return;
    }


    clearDetails();

    await loadAppointments();

  };


// ==========================================
// COMPLETE
// ==========================================

window.completeAppointment =
  async function (index) {

    const appointment =
      appointments[index];


    if (!appointment) return;


    if (
      !confirm(
        `Mark ${
          appointment.name ||
          "this appointment"
        } as completed?`
      )
    ) {
      return;
    }


    const {
      error
    } = await supabaseClient
      .from("appointments")
      .update({

        status: "past",

        completed_date:
          new Date()
            .toLocaleDateString()

      })
      .eq(
        "id",
        appointment.id
      );


    if (error) {

      console.error(
        "Complete error:",
        error
      );

      alert(
        "Could not complete appointment:\n\n" +
        error.message
      );

      return;
    }


    clearDetails();

    await loadAppointments();

  };


// ==========================================
// PREVIOUS MONTH
// ==========================================

const prevMonth =
  document.getElementById(
    "prevMonth"
  );


if (prevMonth) {

  prevMonth.addEventListener(
    "click",
    function () {

      currentDate.setMonth(
        currentDate.getMonth() - 1
      );

      renderCalendar();

    }
  );

}


// ==========================================
// NEXT MONTH
// ==========================================

const nextMonth =
  document.getElementById(
    "nextMonth"
  );


if (nextMonth) {

  nextMonth.addEventListener(
    "click",
    function () {

      currentDate.setMonth(
        currentDate.getMonth() + 1
      );

      renderCalendar();

    }
  );

}


// ==========================================
// SECURITY HELPERS
// ==========================================

function escapeHTML(value) {

  return String(value)
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


function escapeAttribute(value) {

  return escapeHTML(value);

}


// ==========================================
// START
// ==========================================

async function start() {

  console.log(
    "Starting owner appointment manager..."
  );


  const allowed =
    await checkOwnerLogin();


  if (!allowed) {
    return;
  }


  await loadAppointments();

}


start();
