
/* =========================================================
   ELIANA'S NAIL STUDIO
   COMPLETE BOOKING SYSTEM + SUPABASE AVAILABILITY
========================================================= */


/* =========================================================
   1. SUPABASE CONNECTION
========================================================= */

const SUPABASE_URL =
    "https://kyonstvpolakjhrecqcj.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_nsqFsxiE1238R9D4QZqiQA_bJfMioyd";

if (!window.supabase) {
    console.error(
        "Supabase library was not found. Check your Supabase CDN script."
    );
}

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

for (
    let minutes = 9 * 60;
    minutes <= 18 * 60;
    minutes += 30
) {
    allTimes.push(minutesToTime(minutes));
}

// Latest permitted appointment end time.

const CLOSING_MINUTES = timeToMinutes("8:30 PM");

// New weekly schedule begins November 16, 2026.

const WEEKLY_BLOCKING_START_DATE = "2026-11-16";

// Sunday = 0
// Monday = 1
// Tuesday = 2
// Wednesday = 3
// Thursday = 4
// Friday = 5
// Saturday = 6

// Sunday, Monday, Tuesday, and Friday are unavailable.

const PERMANENTLY_BLOCKED_WEEKDAYS = [
    0, 1, 2, 5
];

// Wednesday: only 9 AM appointment starts.
// Thursday: only 9 AM appointment starts.
//
// These restrictions apply to appointment START TIMES.
// A 9 AM appointment can continue for its full duration.

