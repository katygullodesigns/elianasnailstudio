
/* =========================================================
   1. SUPABASE CONNECTION
========================================================= */

const SUPABASE_URL = "https://kyonstvpolakjhrecqcj.supabase.co";

const SUPABASE_ANON_KEY = "sb_publishable_nsqFsxiE1238R9D4QZqiQA_bJfMioyd";

const supabaseClient = window.supabase
    ? window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    )
    : null;


/* =========================================================
   2. BUSINESS SETTINGS
========================================================= */

// Appointment start times: 9 AM–6 PM, every 30 minutes.

const allTimes = [];

for (let minutes = 9 * 60; minutes <= 18 * 60; minutes += 30) {
    allTimes.push(minutesToTime(minutes));
}

// Latest permitted appointment end time.

const CLOSING_MINUTES = timeToMinutes("8:30 PM");

// New recurring weekly schedule begins November 17, 2026.

const WEEKLY_BLOCKING_START_DATE = "2026-11-16";

// Permanently unavailable weekdays.
// Sunday = 0, Monday = 1, Tuesday = 2, etc.

const PERMANENTLY_BLOCKED_WEEKDAYS = [0, 1, 2, 5];

// RECURRING WEEKLY UNAVAILABLE HOURS
//
// Wednesday: Unavailable 10 AM–7 PM.
// Thursday: Only one appointment start time at 9 AM.
//
// Thursday appointments starting at 9 AM may finish
// their full service duration.

const WEEKLY_BLOCKED_HOURS = {
    3: {
        start: "10:00 AM",
        end: "7:00 PM"
    },

    4: {
        start: "9:30 AM",
        end: "11:59 PM"
    }
};


// Service durations in hours.

const serviceDurations = {
    "Manicure": 1.5,
    "Pedicure": 2.0,
    "Gel": 1.5,
    "Acrylic": 2.5,
    "Basic": 0.5,
    "Minimal Design": 1,
    "Max Design": 2.5
};


/* =========================================================
   3. BOOKING STATE
========================================================= */

let selectedDate = "";
let selectedTime = "";

let selectedAdditionalServices = [];

let availabilityBlocks = [];

// Weekdays stored in Supabase are part of the new schedule.
// They only become active November 17, 2026.

let databaseBlockedWeekdays = [];

let datePicker = null;

const timeSlotsContainer = document.getElementById("timeSlots");


/* =========================================================
   4. TIME AND DATE HELPERS
========================================================= */

function timeToMinutes(time) {

    if (!time) return 0;

    const value = String(time).trim();

    const sqlMatch = value.match(
        /^(\d{1,2}):(\d{2})(?::\d{2})?$/
    );

    if (sqlMatch) {
        return Number(sqlMatch[1]) * 60 +
            Number(sqlMatch[2]);
    }

    const displayMatch = value.match(
        /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
    );

    if (!displayMatch) return 0;

    let hour = Number(displayMatch[1]);

    const minute = Number(displayMatch[2]);

    const ampm = displayMatch[3].toUpperCase();

    if (ampm === "PM" && hour !== 12) hour += 12;

    if (ampm === "AM" && hour === 12) hour = 0;

    return hour * 60 + minute;
}


function minutesToTime(totalMinutes) {

    const hour = Math.floor(totalMinutes / 60);

    const minute = totalMinutes % 60;

    const ampm = hour >= 12 ? "PM" : "AM";

    let displayHour = hour % 12;

    if (displayHour === 0) displayHour = 12;

    return `${displayHour}:${String(minute).padStart(2, "0")} ${ampm}`;
}


