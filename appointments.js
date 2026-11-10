
/* =========================================================
   ELIANA'S NAIL STUDIO
   OWNER APPOINTMENT MANAGER
   APPOINTMENTS + AVAILABILITY BLOCKING
========================================================= */


/* =========================================================
   1. SUPABASE CONNECTION
========================================================= */

const SUPABASE_URL =
  "https://kyonstvpolakjhrecqcj.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_nsqFsxiE1238R9D4QZqiQA_bJfMioyd";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


/* =========================================================
   2. OWNER SETTINGS
========================================================= */

const OWNER_EMAIL = "enavejas005@gmail.com";

let appointments = [];
let blockedAvailability = [];

let currentDate = new Date();
let selectedDate = null;


/* =========================================================
   3. SERVICE DURATIONS
========================================================= */

const durations = {
  "Manicure": 1.5,
  "Pedicure": 2,
  "Gel": 1.5,
  "Acrylic": 2.5,
  "Basic": 0.5,
  "Minimal Design": 1,
  "Max Design": 2.5
};


/* =========================================================
   4. START OWNER DASHBOARD
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

  console.log("Owner dashboard loaded.");

  setupButtons();
  setupAvailabilityManager();

  checkOwnerLogin();

});


/* =========================================================
   5. GENERAL BUTTONS
========================================================= */

function setupButtons() {

  const prevMonth =
    document.getElementById("prevMonth");

  const nextMonth =
    document.getElementById("nextMonth");

  const logoutBtn =
    document.getElementById("logoutBtn");


  if (prevMonth) {

    prevMonth.addEventListener("click", function () {

      currentDate.setMonth(
        currentDate.getMonth() - 1
      );

      renderCalendar();

    });

  }


  if (nextMonth) {

    nextMonth.addEventListener("click", function () {

      currentDate.setMonth(
        currentDate.getMonth() + 1
      );

      renderCalendar();

    });

  }


  if (logoutBtn) {

    logoutBtn.addEventListener("click", async function () {

      logoutBtn.disabled = true;
      logoutBtn.textContent = "Logging out...";

      const { error } =
        await supabaseClient.auth.signOut();

      if (error) {

        console.error(error);

        alert(error.message);

        logoutBtn.disabled = false;
        logoutBtn.textContent = "Logout";

        return;

      }

      window.location.href = "login.html";

    });

  }

}


/* =========================================================
   6. CHECK OWNER LOGIN
========================================================= */

async function checkOwnerLogin() {

  try {

    const { data, error } =
      await supabaseClient.auth.getSession();

    if (error) {
      throw error;
    }

    const session = data.session;

    if (!session) {

      window.location.href = "login.html";

      return;

    }

    const email = session.user.email;

    if (
      !email ||
      email.toLowerCase() !== OWNER_EMAIL.toLowerCase()
    ) {

      window.location.href = "myappointments.html";

      return;

    }

    console.log("Owner verified.");

    await loadAppointments();

    await loadBlockedAvailability();

  } catch (error) {

    console.error("Owner login error:", error);

    alert(
      "Could not load the owner dashboard:\n\n" +
      error.message
    );

  }

}


/* =========================================================
   7. LOAD APPOINTMENTS
========================================================= */

async function loadAppointments() {

  const calendarGrid =
    document.getElementById("calendarGrid");

  const counter =
    document.getElementById("appointmentCounter");

  if (calendarGrid) {
    calendarGrid.innerHTML =
      "<p>Loading appointments...</p>";
  }

  const { data, error } =
    await supabaseClient
      .from("appointments")
      .select("*")
      .order("date", { ascending: true });

  if (error) {

    console.error("Appointment loading error:", error);

    if (calendarGrid) {

      calendarGrid.innerHTML = `
        <p>Could not load appointments.</p>
        <p>${escapeHtml(error.message)}</p>
      `;

    }

    return;

  }

  appointments = (data || []).filter(function (appointment) {

    return appointment.status !== "past";

  });

  if (counter) {

    counter.textContent =
      `Total Appointments: ${appointments.length}`;

  }

  renderCalendar();

}


