// ==========================================
// SAVE APPOINTMENT
// ==========================================

window.saveAppointment = async function (id) {
  console.log("=================================");
  console.log("STARTING APPOINTMENT SAVE");
  console.log("Appointment ID:", id);
  console.log("=================================");

  const appointment = appointments.find(function (item) {
    return item.id === id;
  });

  if (!appointment) {
    alert("Appointment not found.");
    console.error("Could not find appointment:", id);
    return;
  }

  // ========================================
  // GET EDIT FIELDS
  // ========================================

  const nameInput = document.getElementById("editName");
  const phoneInput = document.getElementById("editPhone");
  const dateInput = document.getElementById("editDate");
  const timeInput = document.getElementById("editTime");
  const serviceInput = document.getElementById("editService");
  const polishInput = document.getElementById("editPolish");
  const designInput = document.getElementById("editDesign");
  const notesInput = document.getElementById("editNotes");

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
    console.error("Missing edit fields:", {
      nameInput,
      phoneInput,
      dateInput,
      timeInput,
      serviceInput,
      polishInput,
      designInput,
      notesInput
    });

    alert(
      "Could not find one or more appointment edit fields."
    );

    return;
  }

  // ========================================
  // READ VALUES
  // ========================================

  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const date = dateInput.value.trim();
  const time = timeInput.value.trim();
  const service = serviceInput.value.trim();
  const polish = polishInput.value.trim();
  const design = designInput.value.trim();
  const notes = notesInput.value.trim();

  // ========================================
  // VALIDATION
  // ========================================

  if (!name) {
    alert("Please enter a customer name.");
    return;
  }

  if (!date) {
    alert("Please enter a date.");
    return;
  }

  if (!time) {
    alert("Please enter a time.");
    return;
  }

  if (!service) {
    alert("Please enter a service.");
    return;
  }

  // ========================================
  // UPDATE ONLY BASIC COLUMNS
  // ========================================
  //
  // We are intentionally NOT updating:
  //
  // duration
  // blocked_times
  // additional_services
  //
  // This lets us determine whether one of
  // those columns is causing the HTTP 400.
  //
  // ========================================

  const updatedAppointment = {
    name: name,
    phone: phone,
    date: date,
    time: time,
    service: service,
    polish: polish,
    design: design,
    notes: notes
  };

  console.log(
    "Appointment being sent to Supabase:",
    updatedAppointment
  );

  // ========================================
  // UPDATE SUPABASE
  // ========================================

  try {
    const result = await supabaseClient
      .from("appointments")
      .update(updatedAppointment)
      .eq("id", id)
      .select();

    const data = result.data;
    const error = result.error;

    console.log(
      "Supabase update data:",
      data
    );

    console.log(
      "Supabase update error:",
      error
    );

    // ======================================
    // SUPABASE ERROR
    // ======================================

    if (error) {
      console.error(
        "================================="
      );

      console.error(
        "SUPABASE SAVE ERROR"
      );

      console.error(
        "Code:",
        error.code
      );

      console.error(
        "Message:",
        error.message
      );

      console.error(
        "Details:",
        error.details
      );

      console.error(
        "Hint:",
        error.hint
      );

      console.error(
        "Full error:",
        error
      );

      console.error(
        "================================="
      );

      alert(
        "Could not save appointment.\n\n" +
        "Supabase error:\n" +
        error.message +
        (error.details
          ? "\n\nDetails:\n" +
            error.details
          : "") +
        (error.hint
          ? "\n\nHint:\n" +
            error.hint
          : "")
      );

      return;
    }

    // ======================================
    // NO ROW UPDATED
    // ======================================

    if (!data || data.length === 0) {
      console.error(
        "Supabase returned no updated rows."
      );

      alert(
        "The appointment was not saved.\n\n" +
        "Supabase did not return an updated appointment."
      );

      return;
    }

    // ======================================
    // SUCCESS
    // ======================================

    console.log(
      "================================="
    );

    console.log(
      "APPOINTMENT SAVED SUCCESSFULLY"
    );

    console.log(
      "Updated appointment:",
      data[0]
    );

    console.log(
      "================================="
    );

    // ======================================
    // RELOAD APPOINTMENTS
    // ======================================

    await loadAppointments();

    // ======================================
    // KEEP USER ON THE EDITED DATE
    // ======================================

    selectedDate = date;

    if (selectedDate) {
      showAppointmentsForDate(
        selectedDate
      );
    }

    // ======================================
    // SHOW UPDATED APPOINTMENT
    // ======================================

    const savedAppointment =
      appointments.find(function (item) {
        return item.id === id;
      });

    if (savedAppointment) {
      showAppointmentDetails(
        savedAppointment
      );
    }

    alert(
      "Appointment saved successfully."
    );

  } catch (error) {
    console.error(
      "Unexpected save error:",
      error
    );

    alert(
      "An unexpected error occurred while saving:\n\n" +
      (error.message || error)
    );
  }
}