function getTodayString() {

    const today = new Date();

    return [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");
}


function dateStringToLocalDate(dateString) {

    const [year, month, day] = dateString.split("-").map(Number);

    return new Date(year, month - 1, day);
}


function getDateFromPickerDate(date) {

    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-");
}


function isPastTime(date, time) {

    if (!date || !time) return false;

    const today = getTodayString();

    if (date < today) return true;

    if (date > today) return false;

    const now = new Date();

    const currentMinutes =
        now.getHours() * 60 + now.getMinutes();

    return timeToMinutes(time) <= currentMinutes;
}


// Check whether two time ranges overlap.

function rangesOverlap(startA, endA, startB, endB) {

    return startA < endB && endA > startB;
}


/* =========================================================
   5. LOAD AVAILABILITY FROM SUPABASE
========================================================= */

async function loadAvailabilitySettings() {

    if (!supabaseClient) {
        throw new Error("Supabase is not connected.");
    }

    const [blocksResult, weekdaysResult] = await Promise.all([

        supabaseClient
            .from("availability_blocks")
            .select("id, blocked_date, start_time, end_time, all_day, reason"),

        supabaseClient
            .from("blocked_weekdays")
            .select("weekday, reason")

    ]);

    if (blocksResult.error) {

        console.error(
            "availability_blocks error:",
            blocksResult.error
        );

        throw blocksResult.error;
    }

    if (weekdaysResult.error) {

        console.error(
            "blocked_weekdays error:",
            weekdaysResult.error
        );

        throw weekdaysResult.error;
    }

    availabilityBlocks = blocksResult.data || [];

    // Store database weekdays separately.
    // They are not automatically applied before November 17.

    databaseBlockedWeekdays = (weekdaysResult.data || [])
        .map(row => Number(row.weekday))
        .filter(day =>
            Number.isInteger(day) &&
            day >= 0 &&
            day <= 6
        );
}


// Get all blocked entries for a specific date.

function getBlocksForDate(dateString) {

    return availabilityBlocks.filter(
        block => block.blocked_date === dateString
    );
}


/* =========================================================
   6. CHECK DATE AVAILABILITY
========================================================= */

function isDateBlocked(dateString) {
    if (!dateString) return false;

    const date = dateStringToLocalDate(dateString);
    const weekday = date.getDay();

    // Apply the new weekly schedule beginning November 16, 2026.
    if (dateString >= WEEKLY_BLOCKING_START_DATE) {

        // Sunday, Monday, Tuesday, and Friday are unavailable.
        if (PERMANENTLY_BLOCKED_WEEKDAYS.includes(weekday)) {
            return true;
        }

        // Apply weekday restrictions saved in Supabase.
        if (databaseBlockedWeekdays.includes(weekday)) {
            return true;
        }
    }

    // Individual date-specific blocks remain active regardless
    // of which weekly schedule is in effect.
    return getBlocksForDate(dateString).some(
        block => block.all_day === true
    );
}


/* =========================================================
   7. CHECK TIME AVAILABILITY
========================================================= */

// Check recurring weekly restrictions and individual
// Supabase blocks.
//
// ignoreWeeklyBlock allows a Thursday 9 AM appointment
// to finish its full service duration.

function isTimeRangeBlocked(
    dateString,
    startMinutes,
    endMinutes,
    ignoreWeeklyBlock = false
) {

    if (!dateString) return false;

    const date = dateStringToLocalDate(dateString);

    // Apply recurring weekly restrictions only
    // beginning November 17, 2026.

    if (
        dateString >= WEEKLY_BLOCKING_START_DATE &&
        !ignoreWeeklyBlock
    ) {

        const weeklyBlock = WEEKLY_BLOCKED_HOURS[date.getDay()];

        if (weeklyBlock) {

            const weeklyStart = timeToMinutes(weeklyBlock.start);

            const weeklyEnd = timeToMinutes(weeklyBlock.end);

            if (
                rangesOverlap(
                    startMinutes,
                    endMinutes,
                    weeklyStart,
                    weeklyEnd
                )
            ) {
                return true;
            }
        }
    }

    // Always check individual Supabase blocks,
    // regardless of the date.

    return getBlocksForDate(dateString).some(block => {

        if (block.all_day === true) return true;

        if (!block.start_time || !block.end_time) {
            return false;
        }

        const blockStart = timeToMinutes(block.start_time);

        const blockEnd = timeToMinutes(block.end_time);

        return rangesOverlap(
            startMinutes,
            endMinutes,
            blockStart,
            blockEnd
        );
    });
}


// Check one individual 30-minute slot.

function isSlotBlocked(dateString, time) {

    const start = timeToMinutes(time);

    return isTimeRangeBlocked(
        dateString,
        start,
        start + 30
    );
}


/* =========================================================
   8. LOAD EXISTING APPOINTMENTS
========================================================= */

async function getBookedAppointments() {

    if (!supabaseClient) {
        throw new Error("Supabase is not connected.");
    }

    const { data, error } = await supabaseClient
        .from("appointments")
        .select("*");

    if (error) {

        console.error(
            "Could not load appointments:",
            error
        );

        throw error;
    }

    const bookedByDate = {};

    (data || []).forEach(appointment => {

        if (!appointment.date) return;

        // Ignore cancelled appointments.

        const status = String(
            appointment.status || ""
        ).toLowerCase();

        if (
            ["cancelled", "canceled", "deleted"].includes(status)
        ) {
            return;
        }

        const times = Array.isArray(appointment.blocked_times)
            ? appointment.blocked_times
            : appointment.time
                ? [appointment.time]
                : [];

        if (!bookedByDate[appointment.date]) {
            bookedByDate[appointment.date] = [];
        }

        bookedByDate[appointment.date].push(...times);
    });

    return bookedByDate;
}


/* =========================================================
   9. APPOINTMENT DURATION HELPERS
========================================================= */

function calculateAppointmentDuration(
    service,
    polish,
    design
) {

    let duration = Math.max(
        serviceDurations[service] || 1,
        serviceDurations[polish] || 1,
        serviceDurations[design] || 1
    );

    // Each additional service adds two hours.

    duration += selectedAdditionalServices.length * 2;

    return duration;
}


// Calculate all half-hour slots occupied by an appointment.

function getAppointmentSlots(startTime, durationHours) {

    const slotCount = Math.ceil(durationHours * 2);

    const startMinutes = timeToMinutes(startTime);

    const slots = [];

    for (let index = 0; index < slotCount; index++) {

        slots.push(
            minutesToTime(startMinutes + index * 30)
        );
    }

    return slots;
}


// Check every half-hour interval of an appointment.

function appointmentOverlapsBlockedTime(
    dateString,
    slots,
    appointmentStartTime
) {

    const date = dateStringToLocalDate(dateString);

    // Special Thursday rule:
    // An appointment starting at 9 AM may finish
    // its full service duration.
    //
    // Other Thursday start times remain unavailable.

    const allowThursdayNineAM =
        dateString >= WEEKLY_BLOCKING_START_DATE &&
        date.getDay() === 4 &&
        timeToMinutes(appointmentStartTime) === 9 * 60;

    return slots.some(time => {

        const start = timeToMinutes(time);

        return isTimeRangeBlocked(
            dateString,
            start,
            start + 30,
            allowThursdayNineAM
        );
    });
}


/* =========================================================
   10. DATE PICKER
========================================================= */

function initializeDatePicker() {

    const dateInput = document.getElementById("appointmentDate");

    if (!dateInput) return;

    if (typeof flatpickr !== "undefined") {

        if (datePicker) {
            datePicker.destroy();
        }

        datePicker = flatpickr(dateInput, {

            dateFormat: "Y-m-d",

            minDate: "today",

            disable: [
                function (date) {

                    const dateString =
                        getDateFromPickerDate(date);

                    return isDateBlocked(dateString);
                }
            ],

            onChange: async function (
                selectedDates,
                dateString
            ) {

                selectedDate = dateString;

                selectedTime = "";

                await loadTimes(dateString);
            }
        });

    } else {

        // Fallback if Flatpickr is not installed.

        dateInput.min = getTodayString();

        dateInput.addEventListener("change", async function () {

            selectedDate = dateInput.value;

            selectedTime = "";

            await loadTimes(selectedDate);
        });
    }
}


/* =========================================================
   11. DISPLAY AVAILABLE APPOINTMENT TIMES
========================================================= */

function renderTimeButtons(bookedTimes) {

    if (!timeSlotsContainer) return;

    timeSlotsContainer.innerHTML = "";

    if (!selectedDate) return;

    if (isDateBlocked(selectedDate)) {
        selectedTime = "";
        timeSlotsContainer.textContent =
            "This date is unavailable. Please choose another date.";
        return;
    }

    const bookedSet = new Set(bookedTimes || []);

    const service =
        document.getElementById("serviceSelect")?.value || "";

    const polish =
        document.getElementById("polishSelect")?.value || "";

    const design =
        document.getElementById("designSelect")?.value || "";

    const previewDuration = (service || polish || design)
        ? calculateAppointmentDuration(service, polish, design)
        : 0.5;

    allTimes.forEach(time => {

        const start = timeToMinutes(time);

        const previewSlots = getAppointmentSlots(
            time,
            previewDuration
        );

        const button = document.createElement("button");

        button.type = "button";
        button.textContent = time;
        button.classList.add("time-slot");

        const overlapsExistingBooking = previewSlots.some(slot =>
            bookedSet.has(slot)
        );

        const overlapsBlockedHours =
            appointmentOverlapsBlockedTime(
                selectedDate,
                previewSlots,
                time
            );

        const appointmentEnd =
            start + previewDuration * 60;

        const unavailable =
            overlapsExistingBooking ||
            overlapsBlockedHours ||
            isPastTime(selectedDate, time) ||
            appointmentEnd > CLOSING_MINUTES;

        if (unavailable) {

            button.disabled = true;
            button.classList.add("booked");

            // Keep the selection only while it remains available.
            if (selectedTime === time) {
                selectedTime = "";
            }

        } else {

            // Re-highlight the selected time after refreshing the slots.
            if (selectedTime === time) {
                button.classList.add("selected");
            }

            button.addEventListener("click", function () {

                document.querySelectorAll(".time-slot")
                    .forEach(slot => {
                        slot.classList.remove("selected");
                    });

                button.classList.add("selected");
                selectedTime = time;
            });
        }

        timeSlotsContainer.appendChild(button);
    });
}


// Load times for the selected date.

async function loadTimes(dateString, preserveSelection = false) {

    // Save the customer's current time only when refreshing because
    // a service, polish, design, or additional service changed.
    const previousTime = preserveSelection ? selectedTime : "";

    if (!preserveSelection) {
        selectedTime = "";
    }

    if (!timeSlotsContainer) return;

    timeSlotsContainer.innerHTML = "";

    if (!dateString) return;

    if (isDateBlocked(dateString)) {
        selectedTime = "";
        timeSlotsContainer.textContent =
            "This date is unavailable. Please choose another date.";
        return;
    }

    try {

        const booked = await getBookedAppointments();

        // Restore the selection before rendering. The renderer will
        // clear it only if the updated duration makes it unavailable.
        selectedTime = previousTime;

        renderTimeButtons(booked[dateString] || []);

    } catch (error) {

        console.error(
            "Unable to load appointment times:",
            error
        );

        timeSlotsContainer.textContent =
            "Unable to load appointment times. Please refresh and try again.";
    }
}