/* =========================================================
   8. RENDER CALENDAR
========================================================= */

function renderCalendar() {

  const calendarGrid =
    document.getElementById("calendarGrid");

  const monthYear =
    document.getElementById("monthYear");

  if (!calendarGrid || !monthYear) return;

  calendarGrid.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay =
    new Date(year, month, 1).getDay();

  const daysInMonth =
    new Date(year, month + 1, 0).getDate();

  monthYear.textContent =
    new Date(year, month, 1).toLocaleDateString(
      "en-US",
      {
        month: "long",
        year: "numeric"
      }
    );


  // Empty calendar spaces

  for (let i = 0; i < firstDay; i++) {

    const empty = document.createElement("div");

    empty.className = "calendar-day empty";

    calendarGrid.appendChild(empty);

  }


  // Calendar dates

  for (let day = 1; day <= daysInMonth; day++) {

    const cell = document.createElement("div");

    cell.className = "calendar-day";

    const dateString =
      `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;


    const dayAppointments =
      appointments.filter(function (appointment) {

        return appointment.date === dateString;

      });


    const dayBlocks =
      blockedAvailability.filter(function (block) {

        return block.blocked_date === dateString;

      });


    const dayNumber =
      document.createElement("div");

    dayNumber.className = "calendar-day-number";

    dayNumber.textContent = day;

    cell.appendChild(dayNumber);


    // Appointment indicator

    if (dayAppointments.length > 0) {

      const count = document.createElement("div");

      count.className = "appointment-count";

      count.textContent = dayAppointments.length;

      cell.appendChild(count);

      cell.classList.add("has-appointments");

    }


    // Blocked availability indicator

    if (dayBlocks.length > 0) {

      cell.classList.add("has-blocked-availability");

      const blockedLabel =
        document.createElement("div");

      blockedLabel.className = "blocked-day-indicator";

      blockedLabel.textContent =
        dayBlocks.some(block => block.all_day)
          ? "Unavailable"
          : "Blocked time";

      cell.appendChild(blockedLabel);

    }


    if (selectedDate === dateString) {

      cell.classList.add("selected");

    }


    cell.addEventListener("click", function () {

      document
        .querySelectorAll(".calendar-day")
        .forEach(function (item) {

          item.classList.remove("selected");

        });

      cell.classList.add("selected");

      selectedDate = dateString;

      showAppointmentsForDate(dateString);

    });


    calendarGrid.appendChild(cell);

  }

}


/* =========================================================
   9. SHOW APPOINTMENTS FOR SELECTED DATE
========================================================= */

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

  const dateBlocks =
    blockedAvailability.filter(function (block) {

      return block.blocked_date === dateString;

    });


  const displayDate =
    new Date(dateString + "T12:00:00")
      .toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
      });

  title.textContent = displayDate;

  container.innerHTML = "";


  // Display blocked availability

  dateBlocks.forEach(function (block) {

    const blockCard =
      document.createElement("div");

    blockCard.className = "owner-blocked-date";

    const timeText = block.all_day
      ? "Entire day unavailable"
      : `${formatStoredTime(block.start_time)} – ${formatStoredTime(block.end_time)}`;

    blockCard.innerHTML = `
      <strong>Unavailable</strong>
      <p>${escapeHtml(timeText)}</p>
      ${block.reason ? `<p>${escapeHtml(block.reason)}</p>` : ""}
    `;

    container.appendChild(blockCard);

  });


  if (dateAppointments.length === 0) {

    const message = document.createElement("p");

    message.className = "no-selection";

    message.textContent = dateBlocks.length
      ? "No appointments on this day."
      : "No appointments or blocked times on this day.";

    container.appendChild(message);

    return;

  }


  dateAppointments.sort(function (a, b) {

    return timeToMinutes(a.time) - timeToMinutes(b.time);

  });


  dateAppointments.forEach(function (appointment) {

    const card = document.createElement("div");

    card.className = "appointment-card";

    const duration =
      getAppointmentDuration(appointment);

    const endTime =
      getEndTime(appointment.time, duration);

    card.innerHTML = `
      <div class="appointment-summary">

        <h3>${escapeHtml(appointment.name || "Customer")}</h3>

        <p>
          <strong>${escapeHtml(appointment.time || "")}</strong>
          ${endTime ? " - " + escapeHtml(endTime) : ""}
        </p>

        <p>${duration ? formatDuration(duration) : ""}</p>

      </div>
    `;

    card.addEventListener("click", function () {

      showAppointmentDetails(appointment);

    });

    container.appendChild(card);

  });

}


/* =========================================================
   10. APPOINTMENT DETAILS
========================================================= */

function showAppointmentDetails(appointment) {

  const details =
    document.getElementById("appointmentDetails");

  if (!details) return;

  const duration =
    getAppointmentDuration(appointment);

  const endTime =
    getEndTime(appointment.time, duration);

  const additionalServices =
    getAdditionalServices(appointment);


  details.innerHTML = `
    <h3>${escapeHtml(appointment.name || "Customer")}</h3>

    <p><strong>Phone:</strong> ${escapeHtml(appointment.phone || "")}</p>

    <p><strong>Date:</strong> ${escapeHtml(appointment.date || "")}</p>

    <p><strong>Start Time:</strong> ${escapeHtml(appointment.time || "")}</p>

    <p><strong>End Time:</strong> ${escapeHtml(endTime || "N/A")}</p>

    <p><strong>Duration:</strong> ${duration ? formatDuration(duration) : "N/A"}</p>

    <p><strong>Service:</strong> ${escapeHtml(appointment.service || "N/A")}</p>

    <p><strong>Polish:</strong> ${escapeHtml(appointment.polish || "N/A")}</p>

    <p><strong>Design:</strong> ${escapeHtml(appointment.design || "N/A")}</p>

    ${
      additionalServices.length
        ? `
          <p><strong>Additional Services:</strong></p>
          <ul>
            ${additionalServices.map(function (service) {

              const name =
                typeof service === "string"
                  ? service
                  : service.name || service.service || "Additional Service";

              return `<li>${escapeHtml(name)} (2 hours)</li>`;

            }).join("")}
          </ul>
        `
        : ""
    }

    <p><strong>Notes:</strong></p>

    <p class="owner-notes">
      ${appointment.notes
        ? escapeHtml(appointment.notes).replace(/\n/g, "<br>")
        : "No notes."}
    </p>

    <p><strong>Appointment Blocked Times:</strong></p>

    <p class="owner-notes">
      ${formatBlockedTimes(appointment.blocked_times)}
    </p>

    <div class="button-group">

      <button type="button"
        onclick="editAppointment('${appointment.id}')">
        Edit
      </button>

      <button type="button"
        onclick="deleteAppointment('${appointment.id}')">
        Delete
      </button>

      <button type="button"
        onclick="completeAppointment('${appointment.id}')">
        Complete
      </button>

    </div>
  `;

}


/* =========================================================
   11. EDIT APPOINTMENT
========================================================= */

window.editAppointment = function (id) {

  const appointment =
    appointments.find(item => item.id === id);

  if (!appointment) {
    alert("Appointment not found.");
    return;
  }

  const details =
    document.getElementById("appointmentDetails");

  if (!details) return;

  const additionalServices =
    getAdditionalServices(appointment);


  details.innerHTML = `
    <h3>Edit Appointment</h3>

    <input type="text" id="editName"
      value="${escapeHtml(appointment.name || "")}"
      placeholder="Name">

    <input type="text" id="editPhone"
      value="${escapeHtml(appointment.phone || "")}"
      placeholder="Phone">

    <input type="text" id="editDate"
      value="${escapeHtml(appointment.date || "")}"
      placeholder="Date">

    <input type="text" id="editTime"
      value="${escapeHtml(appointment.time || "")}"
      placeholder="Time">

    <input type="text" id="editService"
      value="${escapeHtml(appointment.service || "")}"
      placeholder="Service">

    <input type="text" id="editPolish"
      value="${escapeHtml(appointment.polish || "")}"
      placeholder="Polish">

    <input type="text" id="editDesign"
      value="${escapeHtml(appointment.design || "")}"
      placeholder="Design">

    <p><strong>Additional Services:</strong></p>

    <div id="editAdditionalServices">

      ${
        additionalServices.length
          ? additionalServices.map(function (service) {

              const name =
                typeof service === "string"
                  ? service
                  : service.name || service.service || "";

              return `<div>${escapeHtml(name)}</div>`;

            }).join("")
          : "<div>No additional services</div>"
      }

    </div>

    <textarea id="editNotes"
      placeholder="Owner notes">${escapeHtml(appointment.notes || "")}</textarea>

    <div class="button-group">

      <button type="button"
        onclick="saveAppointment('${appointment.id}')">
        Save
      </button>

      <button type="button"
        onclick="cancelEdit('${appointment.id}')">
        Cancel
      </button>

    </div>
  `;

};


/* =========================================================
   12. CANCEL EDIT
========================================================= */

window.cancelEdit = function (id) {

  const appointment =
    appointments.find(item => item.id === id);

  if (appointment) {

    showAppointmentDetails(appointment);

  }

};


/* =========================================================
   13. SAVE APPOINTMENT
========================================================= */

window.saveAppointment = async function (id) {

  const appointment =
    appointments.find(item => item.id === id);

  if (!appointment) return;

  const getValue = function (elementId) {

    const element = document.getElementById(elementId);

    return element ? element.value.trim() : null;

  };


  const name = getValue("editName");
  const phone = getValue("editPhone");
  const date = getValue("editDate");
  const time = getValue("editTime");
  const service = getValue("editService");
  const polish = getValue("editPolish");
  const design = getValue("editDesign");
  const notes = getValue("editNotes");


  if ([name, phone, date, time, service, polish, design, notes].some(value => value === null)) {

    alert("Could not find the appointment edit fields.");

    return;

  }


  const mainDuration =
    getMainBookingDuration(service, polish, design);

  const additionalServices =
    getAdditionalServices(appointment);

  const additionalDuration =
    additionalServices.length * 2;

  const totalDuration =
    mainDuration + additionalDuration;

  const blockedTimes =
    getBlockedTimes(time, totalDuration);


  const updatedAppointment = {

    name,
    phone,
    date,
    time,
    service,
    polish,
    design,
    notes,
    duration: totalDuration,
    blocked_times: blockedTimes,
    additional_services: additionalServices

  };


  const { error } =
    await supabaseClient
      .from("appointments")
      .update(updatedAppointment)
      .eq("id", id);


  if (error) {

    console.error(error);

    alert("Could not save appointment:\n\n" + error.message);

    return;

  }


  await loadAppointments();

  selectedDate = date;

  showAppointmentsForDate(date);

};


/* =========================================================
   14. DELETE APPOINTMENT
========================================================= */

window.deleteAppointment = async function (id) {

  const appointment =
    appointments.find(item => item.id === id);

  if (!appointment) return;

  const confirmed = confirm(
    `Delete the appointment for ${appointment.name || "this customer"}?`
  );

  if (!confirmed) return;


  const { error } =
    await supabaseClient
      .from("appointments")
      .delete()
      .eq("id", id);


  if (error) {

    alert("Could not delete appointment:\n\n" + error.message);

    return;

  }


  document.getElementById("appointmentDetails").innerHTML =
    '<p class="no-selection">Select an appointment.</p>';

  await loadAppointments();

  if (selectedDate) {
    showAppointmentsForDate(selectedDate);
  }

};


/* =========================================================
   15. COMPLETE APPOINTMENT
========================================================= */

window.completeAppointment = async function (id) {

  const appointment =
    appointments.find(item => item.id === id);

  if (!appointment) return;

  const confirmed = confirm(
    `Mark ${appointment.name || "this appointment"} as completed?`
  );

  if (!confirmed) return;


  const { error } =
    await supabaseClient
      .from("appointments")
      .update({
        status: "past",
        completed_date: new Date().toLocaleDateString()
      })
      .eq("id", id);


  if (error) {

    alert("Could not complete appointment:\n\n" + error.message);

    return;

  }


  document.getElementById("appointmentDetails").innerHTML =
    '<p class="no-selection">Select an appointment.</p>';

  await loadAppointments();

};


/* =========================================================
   16. OWNER AVAILABILITY MANAGER
========================================================= */

function setupAvailabilityManager() {

  const openBtn =
    document.getElementById("blockAvailabilityBtn");

  const modal =
    document.getElementById("blockAvailabilityModal");

  const closeBtn =
    document.getElementById("closeBlockModal");

  const form =
    document.getElementById("blockAvailabilityForm");

  const allDayCheckbox =
    document.getElementById("blockAllDay");


  if (!openBtn || !modal || !closeBtn || !form || !allDayCheckbox) {

    console.error("Availability manager elements are missing.");

    return;

  }


  // Open modal

  openBtn.addEventListener("click", function () {

    form.reset();

    updateBlockTimeFields();

    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");

  });


  // Close modal

  closeBtn.addEventListener("click", closeAvailabilityModal);


  // Close when clicking outside

  modal.addEventListener("click", function (event) {

    if (event.target === modal) {

      closeAvailabilityModal();

    }

  });


  // Toggle time fields

  allDayCheckbox.addEventListener("change", updateBlockTimeFields);


  // Save block

  form.addEventListener("submit", saveAvailabilityBlock);


  updateBlockTimeFields();

}


/* =========================================================
   17. SHOW / HIDE TIME FIELDS
========================================================= */

function updateBlockTimeFields() {

  const allDay =
    document.getElementById("blockAllDay");

  const timeFields =
    document.getElementById("blockTimeFields");

  const start =
    document.getElementById("blockStartTime");

  const end =
    document.getElementById("blockEndTime");


  if (!allDay || !timeFields || !start || !end) return;


  if (allDay.checked) {

    timeFields.style.display = "none";

    start.disabled = true;
    end.disabled = true;

    start.required = false;
    end.required = false;

  } else {

    timeFields.style.display = "block";

    start.disabled = false;
    end.disabled = false;

    start.required = true;
    end.required = true;

  }

}


/* =========================================================
   18. CLOSE AVAILABILITY MODAL
========================================================= */

function closeAvailabilityModal() {

  const modal =
    document.getElementById("blockAvailabilityModal");

  if (!modal) return;

  modal.hidden = true;

  modal.setAttribute("aria-hidden", "true");

}


/* =========================================================
   19. SAVE BLOCKED AVAILABILITY
========================================================= */

async function saveAvailabilityBlock(event) {

  event.preventDefault();

  const saveBtn =
    document.getElementById("saveAvailabilityBlock");

  const date =
    document.getElementById("blockDate").value;

  const allDay =
    document.getElementById("blockAllDay").checked;

  const startTime =
    document.getElementById("blockStartTime").value;

  const endTime =
    document.getElementById("blockEndTime").value;

  const reason =
    document.getElementById("blockReason").value.trim();


  if (!date) {

    alert("Please select a date.");

    return;

  }


  if (!allDay) {

    if (!startTime || !endTime) {

      alert("Please enter both a start time and an end time.");

      return;

    }

    if (startTime >= endTime) {

      alert("The end time must be later than the start time.");

      return;

    }

  }


  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";


  const newBlock = {

    blocked_date: date,

    all_day: allDay,

    start_time: allDay ? null : startTime,

    end_time: allDay ? null : endTime,

    reason: reason || null

  };


  try {

    const { error } =
      await supabaseClient
        .from("availability_blocks")
        .insert([newBlock]);


    if (error) {
      throw error;
    }


    await loadBlockedAvailability();

    closeAvailabilityModal();

    alert("Availability successfully blocked.");


  } catch (error) {

    console.error("Availability save error:", error);

    alert(
      "Could not save blocked availability:\n\n" +
      error.message
    );

  } finally {

    saveBtn.disabled = false;
    saveBtn.textContent = "Save Blocked Time";

  }

}


/* =========================================================
   20. LOAD BLOCKED AVAILABILITY
========================================================= */

async function loadBlockedAvailability() {

  const list =
    document.getElementById("ownerBlockedDatesList");

  if (list) {

    list.innerHTML =
      "<p>Loading blocked availability...</p>";

  }


  const { data, error } =
    await supabaseClient
      .from("availability_blocks")
      .select("*")
      .order("blocked_date", { ascending: true });


  if (error) {

    console.error("Blocked availability loading error:", error);

    if (list) {

      list.innerHTML = `
        <p>Could not load blocked availability.</p>
        <p>${escapeHtml(error.message)}</p>
      `;

    }

    return;

  }


  blockedAvailability = data || [];

  renderBlockedAvailability();

  renderCalendar();

  if (selectedDate) {

    showAppointmentsForDate(selectedDate);

  }

}


/* =========================================================
   21. DISPLAY BLOCKED AVAILABILITY
========================================================= */

function renderBlockedAvailability() {

  const list =
    document.getElementById("ownerBlockedDatesList");

  if (!list) return;

  list.innerHTML = "";


  if (blockedAvailability.length === 0) {

    list.innerHTML =
      "<p>No blocked dates or times yet.</p>";

    return;

  }


  blockedAvailability.forEach(function (block) {

    const card =
      document.createElement("div");

    card.className = "owner-blocked-date";


    const displayDate =
      new Date(block.blocked_date + "T12:00:00")
        .toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric"
        });


    const timeDescription = block.all_day
      ? "Entire day unavailable"
      : `${formatStoredTime(block.start_time)} – ${formatStoredTime(block.end_time)}`;


    card.innerHTML = `
      <div class="blocked-date-info">

        <strong>${escapeHtml(displayDate)}</strong>

        <p>${escapeHtml(timeDescription)}</p>

        ${block.reason
          ? `<p>${escapeHtml(block.reason)}</p>`
          : ""}

      </div>

      <button
        type="button"
        class="remove-availability-block"
      >
        Remove
      </button>
    `;


    card.querySelector("button").addEventListener("click", function () {

      deleteAvailabilityBlock(block.id);

    });


    list.appendChild(card);

  });

}


/* =========================================================
   22. REMOVE BLOCKED AVAILABILITY
========================================================= */

async function deleteAvailabilityBlock(id) {

  const confirmed = confirm(
    "Are you sure you want to remove this blocked date or time?"
  );

  if (!confirmed) return;


  const { error } =
    await supabaseClient
      .from("availability_blocks")
      .delete()
      .eq("id", id);


  if (error) {

    console.error("Availability deletion error:", error);

    alert(
      "Could not remove blocked availability:\n\n" +
      error.message
    );

    return;

  }


  await loadBlockedAvailability();

  alert("Blocked availability removed.");

}


/* =========================================================
   23. FORMAT SUPABASE TIME
========================================================= */

function formatStoredTime(time) {

  if (!time) return "";

  const parts = time.split(":");

  const hour = Number(parts[0]);

  const minute = parts[1] || "00";

  const period = hour >= 12 ? "PM" : "AM";

  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute} ${period}`;

}


/* =========================================================
   24. MAIN SERVICE DURATION
========================================================= */

function getMainBookingDuration(service, polish, design) {

  return Math.max(
    durations[service] || 0,
    durations[polish] || 0,
    durations[design] || 0
  );

}


/* =========================================================
   25. ADDITIONAL SERVICES
========================================================= */

function getAdditionalServices(appointment) {

  if (!appointment || !appointment.additional_services) {
    return [];
  }

  let services = appointment.additional_services;

  if (typeof services === "string") {

    try {

      services = JSON.parse(services);

    } catch (error) {

      console.error("Could not parse additional services:", error);

      return [];

    }

  }

  return Array.isArray(services) ? services : [];

}


/* =========================================================
   26. APPOINTMENT DURATION
========================================================= */

function getAppointmentDuration(appointment) {

  if (!appointment) return 0;

  const mainDuration =
    getMainBookingDuration(
      appointment.service,
      appointment.polish,
      appointment.design
    );

  const additionalServices =
    getAdditionalServices(appointment);

  const calculatedDuration =
    mainDuration + additionalServices.length * 2;

  return calculatedDuration > 0
    ? calculatedDuration
    : Number(appointment.duration) || 0;

}


/* =========================================================
   27. GET APPOINTMENT BLOCKED TIMES
========================================================= */

function getBlockedTimes(selectedTime, duration) {

  if (!selectedTime || !duration) return [];

  const startMinutes = timeToMinutes(selectedTime);

  const totalMinutes = Math.round(duration * 60);

  const blockedTimes = [];

  for (let minutes = 0; minutes < totalMinutes; minutes += 30) {

    blockedTimes.push(
      minutesToTime(startMinutes + minutes)
    );

  }

  return blockedTimes;

}


/* =========================================================
   28. GET END TIME
========================================================= */

function getEndTime(startTime, duration) {

  if (!startTime || !duration) return "";

  return minutesToTime(
    timeToMinutes(startTime) + duration * 60
  );

}


/* =========================================================
   29. FORMAT DURATION
========================================================= */

function formatDuration(duration) {

  const totalMinutes = Math.round(Number(duration) * 60);

  const hours = Math.floor(totalMinutes / 60);

  const minutes = totalMinutes % 60;

  if (hours && minutes) {
    return `${hours} hr ${minutes} min`;
  }

  if (hours) {
    return `${hours} hr`;
  }

  return `${minutes} min`;

}


/* =========================================================
   30. FORMAT APPOINTMENT BLOCKED TIMES
========================================================= */

function formatBlockedTimes(blockedTimes) {

  if (!blockedTimes) return "None";

  let times = blockedTimes;

  if (typeof times === "string") {

    try {

      times = JSON.parse(times);

    } catch (error) {

      return escapeHtml(times);

    }

  }

  if (!Array.isArray(times) || times.length === 0) {
    return "None";
  }

  return times.map(escapeHtml).join(", ");

}


/* =========================================================
   31. TIME TO MINUTES
========================================================= */

function timeToMinutes(time) {

  if (!time) return 0;

  // Supports 24-hour values such as 13:30
  if (/^\d{2}:\d{2}/.test(time)) {

    const parts = time.split(":");

    return Number(parts[0]) * 60 + Number(parts[1]);

  }


  // Supports 12-hour values such as 1:30 PM

  const match =
    time.match(/(\d+):(\d+)\s*(AM|PM)/i);

  if (!match) return 0;

  let hour = Number(match[1]);

  const minute = Number(match[2]);

  const period = match[3].toUpperCase();

  if (period === "PM" && hour !== 12) {
    hour += 12;
  }

  if (period === "AM" && hour === 12) {
    hour = 0;
  }

  return hour * 60 + minute;

}


/* =========================================================
   32. MINUTES TO TIME
========================================================= */

function minutesToTime(totalMinutes) {

  let hours = Math.floor(totalMinutes / 60);

  const minutes = totalMinutes % 60;

  const period = hours >= 12 ? "PM" : "AM";

  hours = hours % 12 || 12;

  return `${hours}:${String(minutes).padStart(2, "0")} ${period}`;

}


/* =========================================================
   33. ESCAPE HTML
========================================================= */

function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}
