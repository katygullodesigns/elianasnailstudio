// ==========================================
// SUPABASE CONNECTION
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
// LOAD PAGE
// ==========================================

document.addEventListener("DOMContentLoaded", async function () {

  const userEmail = document.getElementById("userEmail");
  const appointmentsContainer =
    document.getElementById("appointments");
  const logoutBtn =
    document.getElementById("logoutBtn");


  // ========================================
  // CHECK LOGIN SESSION
  // ========================================

  const {
    data: sessionData,
    error: sessionError
  } = await supabaseClient.auth.getSession();

  console.log("MY APPOINTMENTS SESSION:", sessionData?.session);
  console.log("MY APPOINTMENTS SESSION ERROR:", sessionError);


  const session = sessionData?.session;
  const user = session?.user;


  // ========================================
  // NOT LOGGED IN
  // ========================================

  if (sessionError || !user) {

    alert("Please log in to view your appointments.");

    window.location.href = "login.html";

    return;
  }


  // ========================================
  // DISPLAY EMAIL
  // ========================================

  if (userEmail) {
    userEmail.textContent =
      user.email || "";
  }


  // ========================================
  // LOAD USER'S APPOINTMENTS
  // ========================================

  if (appointmentsContainer) {

    appointmentsContainer.innerHTML =
      "<p>Loading appointments...</p>";
  }


  const {
    data: appointments,
    error: appointmentsError
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


  // ========================================
  // DATABASE ERROR
  // ========================================

  if (appointmentsError) {

    console.error(
      "APPOINTMENTS LOAD ERROR:",
      appointmentsError
    );

    if (appointmentsContainer) {

      appointmentsContainer.innerHTML =
        "<p>Unable to load your appointments. Please try again.</p>";
    }

    return;
  }


  // ========================================
  // NO APPOINTMENTS
  // ========================================

  if (!appointments || appointments.length === 0) {

    if (appointmentsContainer) {

      appointmentsContainer.innerHTML =
        "<p>You don't have any appointments scheduled.</p>";
    }

    return;
  }


  // ========================================
  // DISPLAY APPOINTMENTS
  // ========================================

  appointmentsContainer.innerHTML = "";


  appointments.forEach(function (appointment) {

    const appointmentCard =
      document.createElement("div");

    appointmentCard.className =
      "appointment-card";


    // --------------------------------------
    // DATE
    // --------------------------------------

    let formattedDate =
      appointment.date || "";


    if (appointment.date) {

      const dateObject =
        new Date(
          appointment.date + "T00:00:00"
        );

      if (!isNaN(dateObject)) {

        formattedDate =
          dateObject.toLocaleDateString(
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


    // --------------------------------------
    // APPOINTMENT DETAILS
    // --------------------------------------

    appointmentCard.innerHTML = `

      <h3>${appointment.service || "Appointment"}</h3>

      <p>
        <strong>Date:</strong>
        ${formattedDate}
      </p>

      <p>
        <strong>Time:</strong>
        ${appointment.time || ""}
      </p>

      <p>
        <strong>Service:</strong>
        ${appointment.service || ""}
      </p>

      ${
        appointment.polish
          ? `
            <p>
              <strong>Polish:</strong>
              ${appointment.polish}
            </p>
          `
          : ""
      }

      ${
        appointment.design
          ? `
            <p>
              <strong>Design:</strong>
              ${appointment.design}
            </p>
          `
          : ""
      }

      ${
        appointment.duration
          ? `
            <p>
              <strong>Duration:</strong>
              ${appointment.duration} hour(s)
            </p>
          `
          : ""
      }

      <p>
        <strong>Status:</strong>
        ${appointment.status || "Active"}
      </p>

    `;


    appointmentsContainer.appendChild(
      appointmentCard
    );
  });


  // ========================================
  // LOGOUT
  // ========================================

  if (logoutBtn) {

    logoutBtn.addEventListener(
      "click",
      async function () {

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
    );
  }

});
