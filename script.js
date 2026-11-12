
/* =========================================================
   ELIANA'S NAIL STUDIO
   BOOKING SYSTEM + SUPABASE AVAILABILITY
========================================================= */


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

    databaseBlockedWeekdays = (weekdaysResult.data || [])
        .map(row => Number(row.weekday))
        .filter(day =>
            Number.isInteger(day) &&
            day >= 0 &&
            day <= 6
        );
}


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

    if (dateString >= WEEKLY_BLOCKING_START_DATE) {

        if (PERMANENTLY_BLOCKED_WEEKDAYS.includes(weekday)) {
            return true;
        }

        if (databaseBlockedWeekdays.includes(weekday)) {
            return true;
        }
    }

    return getBlocksForDate(dateString).some(
        block => block.all_day === true
    );
}


/* =========================================================
   7. CHECK TIME AVAILABILITY
========================================================= */

function isTimeRangeBlocked(
    dateString,
    startMinutes,
    endMinutes,
    ignoreWeeklyBlock = false
) {

    if (!dateString) return false;

    const date = dateStringToLocalDate(dateString);

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


function appointmentOverlapsBlockedTime(
    dateString,
    slots,
    appointmentStartTime
) {

    const date = dateStringToLocalDate(dateString);

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
