```javascript
const SUPABASE_URL =
  "https://kyonstvpolakjhrecqcj.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzIiwicmVmIjoia3lvbnN0dnBvbGFramh ycmVjcWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTYxMjUsImV4cCI6MjA5NzI3MjEyNX0.oq6v7gEy8FJPh4NI3ngUYybwJcHF6rW6qkNtepCxr7Y"
    .replace(/\s/g, "");

const supabaseClient =
  supabase.createClient(
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
let selectedAppointment = null;


// ==========================================
// CHECK OWNER LOGIN
// ==========================================

async function checkOwnerLogin() {

  try {

    const {
      data: { user },
      error
    } = await supabaseClient.auth.getUser();

    console.log("Current user:", user);

    if (error || !user) {

      console.log("No logged-in user.");

      window.location.href = "login.html";

      return false;
    }


    if (
      !user.email ||
      user.email.toLowerCase() !==
      OWNER_EMAIL.toLowerCase()
    ) {

      alert(
        "You do not have permission to access the owner appointment manager."
      );

      await supabaseClient.auth.signOut();

      window.location.href = "login.html";

      return false;
    }


    console.log(
      "Owner logged in:",
      user.email
    );

    return true;

  } catch (error) {

    console.error(
      "Owner login check failed:",
      error
    );

    window.location.href =
      "login.html";

    return false;
  }
}


// ==========================================
// LOAD APPOINTMENTS
// ==========================================

async function loadAppointments() {

  console.log(
    "Loading appointments..."
  );


  const {
    data,
    error
  } = await supabaseClient
    .from("appointments")
    .select("*")
    .or(
      "status.is.null,status.neq.past"
    )
    .order(
      "date",
      {
        ascending: true
      }
    );


  if (error) {

    console.error(
      "SUPABASE LOAD ERROR:",
      error
    );

    alert(
      "Could not load appointments.\n\n" +
      error.message
    );

    return;
  }


  appointments =
    data || [];


  console.log(
    "Appointments loaded:",
    appointments
  );


  // Sort by date and time
  appointments.sort(
    function (a, b) {

      const dateA =
        new Date(
          `${a.date || ""} ${a.time || ""}`
        );

      const dateB =
        new Date(
          `${b.date || ""} ${b.time || ""}`
        );

      return dateA - dateB;

    }
  );


  updateCounter();

  renderCalendar();


  if (selectedDate) {

    showAppointmentsForDate(
      selectedDate
    );

  }

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
// CALENDAR
// ==========================================

function renderCalendar() {

  const calendarGrid =
    document.getElementById(
      "calendarGrid"
    );

  const monthYear =
    document.getElementById(
      "monthYear"
    );


  if (!calendarGrid || !monthYear) {

    console.error(
      "Calendar elements not found."
    );

    return;
  }


  calendarGrid.innerHTML =
    "";


  const year =
    currentDate.getFullYear();

  const month =
    currentDate.getMonth();


  monthYear.textContent =
    currentDate.toLocaleDateString(
      "en-US",
      {
        month: "long",
        year: "numeric"
      }
    );


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


  // Empty cells
  for (
    let i = 0;
    i < firstDay;
    i++
  ) {

    const empty =
      document.createElement(
        "div"
      );

    empty.className =
      "calendar-day empty";

    calendarGrid.appendChild(
      empty
    );

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
      document.createElement(
        "div"
      );

    dayElement.className =
      "calendar-day";


    dayElement.textContent =
      day;


    // Appointments on this date
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
        document.createElement(
          "span"
        );

      count.className =
        "appointment-count";

      count.textContent =
        dayAppointments.length;

      dayElement.appendChild(
        count
      );

    }


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

        selectedAppointment =
          null;

        renderCalendar();

        showAppointmentsForDate(
          dateString
        );

        clearAppointmentDetails();

      }
    );


    calendarGrid.appendChild(
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


  if (!title || !container)
    return;


  const dateAppointments =
    appointments.filter(
      function (appointment) {

        return (
          appointment.date ===
          dateString
        );

      }
    );


  const displayDate =
    new Date(
      `${dateString}T12:00:00`
    ).toLocaleDateString(
      "en-US",
      {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
      }
    );


  title.textContent =
    displayDate;


  container.innerHTML =
    "";


  if (
    dateAppointments.length ===
    0
  ) {

    container.innerHTML =
      `<p class="no-selection">
        No appointments on this day.
      </p>`;

    return;
  }


  dateAppointments.forEach(
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
              appointment.time ||
              ""
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


      const button =
        card.querySelector(
          ".appointment-button"
        );


      button.addEventListener(
        "click",
        function () {

          selectedAppointment =
            appointment;

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


  if (!appointment)
    return;


  selectedAppointment =
    appointment;


  const details =
    document.getElementById(
      "appointmentDetails"
    );


  if (!details)
    return;


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
        appointment.phone ||
        "N/A"
      )}
    </p>

    <p>
      <strong>Date:</strong>
      ${escapeHTML(
        appointment.date ||
        "N/A"
      )}
    </p>

    <p>
      <strong>Time:</strong>
      ${escapeHTML(
        appointment.time ||
        "N/A"
      )}
    </p>

    <p>
      <strong>Service:</strong>
      ${escapeHTML(
        appointment.service ||
        "N/A"
      )}
    </p>

    <p>
      <strong>Polish:</strong>
      ${escapeHTML(
        appointment.polish ||
        "N/A"
      )}
    </p>

    <p>
      <strong>Design:</strong>
      ${escapeHTML(
        appointment.design ||
        "N/A"
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
// EDIT APPOINTMENT
// ==========================================

window.editAppointment =
function (index) {

  const appointment =
    appointments[index];


  if (!appointment)
    return;


  const details =
    document.getElementById(
      "appointmentDetails"
    );


  if (!details)
    return;


  details.innerHTML = `

    <h3>
      Edit Appointment
    </h3>

    <label>Name</label>

    <input
      type="text"
      id="editName"
      value="${escapeAttribute(
        appointment.name || ""
      )}"
    >


    <label>Phone</label>

    <input
      type="text"
      id="editPhone"
      value="${escapeAttribute(
        appointment.phone || ""
      )}"
    >


    <label>Date</label>

    <input
      type="date"
      id="editDate"
      value="${escapeAttribute(
        appointment.date || ""
      )}"
    >


    <label>Time</label>

    <input
      type="text"
      id="editTime"
      value="${escapeAttribute(
        appointment.time || ""
      )}"
    >


    <label>Service</label>

    <input
      type="text"
      id="editService"
      value="${escapeAttribute(
        appointment.service || ""
      )}"
    >


    <label>Polish</label>

    <input
      type="text"
      id="editPolish"
      value="${escapeAttribute(
        appointment.polish || ""
      )}"
    >


    <label>Design</label>

    <input
      type="text"
      id="editDesign"
      value="${escapeAttribute(
        appointment.design || ""
      )}"
    >


    <label>Owner Notes</label>

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
// SAVE EDIT
// ==========================================