const WEEKLY_BLOCKED_HOURS = {
    3: {
        start: "10:00 AM",
        end: "11:59 PM"
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
    "Acrylic": 2.5
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

let availabilityRequestNumber = 0;

const timeSlotsContainer =
    document.getElementById("timeSlots");


/* =========================================================
   4. TIME AND DATE HELPERS
========================================================= */

function timeToMinutes(time) {

    if (!time) return 0;

    const value = String(time).trim();

    // Supabase TIME format: 09:00 or 09:00:00.

    const sqlMatch = value.match(
        /^(\d{1,2}):(\d{2})(?::\d{2})?$/
    );

    if (sqlMatch) {
        return (
            Number(sqlMatch[1]) * 60 +
            Number(sqlMatch[2])
        );
    }

    // Display format: 9:00 AM.

    const displayMatch = value.match(
        /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
    );

    if (!displayMatch) return 0;

    let hour = Number(displayMatch[1]);

    const minute = Number(displayMatch[2]);

    const ampm = displayMatch[3].toUpperCase();

    if (ampm === "PM" && hour !== 12) {
        hour += 12;
    }

    if (ampm === "AM" && hour === 12) {
        hour = 0;
    }

    return hour * 60 + minute;
}


function minutesToTime(totalMinutes) {

    const hour = Math.floor(totalMinutes / 60);

    const minute = totalMinutes % 60;

    const ampm = hour >= 12 ? "PM" : "AM";

    let displayHour = hour % 12;

    if (displayHour === 0) {
        displayHour = 12;
    }

    return `${displayHour}:${String(minute).padStart(2, "0")} ${ampm}`;
}


function minutesToSQLTime(totalMinutes) {

    const hour = Math.floor(totalMinutes / 60);

    const minute = totalMinutes % 60;

    return (
        String(hour).padStart(2, "0") +
        ":" +
        String(minute).padStart(2, "0") +
        ":00"
    );
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

    const [year, month, day] =
        dateString.split("-").map(Number);

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


function rangesOverlap(
    startA,
    endA,
    startB,
    endB
) {
    return startA < endB && endA > startB;
}


/* =========================================================
   5. LOAD AVAILABILITY FROM SUPABASE
========================================================= */

async function loadAvailabilitySettings() {

    if (!supabaseClient) {
        throw new Error("Supabase is not connected.");
    }

    const [
        blocksResult,
        weekdaysResult
    ] = await Promise.all([

        supabaseClient
            .from("availability_blocks")
            .select(
                "id, blocked_date, start_time, end_time, all_day, reason"
            ),

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

    databaseBlockedWeekdays =
        (weekdaysResult.data || [])
            .map(row => Number(row.weekday))
            .filter(day =>
                Number.isInteger(day) &&
                day >= 0 &&
                day <= 6
            );
}


// Get all individual blocks for a date.

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

        if (
            PERMANENTLY_BLOCKED_WEEKDAYS.includes(weekday)
        ) {
            return true;
        }

        if (
            databaseBlockedWeekdays.includes(weekday)
        ) {
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

// Check the starting 30-minute slot against weekly
// restrictions and individual date-specific blocks.
//
// Wednesday and Thursday only permit 9 AM starts.
// A 9 AM appointment may continue beyond the blocked
// starting-time window.

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

        const weeklyBlock =
            WEEKLY_BLOCKED_HOURS[date.getDay()];

        if (weeklyBlock) {

            const weeklyStart =
                timeToMinutes(weeklyBlock.start);

            const weeklyEnd =
                timeToMinutes(weeklyBlock.end);

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

    // Individual Supabase blocks.

    return getBlocksForDate(dateString).some(block => {

        if (block.all_day === true) {
            return true;
        }

        if (!block.start_time || !block.end_time) {
            return false;
        }

        const blockStart =
            timeToMinutes(block.start_time);

        const blockEnd =
            timeToMinutes(block.end_time);

        return rangesOverlap(
            startMinutes,
            endMinutes,
            blockStart,
            blockEnd
        );
    });
}


// Check the proposed appointment starting time.

function appointmentOverlapsBlockedTime(
    dateString,
    appointmentStartTime
) {

    const date = dateStringToLocalDate(dateString);

    const startMinutes =
        timeToMinutes(appointmentStartTime);

    // Thursday 9 AM exception.

    const allowThursdayNineAM =
        dateString >= WEEKLY_BLOCKING_START_DATE &&
        date.getDay() === 4 &&
        startMinutes === 9 * 60;

    return isTimeRangeBlocked(
        dateString,
        startMinutes,
        startMinutes + 30,
        allowThursdayNineAM
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

        // Ignore cancelled appointments.

        if (
            ["cancelled", "canceled", "deleted"].includes(status)
        ) {
            return;
        }

        if (!bookedByDate[appointment.date]) {
            bookedByDate[appointment.date] = [];
        }

        // Use saved blocked_times when available.

        if (
            Array.isArray(appointment.blocked_times) &&
            appointment.blocked_times.length
        ) {

            bookedByDate[appointment.date].push(
                ...appointment.blocked_times
            );

            return;
        }

        // Fallback for older appointments without blocked_times.
        // Reconstruct their occupied slots from duration.

        const duration = Number(appointment.duration) || 1;

        const occupiedSlots = getAppointmentSlots(
            appointment.time,
            duration
        );

        bookedByDate[appointment.date].push(
            ...occupiedSlots
        );
    });

    return bookedByDate;
}


/* =========================================================
   9. APPOINTMENT DURATION HELPERS
========================================================= */

// Get the duration of one selection.
// Unknown or empty selections add no extra time.

function getSelectionDuration(value) {

    if (!value) return 0;

    return serviceDurations[value] || 0;
}


// Calculate one service's duration.
//
// The main service, polish, and design are treated as
// selections within the same service. The longest one
// determines the duration.

function getSingleServiceDuration(
    service,
    polish,
    design
) {

    const durations = [
        getSelectionDuration(service),
        getSelectionDuration(polish),
        getSelectionDuration(design)
    ];

    const duration = Math.max(...durations);

    return duration > 0 ? duration : 1;
}


// Calculate the duration of one additional service.

function getAdditionalServiceDuration(item) {

    if (!item) return 0;

    return getSingleServiceDuration(
        item.service,
        item.polish,
        item.design
    );
}


// Calculate the entire appointment duration.
//
// Main service duration + each additional service duration.

function calculateAppointmentDuration(
    service,
    polish,
    design
) {

    let duration = getSingleServiceDuration(
        service,
        polish,
        design
    );

    selectedAdditionalServices.forEach(item => {

        duration += getAdditionalServiceDuration(item);

    });

    return duration;
}


// Calculate every half-hour occupied by an appointment.

function getAppointmentSlots(
    startTime,
    durationHours
) {

    const slotCount =
        Math.ceil(durationHours * 2);

    const startMinutes =
        timeToMinutes(startTime);

    const slots = [];

    for (
        let index = 0;
        index < slotCount;
        index++
    ) {

        slots.push(
            minutesToTime(
                startMinutes + index * 30
            )
        );
    }

    return slots;
}


// Normalize booked times.

function getBookedTimeSet(bookedTimes) {

    return new Set(
        (bookedTimes || []).map(time =>
            timeToMinutes(time)
        )
    );
}


/* =========================================================
   10. DATE PICKER
========================================================= */

function initializeDatePicker() {

    const dateInput =
        document.getElementById("appointmentDate");

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

        dateInput.addEventListener(
            "change",
            async function () {

                selectedDate = dateInput.value;

                selectedTime = "";

                await loadTimes(selectedDate);
            }
        );
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

    const bookedSet =
        getBookedTimeSet(bookedTimes);

    const service =
        document.getElementById("serviceSelect")?.value || "";

    const polish =
        document.getElementById("polishSelect")?.value || "";

    const design =
        document.getElementById("designSelect")?.value || "";

    // Use a short preview only until a service is selected.

    const hasServiceSelection =
        Boolean(service || polish || design);

    const previewDuration = hasServiceSelection
        ? calculateAppointmentDuration(
            service,
            polish,
            design
        )
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

        // Check conflicts across the complete duration.

        const overlapsExistingBooking =
            previewSlots.some(slot =>
                bookedSet.has(timeToMinutes(slot))
            );

        // Check weekly and date-specific restrictions
        // for the appointment's starting slot.

        const overlapsBlockedHours =
            appointmentOverlapsBlockedTime(
                selectedDate,
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

            if (selectedTime === time) {
                selectedTime = "";
            }

        } else {

            if (selectedTime === time) {
                button.classList.add("selected");
            }

            button.addEventListener(
                "click",
                function () {

                    document.querySelectorAll(".time-slot")
                        .forEach(slot => {
                            slot.classList.remove("selected");
                        });

                    button.classList.add("selected");

                    selectedTime = time;
                }
            );
        }

        timeSlotsContainer.appendChild(button);
    });
}


/* =========================================================
   12. LOAD TIMES FOR SELECTED DATE
========================================================= */

async function loadTimes(
    dateString,
    preserveSelection = false
) {

    const requestNumber =
        ++availabilityRequestNumber;

    const previousTime =
        preserveSelection ? selectedTime : "";

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

        // Ignore outdated requests.

        if (
            requestNumber !== availabilityRequestNumber
        ) {
            return;
        }

        selectedTime = previousTime;

        renderTimeButtons(
            booked[dateString] || []
        );

    } catch (error) {

        console.error(
            "Unable to load appointment times:",
            error
        );

        timeSlotsContainer.textContent =
            "Unable to load appointment times. Please refresh and try again.";
    }
}


/* =========================================================
   13. ADDITIONAL SERVICES POPUP
========================================================= */

window.openAdditionalServicePopup = function () {

    const popup = document.getElementById(
        "additionalServicePopup"
    );

    if (popup) {
        popup.style.display = "flex";
    }
};


window.closeAdditionalServicePopup = function () {

    const popup = document.getElementById(
        "additionalServicePopup"
    );

    if (popup) {
        popup.style.display = "none";
    }
};


window.saveAdditionalServiceOptions = function () {

    const serviceElement = document.getElementById(
        "additionalServiceType"
    );

    const polishElement = document.getElementById(
        "additionalPolishSelect"
    );

    const designElement = document.getElementById(
        "additionalDesignSelect"
    );

    const detailsElement = document.getElementById(
        "additionalDesignDetails"
    );

    if (!serviceElement) {

        console.error(
            "Additional service field was not found."
        );

        return;
    }

    const service = serviceElement.value;

    const polish = polishElement
        ? polishElement.value
        : "";

    const design = designElement
        ? designElement.value
        : "";

    const designDetails = detailsElement
        ? detailsElement.value.trim()
        : "";

    if (!service) {

        alert("Please select an additional service.");

        return;
    }

    selectedAdditionalServices.push({
        service,
        polish,
        design,
        designDetails
    });

    renderAdditionalServices();

    serviceElement.value = "";

    if (polishElement) {
        polishElement.value = "";
    }

    if (designElement) {
        designElement.value = "";
    }

    if (detailsElement) {
        detailsElement.value = "";
    }

    window.closeAdditionalServicePopup();

    // Refresh times while preserving the selected start time
    // if the new duration still fits.

    if (selectedDate) {
        loadTimes(selectedDate, true);
    }
};


// Display selected additional services.

function renderAdditionalServices() {

    const container = document.getElementById(
        "selectedAdditionalServices"
    );

    if (!container) return;

    container.innerHTML = "";

    selectedAdditionalServices.forEach(
        (item, index) => {

            const wrapper =
                document.createElement("div");

            wrapper.className =
                "selected-additional-service";

            const info =
                document.createElement("div");

            info.className =
                "additional-service-info";

            const title =
                document.createElement("strong");

            title.textContent = item.service;

            const details =
                document.createElement("span");

            const detailParts = [
                item.polish,
                item.design,
                item.designDetails
            ].filter(Boolean);

            details.textContent =
                detailParts.length
                    ? " • " + detailParts.join(" • ")
                    : "";

            info.appendChild(title);
            info.appendChild(details);

            const duration =
                getAdditionalServiceDuration(item);

            const durationLabel =
                document.createElement("span");

            durationLabel.textContent =
                ` (${duration} hr)`;

            info.appendChild(durationLabel);

            const removeButton =
                document.createElement("button");

            removeButton.type = "button";
            removeButton.textContent = "×";

            removeButton.setAttribute(
                "aria-label",
                `Remove ${item.service}`
            );

            removeButton.addEventListener(
                "click",
                function () {
                    window.removeAdditionalService(index);
                }
            );

            wrapper.appendChild(info);
            wrapper.appendChild(removeButton);

            container.appendChild(wrapper);
        }
    );
}


// Remove an additional service.

window.removeAdditionalService = function (index) {

    selectedAdditionalServices.splice(index, 1);

    renderAdditionalServices();

    if (selectedDate) {
        loadTimes(selectedDate, true);
    }
};


/* =========================================================
   14. BOOKING CONFIRMATION POPUP
========================================================= */

window.closePopup = function () {

    const popup = document.getElementById(
        "bookingPopup"
    );

    if (popup) {
        popup.style.display = "none";
    }
};


/* =========================================================
   15. BOOK APPOINTMENT
========================================================= */

window.bookAppointment = async function () {

    if (!supabaseClient) {

        alert("The booking system is not connected.");

        return;
    }

    try {

        // Verify customer login.

        const {
            data: { user },
            error: userError
        } = await supabaseClient.auth.getUser();

        if (userError || !user) {

            alert(
                "Please log in or create an account before booking."
            );

            window.location.href = "login.html";

            return;
        }


        // Get form fields.

        const nameElement =
            document.getElementById("clientName");

        const phoneElement =
            document.getElementById("clientPhone");

        const serviceElement =
            document.getElementById("serviceSelect");

        const polishElement =
            document.getElementById("polishSelect");

        const designElement =
            document.getElementById("designSelect");


        const name = nameElement
            ? nameElement.value.trim()
            : "";

        const phone = phoneElement
            ? phoneElement.value.trim()
            : "";

        const service = serviceElement
            ? serviceElement.value
            : "";

        const polish = polishElement
            ? polishElement.value
            : "";

        const design = designElement
            ? designElement.value
            : "";


        // Validate required fields.

        if (!name) {

            alert("Please enter your name.");

            return;
        }

        if (!phone) {

            alert("Please enter your phone number.");

            return;
        }

        if (!selectedDate || !selectedTime) {

            alert("Please select an appointment date and time.");

            return;
        }

        if (!service || !design) {

            alert("Please select a service and design.");

            return;
        }

        if (isPastTime(selectedDate, selectedTime)) {

            alert(
                "That time has already passed. Please choose another time."
            );

            await loadTimes(selectedDate);

            return;
        }


        // Refresh availability before saving.

        await loadAvailabilitySettings();


        // Check whether the entire date is blocked.

        if (isDateBlocked(selectedDate)) {

            alert(
                "This date is unavailable. Please choose another date."
            );

            await loadTimes(selectedDate);

            if (datePicker) {
                datePicker.redraw();
            }

            return;
        }


        // Calculate the complete appointment duration.

        const duration = calculateAppointmentDuration(
            service,
            polish,
            design
        );

        // Calculate all occupied 30-minute slots.

        const timesToBook = getAppointmentSlots(
            selectedTime,
            duration
        );

        const appointmentStart =
            timeToMinutes(selectedTime);

        const appointmentEnd =
            appointmentStart + duration * 60;


        // Check closing time.

        if (appointmentEnd > CLOSING_MINUTES) {

            alert(
                "This appointment would extend beyond closing time. Please choose an earlier appointment."
            );

            return;
        }


        // Check appointment starting time against weekly
        // restrictions and individual date-specific blocks.

        if (
            appointmentOverlapsBlockedTime(
                selectedDate,
                selectedTime
            )
        ) {

            alert(
                "That appointment start time is unavailable. Please choose another time."
            );

            await loadTimes(selectedDate);

            return;
        }


        // Check existing appointments across the FULL
        // calculated appointment duration.

        const bookedAppointments =
            await getBookedAppointments();

        const bookedTimes =
            bookedAppointments[selectedDate] || [];

        const bookedSet =
            getBookedTimeSet(bookedTimes);

        const hasBookingConflict =
            timesToBook.some(time =>
                bookedSet.has(timeToMinutes(time))
            );

        if (hasBookingConflict) {

            alert(
                "One or more of those time slots have already been booked. Please choose another time."
            );

            await loadTimes(selectedDate);

            return;
        }


        // Prepare appointment for Supabase.

        const appointment = {

            user_id: user.id,

            name: name,

            phone: phone,

            date: selectedDate,

            time: minutesToSQLTime(appointmentStart),

            duration: duration,

            blocked_times: timesToBook.map(time =>
                minutesToSQLTime(timeToMinutes(time))
            ),

            service: service,

            polish: polish,

            design: design,

            additional_services:
                selectedAdditionalServices,

            notes: "",

            status: "active",

            created_at: new Date().toISOString()
        };


        // Save appointment.

        const { error: insertError } =
            await supabaseClient
                .from("appointments")
                .insert([appointment]);


        if (insertError) {

            console.error(
                "Supabase booking error:",
                insertError
            );

            alert(
                insertError.message ||
                "Your appointment could not be saved. Please try again."
            );

            return;
        }


        // Show confirmation.

        const confirmationPopup =
            document.getElementById("bookingPopup");

        if (confirmationPopup) {

            confirmationPopup.style.display = "flex";

        } else {

            alert("Your appointment has been booked!");
        }


        // Reset form fields.

        if (nameElement) {
            nameElement.value = "";
        }

        if (phoneElement) {
            phoneElement.value = "";
        }

        if (serviceElement) {
            serviceElement.value = "";
        }

        if (polishElement) {
            polishElement.value = "";
        }

        if (designElement) {
            designElement.value = "";
        }


        // Reset booking selections.

        selectedDate = "";
        selectedTime = "";
        selectedAdditionalServices = [];

        renderAdditionalServices();


        const dateInput =
            document.getElementById("appointmentDate");

        if (dateInput) {
            dateInput.value = "";
        }

        if (datePicker) {
            datePicker.clear();
        }

        if (timeSlotsContainer) {
            timeSlotsContainer.innerHTML = "";
        }

    } catch (error) {

        console.error(
            "Booking error:",
            error
        );

        alert(
            "Something went wrong while booking. Please refresh the page and try again."
        );
    }
};


/* =========================================================
   16. MOBILE NAVIGATION
========================================================= */

function initializeMobileNavigation() {

    const nav = document.querySelector("nav");

    const menuButton =
        document.querySelector(".mobile-menu-btn");

    const scrollArrow =
        document.getElementById("scrollArrow");


    if (menuButton && nav) {

        menuButton.addEventListener(
            "click",
            function () {

                const isOpen =
                    nav.classList.toggle("mobile-open");

                document.body.classList.toggle(
                    "menu-open",
                    isOpen
                );

                menuButton.innerHTML =
                    isOpen ? "✕" : "☰";

                menuButton.setAttribute(
                    "aria-expanded",
                    String(isOpen)
                );
            }
        );
    }


    document.querySelectorAll("nav a").forEach(link => {

        link.addEventListener(
            "click",
            function () {

                if (nav) {
                    nav.classList.remove("mobile-open");
                }

                document.body.classList.remove("menu-open");

                if (menuButton) {

                    menuButton.innerHTML = "☰";

                    menuButton.setAttribute(
                        "aria-expanded",
                        "false"
                    );
                }
            }
        );
    });


    if (scrollArrow) {

        scrollArrow.addEventListener(
            "click",
            function () {

                document.body.style.overflow = "auto";

                document.body.classList.remove("lock-scroll");
            }
        );
    }


    if (
        document.body.classList.contains("home-page")
    ) {

        document.body.style.overflow = "auto";
    }
}


/* =========================================================
   17. INITIALIZE BOOKING SYSTEM
========================================================= */

async function initializeBookingSystem() {

    initializeMobileNavigation();

    if (!supabaseClient) {

        console.error(
            "Supabase is not connected. Make sure the Supabase JS library loads before this file."
        );

        return;
    }

    try {

        // Load availability before initializing calendar.

        await loadAvailabilitySettings();

        initializeDatePicker();


        // Refresh times when service selections change.

        [
            "serviceSelect",
            "polishSelect",
            "designSelect"
        ].forEach(id => {

            const element =
                document.getElementById(id);

            if (element) {

                element.addEventListener(
                    "change",
                    function () {

                        if (selectedDate) {

                            // Keep the selected start time if it
                            // remains available for the new duration.

                            loadTimes(selectedDate, true);
                        }
                    }
                );
            }
        });


        console.log(
            "Supabase appointment availability loaded."
        );

    } catch (error) {

        console.error(
            "Could not initialize booking availability:",
            error
        );

        const dateInput =
            document.getElementById("appointmentDate");

        if (dateInput) {

            dateInput.disabled = true;

            dateInput.title =
                "Availability could not be loaded. Please refresh the page.";
        }

        if (timeSlotsContainer) {

            timeSlotsContainer.textContent =
                "Appointment availability could not be loaded. Please refresh the page.";
        }
    }
}


/* =========================================================
   18. START WHEN PAGE LOADS
========================================================= */

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initializeBookingSystem
    );

} else {

    initializeBookingSystem();
}
