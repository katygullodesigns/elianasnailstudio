/* =========================================================
   ELIANA'S NAIL STUDIO
   BOOKING SYSTEM + SUPABASE AVAILABILITY
========================================================= */


/* 1. SUPABASE CONNECTION */

const SUPABASE_URL = "https://kyonstvpolakjhrecqcj.supabase.co";

const SUPABASE_ANON_KEY = "sb_publishable_nsqFsxiE1238R9D4QZqiQA_bJfMioyd";

const supabaseClient = window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;


/* 2. BUSINESS SETTINGS */

// Appointment start times: 9 AM–8 PM, every 30 minutes.
const allTimes = [];

for (let minutes = 9 * 60; minutes <= 20 * 60; minutes += 30) {
    allTimes.push(minutesToTime(minutes));
}

// Latest permitted appointment end time.
const CLOSING_MINUTES = timeToMinutes("8:30 PM");

// Sundays are permanently unavailable.
const PERMANENTLY_BLOCKED_WEEKDAYS = [0];

// RECURRING WEEKLY UNAVAILABLE HOURS
// Sunday = 0, Monday = 1, Tuesday = 2, etc.

const WEEKLY_BLOCKED_HOURS = {
    1: { start: "10:00 AM", end: "7:00 PM" }, // Monday
    2: { start: "10:00 AM", end: "7:00 PM" }, // Tuesday
    3: { start: "1:00 PM", end: "7:00 PM" },  // Wednesday
    4: { start: "1:00 PM", end: "7:00 PM" },  // Thursday
    5: { start: "9:00 AM", end: "5:00 PM" }   // Friday
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


/* 3. BOOKING STATE */

let selectedDate = "";
let selectedTime = "";
let selectedAdditionalServices = [];

let availabilityBlocks = [];
let blockedWeekdays = [...PERMANENTLY_BLOCKED_WEEKDAYS];

let datePicker = null;

const timeSlotsContainer = document.getElementById("timeSlots");


/* 4. TIME AND DATE HELPERS */

function timeToMinutes(time) {
    if (!time) return 0;

    const value = String(time).trim();

    // Supabase TIME format: 12:00:00 or 14:30
    const sqlMatch = value.match(
        /^(\d{1,2}):(\d{2})(?::\d{2})?$/
    );

    if (sqlMatch) {
        return Number(sqlMatch[1]) * 60 +
            Number(sqlMatch[2]);
    }

    // Display format: 12:00 PM
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


/* 5. LOAD AVAILABILITY FROM SUPABASE */

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
        console.error("availability_blocks error:", blocksResult.error);
        throw blocksResult.error;
    }

    if (weekdaysResult.error) {
        console.error("blocked_weekdays error:", weekdaysResult.error);
        throw weekdaysResult.error;
    }

    availabilityBlocks = blocksResult.data || [];

    const databaseWeekdays = (weekdaysResult.data || [])
        .map(row => Number(row.weekday))
        .filter(day =>
            Number.isInteger(day) &&
            day >= 0 &&
            day <= 6
        );

    blockedWeekdays = [
        ...new Set([
            ...PERMANENTLY_BLOCKED_WEEKDAYS,
            ...databaseWeekdays
        ])
    ];
}


// Get all blocked entries for a specific date.
function getBlocksForDate(dateString) {
    return availabilityBlocks.filter(
        block => block.blocked_date === dateString
    );
}


// Check whether an entire date is unavailable.
function isDateBlocked(dateString) {
    if (!dateString) return false;

    const date = dateStringToLocalDate(dateString);

    if (blockedWeekdays.includes(date.getDay())) {
        return true;
    }

    return getBlocksForDate(dateString).some(
        block => block.all_day === true
    );
}


