const SUPABASE_URL = "https://kyonstvpolakjhrecqcj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5b25zdHZwb2xha2pocmVjcWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTYxMjUsImV4cCI6MjA5NzI3MjEyNX0.oq6v7gEy8FJPh4NI3ngUYybwJcHF6rW6qkNtepCxr7Y";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const appointmentCounter = document.getElementById("appointmentCounter");
const logoutBtn = document.getElementById("logoutBtn");

const monthYear = document.getElementById("monthYear");
const calendarGrid = document.getElementById("calendarGrid");
const selectedDateTitle = document.getElementById("selectedDateTitle");
const dailyAppointments = document.getElementById("dailyAppointments");
const appointmentDetails = document.getElementById("appointmentDetails");

const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");

let appointments = [];
let selectedDate = new Date().toISOString().split("T")[0];
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedAppointmentId = null;

checkLogin();

async function checkLogin() {
  const { data } = await supabaseClient.auth.getSession();

  if (!data.session) {
    window.location.href = "login.html";
    return;
  }

  loadAppointments();
}

async function loadAppointments() {
  const { data, error } = await supabaseClient
    .from("appointments")
    .select("*")
    .or("status.is.null,status.neq.past");

  if (error) {
    console.error("Load appointments error:", error);
    dailyAppointments.innerHTML = "<p>Could not load appointments.</p>";
    return;
  }

  appointments = data || [];

  appointments.sort(function (a, b) {
    return new Date(`${a.date} ${convertTimeTo24Hour(a.time)}`) - new Date(`${b.date} ${convertTimeTo24Hour(b.time)}`);
  });

  appointmentCounter.textContent = `Total Appointments: ${appointments.length}`;

  renderCalendar();
  renderDailyAppointments();
  clearDetails();
}

function renderCalendar() {
  calendarGrid.innerHTML = "";

  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const firstDayIndex = firstDay.getDay();
  const numberOfDays = lastDay.getDate();

  monthYear.textContent = firstDay.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  });

  for (let i = 0; i < firstDayIndex; i++) {
    const blank = document.createElement("div");
    blank.classList.add("calendar-day", "blank-day");
    calendarGrid.appendChild(blank);
  }

  for (let day = 1; day <= numberOfDays; day++) {
    const dateString = formatDate(currentYear, currentMonth, day);
    const dayAppointments = getAppointmentsByDate(dateString);

    const dayBox = document.createElement("button");
    dayBox.classList.add("calendar-day");
    dayBox.type = "button";

    if (dateString === selectedDate) {
      dayBox.classList.add("selected-day");
    }

    if (dateString === new Date().toISOString().split("T")[0]) {
      dayBox.classList.add("today-day");
    }

    dayBox.innerHTML = `
      <span>${day}</span>
      ${dayAppointments.length > 0 ? `<small>${dayAppointments.length}</small>` : ""}
    `;

    dayBox.addEventListener("click", function () {
      selectedDate = dateString;
      selectedAppointmentId = null;
      renderCalendar();
      renderDailyAppointments();
      clearDetails();
    });

    calendarGrid.appendChild(dayBox);
  }
}

function renderDailyAppointments() {
  const dayAppointments = getAppointmentsByDate(selectedDate);

  selectedDateTitle.textContent = new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  dailyAppointments.innerHTML = "";

  if (dayAppointments.length === 0) {
    dailyAppointments.innerHTML = `
      <p class="no-selection">
        No appointments for this day.
      </p>
    `;
    return;
  }

  dayAppointments.forEach(function (appointment) {
    const appointmentButton = document.createElement("button");
    appointmentButton.type = "button";
    appointmentButton.classList.add("daily-appointment");

    if (appointment.id === selectedAppointmentId) {
      appointmentButton.classList.add("selected-appointment");
    }

    const additionalText =
      appointment.additional_service && appointment.additional_service !== "No"
        ? ` + ${appointment.additional_service}`
        : "";

    appointmentButton.innerHTML = `
      <div class="daily-time">${appointment.time || ""}</div>
      <div>
        <h4>${appointment.name || "No Name"}</h4>
        <p>${appointment.service || "No service listed"}${additionalText}</p>
      </div>
    `;

    appointmentButton.addEventListener("click", function () {
      selectedAppointmentId = appointment.id;
      renderDailyAppointments();
      renderDetails(appointment);
    });

    dailyAppointments.appendChild(appointmentButton);
  });
}

