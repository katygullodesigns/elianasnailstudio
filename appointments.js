const SUPABASE_URL =
  "https://kyonstvpolakjhrecqcj.supabase.co";

const SUPABASE_ANON_KEY =
  "YOUR_EXACT_SUPABASE_ANON_KEY";

const supabaseClient =
  supabase.createClient(
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
let selectedAppointment = null;
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

  // Only allow the owner's account
  if (user.email.toLowerCase() !== OWNER_EMAIL.toLowerCase()) {

    alert("You do not have permission to access the owner appointment manager.");

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

  const { data, error } = await supabaseClient
    .from("appointments")
    .select("*")
    .neq("status", "past");

  if (error) {

    console.error("Load appointments error:", error);

    alert("Could not load appointments: " + error.message);

    return;
  }

  appointments = data || [];

  // Sort appointments by date and time
  appointments.sort(function (a, b) {

    const dateA = new Date(`${a.date} ${a.time}`);
    const dateB = new Date(`${b.date} ${b.time}`);

    return dateA - dateB;

  });

  updateCounter();

  renderCalendar();

  if (selectedDate) {
    showAppointmentsForDate(selectedDate);
  }

}


// ==========================================
// UPDATE APPOINTMENT COUNTER
// ==========================================

function updateCounter() {

  const counter =
    document.getElementById("appointmentCounter");

  if (!counter) return;

  counter.textContent =
    `Total Appointments: ${appointments.length}`;

}


// ==========================================
// CALENDAR
// ==========================================

function renderCalendar() {

  const calendarGrid =
    document.getElementById("calendarGrid");

  const monthYear =
    document.getElementById("monthYear");

  if (!calendarGrid || !monthYear) return;

  calendarGrid.innerHTML = "";

  const year =
    currentDate.getFullYear();

  const month =
    currentDate.getMonth();

  const monthName =
    currentDate.toLocaleString("default", {
      month: "long"
    });

  monthYear.textContent =
    `${monthName} ${year}`;

  // First day of month
  const firstDay =
    new Date(year, month, 1).getDay();

  // Number of days
  const daysInMonth =
    new Date(year, month + 1, 0).getDate();


  // Empty spaces before first day
  for (let i = 0; i < firstDay; i++) {

    const empty =
      document.createElement("div");

    empty.classList.add("calendar-day", "empty");

    calendarGrid.appendChild(empty);

  }


  // Create days
  for (let day = 1; day <= daysInMonth; day++) {

    const dateString =
      `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const dayElement =
      document.createElement("div");

    dayElement.classList.add("calendar-day");

    dayElement.textContent = day;


    // Check if appointments exist
    const dayAppointments =
      appointments.filter(function (appointment) {

        return appointment.date === dateString;

      });


    if (dayAppointments.length > 0) {

      dayElement.classList.add("has-appointments");

      const count =
        document.createElement("span");

      count.classList.add("appointment-count");

      count.textContent =
        dayAppointments.length;

      dayElement.appendChild(count);

    }


    // Highlight selected date
    if (selectedDate === dateString) {

      dayElement.classList.add("selected");

    }


    dayElement.addEventListener(
      "click",
      function () {

        selectedDate = dateString;

        selectedAppointment = null;

        renderCalendar();

        showAppointmentsForDate(dateString);

        clearAppointmentDetails();

      }
    );


    calendarGrid.appendChild(dayElement);

  }

}


// ==========================================
// SHOW APPOINTMENTS FOR SELECTED DAY
// ==========================================

function showAppointmentsForDate(dateString) {

  const title =
    document.getElementById("selectedDateTitle");

  const container =
    document.getElementById("dailyAppointments");

  if (!title || !container) return;


  const dateAppointments =
    appointments.filter(function (appointment) {

      return appointment.date === dateString;

    });


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


  container.innerHTML = "";


  if (dateAppointments.length === 0) {

    container.innerHTML =
      `<p class="no-selection">No appointments on this day.</p>`;

    return;

  }


  dateAppointments.forEach(function (appointment) {

    const index =
      appointments.indexOf(appointment);

    const card =
      document.createElement("div");

    card.classList.add(
      "appointment-card"
    );


    card.innerHTML = `

      <button
        class="appointment-button"
        type="button"
      >

        <strong>
          ${escapeHTML(appointment.time || "")}
        </strong>

        <br>

        ${escapeHTML(appointment.name || "Unnamed Client")}

        <br>

        <small>
          ${escapeHTML(appointment.service || "Appointment")}
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

        selectedAppointment = appointment;

        showAppointmentDetails(index);

      }
    );


    container.appendChild(card);

  });

}


// ==========================================
// SHOW APPOINTMENT DETAILS
// ==========================================

