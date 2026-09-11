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
// OWNER
// ==========================================

const OWNER_EMAIL =
  "enavejas005@gmail.com";

let appointments = [];

let currentDate =
  new Date();

let selectedDate = null;


// ==========================================
// DURATIONS
// ==========================================

const durations = {

  "Manicure": 1.5,

  "Pedicure": 2.0,

  "Gel": 1.5,

  "Acrylic": 1.5,

  "Basic": 0.5,

  "Minimal Design": 1,

  "Max Design": 2.5,

};


// ==========================================
// START
// ==========================================

document.addEventListener(
  "DOMContentLoaded",
  function () {

    console.log(
      "Owner appointment page loaded."
    );

    setupButtons();

    checkOwnerLogin();

  }
);


// ==========================================
// SETUP BUTTONS
// ==========================================

function setupButtons() {

  const prevMonth =
    document.getElementById(
      "prevMonth"
    );

  const nextMonth =
    document.getElementById(
      "nextMonth"
    );

  const logoutBtn =
    document.getElementById(
      "logoutBtn"
    );


  if (prevMonth) {

    prevMonth.addEventListener(
      "click",
      function () {

        currentDate.setMonth(
          currentDate.getMonth() - 1
        );

        renderCalendar();

      }
    );

  }


  if (nextMonth) {

    nextMonth.addEventListener(
      "click",
      function () {

        currentDate.setMonth(
          currentDate.getMonth() + 1
        );

        renderCalendar();

      }
    );

  }


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
            "Could not log out:\n\n" +
            error.message
          );

          logoutBtn.disabled = false;

          logoutBtn.textContent =
            "Logout";

          return;

        }


        window.location.href =
          "login.html";

      }
    );

  }

}


// ==========================================
// CHECK OWNER LOGIN
// ==========================================

async function checkOwnerLogin() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.getSession();


    if (error) {

      console.error(
        "Session error:",
        error
      );

      window.location.href =
        "login.html";

      return;

    }


    const session =
      data.session;


    if (!session) {

      console.log(
        "No active login session."
      );

      window.location.href =
        "login.html";

      return;

    }


    const email =
      session.user.email;


    if (
      !email ||
      email.toLowerCase() !==
        OWNER_EMAIL.toLowerCase()
    ) {

      window.location.href =
        "myappointments.html";

      return;

    }


    console.log(
      "Owner verified."
    );


    await loadAppointments();

  }

  catch (error) {

    console.error(
      "Owner login check failed:",
      error
    );

    window.location.href =
      "login.html";

  }

}


// ==========================================
// LOAD APPOINTMENTS
// ==========================================

async function loadAppointments() {

  const calendarGrid =
    document.getElementById(
      "calendarGrid"
    );

  const appointmentCounter =
    document.getElementById(
      "appointmentCounter"
    );


  if (!calendarGrid) {

    return;

  }


  calendarGrid.innerHTML =
    "<p>Loading appointments...</p>";


  const {
    data,
    error
  } =
    await supabaseClient
      .from("appointments")
      .select("*")
      .order("date", {
        ascending: true
      });


  if (error) {

    console.error(
      "SUPABASE APPOINTMENT ERROR:",
      error
    );


    calendarGrid.innerHTML = `
      <p>Could not load appointments.</p>

      <p style="font-size:12px;">
        ${escapeHtml(
          error.message ||
          "Unknown error"
        )}
      </p>
    `;

    return;

  }


  appointments =
    data || [];


  appointments =
    appointments.filter(
      function (appointment) {

        return (
          appointment.status !==
          "past"
        );

      }
    );


  if (appointmentCounter) {

    appointmentCounter.textContent =
      `Total Appointments: ${appointments.length}`;

  }


  renderCalendar();

}


// ==========================================
// RENDER CALENDAR
// ==========================================

