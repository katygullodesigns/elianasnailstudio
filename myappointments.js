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
// LOAD CUSTOMER APPOINTMENTS
// ==========================================

async function loadAppointments() {

  const appointmentsContainer =
    document.getElementById("appointments");

  const userEmail =
    document.getElementById("userEmail");


  // Get logged-in customer
  const {
    data: { user },
    error
  } =
    await supabaseClient.auth.getUser();


  // Not logged in
  if (error || !user) {

    window.location.href =
      "login.html";

    return;
  }


  // Show email
  userEmail.textContent =
    `Logged in as ${user.email}`;


  // Get customer's appointments
  const {
    data: appointments,
    error: appointmentsError
  } =
    await supabaseClient
      .from("appointments")
      .select("*")
      .eq("user_id", user.id)
      .order("date", {
        ascending: true
      });


  if (appointmentsError) {

    console.error(
      "Appointment error:",
      appointmentsError
    );

    appointmentsContainer.innerHTML =
      "<p>Unable to load your appointments.</p>";

    return;
  }


  // No appointments
  if (
    !appointments ||
    appointments.length === 0
  ) {

    appointmentsContainer.innerHTML =
      "<p>You don't have any appointments scheduled.</p>";

    return;
  }


  // Display appointments
  appointmentsContainer.innerHTML = "";


  appointments.forEach(
    function (appointment) {

      const div =
        document.createElement("div");

      div.className =
        "appointment";


      div.innerHTML = `

        <h3>
          ${escapeHtml(
            appointment.service ||
            "Appointment"
          )}
        </h3>

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

      `;


      appointmentsContainer.appendChild(
        div
      );

    }
  );

}


// ==========================================
// LOGOUT
// ==========================================

const logoutBtn =
  document.getElementById(
    "logoutBtn"
  );


if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    async function () {

      logoutBtn.disabled = true;

      logoutBtn.textContent =
        "Logging out...";


      const {
        error
      } =
        await supabaseClient.auth.signOut();


      if (error) {

        console.error(
          "Logout error:",
          error
        );

        alert(
          "Could not log out: " +
          error.message
        );

        logoutBtn.disabled = false;

        logoutBtn.textContent =
          "Logout";

        return;
      }


      // Successfully logged out
      window.location.href =
        "login.html";

    }
  );

}


// ==========================================
// HTML ESCAPE
// ==========================================

function escapeHtml(value) {

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


// ==========================================
// START
// ==========================================

loadAppointments();
