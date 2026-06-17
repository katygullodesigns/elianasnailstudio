const SUPABASE_URL = "https://kyonstvpolakjhrecqcj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5b25zdHZwb2xha2pocmVjcWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTYxMjUsImV4cCI6MjA5NzI3MjEyNX0.oq6v7gEy8FJPh4NI3ngUYybwJcHF6rW6qkNtepCxr7Y";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const pastAppointmentsList = document.getElementById("pastAppointmentsList");
const logoutBtn = document.getElementById("logoutBtn");

let pastAppointments = [];

checkLogin();

async function checkLogin() {
  const { data } = await supabaseClient.auth.getSession();

  if (!data.session) {
    window.location.href = "login.html";
    return;
  }

  loadPastAppointments();
}

async function loadPastAppointments() {
  const { data, error } = await supabaseClient
    .from("appointments")
    .select("*")
    .eq("status", "past");

  if (error) {
    console.error("Load past appointments error:", error);
    pastAppointmentsList.innerHTML = "<p>Could not load completed appointments.</p>";
    return;
  }

  pastAppointments = data || [];

  pastAppointmentsList.innerHTML = "";

  if (pastAppointments.length === 0) {
    pastAppointmentsList.innerHTML = "<p>No completed appointments.</p>";
    return;
  }

  pastAppointments.forEach(function (appointment, index) {
    const card = document.createElement("div");
    card.classList.add("appointment-card");

    card.innerHTML = `
      <div class="appointment-summary" onclick="togglePastDetails(${index})">
        <h3>${appointment.name || ""}</h3>
        <p>${appointment.date || ""} at ${appointment.time || ""}</p>
      </div>

      <div id="past-details-${index}" class="appointment-details" style="display:none;">
        <p><strong>Date:</strong> ${appointment.date || ""}</p>
        <p><strong>Time:</strong> ${appointment.time || ""}</p>
        <p><strong>Phone:</strong> ${appointment.phone || ""}</p>
        <p><strong>Service:</strong> ${appointment.service || "N/A"}</p>
        <p><strong>Polish:</strong> ${appointment.polish || "N/A"}</p>
        <p><strong>Design:</strong> ${appointment.design || "N/A"}</p>
        <p><strong>Notes:</strong> ${appointment.notes || "No notes."}</p>
        <p><strong>Completed:</strong> ${appointment.completed_date || ""}</p>

        <div class="button-group">
          <button onclick="deletePastAppointment(${index})">Delete</button>
        </div>
      </div>
    `;

    pastAppointmentsList.appendChild(card);
  });
}

window.togglePastDetails = function (index) {
  const details = document.getElementById(`past-details-${index}`);
  details.style.display = details.style.display === "none" ? "block" : "none";
};

window.deletePastAppointment = async function (index) {
  const appointment = pastAppointments[index];

  const { error } = await supabaseClient
    .from("appointments")
    .delete()
    .eq("id", appointment.id);

  if (error) {
    console.error("Delete past appointment error:", error);
    alert(error.message);
    return;
  }

  loadPastAppointments();
};

if (logoutBtn) {
  logoutBtn.addEventListener("click", async function () {
    await supabaseClient.auth.signOut();
    window.location.href = "login.html";
  });
}