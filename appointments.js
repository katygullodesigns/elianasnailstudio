const SUPABASE_URL =
  "https://kyonstvpolakjhrecqcj.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5b25zdHZwb2xha2pocmVjcWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTYxMjUsImV4cCI6MjA5NzI3MjEyNX0.oq6v7gEy8FJPh4NI3ngUYybwJcHF6rW6qkNtepCxr7Y";

const supabaseClient =
  supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );


// ==========================================
// OWNER
// ==========================================

const OWNER_EMAIL =
  "enavejas005@gmail.com";

let appointments = [];

let currentDate =
  new Date();

let selectedDate = null;


// ==========================================
// START
// ==========================================

document.addEventListener(
  "DOMContentLoaded",
  function () {

    console.log(
      "Owner appointment page loaded."
    );

    checkOwnerLogin();

  }
);


// ==========================================
// CHECK OWNER LOGIN
// ==========================================

async function checkOwnerLogin() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.getSession();


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
        "No active login session."
      );

      window.location.href =
        "login.html";

      return;
    }


    const email =
      session.user.email;


    console.log(
      "Logged in user:",
      email
    );


    // Make sure this is the owner

    if (
      !email ||
      email.toLowerCase() !==
        OWNER_EMAIL.toLowerCase()
    ) {

      console.log(
        "This account is not the owner."
      );

      window.location.href =
        "myappointments.html";

      return;
    }


    console.log(
      "Owner verified."
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

  const calendarGrid =
    document.getElementById(
      "calendarGrid"
    );

  const appointmentCounter =
    document.getElementById(
      "appointmentCounter"
    );


  if (!calendarGrid) {

    console.error(
      "calendarGrid element not found."
    );

    return;
  }


  calendarGrid.innerHTML =
    "<p>Loading appointments...</p>";


  console.log(
    "Loading appointments from Supabase..."
  );


  const {
    data,
    error
  } =
    await supabaseClient
      .from("appointments")
      .select("*")
      .order("date", {
        ascending: true
      });


  // ========================================
  // DATABASE ERROR
  // ========================================

  if (error) {

    console.error(
      "SUPABASE APPOINTMENT ERROR:",
      error
    );

    console.error(
      "Error message:",
      error.message
    );

    console.error(
      "Error details:",
      error.details
    );

    console.error(
      "Error hint:",
      error.hint
    );


    calendarGrid.innerHTML = `
      <p>
        Could not load appointments.
      </p>

      <p style="font-size:12px;">
        ${escapeHtml(
          error.message || "Unknown error"
        )}
      </p>
    `;

    return;
  }


  // ========================================
  // SUCCESS
  // ========================================

  appointments =
    data || [];


  console.log(
    "Appointments successfully loaded:",
    appointments
  );


  // Only count current appointments

  const currentAppointments =
    appointments.filter(
      function (appointment) {

        return (
          appointment.status !==
          "past"
        );

      }
    );


  if (appointmentCounter) {

    appointmentCounter.textContent =
      `Total Appointments: ${currentAppointments.length}`;

  }


  // Calendar only shows current appointments

  appointments =
    currentAppointments;


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


  if (
    !calendarGrid ||
    !monthYear
  ) {

    console.error(
      "Calendar elements are missing."
    );

    return;
  }


  calendarGrid.innerHTML =
    "";


  const year =
    currentDate.getFullYear();

  const month =
    currentDate.getMonth();


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


  // ========================================
  // EMPTY DAYS
  // ========================================

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


  // ========================================
  // ACTUAL DAYS
  // ========================================

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


    const dateString =
      `${year}-${String(
        month + 1
      ).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;


    cell.textContent =
      day;


    // Find appointments on this date

    const dayAppointments =
      appointments.filter(
        function (appointment) {

          return (
            appointment.date ===
            dateString
          );

        }
      );


    // Mark days that have appointments

    if (
      dayAppointments.length >
      0
    ) {

      cell.classList.add(
        "has-appointments"
      );

    }


    // Click date

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

}


// ==========================================
// PREVIOUS / NEXT MONTH
// ==========================================

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


  if (
    !title ||
    !container
  ) {

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
      dateString +
      "T12:00:00"
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
      `
      <p class="no-selection">
        No appointments on this day.
      </p>
      `;

    return;
  }


  // Sort by time

  dateAppointments.sort(
    function (a, b) {

      return (
        timeToMinutes(a.time) -
        timeToMinutes(b.time)
      );

    }
  );


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
        ""
      )}
    </p>

    <p>
      <strong>Date:</strong>
      ${escapeHtml(
        appointment.date ||
        ""
      )}
    </p>

    <p>
      <strong>Time:</strong>
      ${escapeHtml(
        appointment.time ||
        ""
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
      ${escapeHtml(
        appointment.duration ||
        "N/A"
      )}
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
        type="button"
        onclick="editAppointment('${appointment.id}')"
      >
        Edit
      </button>


      <button
        type="button"
        onclick="deleteAppointment('${appointment.id}')"
      >
        Delete
      </button>


      <button
        type="button"
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

    alert(
      "Appointment not found."
    );

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
        type="button"
        onclick="saveAppointment('${appointment.id}')"
      >
        Save
      </button>


      <button
        type="button"
        onclick="showAppointmentDetails(
          appointments.find(
            a => a.id === '${appointment.id}'
          )
        )"
      >
        Cancel
      </button>

    </div>

  `;

};


