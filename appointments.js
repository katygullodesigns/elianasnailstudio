const SUPABASE_URL =
  "https://kyonstvpolakjhrecqcj.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmU iLCAicmVmIjoia3lvbnN0dnBvbGFramh ycmVjcWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTYxMjUsImV4cCI6MjA5NzI3MjEyNX0.oq6v7gEy8FJPh4NI3ngUYybwJcHF6rW6qkNtepCxr7Y"
    .replace(/\s/g, "");

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const OWNER_EMAIL = "enavejas005@gmail.com";

let appointments = [];
let currentDate = new Date();
let selectedDate = null;


// ==========================================
// START
// ==========================================

document.addEventListener("DOMContentLoaded", function () {
  checkOwnerLogin();
});


// ==========================================
// CHECK OWNER LOGIN
// ==========================================

async function checkOwnerLogin() {

  const {
    data: { session },
    error
  } = await supabaseClient.auth.getSession();

  if (error || !session) {
    window.location.href = "login.html";
    return;
  }

  // Make sure this is actually the owner
  if (
    !session.user.email ||
    session.user.email.toLowerCase() !==
      OWNER_EMAIL.toLowerCase()
  ) {
    window.location.href = "myappointments.html";
    return;
  }

  console.log("Owner logged in:", session.user.email);

  loadAppointments();
}


// ==========================================
// LOAD ALL CURRENT APPOINTMENTS
// ==========================================

async function loadAppointments() {

  const calendarGrid =
    document.getElementById("calendarGrid");

  const appointmentCounter =
    document.getElementById("appointmentCounter");

  if (!calendarGrid) {
    console.error("calendarGrid not found.");
    return;
  }

  const {
    data,
    error
  } = await supabaseClient
    .from("appointments")
    .select("*")
    .or("status.is.null,status.neq.past")
    .order("date", {
      ascending: true
    });

  if (error) {

    console.error(
      "Could not load appointments:",
      error
    );

    calendarGrid.innerHTML =
      "<p>Could not load appointments.</p>";

    return;
  }

  appointments = data || [];

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


    const dayAppointments =
      appointments.filter(
        function (appointment) {

          return (
            appointment.date ===
            dateString
          );

        }
      );


    if (dayAppointments.length > 0) {

      cell.classList.add(
        "has-appointments"
      );

    }


    cell.onclick = function () {

      document
        .querySelectorAll(".calendar-day")
        .forEach(function (dayCell) {

          dayCell.classList.remove(
            "selected"
          );

        });

      cell.classList.add("selected");

      selectedDate = dateString;

      showAppointmentsForDate(
        dateString
      );
    };


    calendarGrid.appendChild(cell);
  }
}


// ==========================================
// SHOW DAY'S APPOINTMENTS
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


  if (dateAppointments.length === 0) {

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
              appointment.name || "Customer"
            )}
          </h3>

          <p>
            ${escapeHtml(
              appointment.time || ""
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
        appointment.name || "Customer"
      )}
    </h3>

    <p>
      <strong>Phone:</strong>
      ${escapeHtml(
        appointment.phone || ""
      )}
    </p>

    <p>
      <strong>Date:</strong>
      ${escapeHtml(
        appointment.date || ""
      )}
    </p>

    <p>
      <strong>Time:</strong>
      ${escapeHtml(
        appointment.time || ""
      )}
    </p>

    <p>
      <strong>Service:</strong>
      ${escapeHtml(
        appointment.service || "N/A"
      )}
    </p>

    <p>
      <strong>Polish:</strong>
      ${escapeHtml(
        appointment.polish || "N/A"
      )}
    </p>

    <p>
      <strong>Design:</strong>
      ${escapeHtml(
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

  details.innerHTML = `

    <h3>Edit Appointment</h3>

    <input
      id="editName"
      value="${escapeHtml(
        appointment.name || ""
      )}"
      placeholder="Name"
    >

    <input
      id="editPhone"
      value="${escapeHtml(
        appointment.phone || ""
      )}"
      placeholder="Phone"
    >

    <input
      id="editDate"
      value="${escapeHtml(
        appointment.date || ""
      )}"
      placeholder="Date"
    >

    <input
      id="editTime"
      value="${escapeHtml(
        appointment.time || ""
      )}"
      placeholder="Time"
    >

    <input
      id="editService"
      value="${escapeHtml(
        appointment.service || ""
      )}"
      placeholder="Service"
    >

    <input
      id="editPolish"
      value="${escapeHtml(
        appointment.polish || ""
      )}"
      placeholder="Polish"
    >

    <input
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
        onclick="showAppointmentDetails(
          appointments.find(a => a.id === '${appointment.id}')
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

  const { error } =
    await supabaseClient
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
      .eq("id", id);


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


  const { error } =
    await supabaseClient
      .from("appointments")
      .delete()
      .eq("id", id);


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

  const { error } =
    await supabaseClient
      .from("appointments")
      .update({

        status: "past",

        completed_date:
          new Date().toLocaleDateString()

      })
      .eq("id", id);


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
// HTML ESCAPE
// ==========================================

function escapeHtml(value) {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
