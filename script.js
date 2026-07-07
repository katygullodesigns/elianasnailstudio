const SUPABASE_URL = "https://kyonstvpolakjhrecqcj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5b25zdHZwb2xha2pocmVjcWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTYxMjUsImV4cCI6MjA5NzI3MjEyNX0.oq6v7gEy8FJPh4NI3ngUYybwJcHF6rW6qkNtepCxr7Y";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function toggleMenu() {
  const nav = document.querySelector("nav");
  const btn = document.querySelector(".mobile-menu-btn");

  if (!nav) return;

  nav.classList.toggle("mobile-open");
  document.body.classList.toggle("menu-open");

  if (btn) {
    btn.innerHTML = nav.classList.contains("mobile-open") ? "✕" : "☰";
  }
}

document.addEventListener("DOMContentLoaded", function () {
  let selectedDate = "";
  let selectedTime = "";
  let additionalPolish = "";
  let additionalDesign = "";
  let calendarInstance = null;
  let bookedCalendarDates = {};

  const timeSlots = document.getElementById("timeSlots");

  const allTimes = [
    "8:00 AM", "8:30 AM",
    "9:00 AM", "9:30 AM",
    "10:00 AM", "10:30 AM",
    "11:00 AM", "11:30 AM",
    "12:00 PM", "12:30 PM",
    "1:00 PM", "1:30 PM",
    "2:00 PM", "2:30 PM",
    "3:00 PM", "3:30 PM",
    "4:00 PM", "4:30 PM",
    "5:00 PM", "5:30 PM",
    "6:00 PM", "6:30 PM"
  ];

  const serviceDurations = {
    "Manicure": 1.5,
    "Pedicure": 1.5,
    "Gel": 1.5,
    "Acrylic": 2.5,
    "Basic": 0.5,
    "Minimal Design": 1,
    "Max Design": 2.5,
    "No": 0
  };

  function getValue(id) {
    const element = document.getElementById(id);
    return element ? element.value : "";
  }

  function setValue(id, value) {
    const element = document.getElementById(id);
    if (element) element.value = value;
  }

  function getSelectedDuration() {
    const service = getValue("serviceSelect");
    const polish = getValue("polishSelect");
    const design = getValue("designSelect");
    const additionalService = getValue("additionalServiceSelect");

    const baseDuration = Math.max(
      serviceDurations[service] || 0,
      serviceDurations[polish] || 0,
      serviceDurations[design] || 0
    );

    const additionalDuration =
      additionalService !== "No" ? serviceDurations[additionalService] || 0 : 0;

    return baseDuration + additionalDuration;
  }

  function getTodayString() {
    const today = new Date();

    return (
      today.getFullYear() +
      "-" +
      String(today.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(today.getDate()).padStart(2, "0")
    );
  }

  function timeToMinutes(time) {
    const match = time.match(/(\d+):(\d+)\s(AM|PM)/);

    if (!match) return 0;

    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const ampm = match[3];

    if (ampm === "PM" && hour !== 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;

    return hour * 60 + minute;
  }

  function isPastTime(date, time) {
    if (!date || !time) return false;

    const todayString = getTodayString();

    if (date < todayString) return true;
    if (date > todayString) return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const slotMinutes = timeToMinutes(time);

    return slotMinutes <= currentMinutes;
  }

  function getBlockedTimesForAppointment(appointment) {
    const savedBlockedTimes =
      appointment.blockedTimes || appointment.blocked_times || [];

    if (savedBlockedTimes.length > 0) {
      return savedBlockedTimes;
    }

    if (!appointment.time || !appointment.duration) {
      return appointment.time ? [appointment.time] : [];
    }

    const startIndex = allTimes.indexOf(appointment.time);
    const slotsNeeded = Number(appointment.duration) * 2;

    if (startIndex === -1 || !slotsNeeded) {
      return appointment.time ? [appointment.time] : [];
    }

    return allTimes.slice(startIndex, startIndex + slotsNeeded);
  }

  async function getBookedAppointments() {
    const { data, error } = await supabaseClient
      .from("appointments")
      .select("*")
      .or("status.is.null,status.neq.past");

    if (error) {
      console.error("Supabase read error:", error);
      return {};
    }

    const bookedAppointments = {};

    (data || []).forEach(function (appointment) {
      if (!appointment.date) return;

      const blockedTimes = getBlockedTimesForAppointment(appointment);

      if (!bookedAppointments[appointment.date]) {
        bookedAppointments[appointment.date] = [];
      }

      blockedTimes.forEach(function (time) {
        if (!bookedAppointments[appointment.date].includes(time)) {
          bookedAppointments[appointment.date].push(time);
        }
      });
    });

    return bookedAppointments;
  }



    const counts = {};

    (data || []).forEach(function (appointment) {
      if (!appointment.date) return;

      if (!counts[appointment.date]) {
        counts[appointment.date] = 0;
      }

      counts[appointment.date]++;
    });

    return counts;
  }

  function renderTimeButtons(bookedTimes) {
    if (!timeSlots) return;

    timeSlots.innerHTML = "";

    allTimes.forEach(function (time) {
      const button = document.createElement("button");

      button.type = "button";
      button.textContent = time;
      button.classList.add("time-slot");

      const timeAlreadyPassed = isPastTime(selectedDate, time);
      const alreadyBooked = bookedTimes.includes(time);

      if (timeAlreadyPassed || alreadyBooked) {
        button.classList.add("booked");
        button.disabled = true;
      }

      button.addEventListener("click", function () {
        if (button.disabled) return;

        document.querySelectorAll(".time-slot").forEach(function (btn) {
          btn.classList.remove("selected");
        });

        button.classList.add("selected");
        selectedTime = time;
      });

      timeSlots.appendChild(button);
    });
  }

async function loadTimes(date) {
  selectedTime = "";

  if (Object.keys(bookedCalendarDates).length === 0) {
    bookedCalendarDates = await getBookedAppointments();
  }

  const bookedTimes = bookedCalendarDates[date] || [];

  renderTimeButtons(bookedTimes);
}

  document.querySelectorAll("nav a").forEach(function (link) {
    link.addEventListener("click", function () {
      const nav = document.querySelector("nav");
      const btn = document.querySelector(".mobile-menu-btn");

      if (nav) nav.classList.remove("mobile-open");
      document.body.classList.remove("menu-open");
      if (btn) btn.innerHTML = "☰";
    });
  });

  const additionalServiceSelect = document.getElementById("additionalServiceSelect");

  if (additionalServiceSelect) {
    additionalServiceSelect.addEventListener("change", function () {
      const popup = document.getElementById("additionalServicePopup");

      if (this.value !== "No" && this.value !== "") {
        if (popup) popup.style.display = "flex";
      } else {
        additionalPolish = "";
        additionalDesign = "";
        setValue("additionalPolishSelect", "");
        setValue("additionalDesignSelect", "");

        if (popup) popup.style.display = "none";
      }
    });
  }

  window.saveAdditionalServiceOptions = function () {
    additionalPolish = getValue("additionalPolishSelect");
    additionalDesign = getValue("additionalDesignSelect");

    if (!additionalPolish || !additionalDesign) {
      alert("Please select polish and design for the additional service.");
      return;
    }

    const popup = document.getElementById("additionalServicePopup");

    if (popup) {
      popup.style.display = "none";
    }
  };

if (
  typeof flatpickr !== "undefined" &&
  document.getElementById("appointmentDate")
) {

  calendarInstance = flatpickr("#appointmentDate", {
    dateFormat: "Y-m-d",
    minDate: "today",

    onReady: async function () {
      bookedCalendarDates = await getBookedAppointments();
    },

    onOpen: async function () {
      bookedCalendarDates = await getBookedAppointments();
    },

    onChange: async function (selectedDates, dateStr) {
      selectedDate = dateStr;

      bookedCalendarDates = await getBookedAppointments();

      const bookedTimes = bookedCalendarDates[dateStr] || [];

      renderTimeButtons(bookedTimes);
    }
  });

}
  window.closePopup = function () {
    const popup = document.getElementById("bookingPopup");

    if (popup) {
      popup.style.display = "none";
    }
  };

  window.bookAppointment = async function () {
    const name = document.getElementById("clientName").value.trim();
    const phone = document.getElementById("clientPhone").value.trim();

    const service = getValue("serviceSelect");
    const polish = getValue("polishSelect");
    const design = getValue("designSelect");
    const additionalService = getValue("additionalServiceSelect");

    if (!name) {
      alert("Please enter your name.");
      return;
    }

    if (!phone) {
      alert("Please enter your phone number.");
      return;
    }

    if (!selectedDate || !selectedTime) {
      alert("Please select a date and time.");
      return;
    }

    if (!service || !polish || !design) {
      alert("Please select service, polish, and design.");
      return;
    }

    if (additionalService !== "No" && additionalService !== "") {
      if (!additionalPolish || !additionalDesign) {
        alert("Please choose polish and design for the additional service.");

        const popup = document.getElementById("additionalServicePopup");

        if (popup) {
          popup.style.display = "flex";
        }

        return;
      }
    }

    const duration = getSelectedDuration();

    if (duration <= 0) {
      alert("Please select a valid service.");
      return;
    }

    const startIndex = allTimes.indexOf(selectedTime);

    if (startIndex === -1) {
      alert("Invalid appointment time.");
      return;
    }

    const slotsNeeded = duration * 2;
    const timesToBook = allTimes.slice(startIndex, startIndex + slotsNeeded);

    if (timesToBook.length < slotsNeeded) {
      alert("That service requires more time than is available. Please choose an earlier appointment.");
      return;
    }

    const bookedAppointments = await getBookedAppointments();
    const bookedTimes = bookedAppointments[selectedDate] || [];

    const conflict = timesToBook.some(function (time) {
      return bookedTimes.includes(time);
    });

    if (conflict) {
      alert("One or more of those time slots are already booked. Please choose another time.");
      await loadTimes(selectedDate);
      return;
    }

    const pastConflict = timesToBook.some(function (time) {
      return isPastTime(selectedDate, time);
    });

    if (pastConflict) {
      alert("That appointment time frame has already passed. Please choose another time.");
      await loadTimes(selectedDate);
      return;
    }

    const appointment = {
      name: name,
      phone: phone,
      date: selectedDate,
      time: selectedTime,
      duration: duration,
      blocked_times: timesToBook,
      service: service,
      polish: polish,
      design: design,
      additional_service: additionalService,
      additional_polish: additionalPolish,
      additional_design: additionalDesign,
      notes: "",
      status: "active",
      created_at: new Date().toISOString()
    };

const { error } = await supabaseClient
  .from("appointments")
  .insert([appointment]);

if (!error) {
  bookedCalendarDates = await getBookedAppointments();

  if (selectedDate) {
    renderTimeButtons(bookedCalendarDates[selectedDate] || []);
  }
}

    const popup = document.getElementById("bookingPopup");

    if (popup) {
      popup.style.display = "flex";
    }

    setValue("clientName", "");
    setValue("clientPhone", "");
    setValue("appointmentDate", "");
    setValue("serviceSelect", "");
    setValue("polishSelect", "");
    setValue("designSelect", "");
    setValue("additionalServiceSelect", "No");
    setValue("additionalPolishSelect", "");
    setValue("additionalDesignSelect", "");

    additionalPolish = "";
    additionalDesign = "";
    selectedDate = "";
    selectedTime = "";

    if (timeSlots) {
      timeSlots.innerHTML = "";
    }
  };
});