function showAppointmentDetails(index) {

  const appointment =
    appointments[index];

  if (!appointment) return;


  const details =
    document.getElementById(
      "appointmentDetails"
    );

  if (!details) return;


  selectedAppointment = appointment;


  details.innerHTML = `

    <h3>
      ${escapeHTML(
        appointment.name || "Appointment"
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
      ${appointment.duration || 1} hours
    </p>

    <p>
      <strong>Owner Notes:</strong>
    </p>

    <p class="owner-notes">
      ${escapeHTML(
        appointment.notes || "No notes yet."
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

function clearAppointmentDetails() {

  const details =
    document.getElementById(
      "appointmentDetails"
    );

  if (!details) return;

  details.innerHTML =
    `<p class="no-selection">Select an appointment.</p>`;

}


// ==========================================
// EDIT APPOINTMENT
// ==========================================

window.editAppointment = function (index) {

  const appointment =
    appointments[index];

  if (!appointment) return;


  const details =
    document.getElementById(
      "appointmentDetails"
    );

  if (!details) return;


  details.innerHTML = `

    <h3>Edit Appointment</h3>

    <input
      type="text"
      id="editName"
      value="${escapeAttribute(
        appointment.name || ""
      )}"
      placeholder="Name"
    >

    <input
      type="text"
      id="editPhone"
      value="${escapeAttribute(
        appointment.phone || ""
      )}"
      placeholder="Phone"
    >

    <input
      type="text"
      id="editDate"
      value="${escapeAttribute(
        appointment.date || ""
      )}"
      placeholder="Date"
    >

    <input
      type="text"
      id="editTime"
      value="${escapeAttribute(
        appointment.time || ""
      )}"
      placeholder="Time"
    >

    <input
      type="text"
      id="editService"
      value="${escapeAttribute(
        appointment.service || ""
      )}"
      placeholder="Service"
    >

    <input
      type="text"
      id="editPolish"
      value="${escapeAttribute(
        appointment.polish || ""
      )}"
      placeholder="Polish"
    >

    <input
      type="text"
      id="editDesign"
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
// SAVE APPOINTMENT
// ==========================================

window.saveAppointment = async function (index) {

  const appointment =
    appointments[index];

  if (!appointment) return;


  const updatedData = {

    name:
      document.getElementById("editName").value.trim(),

    phone:
      document.getElementById("editPhone").value.trim(),

    date:
      document.getElementById("editDate").value.trim(),

    time:
      document.getElementById("editTime").value.trim(),

    service:
      document.getElementById("editService").value.trim(),

    polish:
      document.getElementById("editPolish").value.trim(),

    design:
      document.getElementById("editDesign").value.trim(),

    notes:
      document.getElementById("editNotes").value.trim()

  };


  const { error } =
    await supabaseClient
      .from("appointments")
      .update(updatedData)
      .eq("id", appointment.id);


  if (error) {

    console.error(
      "Save appointment error:",
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
    updatedData.date;

  currentDate =
    new Date(
      `${updatedData.date}T12:00:00`
    );


  renderCalendar();

  showAppointmentsForDate(
    updatedData.date
  );

};


// ==========================================
// DELETE APPOINTMENT
// ==========================================

window.deleteAppointment = async function (index) {

  const appointment =
    appointments[index];

  if (!appointment) return;


  const confirmed =
    confirm(
      `Delete the appointment for ${appointment.name || "this client"}?`
    );


  if (!confirmed) return;


  const { error } =
    await supabaseClient
      .from("appointments")
      .delete()
      .eq("id", appointment.id);


  if (error) {

    console.error(
      "Delete appointment error:",
      error
    );

    alert(
      "Could not delete appointment:\n\n" +
      error.message
    );

    return;

  }


  selectedAppointment = null;

  clearAppointmentDetails();

  await loadAppointments();

};


// ==========================================
// COMPLETE APPOINTMENT
// ==========================================

window.completeAppointment = async function (index) {

  const appointment =
    appointments[index];

  if (!appointment) return;


  const confirmed =
    confirm(
      `Mark ${appointment.name || "this appointment"} as completed?`
    );


  if (!confirmed) return;


  const { error } =
    await supabaseClient
      .from("appointments")
      .update({

        status: "past",

        completed_date:
          new Date().toLocaleDateString()

      })
      .eq("id", appointment.id);


  if (error) {

    console.error(
      "Complete appointment error:",
      error
    );

    alert(
      "Could not complete appointment:\n\n" +
      error.message
    );

    return;

  }


  selectedAppointment = null;

  clearAppointmentDetails();

  await loadAppointments();

};


// ==========================================
// MONTH NAVIGATION
// ==========================================

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


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

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

  const allowed =
    await checkOwnerLogin();

  if (!allowed) return;

  await loadAppointments();

}


// Start the owner appointment manager
start();
 