function renderCalendar() {

  const calendarGrid =
    document.getElementById(
      "calendarGrid"
    );

  const monthYear =
    document.getElementById(
      "monthYear"
    );


  if (
    !calendarGrid ||
    !monthYear
  ) {

    return;

  }


  calendarGrid.innerHTML =
    "";


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


  for (
    let i = 0;
    i < firstDay;
    i++
  ) {

    const emptyDay =
      document.createElement(
        "div"
      );

    emptyDay.className =
      "calendar-day empty";

    calendarGrid.appendChild(
      emptyDay
    );

  }


  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {

    const cell =
      document.createElement(
        "div"
      );

    cell.className =
      "calendar-day";


    const dateString =
      `${year}-${String(
        month + 1
      ).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;


    const dayAppointments =
      appointments.filter(
        function (appointment) {

          return (
            appointment.date ===
            dateString
          );

        }
      );


    const appointmentCount =
      dayAppointments.length;


    const dayNumber =
      document.createElement(
        "div"
      );

    dayNumber.className =
      "calendar-day-number";

    dayNumber.textContent =
      day;


    cell.appendChild(
      dayNumber
    );


    if (
      appointmentCount > 0
    ) {

      const count =
        document.createElement(
          "div"
        );

      count.className =
        "appointment-count";

      count.textContent =
        appointmentCount;


      cell.appendChild(
        count
      );


      cell.classList.add(
        "has-appointments"
      );

    }


    if (
      selectedDate ===
      dateString
    ) {

      cell.classList.add(
        "selected"
      );

    }


    cell.addEventListener(
      "click",
      function () {

        document
          .querySelectorAll(
            ".calendar-day"
          )
          .forEach(
            function (dayCell) {

              dayCell.classList.remove(
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

      }
    );


    calendarGrid.appendChild(
      cell
    );

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


  if (
    !title ||
    !container
  ) {

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
      dateString +
      "T12:00:00"
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


  container.innerHTML =
    "";


  if (
    dateAppointments.length ===
    0
  ) {

    container.innerHTML = `
      <p class="no-selection">
        No appointments on this day.
      </p>
    `;

    return;

  }


  dateAppointments.sort(
    function (a, b) {

      return (
        timeToMinutes(a.time) -
        timeToMinutes(b.time)
      );

    }
  );


  dateAppointments.forEach(
    function (appointment) {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "appointment-card";


      const duration =
        getAppointmentDuration(
          appointment
        );


      const endTime =
        getEndTime(
          appointment.time,
          duration
        );


      card.innerHTML = `

        <div class="appointment-summary">

          <h3>
            ${escapeHtml(
              appointment.name ||
              "Customer"
            )}
          </h3>

          <p>
            <strong>
              ${escapeHtml(
                appointment.time ||
                ""
              )}
            </strong>

            ${
              endTime
                ? " - " +
                  escapeHtml(
                    endTime
                  )
                : ""
            }
          </p>

          ${
            duration
              ? `
                <p>
                  ${escapeHtml(
                    formatDuration(
                      duration
                    )
                  )}
                </p>
              `
              : ""
          }

        </div>

      `;


      card.addEventListener(
        "click",
        function () {

          showAppointmentDetails(
            appointment
          );

        }
      );


      container.appendChild(
        card
      );

    }
  );

}


// ==========================================
// SHOW APPOINTMENT DETAILS
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


  const duration =
    getAppointmentDuration(
      appointment
    );


  const endTime =
    getEndTime(
      appointment.time,
      duration
    );


  const additionalServices =
    getAdditionalServices(
      appointment
    );


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
      <strong>Start Time:</strong>
      ${escapeHtml(
        appointment.time ||
        ""
      )}
    </p>


    <p>
      <strong>End Time:</strong>
      ${escapeHtml(
        endTime ||
        "N/A"
      )}
    </p>


    <p>
      <strong>Duration:</strong>
      ${
        duration
          ? escapeHtml(
              formatDuration(
                duration
              )
            )
          : "N/A"
      }
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


    ${
      additionalServices.length > 0
        ? `
          <p>
            <strong>Additional Services:</strong>
          </p>

          <ul>
            ${
              additionalServices
                .map(
                  function (service) {

                    const name =
                      typeof service ===
                      "string"
                        ? service
                        : service.name ||
                          service.service ||
                          "Additional Service";

                    const serviceDuration =
                      getAdditionalServiceDuration(
                        service
                      );

                    return `
                      <li>
                        ${escapeHtml(name)}
                        ${
                          serviceDuration
                            ? ` (${escapeHtml(
                                formatDuration(
                                  serviceDuration
                                )
                              )})`
                            : ""
                        }
                      </li>
                    `;

                  }
                )
                .join("")
            }
          </ul>
        `
        : ""
    }


    <p>
      <strong>Notes:</strong>
    </p>


    <p class="owner-notes">
      ${
        appointment.notes
          ? escapeHtml(
              appointment.notes
            ).replace(
              /\n/g,
              "<br>"
            )
          : "No notes."
      }
    </p>


    <p>
      <strong>Blocked Times:</strong>
    </p>


    <p class="owner-notes">
      ${formatBlockedTimes(
        appointment.blocked_times
      )}
    </p>


    <div class="button-group">

      <button
        type="button"
        onclick="editAppointment('${appointment.id}')"
      >
        Edit
      </button>


      <button
        type="button"
        onclick="deleteAppointment('${appointment.id}')"
      >
        Delete
      </button>


      <button
        type="button"
        onclick="completeAppointment('${appointment.id}')"
      >
        Complete
      </button>

    </div>

  `;

}


// ==========================================
// EDIT APPOINTMENT
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

    alert(
      "Appointment not found."
    );

    return;

  }


  const details =
    document.getElementById(
      "appointmentDetails"
    );


  if (!details) {

    return;

  }


  const additionalServices =
    getAdditionalServices(
      appointment
    );


  details.innerHTML = `

    <h3>
      Edit Appointment
    </h3>


    <input
      type="text"
      id="editName"
      value="${escapeHtml(
        appointment.name || ""
      )}"
      placeholder="Name"
    >


    <input
      type="text"
      id="editPhone"
      value="${escapeHtml(
        appointment.phone || ""
      )}"
      placeholder="Phone"
    >


    <input
      type="text"
      id="editDate"
      value="${escapeHtml(
        appointment.date || ""
      )}"
      placeholder="Date"
    >


    <input
      type="text"
      id="editTime"
      value="${escapeHtml(
        appointment.time || ""
      )}"
      placeholder="Time"
    >


    <input
      type="text"
      id="editService"
      value="${escapeHtml(
        appointment.service || ""
      )}"
      placeholder="Service"
    >


    <input
      type="text"
      id="editPolish"
      value="${escapeHtml(
        appointment.polish || ""
      )}"
      placeholder="Polish"
    >


    <input
      type="text"
      id="editDesign"
      value="${escapeHtml(
        appointment.design || ""
      )}"
      placeholder="Design"
    >


    <p>
      <strong>Additional Services:</strong>
    </p>

    <div id="editAdditionalServices">

      ${
        additionalServices.length > 0
          ? additionalServices
              .map(
                function (service) {

                  const name =
                    typeof service ===
                    "string"
                      ? service
                      : service.name ||
                        service.service ||
                        "";

                  return `
                    <div>
                      ${escapeHtml(
                        name
                      )}
                    </div>
                  `;

                }
              )
              .join("")
          : "<div>No additional services</div>"
      }

    </div>


    <textarea
      id="editNotes"
      placeholder="Owner notes"
    >${escapeHtml(
      appointment.notes || ""
    )}</textarea>


    <div class="button-group">

      <button
        type="button"
        onclick="saveAppointment('${appointment.id}')"
      >
        Save
      </button>


      <button
        type="button"
        onclick="cancelEdit('${appointment.id}')"
      >
        Cancel
      </button>

    </div>

  `;

};


