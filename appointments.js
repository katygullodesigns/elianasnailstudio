function showAppointmentDetails(appointment) {

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
        appointment.name ||
        "Customer"
      )}
    </h3>

    <p>
      <strong>Phone:</strong>
      ${escapeHtml(
        appointment.phone ||
        "N/A"
      )}
    </p>

    <p>
      <strong>Date:</strong>
      ${escapeHtml(
        appointment.date ||
        "N/A"
      )}
    </p>

    <p>
      <strong>Time:</strong>
      ${escapeHtml(
        appointment.time ||
        "N/A"
      )}
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

    <p>
      <strong>Duration:</strong>
      ${escapeHtml(
        appointment.duration ||
        "N/A"
      )}
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
        type="button"
        id="editAppointmentButton"
      >
        Edit Appointment
      </button>

      <button
        type="button"
        id="deleteAppointmentButton"
      >
        Delete Appointment
      </button>

    </div>

  `;


  // EDIT BUTTON

  document
    .getElementById(
      "editAppointmentButton"
    )
    .addEventListener(
      "click",
      function () {

        editAppointment(
          appointment.id
        );

      }
    );


  // DELETE BUTTON

  document
    .getElementById(
      "deleteAppointmentButton"
    )
    .addEventListener(
      "click",
      function () {

        deleteAppointment(
          appointment.id
        );

      }
    );

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


  details.innerHTML = `

    <h3>
      Edit Appointment
    </h3>


    <label>Name</label>

    <input
      type="text"
      id="editName"
      value="${escapeAttribute(
        appointment.name || ""
      )}"
    >


    <label>Phone</label>

    <input
      type="text"
      id="editPhone"
      value="${escapeAttribute(
        appointment.phone || ""
      )}"
    >


    <label>Date</label>

    <input
      type="date"
      id="editDate"
      value="${escapeAttribute(
        appointment.date || ""
      )}"
    >


    <label>Time</label>

    <input
      type="text"
      id="editTime"
      value="${escapeAttribute(
        appointment.time || ""
      )}"
    >


    <label>Service</label>

    <input
      type="text"
      id="editService"
      value="${escapeAttribute(
        appointment.service || ""
      )}"
    >


    <label>Polish</label>

    <input
      type="text"
      id="editPolish"
      value="${escapeAttribute(
        appointment.polish || ""
      )}"
    >


    <label>Design</label>

    <input
      type="text"
      id="editDesign"
      value="${escapeAttribute(
        appointment.design || ""
      )}"
    >


    <label>Owner Notes</label>

    <textarea
      id="editNotes"
      placeholder="Owner notes"
    >${escapeHtml(
      appointment.notes || ""
    )}</textarea>


    <div class="button-group">

      <button
        type="button"
        id="saveAppointmentButton"
      >
        Save Changes
      </button>


      <button
        type="button"
        id="cancelEditButton"
      >
        Cancel
      </button>

    </div>

  `;


  document
    .getElementById(
      "saveAppointmentButton"
    )
    .addEventListener(
      "click",
      function () {

        saveAppointment(
          appointment.id
        );

      }
    );


  document
    .getElementById(
      "cancelEditButton"
    )
    .addEventListener(
      "click",
      function () {

        showAppointmentDetails(
          appointment
        );

      }
    );

};


// ==========================================
// SAVE APPOINTMENT
// ==========================================

window.saveAppointment =
async function (id) {

  const updatedAppointment = {

    name:
      document.getElementById(
        "editName"
      ).value.trim(),

    phone:
      document.getElementById(
        "editPhone"
      ).value.trim(),

    date:
      document.getElementById(
        "editDate"
      ).value.trim(),

    time:
      document.getElementById(
        "editTime"
      ).value.trim(),

    service:
      document.getElementById(
        "editService"
      ).value.trim(),

    polish:
      document.getElementById(
        "editPolish"
      ).value.trim(),

    design:
      document.getElementById(
        "editDesign"
      ).value.trim(),

    notes:
      document.getElementById(
        "editNotes"
      ).value.trim()

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
      "Save appointment error:",
      error
    );

    alert(
      "Could not save appointment:\n\n" +
      error.message
    );

    return;
  }


  // Update the appointment in memory

  const appointment =
    appointments.find(
      function (item) {

        return item.id === id;

      }
    );


  if (appointment) {

    Object.assign(
      appointment,
      updatedAppointment
    );

  }


  // Move calendar if date was changed

  selectedDate =
    updatedAppointment.date;

  currentDate =
    new Date(
      `${updatedAppointment.date}T12:00:00`
    );


  renderCalendar();

  showAppointmentsForDate(
    updatedAppointment.date
  );

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

    alert(
      "Appointment not found."
    );

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
      "Delete appointment error:",
      error
    );

    alert(
      "Could not delete appointment:\n\n" +
      error.message
    );

    return;
  }


  // Remove from local array

  appointments =
    appointments.filter(
      function (item) {

        return item.id !== id;

      }
    );


  // Update counter

  const counter =
    document.getElementById(
      "appointmentCounter"
    );

  if (counter) {

    counter.textContent =
      `Total Appointments: ${appointments.length}`;

  }


  // Clear details

  const details =
    document.getElementById(
      "appointmentDetails"
    );

  if (details) {

    details.innerHTML =
      `<p class="no-selection">
        Select an appointment.
      </p>`;

  }


  // Refresh calendar

  renderCalendar();


  // Refresh selected date

  if (selectedDate) {

    showAppointmentsForDate(
      selectedDate
    );

  }

};