window.saveAppointment =
async function (index) {

  const appointment =
    appointments[index];


  if (!appointment)
    return;


  const name =
    document.getElementById(
      "editName"
    ).value.trim();


  const phone =
    document.getElementById(
      "editPhone"
    ).value.trim();


  const date =
    document.getElementById(
      "editDate"
    ).value.trim();


  const time =
    document.getElementById(
      "editTime"
    ).value.trim();


  const service =
    document.getElementById(
      "editService"
    ).value.trim();


  const polish =
    document.getElementById(
      "editPolish"
    ).value.trim();


  const design =
    document.getElementById(
      "editDesign"
    ).value.trim();


  const notes =
    document.getElementById(
      "editNotes"
    ).value.trim();


  if (!name || !date || !time) {

    alert(
      "Name, date, and time are required."
    );

    return;
  }


  const updatedData = {

    name: name,

    phone: phone,

    date: date,

    time: time,

    service: service,

    polish: polish,

    design: design,

    notes: notes

  };


  console.log(
    "Saving appointment:",
    updatedData
  );


  const {
    error
  } = await supabaseClient
    .from("appointments")
    .update(updatedData)
    .eq(
      "id",
      appointment.id
    );


  if (error) {

    console.error(
      "SAVE ERROR:",
      error
    );

    alert(
      "Could not save appointment.\n\n" +
      error.message
    );

    return;
  }


  alert(
    "Appointment updated successfully!"
  );


  selectedDate =
    date;


  currentDate =
    new Date(
      `${date}T12:00:00`
    );


  selectedAppointment =
    null;


  await loadAppointments();


  renderCalendar();

  showAppointmentsForDate(
    date
  );


  clearAppointmentDetails();

};