// ==========================================
// CANCEL EDIT
// ==========================================

window.cancelEdit =
function (id) {

  const appointment =
    appointments.find(
      function (item) {

        return item.id === id;

      }
    );


  if (appointment) {

    showAppointmentDetails(
      appointment
    );

  }

};


// ==========================================
// SAVE APPOINTMENT
// ==========================================

window.saveAppointment =
async function (id) {

  const appointment =
    appointments.find(
      function (item) {

        return item.id === id;

      }
    );


  if (!appointment) {

    alert(
      "Appointment not found."
    );

    return;

  }


  const nameInput =
    document.getElementById(
      "editName"
    );

  const phoneInput =
    document.getElementById(
      "editPhone"
    );

  const dateInput =
    document.getElementById(
      "editDate"
    );

  const timeInput =
    document.getElementById(
      "editTime"
    );

  const serviceInput =
    document.getElementById(
      "editService"
    );

  const polishInput =
    document.getElementById(
      "editPolish"
    );

  const designInput =
    document.getElementById(
      "editDesign"
    );

  const notesInput =
    document.getElementById(
      "editNotes"
    );


  if (
    !nameInput ||
    !phoneInput ||
    !dateInput ||
    !timeInput ||
    !serviceInput ||
    !polishInput ||
    !designInput ||
    !notesInput
  ) {

    alert(
      "Could not find the edit fields."
    );

    return;

  }


  const name =
    nameInput.value.trim();

  const phone =
    phoneInput.value.trim();

  const date =
    dateInput.value.trim();

  const time =
    timeInput.value.trim();

  const service =
    serviceInput.value.trim();

  const polish =
    polishInput.value.trim();

  const design =
    designInput.value.trim();

  const notes =
    notesInput.value.trim();


  // ========================================
  // MAIN DURATION
  // ========================================

  const newMainDuration =
    getMainBookingDuration(
      service,
      polish,
      design
    );


  // ========================================
  // ADDITIONAL SERVICE DURATION
  // ========================================

  const additionalServices =
    getAdditionalServices(
      appointment
    );


  const additionalDuration =
    getAdditionalServicesDuration(
      additionalServices
    );


  // ========================================
  // TOTAL DURATION
  // ========================================

  const newDuration =
    newMainDuration +
    additionalDuration;


  // ========================================
  // BLOCKED TIMES
  // ========================================

  const blockedTimes =
    getBlockedTimes(
      time,
      newDuration
    );


  console.log(
    "Main duration:",
    newMainDuration
  );

  console.log(
    "Additional duration:",
    additionalDuration
  );

  console.log(
    "Total duration:",
    newDuration
  );

  console.log(
    "Blocked times:",
    blockedTimes
  );


  const updatedAppointment = {

    name:
      name,

    phone:
      phone,

    date:
      date,

    time:
      time,

    service:
      service,

    polish:
      polish,

    design:
      design,

    notes:
      notes,

    duration:
      newDuration,

    blocked_times:
      blockedTimes

  };


  const {
    error
  } =
    await supabaseClient
      .from("appointments")
      .update(
        updatedAppointment
      )
      .eq(
        "id",
        id
      );


  if (error) {

    console.error(
      "Save error:",
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
    date;


  if (selectedDate) {

    showAppointmentsForDate(
      selectedDate
    );

  }

};


// ==========================================
// DELETE APPOINTMENT
// ==========================================

window.deleteAppointment =
async function (id) {

  const appointment =
    appointments.find(
      function (item) {

        return item.id === id;

      }
    );


  if (!appointment) {

    return;

  }


  const confirmed =
    confirm(
      `Delete the appointment for ${
        appointment.name ||
        "this customer"
      }?`
    );


  if (!confirmed) {

    return;

  }


  const {
    error
  } =
    await supabaseClient
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

    alert(
      "Could not delete appointment:\n\n" +
      error.message
    );

    return;

  }


  const details =
    document.getElementById(
      "appointmentDetails"
    );


  if (details) {

    details.innerHTML = `
      <p class="no-selection">
        Select an appointment.
      </p>
    `;

  }


  await loadAppointments();


  if (selectedDate) {

    showAppointmentsForDate(
      selectedDate
    );

  }

};


// ==========================================
// COMPLETE APPOINTMENT
// ==========================================

window.completeAppointment =
async function (id) {

  const appointment =
    appointments.find(
      function (item) {

        return item.id === id;

      }
    );


  if (!appointment) {

    return;

  }


  const confirmed =
    confirm(
      `Mark ${
        appointment.name ||
        "this appointment"
      } as completed?`
    );


  if (!confirmed) {

    return;

  }


  const {
    error
  } =
    await supabaseClient
      .from("appointments")
      .update({

        status:
          "past",

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

    alert(
      "Could not complete appointment:\n\n" +
      error.message
    );

    return;

  }


  const details =
    document.getElementById(
      "appointmentDetails"
    );


  if (details) {

    details.innerHTML = `
      <p class="no-selection">
        Select an appointment.
      </p>
    `;

  }


  await loadAppointments();

};


// ==========================================
// GET MAIN BOOKING DURATION
// ==========================================

function getMainBookingDuration(
  service,
  polish,
  design
) {

  return Math.max(

    durations[service] || 0,

    durations[polish] || 0,

    durations[design] || 0

  );

}


// ==========================================
// GET ADDITIONAL SERVICES
// ==========================================

function getAdditionalServices(
  appointment
) {

  if (
    !appointment ||
    !appointment.additional_services
  ) {

    return [];

  }


  let additionalServices =
    appointment.additional_services;


  if (
    typeof additionalServices ===
    "string"
  ) {

    try {

      additionalServices =
        JSON.parse(
          additionalServices
        );

    }

    catch (error) {

      console.error(
        "Could not parse additional services:",
        error
      );

      return [];

    }

  }


  if (
    !Array.isArray(
      additionalServices
    )
  ) {

    return [];

  }


  return additionalServices;

}


// ==========================================
// GET ONE ADDITIONAL SERVICE DURATION
// ==========================================

function getAdditionalServiceDuration(
  service
) {

  if (
    !service
  ) {

    return 0;

  }


  // If the saved service is just a string.

  if (
    typeof service ===
    "string"
  ) {

    return (
      durations[service] ||
      0
    );

  }


  // If the booking page saved:
  // { name: "Pedicure" }

  if (
    service.name &&
    durations[service.name]
  ) {

    return durations[
      service.name
    ];

  }


  // If it saved:
  // { service: "Pedicure" }

  if (
    service.service &&
    durations[service.service]
  ) {

    return durations[
      service.service
    ];

  }


  // If it already saved its duration.

  if (
    service.duration
  ) {

    return Number(
      service.duration
    ) || 0;

  }


  return 0;

}


// ==========================================
// GET ALL ADDITIONAL SERVICE DURATION
// ==========================================

function getAdditionalServicesDuration(
  additionalServices
) {

  if (
    !Array.isArray(
      additionalServices
    )
  ) {

    return 0;

  }


  return additionalServices.reduce(
    function (
      total,
      service
    ) {

      return (
        total +
        getAdditionalServiceDuration(
          service
        )
      );

    },
    0
  );

}


// ==========================================
// GET TOTAL APPOINTMENT DURATION
// ==========================================

function getAppointmentDuration(
  appointment
) {

  if (!appointment) {

    return 0;

  }


  const mainDuration =
    getMainBookingDuration(
      appointment.service,
      appointment.polish,
      appointment.design
    );


  const additionalServices =
    getAdditionalServices(
      appointment
    );


  const additionalDuration =
    getAdditionalServicesDuration(
      additionalServices
    );


  /*
    IMPORTANT:

    Additional services are ADDED.

    Example:

    Manicure = 1.5
    Pedicure = 0.5

    Total = 2.0

    Manicure = 1.5
    Pedicure = 0.5
    Nail Art = 1

    Total = 3.0
  */

  const calculatedDuration =
    mainDuration +
    additionalDuration;


  // If additional_services exists,
  // the calculated value is authoritative.

  if (
    additionalServices.length > 0
  ) {

    return calculatedDuration;

  }


  // For older appointments that were
  // created before additional_services
  // existed, preserve their saved duration.

  return (
    Number(
      appointment.duration
    ) ||
    mainDuration
  );

}


// ==========================================
// GET BLOCKED TIMES
// ==========================================

function getBlockedTimes(
  selectedTime,
  duration
) {

  if (
    !selectedTime ||
    !duration
  ) {

    return [];

  }


  const startMinutes =
    timeToMinutes(
      selectedTime
    );


  const totalMinutes =
    Math.round(
      duration * 60
    );


  const blockedTimes = [];


  for (
    let minutes = 0;
    minutes < totalMinutes;
    minutes += 30
  ) {

    blockedTimes.push(
      minutesToTime(
        startMinutes +
        minutes
      )
    );

  }


  return blockedTimes;

}


// ==========================================
// GET END TIME
// ==========================================

function getEndTime(
  startTime,
  duration
) {

  if (
    !startTime ||
    !duration
  ) {

    return "";

  }


  const startMinutes =
    timeToMinutes(
      startTime
    );


  return minutesToTime(
    startMinutes +
    duration * 60
  );

}


// ==========================================
// FORMAT DURATION
// ==========================================

function formatDuration(
  duration
) {

  const totalMinutes =
    Math.round(
      Number(duration) * 60
    );


  const hours =
    Math.floor(
      totalMinutes / 60
    );


  const minutes =
    totalMinutes % 60;


  if (
    hours > 0 &&
    minutes > 0
  ) {

    return (
      `${hours} hr ${minutes} min`
    );

  }


  if (
    hours > 0
  ) {

    return (
      `${hours} hr`
    );

  }


  return (
    `${minutes} min`
  );

}


// ==========================================
// FORMAT BLOCKED TIMES
// ==========================================

function formatBlockedTimes(
  blockedTimes
) {

  if (
    !blockedTimes
  ) {

    return "None";

  }


  let times =
    blockedTimes;


  if (
    typeof times ===
    "string"
  ) {

    try {

      times =
        JSON.parse(
          times
        );

    }

    catch (error) {

      return escapeHtml(
        times
      );

    }

  }


  if (
    !Array.isArray(times) ||
    times.length === 0
  ) {

    return "None";

  }


  return times
    .map(
      function (time) {

        return escapeHtml(
          time
        );

      }
    )
    .join(
      ", "
    );

}


// ==========================================
// TIME TO MINUTES
// ==========================================

function timeToMinutes(
  time
) {

  if (!time) {

    return 0;

  }


  const match =
    time.match(
      /(\d+):(\d+)\s*(AM|PM)/i
    );


  if (!match) {

    return 0;

  }


  let hour =
    Number(
      match[1]
    );


  const minute =
    Number(
      match[2]
    );


  const ampm =
    match[3].toUpperCase();


  if (
    ampm === "PM" &&
    hour !== 12
  ) {

    hour += 12;

  }


  if (
    ampm === "AM" &&
    hour === 12
  ) {

    hour = 0;

  }


  return (
    hour * 60 +
    minute
  );

}


// ==========================================
// MINUTES TO TIME
// ==========================================

function minutesToTime(
  totalMinutes
) {

  let hours =
    Math.floor(
      totalMinutes / 60
    );


  const minutes =
    totalMinutes % 60;


  const modifier =
    hours >= 12
      ? "PM"
      : "AM";


  if (
    hours > 12
  ) {

    hours -= 12;

  }


  if (
    hours === 0
  ) {

    hours = 12;

  }


  return (
    hours +
    ":" +
    String(
      minutes
    ).padStart(
      2,
      "0"
    ) +
    " " +
    modifier
  );

}


// ==========================================
// HTML ESCAPE
// ==========================================

function escapeHtml(
  value
) {

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

