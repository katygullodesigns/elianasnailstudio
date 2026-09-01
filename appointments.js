const SUPABASE_URL = "https://kyonstvpolakjhrecqcj.supabase.co/rest/v1/";

const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5b25zdHZwb2xha2pocmVjcWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTYxMjUsImV4cCI6MjA5NzI3MjEyNX0.oq6v7gEy8FJPh4NI3ngUYybwJcHF6rW6qkNtepCxr7Y"";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const appointmentsList = document.getElementById("appointmentsList");
const appointmentCounter = document.getElementById("appointmentCounter");
const logoutBtn = document.getElementById("logoutBtn");

let appointments = [];

checkLogin();


// ==========================================
// CHECK LOGIN
// ==========================================

async function checkLogin() {

  const { data } =
    await supabaseClient.auth.getSession();

  if (!data.session) {

    window.location.href = "login.html";

    return;
  }

  loadAppointments();
}


// ==========================================
// LOAD APPOINTMENTS
// ==========================================

async function loadAppointments() {

  const { data, error } =
    await supabaseClient
      .from("appointments")
      .select("*")
      .neq("status", "past");


  if (error) {

    console.error(
      "Load appointments error:",
      error
    );

    if (appointmentsList) {
      appointmentsList.innerHTML =
        "<p>Could not load appointments.</p>";
    }

    return;
  }


  appointments = data || [];


  appointments.sort(function (a, b) {

    return new Date(
      `${a.date} ${a.time}`
    ) - new Date(
      `${b.date} ${b.time}`
    );

  });


  if (appointmentCounter) {

    appointmentCounter.textContent =
      `Total Appointments: ${appointments.length}`;

  }


  if (!appointmentsList) {
    return;
  }


  appointmentsList.innerHTML = "";


  if (appointments.length === 0) {

    appointmentsList.innerHTML =
      "<p>No appointments booked yet.</p>";

    return;
  }


  appointments.forEach(function (appointment, index) {

    const card =
      document.createElement("div");

    card.classList.add(
      "appointment-card"
    );


    card.innerHTML = `

      <div
        class="appointment-summary"
        onclick="toggleDetails(${index})"
      >

        <h3>
          ${appointment.name || ""}
        </h3>

        <p>
          ${appointment.date || ""}
          at
          ${appointment.time || ""}
        </p>

      </div>


      <div
        id="details-${index}"
        class="appointment-details"
        style="display:none;"
      >

        <p>
          <strong>Phone:</strong>
          ${appointment.phone || ""}
        </p>

        <p>
          <strong>Service:</strong>
          ${appointment.service || "N/A"}
        </p>

        <p>
          <strong>Polish:</strong>
          ${appointment.polish || "N/A"}
        </p>

        <p>
          <strong>Design:</strong>
          ${appointment.design || "N/A"}
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
          ${appointment.notes || "No notes yet."}
        </p>


        <div class="button-group">

          <button
            onclick="editAppointment(${index})"
          >
            Edit
          </button>

          <button
            onclick="deleteAppointment(${index})"
          >
            Delete
          </button>

          <button
            onclick="completeAppointment(${index})"
          >
            Complete
          </button>

        </div>

      </div>


      <div
        id="edit-${index}"
        class="appointment-edit"
        style="display:none;"
      >

        <input
          type="text"
          id="name-${index}"
          value="${appointment.name || ""}"
        >

        <input
          type="text"
          id="phone-${index}"
          value="${appointment.phone || ""}"
        >

        <input
          type="text"
          id="date-${index}"
          value="${appointment.date || ""}"
        >

        <input
          type="text"
          id="time-${index}"
          value="${appointment.time || ""}"
        >

        <input
          type="text"
          id="service-${index}"
          value="${appointment.service || ""}"
        >

        <input
          type="text"
          id="polish-${index}"
          value="${appointment.polish || ""}"
        >

        <input
          type="text"
          id="design-${index}"
          value="${appointment.design || ""}"
        >

        <textarea
          id="notes-${index}"
          placeholder="Owner notes"
        >${appointment.notes || ""}</textarea>


        <div class="button-group">

          <button
            onclick="saveAppointment(${index})"
          >
            Save
          </button>

          <button
            onclick="cancelEdit(${index})"
          >
            Cancel
          </button>

        </div>

      </div>

    `;


    appointmentsList.appendChild(card);

  });

}


// ==========================================
// TOGGLE DETAILS
// ==========================================

window.toggleDetails = function (index) {

  const details =
    document.getElementById(
      `details-${index}`
    );


  details.style.display =
    details.style.display === "none"
      ? "block"
      : "none";

};


// ==========================================
// EDIT APPOINTMENT
// ==========================================

window.editAppointment = function (index) {

  document.getElementById(
    `details-${index}`
  ).style.display = "none";


  document.getElementById(
    `edit-${index}`
  ).style.display = "block";

};


// ==========================================
// CANCEL EDIT
// ==========================================

window.cancelEdit = function (index) {

  document.getElementById(
    `edit-${index}`
  ).style.display = "none";


  document.getElementById(
    `details-${index}`
  ).style.display = "block";

};


// ==========================================
// SAVE APPOINTMENT
// ==========================================

window.saveAppointment = async function (index) {

  const appointment =
    appointments[index];


  const { error } =
    await supabaseClient
      .from("appointments")
      .update({

        name:
          document.getElementById(
            `name-${index}`
          ).value,

        phone:
          document.getElementById(
            `phone-${index}`
          ).value,

        date:
          document.getElementById(
            `date-${index}`
          ).value,

        time:
          document.getElementById(
            `time-${index}`
          ).value,

        service:
          document.getElementById(
            `service-${index}`
          ).value,

        polish:
          document.getElementById(
            `polish-${index}`
          ).value,

        design:
          document.getElementById(
            `design-${index}`
          ).value,

        notes:
          document.getElementById(
            `notes-${index}`
          ).value

      })

      .eq("id", appointment.id);


  if (error) {

    console.error(
      "Save error:",
      error
    );

    alert(error.message);

    return;
  }


  loadAppointments();

};


// ==========================================
// DELETE APPOINTMENT
// ==========================================

window.deleteAppointment = async function (index) {

  const appointment =
    appointments[index];


  const { error } =
    await supabaseClient
      .from("appointments")
      .delete()
      .eq("id", appointment.id);


  if (error) {

    console.error(
      "Delete error:",
      error
    );

    alert(error.message);

    return;
  }


  loadAppointments();

};


// ==========================================
// COMPLETE APPOINTMENT
// ==========================================

window.completeAppointment = async function (index) {

  const appointment =
    appointments[index];


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
      "Complete error:",
      error
    );

    alert(error.message);

    return;
  }


  loadAppointments();

};


// ==========================================
// LOGOUT
// ==========================================

if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    async function () {

      await supabaseClient.auth.signOut();

      window.location.href =
        "login.html";

    }
  );

}