// ==========================================
// DELETE
// ==========================================

window.deleteAppointment =
async function (index) {

  const appointment =
    appointments[index];


  if (!appointment)
    return;


  const confirmed =
    confirm(
      `Delete the appointment for ${
        appointment.name ||
        "this client"
      }?`
    );


  if (!confirmed)
    return;


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
      "DELETE ERROR:",
      error
    );

    alert(
      "Could not delete appointment.\n\n" +
      error.message
    );

    return;
  }


  alert(
    "Appointment deleted."
  );


  selectedAppointment =
    null;


  clearAppointmentDetails();


  await loadAppointments();


  if (selectedDate) {

    showAppointmentsForDate(
      selectedDate
    );

  }

};


// ==========================================
// COMPLETE
// ==========================================

window.completeAppointment =
async function (index) {

  const appointment =
    appointments[index];


  if (!appointment)
    return;


  const confirmed =
    confirm(
      `Mark ${
        appointment.name ||
        "this appointment"
      } as completed?`
    );


  if (!confirmed)
    return;


  const {
    error
  } = await supabaseClient
    .from("appointments")
    .update({

      status: "past",

      completed_date:
        new Date().toLocaleDateString()

    })
    .eq(
      "id",
      appointment.id
    );


  if (error) {

    console.error(
      "COMPLETE ERROR:",
      error
    );

    alert(
      "Could not complete appointment.\n\n" +
      error.message
    );

    return;
  }


  alert(
    "Appointment marked as completed."
  );


  selectedAppointment =
    null;


  clearAppointmentDetails();


  await loadAppointments();


  if (selectedDate) {

    showAppointmentsForDate(
      selectedDate
    );

  }

};


// ==========================================
// CLEAR DETAILS
// ==========================================

function clearAppointmentDetails() {

  const details =
    document.getElementById(
      "appointmentDetails"
    );


  if (!details)
    return;


  details.innerHTML =
    `<p class="no-selection">
      Select an appointment.
    </p>`;

}


// ==========================================
// MONTH BUTTONS
// ==========================================

document.addEventListener(
  "DOMContentLoaded",
  function () {

    const previousButton =
      document.getElementById(
        "prevMonth"
      );

    const nextButton =
      document.getElementById(
        "nextMonth"
      );


    if (previousButton) {

      previousButton.addEventListener(
        "click",
        function () {

          currentDate.setMonth(
            currentDate.getMonth() - 1
          );

          renderCalendar();

        }
      );

    }


    if (nextButton) {

      nextButton.addEventListener(
        "click",
        function () {

          currentDate.setMonth(
            currentDate.getMonth() + 1
          );

          renderCalendar();

        }
      );

    }

  }
);


// ==========================================
// ESCAPE HTML
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


// ==========================================
// ESCAPE ATTRIBUTE
// ==========================================

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


  if (!allowed)
    return;


  await loadAppointments();

}


start();
```