// ==========================================
// SAVE APPOINTMENT
// ==========================================

window.saveAppointment =
async function (id) {

  const appointment =
    appointments.find(
      function (item) {

        return item.id === id;

      }
    );


  if (!appointment) {

    alert(
      "Appointment not found."
    );

    return;
  }


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
  } =
    await supabaseClient
      .from("appointments")
      .update(
        updatedAppointment
      )
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
      "Could not save appointment:\n\n" +
      error.message
    );

    return;
  }


  await loadAppointments();


  if (selectedDate) {

    showAppointmentsForDate(
      selectedDate
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
      `Delete the appointment for ${
        appointment.name ||
        "this customer"
      }?`
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
      "Could not delete appointment:\n\n" +
      error.message
    );

    return;
  }


  const details =
    document.getElementById(
      "appointmentDetails"
    );


  if (details) {

    details.innerHTML =
      `
      <p class="no-selection">
        Select an appointment.
      </p>
      `;

  }


  await loadAppointments();


  if (selectedDate) {

    showAppointmentsForDate(
      selectedDate
    );

  }

};


// ==========================================
// COMPLETE APPOINTMENT
// ==========================================

window.completeAppointment =
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
      `Mark ${appointment.name || "this appointment"} as completed?`
    );


  if (!confirmed) {

    return;
  }


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
      "Could not complete appointment:\n\n" +
      error.message
    );

    return;
  }


  const details =
    document.getElementById(
      "appointmentDetails"
    );


  if (details) {

    details.innerHTML =
      `
      <p class="no-selection">
        Select an appointment.
      </p>
      `;

  }


  await loadAppointments();

};


// ==========================================
// TIME CONVERSION
// ==========================================

function timeToMinutes(
  time
) {

  if (!time) {

    return 0;
  }


  const match =
    time.match(
      /(\d+):(\d+)\s*(AM|PM)/i
    );


  if (!match) {

    return 0;
  }


  let hour =
    Number(
      match[1]
    );


  const minute =
    Number(
      match[2]
    );


  const ampm =
    match[3].toUpperCase();


  if (
    ampm === "PM" &&
    hour !== 12
  ) {

    hour += 12;

  }


  if (
    ampm === "AM" &&
    hour === 12
  ) {

    hour = 0;

  }


  return (
    hour * 60 +
    minute
  );

}


// ==========================================
// HTML ESCAPE
// ==========================================

function escapeHtml(
  value
) {

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
