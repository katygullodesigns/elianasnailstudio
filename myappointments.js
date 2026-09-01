const SUPABASE_URL = "https://kyonstvpolakjhrecqcj.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJrdW9uc3R2cG9sYWtqaHJlY3FjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTYxMjUsImV4cCI6MjA5NzI3MjEyNX0.oq6v7gEy8FJPh4NI3ngUYybwJcHF6rW6qkNtepCxr7Y";

const supabaseClient = supabase.createClient(
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
  } = await supabaseClient.auth.getUser();


  // Not logged in
  if (error || !user) {

    window.location.href = "login.html";

    return;
  }


  // Show email
  userEmail.textContent =
    `Logged in as ${user.email}`;


  // Get ONLY this customer's appointments
  const {
    data: appointments,
    error: appointmentsError
  } = await supabaseClient
    .from("appointments")
    .select("*")
    .eq("user_id", user.id)
    .order("appointment_date", {
      ascending: true
    });


  if (appointmentsError) {

    console.error(appointmentsError);

    appointmentsContainer.innerHTML =
      "<p>Unable to load your appointments.</p>";

    return;
  }


  // No appointments
  if (!appointments || appointments.length === 0) {

    appointmentsContainer.innerHTML =
      "<p>You don't have any appointments scheduled.</p>";

    return;
  }


  // Display appointments
  appointmentsContainer.innerHTML = "";


  appointments.forEach(function (appointment) {

    const div =
      document.createElement("div");

    div.className = "appointment";


    div.innerHTML = `
      <h3>
        ${appointment.service || "Appointment"}
      </h3>

      <p>
        <strong>Date:</strong>
        ${appointment.appointment_date || ""}
      </p>

      <p>
        <strong>Time:</strong>
        ${appointment.appointment_time || ""}
      </p>
    `;


    appointmentsContainer.appendChild(div);

  });

}


// ==========================================
// LOGOUT
// ==========================================

document.getElementById("logoutBtn")
  .addEventListener("click", async function () {

    const { error } =
      await supabaseClient.auth.signOut();

    if (error) {

      console.error(error);

      return;
    }

    window.location.href = "login.html";

  });


// ==========================================
// START
// ==========================================

loadAppointments();
