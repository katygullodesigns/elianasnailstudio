const SUPABASE_URL =
  "https://kyonstvpolakjhrecqcj.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJrdW9uc3R2cG9sYWtqaHJlY3FjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTYxMjUsImV4cCI6MjA5NzI3MjEyNX0.oq6v7gEy8FJPh4NI3ngUYybwJcHF6rW6qkNtepCxr7Y";;

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


// ==========================================
// OWNER EMAIL
// ==========================================

const OWNER_EMAIL = "enavejas005@gmail.com";


// ==========================================
// VARIABLES
// ==========================================

let appointments = [];

let currentDate = new Date();

let selectedDate = null;


// ==========================================
// START
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

  console.log("Appointments page loaded.");

  checkOwnerLogin();

});


// ==========================================
// CHECK OWNER LOGIN
// ==========================================

async function checkOwnerLogin() {

  try {

    const {
      data,
      error
    } = await supabaseClient.auth.getSession();


    if (error) {

      console.error(
        "Session error:",
        error
      );

      window.location.href =
        "login.html";

      return;
    }


    const session =
      data.session;


    if (!session) {

      console.log(
        "No active session."
      );

      window.location.href =
        "login.html";

      return;
    }


    const email =
      session.user.email
        .trim()
        .toLowerCase();


    console.log(
      "Logged in as:",
      email
    );


    // MAKE SURE THIS IS THE OWNER

    if (
      email !==
      OWNER_EMAIL.toLowerCase()
    ) {

      console.log(
        "This is not the owner account."
      );

      window.location.href =
        "myappointments.html";

      return;
    }


    console.log(
      "Owner login confirmed."
    );


    await loadAppointments();

  }

  catch (error) {

    console.error(
      "Owner login check failed:",
      error
    );

    window.location.href =
      "login.html";

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
    .neq("status", "past")
    .order("date", {
      ascending: true
    });


  if (error) {

    console.error(
      "Supabase appointment error:",
      error
    );

    const counter =
      document.getElementById(
        "appointmentCounter"
      );

    if (counter) {

      counter.textContent =
        "Unable to load appointments";

    }

    return;
  }


  appointments =
    data || [];


  console.log(
    "Appointments loaded:",
    appointments
  );


  const counter =
    document.getElementById(
      "appointmentCounter"
    );


  if (counter) {

    counter.textContent =
      `Total Appointments: ${appointments.length}`;

  }


  renderCalendar();

}


// ==========================================
// RENDER CALENDAR
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


  if (!calendarGrid) {

    console.error(
      "calendarGrid element not found."
    );

    return;
  }


  if (!monthYear) {

    console.error(
      "monthYear element not found."
    );

    return;
  }


  calendarGrid.innerHTML = "";


  const year =
    currentDate.getFullYear();

  const month =
    currentDate.getMonth();


  monthYear.textContent =
    new Date(
      year,
      month,
      1
    ).toLocaleDateString(
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


  // EMPTY DAYS BEFORE MONTH STARTS

  for (
    let i = 0;
    i < firstDay;
    i++
  ) {

    const emptyDay =
      document.createElement(
        "div"
      );

    emptyDay.className =
      "calendar-day empty";

    calendarGrid.appendChild(
      emptyDay
    );

  }


  // ACTUAL DAYS

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {

    const cell =
      document.createElement(
        "div"
      );


    cell.className =
      "calendar-day";


    cell.textContent =
      day;


    const dateString =
      `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;


    // FIND APPOINTMENTS ON THIS DATE

    const dayAppointments =
      appointments.filter(
        function (appointment) {

          return (
            appointment.date ===
            dateString
          );

        }
      );


    // MARK DAYS THAT HAVE APPOINTMENTS

    if (
      dayAppointments.length > 0
    ) {

      cell.classList.add(
        "has-appointments"
      );

    }


    // CLICK DATE

    cell.addEventListener(
      "click",
      function () {

        document
          .querySelectorAll(
            ".calendar-day"
          )
          .forEach(
            function (dayCell) {

              dayCell.classList.remove(
                "selected"
              );

            }
          );


        cell.classList.add(
          "selected"
        );


        selectedDate =
          dateString;


        showAppointmentsForDate(
          dateString
        );

      }
    );


    calendarGrid.appendChild(
      cell
    );

  }


  console.log(
    "Calendar rendered:",
    monthYear.textContent
  );

}


// ==========================================
// SHOW APPOINTMENTS FOR DATE
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
      dateString + "T12:00:00"
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


  container.innerHTML = "";


  if (
    dateAppointments.length ===
    0
  ) {

    container.innerHTML =
      "<p class='no-selection'>No appointments on this day.</p>";

    return;
  }


  dateAppointments.forEach(
    function (appointment) {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "appointment-card";


      card.innerHTML = `

        <div class="appointment-summary">

          <h3>
            ${escapeHtml(
              appointment.name ||
              "Customer"
            )}
          </h3>

          <p>
            ${escapeHtml(
              appointment.time ||
              ""
            )}
          </p>

        </div>

      `;


      card.addEventListener(
        "click",
        function () {

          showAppointmentDetails(
            appointment
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
// SHOW APPOINTMENT DETAILS
// ==========================================

function showAppointmentDetails(
  appointment
) {

  const details =
    document.getElementById(
      "appointmentDetails"
    );


  if (!details) {
    return;
  }


  details.innerHTML = `

    <h3>
      ${escapeHtml(
        appointment.name ||
        "Customer"
      )}
    </h3>

    <p>
      <strong>Phone:</strong>
      ${escapeHtml(
        appointment.phone ||
        "N/A"
      )}
    </p>

    <p>
      <strong>Date:</strong>
      ${escapeHtml(
        appointment.date ||
        "N/A"
      )}
    </p>

    <p>
      <strong>Time:</strong>
      ${escapeHtml(
        appointment.time ||
        "N/A"
      )}
    </p>

    <p>
      <strong>Service:</strong>
      ${escapeHtml(
        appointment.service ||
        "N/A"
      )}
    </p>

    <p>
      <strong>Polish:</strong>
      ${escapeHtml(
        appointment.polish ||
        "N/A"
      )}
    </p>

    <p>
      <strong>Design:</strong>
      ${escapeHtml(
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
      ${escapeHtml(
        appointment.notes ||
        "No notes yet."
      )}
    </p>


    <div class="button-group">

      <button
        onclick="editAppointment('${appointment.id}')"
      >
        Edit
      </button>

      <button
        onclick="deleteAppointment('${appointment.id}')"
      >
        Delete
      </button>

      <button
        onclick="completeAppointment('${appointment.id}')"
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
function (id) {

  const appointment =
    appointments.find(
      function (item) {

        return item.id === id;

      }
    );


  if (!appointment) {
    return;
  }


  const details =
    document.getElementById(
      "appointmentDetails"
    );


  if (!details) {
    return;
  }


  details.innerHTML = `

    <h3>
      Edit Appointment
    </h3>


    <input
      type="text"
      id="editName"
      value="${escapeHtml(
        appointment.name || ""
      )}"
      placeholder="Name"
    >


    <input
      type="text"
      id="editPhone"
      value="${escapeHtml(
        appointment.phone || ""
      )}"
      placeholder="Phone"
    >


    <input
      type="text"
      id="editDate"
      value="${escapeHtml(
        appointment.date || ""
      )}"
      placeholder="Date"
    >


    <input
      type="text"
      id="editTime"
      value="${escapeHtml(
        appointment.time || ""
      )}"
      placeholder="Time"
    >


    <input
      type="text"
      id="editService"
      value="${escapeHtml(
        appointment.service || ""
      )}"
      placeholder="Service"
    >


    <input
      type="text"
      id="editPolish"
      value="${escapeHtml(
        appointment.polish || ""
      )}"
      placeholder="Polish"
    >


    <input
      type="text"
      id="editDesign"
      value="${escapeHtml(
        appointment.design || ""
      )}"
      placeholder="Design"
    >


    <textarea
      id="editNotes"
      placeholder="Owner notes"
    >${escapeHtml(
      appointment.notes || ""
    )}</textarea>


    <div class="button-group">

      <button
        onclick="saveAppointment('${appointment.id}')"
      >
        Save
      </button>


      <button
        onclick="cancelEdit('${appointment.id}')"
      >
        Cancel
      </button>

    </div>

  `;

};


// ==========================================
// CANCEL EDIT
// ==========================================

window.cancelEdit =
function (id) {

  const appointment =
    appointments.find(
      function (item) {

        return item.id === id;

      }
    );


  if (appointment) {

    showAppointmentDetails(
      appointment
    );

  }

};


// ==========================================
// SAVE APPOINTMENT
// ==========================================

window.saveAppointment =
async function (id) {

  const name =
    document.getElementById(
      "editName"
    ).value;

  const phone =
    document.getElementById(
      "editPhone"
    ).value;

  const date =
    document.getElementById(
      "editDate"
    ).value;

  const time =
    document.getElementById(
      "editTime"
    ).value;

  const service =
    document.getElementById(
      "editService"
    ).value;

  const polish =
    document.getElementById(
      "editPolish"
    ).value;

  const design =
    document.getElementById(
      "editDesign"
    ).value;

  const notes =
    document.getElementById(
      "editNotes"
    ).value;


  const {
    error
  } =
    await supabaseClient
      .from("appointments")
      .update({

        name,
        phone,
        date,
        time,
        service,
        polish,
        design,
        notes

      })
      .eq(
        "id",
        id
      );


  if (error) {

    console.error(
      "Save error:",
      error
    );

    alert(
      "Could not save appointment: " +
      error.message
    );

    return;
  }


  await loadAppointments();


  // RESELECT DATE

  if (date) {

    selectedDate =
      date;

    showAppointmentsForDate(
      date
    );

  }

};


// ==========================================
// DELETE APPOINTMENT
// ==========================================

window.deleteAppointment =
async function (id) {

  const appointment =
    appointments.find(
      function (item) {

        return item.id === id;

      }
    );


  if (!appointment) {
    return;
  }


  const confirmed =
    confirm(
      `Delete ${appointment.name || "this appointment"}?`
    );


  if (!confirmed) {
    return;
  }


  const {
    error
  } =
    await supabaseClient
      .from("appointments")
      .delete()
      .eq(
        "id",
        id
      );


  if (error) {

    console.error(
      "Delete error:",
      error
    );

    alert(
      "Could not delete appointment: " +
      error.message
    );

    return;
  }


  document.getElementById(
    "appointmentDetails"
  ).innerHTML =
    "<p class='no-selection'>Select an appointment.</p>";


  await loadAppointments();

};


// ==========================================
// COMPLETE APPOINTMENT
// ==========================================

window.completeAppointment =
async function (id) {

  const {
    error
  } =
    await supabaseClient
      .from("appointments")
      .update({

        status: "past",

        completed_date:
          new Date().toLocaleDateString()

      })
      .eq(
        "id",
        id
      );


  if (error) {

    console.error(
      "Complete error:",
      error
    );

    alert(
      "Could not complete appointment: " +
      error.message
    );

    return;
  }


  document.getElementById(
    "appointmentDetails"
  ).innerHTML =
    "<p class='no-selection'>Select an appointment.</p>";


  await loadAppointments();

};


// ==========================================
// MONTH NAVIGATION
// ==========================================

document.addEventListener(
  "DOMContentLoaded",
  function () {

    const prevMonth =
      document.getElementById(
        "prevMonth"
      );

    const nextMonth =
      document.getElementById(
        "nextMonth"
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

  }
);


// ==========================================
// HTML ESCAPE
// ==========================================

function escapeHtml(value) {

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