// Check weekly restrictions AND date-specific Supabase blocks.
function isTimeRangeBlocked(
    dateString,
    startMinutes,
    endMinutes
) {
    if (!dateString) return false;

    const date = dateStringToLocalDate(dateString);

    // Check recurring weekly unavailable hours.
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

    // Check date-specific Supabase blocks.
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


/* 6. LOAD EXISTING APPOINTMENTS */

async function getBookedAppointments() {
    if (!supabaseClient) {
        throw new Error("Supabase is not connected.");
    }

const { data, error } = await supabaseClient
    .from("appointments")
    .select("*");

    if (error) {
        console.error("Could not load appointments:", error);
        throw error;
    }

    const bookedByDate = {};

    (data || []).forEach(appointment => {

        if (!appointment.date) return;

        // Ignore cancelled appointments.
        const status = String(appointment.status || "").toLowerCase();

        if (["cancelled", "canceled", "deleted"].includes(status)) {
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


/* 7. APPOINTMENT DURATION HELPERS */

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
    slots
) {
    return slots.some(time => {

        const start = timeToMinutes(time);

        return isTimeRangeBlocked(
            dateString,
            start,
            start + 30
        );
    });
}


/* 8. DATE PICKER */

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
                    const dateString = getDateFromPickerDate(date);

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


/* 9. DISPLAY AVAILABLE APPOINTMENT TIMES */

function renderTimeButtons(bookedTimes) {
    if (!timeSlotsContainer) return;

    timeSlotsContainer.innerHTML = "";

    if (!selectedDate) return;

    if (isDateBlocked(selectedDate)) {
        timeSlotsContainer.textContent =
            "This date is unavailable. Please choose another date.";

        return;
    }

    const bookedSet = new Set(bookedTimes || []);

    // Get the selected service duration.
    const service = document.getElementById("serviceSelect")?.value || "";
    const polish = document.getElementById("polishSelect")?.value || "";
    const design = document.getElementById("designSelect")?.value || "";

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

        // Check the entire appointment duration.
        const overlapsExistingBooking = previewSlots.some(slot =>
            bookedSet.has(slot)
        );

        const overlapsBlockedHours = appointmentOverlapsBlockedTime(
            selectedDate,
            previewSlots
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

        } else {

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
async function loadTimes(dateString) {
    selectedTime = "";

    if (!timeSlotsContainer) return;

    timeSlotsContainer.innerHTML = "";

    if (!dateString) return;

    if (isDateBlocked(dateString)) {
        timeSlotsContainer.textContent =
            "This date is unavailable. Please choose another date.";

        return;
    }

    try {

        const booked = await getBookedAppointments();

        renderTimeButtons(booked[dateString] || []);

    } catch (error) {

        console.error("Unable to load appointment times:", error);

        timeSlotsContainer.textContent =
            "Unable to load appointment times. Please refresh and try again.";
    }
}


/* 10. ADDITIONAL SERVICES POPUP */

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
        console.error("Additional service field was not found.");
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

    if (polishElement) polishElement.value = "";
    if (designElement) designElement.value = "";
    if (detailsElement) detailsElement.value = "";

    window.closeAdditionalServicePopup();

    // Refresh times because the appointment duration changed.
    if (selectedDate) {
        loadTimes(selectedDate);
    }
};


// Display selected additional services.
function renderAdditionalServices() {

    const container = document.getElementById(
        "selectedAdditionalServices"
    );

    if (!container) return;

    container.innerHTML = "";

    selectedAdditionalServices.forEach((item, index) => {

        const wrapper = document.createElement("div");

        wrapper.className = "selected-additional-service";

        const info = document.createElement("div");

        info.className = "additional-service-info";

        const title = document.createElement("strong");

        title.textContent = item.service;

        const details = document.createElement("span");

        const detailParts = [
            item.polish,
            item.design,
            item.designDetails
        ].filter(Boolean);

        details.textContent = detailParts.length
            ? " • " + detailParts.join(" • ")
            : "";

        info.appendChild(title);
        info.appendChild(details);

        const removeButton = document.createElement("button");

        removeButton.type = "button";
        removeButton.textContent = "×";

        removeButton.setAttribute(
            "aria-label",
            `Remove ${item.service}`
        );

        removeButton.addEventListener("click", function () {
            window.removeAdditionalService(index);
        });

        wrapper.appendChild(info);
        wrapper.appendChild(removeButton);

        container.appendChild(wrapper);
    });
}


// Remove an additional service.
window.removeAdditionalService = function (index) {

    selectedAdditionalServices.splice(index, 1);

    renderAdditionalServices();

    if (selectedDate) {
        loadTimes(selectedDate);
    }
};


/* 11. BOOKING CONFIRMATION POPUP */

window.closePopup = function () {

    const popup = document.getElementById("bookingPopup");

    if (popup) {
        popup.style.display = "none";
    }
};


/* 12. BOOK APPOINTMENT */

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
        const nameElement = document.getElementById("clientName");
        const phoneElement = document.getElementById("clientPhone");
        const serviceElement = document.getElementById("serviceSelect");
        const polishElement = document.getElementById("polishSelect");
        const designElement = document.getElementById("designSelect");

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


        // Check whether the entire day is blocked.
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


        // Calculate appointment duration.
        const duration = calculateAppointmentDuration(
            service,
            polish,
            design
        );

        const timesToBook = getAppointmentSlots(
            selectedTime,
            duration
        );

        const appointmentEnd =
            timeToMinutes(selectedTime) + duration * 60;


        // Check closing time.
        if (appointmentEnd > CLOSING_MINUTES) {

            alert(
                "This appointment would extend beyond closing time. Please choose an earlier appointment."
            );

            return;
        }


        // Check weekly hours and Supabase blocked time intervals.
        if (
            appointmentOverlapsBlockedTime(
                selectedDate,
                timesToBook
            )
        ) {

            alert(
                "That appointment overlaps with your unavailable hours. Please choose another time."
            );

            await loadTimes(selectedDate);

            return;
        }


        // Check existing appointments.
        const bookedAppointments = await getBookedAppointments();

        const bookedTimes =
            bookedAppointments[selectedDate] || [];

        const hasBookingConflict = timesToBook.some(
            time => bookedTimes.includes(time)
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

            time: selectedTime,

            duration: duration,

            blocked_times: timesToBook,

            service: service,

            polish: polish,

            design: design,

            additional_services: selectedAdditionalServices,

            notes: "",

            status: "active",

            created_at: new Date().toISOString()
        };


        // Save appointment.
        const { error: insertError } = await supabaseClient
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
        const confirmationPopup = document.getElementById(
            "bookingPopup"
        );

        if (confirmationPopup) {

            confirmationPopup.style.display = "flex";

        } else {

            alert("Your appointment has been booked!");
        }


        // Reset form.
        if (nameElement) nameElement.value = "";
        if (phoneElement) phoneElement.value = "";
        if (serviceElement) serviceElement.value = "";
        if (polishElement) polishElement.value = "";
        if (designElement) designElement.value = "";


        // Reset booking selections.
        selectedDate = "";
        selectedTime = "";
        selectedAdditionalServices = [];

        renderAdditionalServices();


        const dateInput = document.getElementById(
            "appointmentDate"
        );

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

        console.error("Booking error:", error);

        alert(
            "Something went wrong while booking. Please refresh the page and try again."
        );
    }
};


/* 13. MOBILE NAVIGATION */

function initializeMobileNavigation() {

    const nav = document.querySelector("nav");

    const menuButton = document.querySelector(
        ".mobile-menu-btn"
    );

    const scrollArrow = document.getElementById(
        "scrollArrow"
    );


    if (menuButton && nav) {

        menuButton.addEventListener("click", function () {

            const isOpen = nav.classList.toggle(
                "mobile-open"
            );

            document.body.classList.toggle(
                "menu-open",
                isOpen
            );

            menuButton.innerHTML = isOpen ? "✕" : "☰";

            menuButton.setAttribute(
                "aria-expanded",
                String(isOpen)
            );
        });
    }


    document.querySelectorAll("nav a").forEach(link => {

        link.addEventListener("click", function () {

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
        });
    });


    if (scrollArrow) {

        scrollArrow.addEventListener("click", function () {

            document.body.style.overflow = "auto";

            document.body.classList.remove("lock-scroll");
        });
    }


    if (document.body.classList.contains("home-page")) {

        document.body.style.overflow = "auto";
    }
}


/* 14. INITIALIZE BOOKING SYSTEM */

async function initializeBookingSystem() {

    initializeMobileNavigation();

    if (!supabaseClient) {

        console.error(
            "Supabase is not connected. Make sure the Supabase JS library loads before this file."
        );

        return;
    }

    try {

        // Load availability before initializing the calendar.
        await loadAvailabilitySettings();

        initializeDatePicker();

        // Refresh displayed times when a service selection changes.
        ["serviceSelect", "polishSelect", "designSelect"].forEach(id => {

            const element = document.getElementById(id);

            if (element) {

                element.addEventListener("change", function () {

                    if (selectedDate) {
                        loadTimes(selectedDate);
                    }
                });
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

        const dateInput = document.getElementById(
            "appointmentDate"
        );

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


/* 15. START WHEN PAGE LOADS */

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initializeBookingSystem
    );

} else {

    initializeBookingSystem();
}