function renderDetails(appointment) {
  appointmentDetails.innerHTML = `
    <div class="details-view">

      <label>Name</label>
      <input id="detailName" type="text" value="${escapeInput(appointment.name || "")}">

      <label>Phone</label>
      <input id="detailPhone" type="text" value="${escapeInput(appointment.phone || "")}">

      <label>Date</label>
      <input id="detailDate" type="date" value="${appointment.date || ""}">

      <label>Time</label>
      <input id="detailTime" type="text" value="${escapeInput(appointment.time || "")}">

      <label>Service</label>
      <input id="detailService" type="text" value="${escapeInput(appointment.service || "")}">

      <label>Polish</label>
      <input id="detailPolish" type="text" value="${escapeInput(appointment.polish || "")}">

      <label>Design</label>
      <input id="detailDesign" type="text" value="${escapeInput(appointment.design || "")}">

      <label>Additional Service</label>
      <input id="detailAdditionalService" type="text" value="${escapeInput(appointment.additional_service || "No")}">

      <label>Additional Polish</label>
      <input id="detailAdditionalPolish" type="text" value="${escapeInput(appointment.additional_polish || "")}">

      <label>Additional Design</label>
      <input id="detailAdditionalDesign" type="text" value="${escapeInput(appointment.additional_design || "")}">

      <label>Duration</label>
      <input id="detailDuration" type="text" value="${escapeInput(appointment.duration || "1")}">

      <label>Owner Notes</label>
      <textarea id="detailNotes" placeholder="Owner notes">${escapeTextarea(appointment.notes || "")}</textarea>

      <div class="button-group">
        <button onclick="saveSelectedAppointment()">Save</button>
        <button onclick="completeSelectedAppointment()">Complete</button>
        <button onclick="deleteSelectedAppointment()">Delete</button>
      </div>

    </div>
  `;
}

function clearDetails() {
  appointmentDetails.innerHTML = `
    <p class="no-selection">
      Select an appointment.
    </p>
  `;
}

window.saveSelectedAppointment = async function () {
  const appointment = appointments.find(function (item) {
    return item.id === selectedAppointmentId;
  });

  if (!appointment) {
    alert("Please select an appointment first.");
    return;
  }

  const newDate = document.getElementById("detailDate").value;

  const { error } = await supabaseClient
    .from("appointments")
    .update({
      name: document.getElementById("detailName").value,
      phone: document.getElementById("detailPhone").value,
      date: newDate,
      time: document.getElementById("detailTime").value,
      service: document.getElementById("detailService").value,
      polish: document.getElementById("detailPolish").value,
      design: document.getElementById("detailDesign").value,
      additional_service: document.getElementById("detailAdditionalService").value,
      additional_polish: document.getElementById("detailAdditionalPolish").value,
      additional_design: document.getElementById("detailAdditionalDesign").value,
      duration: document.getElementById("detailDuration").value,
      notes: document.getElementById("detailNotes").value
    })
    .eq("id", appointment.id);

  if (error) {
    console.error("Save error:", error);
    alert(error.message);
    return;
  }

  selectedDate = newDate;
  await loadAppointments();
};

window.deleteSelectedAppointment = async function () {
  const appointment = appointments.find(function (item) {
    return item.id === selectedAppointmentId;
  });

  if (!appointment) {
    alert("Please select an appointment first.");
    return;
  }

  const confirmDelete = confirm("Delete this appointment?");

  if (!confirmDelete) {
    return;
  }

  const { error } = await supabaseClient
    .from("appointments")
    .delete()
    .eq("id", appointment.id);

  if (error) {
    console.error("Delete error:", error);
    alert(error.message);
    return;
  }

  selectedAppointmentId = null;
  await loadAppointments();
};

window.completeSelectedAppointment = async function () {
  const appointment = appointments.find(function (item) {
    return item.id === selectedAppointmentId;
  });

  if (!appointment) {
    alert("Please select an appointment first.");
    return;
  }

  const { error } = await supabaseClient
    .from("appointments")
    .update({
      status: "past",
      completed_date: new Date().toLocaleDateString()
    })
    .eq("id", appointment.id);

  if (error) {
    console.error("Complete error:", error);
    alert(error.message);
    return;
  }

  selectedAppointmentId = null;
  await loadAppointments();
};

function getAppointmentsByDate(dateString) {
  return appointments.filter(function (appointment) {
    return appointment.date === dateString;
  });
}

function formatDate(year, month, day) {
  const monthNumber = String(month + 1).padStart(2, "0");
  const dayNumber = String(day).padStart(2, "0");
  return `${year}-${monthNumber}-${dayNumber}`;
}

function convertTimeTo24Hour(time) {
  if (!time) {
    return "00:00";
  }

  const date = new Date(`January 1, 2026 ${time}`);

  if (isNaN(date.getTime())) {
    return time;
  }

  return date.toTimeString().slice(0, 5);
}

function escapeInput(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeTextarea(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

if (prevMonthBtn) {
  prevMonthBtn.addEventListener("click", function () {
    currentMonth--;

    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }

    renderCalendar();
  });
}

if (nextMonthBtn) {
  nextMonthBtn.addEventListener("click", function () {
    currentMonth++;

    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }

    renderCalendar();
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", async function () {
    await supabaseClient.auth.signOut();
    window.location.href = "login.html";
  });
}
