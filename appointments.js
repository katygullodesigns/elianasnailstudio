const SUPABASE_URL =
  "https://kyonstvpolakjhrecqcj.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5b25zdHZwb2xha2pocWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTYxMjUsImV4cCI6MjA5NzI3MjEyNX0.oq6v7gEy8FJPh4NI3ngUYybwJcHF6rW6qkNtepCxr7Y";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

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

  const {
    data,
    error
  } = await supabaseClient.auth.getSession();

  console.log("Current session:", data.session);

  if (error) {

    console.error("Session error:", error);

    return;

  }

  if (!data.session) {

    console.log("No session found.");

    window.location.href = "login.html";

    return;

  }

  console.log(
    "Logged in as:",
    data.session.user.email
  );

  loadAppointments();

}


// ==========================================
// LOAD APPOINTMENTS
// ==========================================

async function loadAppointments() {

  console.log("Loading appointments...");

  const calendarGrid =
    document.getElementById("calendarGrid");

  const appointmentCounter =
    document.getElementById("appointmentCounter");

  if (!calendarGrid) {

    console.error(
      "ERROR: calendarGrid was not found."
    );

    return;

  }


  // Get ALL appointments
  const {
    data,
    error
  } = await supabaseClient
    .from("appointments")
    .select("*")
    .order("date", {
      ascending: true
    });


  if (error) {

    console.error(
      "SUPABASE ERROR:",
      error
    );

    calendarGrid.innerHTML =
      "<p>Could not load appointments.</p>";

    return;

  }


  console.log(
    "ALL APPOINTMENTS FROM SUPABASE:",
    data
  );


  // Keep only current appointments
  appointments = (data || []).filter(
    function (appointment) {

      return appointment.status !== "past";

    }
  );


  console.log(
    "CURRENT APPOINTMENTS:",
    appointments
  );


  if (appointmentCounter) {

    appointmentCounter.textContent =
      `Total Appointments: ${appointments.length}`;

  }


  initializeCalendar();

}


// ==========================================
// CALENDAR
// ==========================================

function initializeCalendar() {

  const prevMonth =
    document.getElementById("prevMonth");

  const nextMonth =
    document.getElementById("nextMonth");


  if (prevMonth) {

    prevMonth.onclick = function () {

      currentDate.setMonth(
        currentDate.getMonth() - 1
      );

      renderCalendar();

    };

  }


  if (nextMonth) {

    nextMonth.onclick = function () {

      currentDate.setMonth(
        currentDate.getMonth() + 1
      );

      renderCalendar();

    };

  }


  renderCalendar();

}


// ==========================================
// RENDER CALENDAR
// ==========================================

function renderCalendar() {

  const calendarGrid =
    document.getElementById("calendarGrid");

  const monthYear =
    document.getElementById("monthYear");


  if (!calendarGrid || !monthYear) {

    console.error(
      "Calendar elements missing."
    );

    return;

  }


  calendarGrid.innerHTML = "";


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


  // Empty spaces

  for (
    let i = 0;
    i < firstDay;
    i++
  ) {

    const empty =
      document.createElement("div");

    empty.className =
      "calendar-day empty";

    calendarGrid.appendChild(empty);

  }


  // Days

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {

    const cell =
      document.createElement("div");

    cell.className =
      "calendar-day";


    const dateString =
      `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;


    cell.textContent = day;


    // Find appointments for this day

    const dayAppointments =
      appointments.filter(
        function (appointment) {

          return String(
            appointment.date
          ) === dateString;

        }
      );


    // Mark day if it has appointments

    if (
      dayAppointments.length > 0
    ) {

      cell.classList.add(
        "has-appointments"
      );

    }


    cell.onclick = function () {

      document
        .querySelectorAll(
          ".calendar-day"
        )
        .forEach(
          function (otherDay) {

            otherDay.classList.remove(
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

    };


    calendarGrid.appendChild(cell);

  }

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
    appointments
      .filter(
        function (appointment) {

          return String(
            appointment.date
          ) === dateString;

        }
      )
      .sort(
        function (a, b) {

          return String(
            a.time || ""
          ).localeCompare(
            String(
              b.time || ""
            )
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
    dateAppointments.length === 0
  ) {

    container.innerHTML =
      "<p class='no-selection'>No appointments on this day.</p>";

    return;

  }


  dateAppointments.forEach(
    function (appointment) {

      const card =
        document.createElement("div");

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


      card.onclick = function () {

        showAppointmentDetails(
          appointment
        );

      };


      container.appendChild(card);

    }
  );

}


// ==========================================
// APPOINTMENT DETAILS
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
// EDIT
// ==========================================

window.editAppointment =
function (id) {

  const appointment =
    appointments.find(
      function (item) {

        return String(item.id) ===
          String(id);

      }
    );


  if (!appointment) {

    return;

  }


  const details =
    document.getElementById(
      "appointmentDetails"
    );


  details.innerHTML = `

    <h3>Edit Appointment</h3>

    <input
      id="editName"
      type="text"
      value="${escapeHtml(
        appointment.name || ""
      )}"
      placeholder="Name"
    >

    <input
      id="editPhone"
      type="text"
      value="${escapeHtml(
        appointment.phone || ""
      )}"
      placeholder="Phone"
    >

    <input
      id="editDate"
      type="text"
      value="${escapeHtml(
        appointment.date || ""
      )}"
      placeholder="Date"
    >

    <input
      id="editTime"
      type="text"
      value="${escapeHtml(
        appointment.time || ""
      )}"
      placeholder="Time"
    >

    <input
      id="editService"
      type="text"
      value="${escapeHtml(
        appointment.service || ""
      )}"
      placeholder="Service"
    >

    <input
      id="editPolish"
      type="text"
      value="${escapeHtml(
        appointment.polish || ""
      )}"
      placeholder="Polish"
    >

    <input
      id="editDesign"
      type="text"
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
        onclick="showAppointmentDetails(
          appointments.find(
            a => String(a.id) === String('${appointment.id}')
          )
        )"
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
async function (id) {

  const {
    error
  } = await supabaseClient
    .from("appointments")
    .update({

      name:
        document.getElementById(
          "editName"
        ).value,

      phone:
        document.getElementById(
          "editPhone"
        ).value,

      date:
        document.getElementById(
          "editDate"
        ).value,

      time:
        document.getElementById(
          "editTime"
        ).value,

      service:
        document.getElementById(
          "editService"
        ).value,

      polish:
        document.getElementById(
          "editPolish"
        ).value,

      design:
        document.getElementById(
          "editDesign"
        ).value,

      notes:
        document.getElementById(
          "editNotes"
        ).value

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

    alert(error.message);

    return;

  }


  await loadAppointments();

};


// ==========================================
// DELETE
// ==========================================

window.deleteAppointment =
async function (id) {

  if (
    !confirm(
      "Delete this appointment?"
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
      id
    );


  if (error) {

    console.error(
      "Delete error:",
      error
    );

    alert(error.message);

    return;

  }


  document.getElementById(
    "appointmentDetails"
  ).innerHTML =
    "<p class='no-selection'>Select an appointment.</p>";


  await loadAppointments();

};


// ==========================================
// COMPLETE
// ==========================================

window.completeAppointment =
async function (id) {

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
      id
    );


  if (error) {

    console.error(
      "Complete error:",
      error
    );

    alert(error.message);

    return;

  }


  document.getElementById(
    "appointmentDetails"
  ).innerHTML =
    "<p class='no-selection'>Select an appointment.</p>";


  await loadAppointments();

};


// ==========================================
// ESCAPE HTML
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
