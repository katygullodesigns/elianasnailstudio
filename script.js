/* ==========================================
   SUPABASE CONNECTION
========================================== */

const SUPABASE_URL =
    "https://kyonstvpolakjhrecqcj.supabase.co";

const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXMiLCJyZWYiOiJreW9uc3R2cG9sYWtqaHJlY3FjaiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzgxNjk2MTI1LCJleHAiOjIwOTcyNzIxMjV9.oq6v7gEy8FJPh4NI3ngUYybwJcHF6rW6qkNtepCxr7Y";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

console.log("Eliana's Nail Studio Loaded");


/* ==========================================
   HOME PAGE SCROLL
========================================== */

if (document.body.classList.contains("home-page")) {
    document.body.style.overflow = "auto";
}

const scrollArrow = document.getElementById("scrollArrow");

if (scrollArrow) {
    scrollArrow.addEventListener("click", function () {
        document.body.style.overflow = "auto";
        document.body.classList.remove("lock-scroll");
    });
}


/* ==========================================
   MOBILE NAVIGATION
========================================== */

function toggleMenu() {
    const nav = document.querySelector("nav");
    const btn = document.querySelector(".mobile-menu-btn");

    if (!nav) return;

    nav.classList.toggle("mobile-open");
    document.body.classList.toggle("menu-open");

    if (btn) {
        btn.innerHTML = nav.classList.contains("mobile-open")
            ? "✕"
            : "☰";
    }
}


/* ==========================================
   BOOKING SYSTEM
========================================== */

document.addEventListener("DOMContentLoaded", function () {

    /* ==========================================
       MOBILE MENU
    ========================================== */

    document.querySelectorAll("nav a").forEach(function (link) {
        link.addEventListener("click", function () {
            const nav = document.querySelector("nav");
            const btn = document.querySelector(".mobile-menu-btn");

            if (nav) nav.classList.remove("mobile-open");

            document.body.classList.remove("menu-open");

            if (btn) btn.innerHTML = "☰";
        });
    });


    /* ==========================================
       BOOKING VARIABLES
    ========================================== */

    let selectedDate = "";
    let selectedTime = "";
    let selectedAdditionalServices = [];

    const timeSlots = document.getElementById("timeSlots");


    /* ==========================================
       AVAILABLE APPOINTMENT TIMES
    ========================================== */

    const allTimes = [
        "8:00 AM",
        "8:30 AM",
        "9:00 AM",
        "9:30 AM",
        "10:00 AM",
        "10:30 AM",
        "11:00 AM",
        "11:30 AM",
        "12:00 PM",
        "12:30 PM",
        "1:00 PM",
        "1:30 PM",
        "2:00 PM",
        "2:30 PM",
        "3:00 PM",
        "3:30 PM",
        "4:00 PM",
        "4:30 PM",
        "5:00 PM",
        "5:30 PM",
        "6:00 PM",
        "6:30 PM",
        "7:00 PM",
        "7:30 PM",
        "8:00 PM"
    ];


    /* ==========================================
       BLOCKED DAYS AND TIMES
    ========================================== */

    // 0 = Sunday
    // 1 = Monday
    // 2 = Tuesday
    // 3 = Wednesday
    // 4 = Thursday
    // 5 = Friday
    // 6 = Saturday

    // RECURRING DAYS OFF

    const blockedWeekdays = [
        0
    ];

    // ENTIRE DAYS OFF
    // Format: YYYY-MM-DD

    const blockedDates = [
        "2026-12-25",
        "2026-12-26",
        "2027-01-01"
    ];

    // INDIVIDUAL BLOCKED TIMES
    // Add dates and times as needed.

    const blockedTimesByDate = {

        "2026-11-06": [
            "1:00 PM",
            "1:30 PM",
            "2:00 PM",
            "2:30 PM",
            "3:30 PM",
            "3:00 PM",
            "4:30 PM",
            "4:00 PM",
            "5:30 PM",
            "6:30 PM",
            "6:00 PM"
        ],

        "2026-11-04": [
            "1:00 PM",
            "1:30 PM",
            "2:00 PM",
            "2:30 PM",
            "3:30 PM",
            "3:00 PM",
            "4:30 PM",
            "4:00 PM",
            "5:30 PM",
            "6:30 PM",
            "6:00 PM"
        ],

       "2026-11-07": [
            "1:00 PM",
            "1:30 PM",
            "2:00 PM",
            "2:30 PM",
            "3:30 PM",
            "3:00 PM",
            "4:30 PM",
            "4:00 PM",
            "5:30 PM",
            "6:30 PM",
            "6:00 PM"
        ],
       
       "2026-11-09": [
            "1:00 PM",
            "1:30 PM",
            "2:00 PM",
            "2:30 PM",
            "3:30 PM",
            "3:00 PM",
            "4:30 PM",
            "4:00 PM",
            "5:30 PM",
            "6:30 PM",
            "6:00 PM"
        ],
       
       "2026-11-11": [
            "1:00 PM",
            "1:30 PM",
            "2:00 PM",
            "2:30 PM",
            "3:30 PM",
            "3:00 PM",
            "4:30 PM",
            "4:00 PM",
            "5:30 PM",
            "6:30 PM",
            "6:00 PM"
        ],

       "2026-11-13": [
            "1:00 PM",
            "1:30 PM",
            "2:00 PM",
            "2:30 PM",
            "3:30 PM",
            "3:00 PM",
            "4:30 PM",
            "4:00 PM",
            "5:30 PM",
            "6:30 PM",
            "6:00 PM"
        ],

       "2026-11-14": [
            "1:00 PM",
            "1:30 PM",
            "2:00 PM",
            "2:30 PM",
            "3:30 PM",
            "3:00 PM",
            "4:30 PM",
            "4:00 PM",
            "5:30 PM",
            "6:30 PM",
            "6:00 PM"
        ]

    };


    /* ==========================================
       SERVICE DURATIONS
    ========================================== */

    const serviceDurations = {
        "Manicure": 1.5,
        "Pedicure": 2.0,
        "Gel": 1.5,
        "Acrylic": 2.5,
        "Basic": 0.5,
        "Minimal Design": 1,
        "Max Design": 2.5
    };


    /* ==========================================
       CHECK BLOCKED DATES
    ========================================== */

    function isDateBlocked(dateString) {

        if (!dateString) return false;

        const [year, month, day] =
            dateString.split("-").map(Number);

        const date = new Date(year, month - 1, day);

        return (
            blockedDates.includes(dateString) ||
            blockedWeekdays.includes(date.getDay())
        );
    }


    /* ==========================================
       TIME TO MINUTES
    ========================================== */

    function timeToMinutes(time) {

        const match = time.match(
            /(\d+):(\d+)\s(AM|PM)/
        );

        if (!match) return 0;

        let hour = Number(match[1]);
        const minute = Number(match[2]);
        const ampm = match[3];

        if (ampm === "PM" && hour !== 12) {
            hour += 12;
        }

        if (ampm === "AM" && hour === 12) {
            hour = 0;
        }

        return hour * 60 + minute;
    }


    /* ==========================================
       FORMAT MINUTES AS TIME
    ========================================== */

    function minutesToTime(minutes) {

        const hour = Math.floor(minutes / 60);
        const minute = minutes % 60;

        const ampm = hour >= 12 ? "PM" : "AM";

        let displayHour = hour % 12;

        if (displayHour === 0) {
            displayHour = 12;
        }

        return (
            `${displayHour}:${String(minute).padStart(2, "0")} ${ampm}`
        );
    }


    /* ==========================================
       GET TODAY'S DATE
    ========================================== */

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


    /* ==========================================
       CHECK PAST APPOINTMENT TIMES
    ========================================== */

    function isPastTime(date, time) {

        if (!date || !time) return false;

        const todayString = getTodayString();

        if (date < todayString) return true;

        if (date > todayString) return false;

        const now = new Date();

        const currentMinutes =
            now.getHours() * 60 +
            now.getMinutes();

        return timeToMinutes(time) <= currentMinutes;
    }


    /* ==========================================
       GET BOOKED APPOINTMENTS
    ========================================== */

    async function getBookedAppointments() {

        const { data, error } = await supabaseClient
            .from("appointments")
            .select("*")
            .or("status.is.null,status.neq.past");

        if (error) {

            console.error("Supabase read error:", error);

            throw error;
        }

        const bookedAppointments = {};

        data.forEach(function (appointment) {

            const blockedTimes =
                appointment.blockedTimes ||
                appointment.blocked_times ||
                [];

            if (!appointment.date || !Array.isArray(blockedTimes)) {
                return;
            }

            if (!bookedAppointments[appointment.date]) {
                bookedAppointments[appointment.date] = [];
            }

            blockedTimes.forEach(function (time) {
                bookedAppointments[appointment.date].push(time);
            });

        });

        return bookedAppointments;
    }


    /* ==========================================
       RENDER TIME BUTTONS
    ========================================== */

    function renderTimeButtons(unavailableTimes) {

        if (!timeSlots) return;

        timeSlots.innerHTML = "";

        allTimes.forEach(function (time) {

            const button = document.createElement("button");

            button.type = "button";
            button.textContent = time;
            button.classList.add("time-slot");

            const timeAlreadyPassed =
                isPastTime(selectedDate, time);

            const alreadyBooked =
                unavailableTimes.includes(time);

            if (timeAlreadyPassed || alreadyBooked) {

                button.classList.add("booked");
                button.disabled = true;

            }

            button.addEventListener("click", function () {

                if (button.disabled) return;

                document.querySelectorAll(".time-slot")
                    .forEach(function (btn) {
                        btn.classList.remove("selected");
                    });

                button.classList.add("selected");

                selectedTime = time;

            });

            timeSlots.appendChild(button);

        });

    }


    /* ==========================================
       LOAD AVAILABLE TIMES
    ========================================== */

    async function loadTimes(date) {

        selectedTime = "";

        if (!date) return;

        if (isDateBlocked(date)) {

            if (timeSlots) {
                timeSlots.innerHTML =
                    "<p>This date is unavailable.</p>";
            }

            return;
        }

        try {

            const bookedAppointments =
                await getBookedAppointments();

            const bookedTimes =
                bookedAppointments[date] || [];

            const manuallyBlockedTimes =
                blockedTimesByDate[date] || [];

            const unavailableTimes = [
                ...bookedTimes,
                ...manuallyBlockedTimes
            ];

            renderTimeButtons(unavailableTimes);

        } catch (error) {

            console.error("Unable to load appointment times:", error);

            if (timeSlots) {
                timeSlots.innerHTML =
                    "<p>Unable to load appointment times. Please try again.</p>";
            }

        }

    }


    /* ==========================================
       DATE PICKER
    ========================================== */

    if (
        typeof flatpickr !== "undefined" &&
        document.getElementById("appointmentDate")
    ) {

        flatpickr("#appointmentDate", {

            dateFormat: "Y-m-d",

            minDate: "today",

            disable: [

                function (date) {

                    const dateString =
                        date.getFullYear() + "-" +
                        String(date.getMonth() + 1).padStart(2, "0") + "-" +
                        String(date.getDate()).padStart(2, "0");

                    return isDateBlocked(dateString);

                }

            ],

            onChange: async function (selectedDates, dateStr) {

                selectedDate = dateStr;

                await loadTimes(dateStr);

            }

        });

    }


    /* ==========================================
       ADDITIONAL SERVICES
    ========================================== */

    window.openAdditionalServicePopup = function () {

        const popup = document.getElementById(
            "additionalServicePopup"
        );

        if (popup) {
            popup.style.display = "flex";
        }

    };


    /* ==========================================
       CLOSE ADDITIONAL SERVICE POPUP
    ========================================== */

    window.closeAdditionalServicePopup = function () {

        const popup = document.getElementById(
            "additionalServicePopup"
        );

        if (popup) {
            popup.style.display = "none";
        }

    };


    /* ==========================================
       SAVE ADDITIONAL SERVICE
    ========================================== */

    window.saveAdditionalServiceOptions = function () {

        const serviceElement =
            document.getElementById("additionalServiceType");

        const polishElement =
            document.getElementById("additionalPolishSelect");

        const designElement =
            document.getElementById("additionalDesignSelect");

        const detailsElement =
            document.getElementById("additionalDesignDetails");

        if (!serviceElement) return;

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
            service: service,
            polish: polish,
            design: design,
            designDetails: designDetails
        });

        renderAdditionalServices();

        serviceElement.value = "";

        if (polishElement) polishElement.value = "";
        if (designElement) designElement.value = "";
        if (detailsElement) detailsElement.value = "";

        window.closeAdditionalServicePopup();

    };


    /* ==========================================
       DISPLAY SELECTED SERVICES
    ========================================== */

    function renderAdditionalServices() {

        const container = document.getElementById(
            "selectedAdditionalServices"
        );

        if (!container) return;

        container.innerHTML = "";

        selectedAdditionalServices.forEach(function (item, index) {

            const service = document.createElement("div");

            service.className = "selected-additional-service";

            const info = document.createElement("div");
            info.className = "additional-service-info";

            const title = document.createElement("strong");
            title.textContent = item.service;

            let details = "";

            if (item.polish) {
                details += " • " + item.polish;
            }

            if (item.design) {
                details += " • " + item.design;
            }

            if (item.designDetails) {
                details += " • " + item.designDetails;
            }

            const description = document.createElement("span");
            description.textContent = details;

            const removeButton = document.createElement("button");

            removeButton.type = "button";
            removeButton.textContent = "×";

            removeButton.addEventListener("click", function () {
                window.removeAdditionalService(index);
            });

            info.appendChild(title);
            info.appendChild(description);

            service.appendChild(info);
            service.appendChild(removeButton);

            container.appendChild(service);

        });

    }


    /* ==========================================
       REMOVE ADDITIONAL SERVICE
    ========================================== */

    window.removeAdditionalService = function (index) {

        selectedAdditionalServices.splice(index, 1);

        renderAdditionalServices();

    };


    /* ==========================================
       CLOSE BOOKING POPUP
    ========================================== */

    window.closePopup = function () {

        const popup = document.getElementById("bookingPopup");

        if (popup) {
            popup.style.display = "none";
        }

    };


    /* ==========================================
       BOOK APPOINTMENT
    ========================================== */

    window.bookAppointment = async function () {

        try {

            /* ==========================================
               CHECK LOGIN
            ========================================== */

            const {
                data: { user },
                error: userError
            } = await supabaseClient.auth.getUser();

            if (userError || !user) {

                alert(
                    "Please log in or create an account before booking an appointment."
                );

                window.location.href = "login.html";

                return;
            }


            /* ==========================================
               GET FORM VALUES
            ========================================== */

            const name = document
                .getElementById("clientName")
                .value.trim();

            const phone = document
                .getElementById("clientPhone")
                .value.trim();

            const service = document
                .getElementById("serviceSelect")
                .value;

            const polish = document
                .getElementById("polishSelect")
                .value;

            const design = document
                .getElementById("designSelect")
                .value;


            /* ==========================================
               VALIDATE FORM
            ========================================== */

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

            if (isDateBlocked(selectedDate)) {

                alert("This date is unavailable. Please choose another date.");

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


            /* ==========================================
               CALCULATE APPOINTMENT DURATION
            ========================================== */

            let duration = Math.max(
                serviceDurations[service] || 1,
                serviceDurations[polish] || 1,
                serviceDurations[design] || 1
            );

            // Add two hours for each additional service.
            duration += selectedAdditionalServices.length * 2;

            const slotsNeeded = duration * 2;

            const timesToBook = [];

            const startMinutes = timeToMinutes(selectedTime);

            for (let i = 0; i < slotsNeeded; i++) {

                const minutes = startMinutes + (i * 30);

                timesToBook.push(minutesToTime(minutes));

            }


            /* ==========================================
               CHECK BOOKING CONFLICTS
            ========================================== */

            const bookedAppointments =
                await getBookedAppointments();

            const bookedTimes =
                bookedAppointments[selectedDate] || [];

            const manuallyBlockedTimes =
                blockedTimesByDate[selectedDate] || [];

            const unavailableTimes = [
                ...bookedTimes,
                ...manuallyBlockedTimes
            ];

            const conflict = timesToBook.some(function (time) {

                return unavailableTimes.includes(time);

            });

            if (conflict) {

                alert(
                    "One or more of those time slots are unavailable. Please choose another time."
                );

                await loadTimes(selectedDate);

                return;
            }


            /* ==========================================
               CHECK CLOSING TIME
            ========================================== */

            const closingMinutes = timeToMinutes("8:30 PM");

            const appointmentEnd =
                startMinutes + (slotsNeeded * 30);

            if (appointmentEnd > closingMinutes) {

                alert(
                    "This appointment would extend beyond closing time. Please choose an earlier appointment."
                );

                return;
            }


            /* ==========================================
               CREATE APPOINTMENT
            ========================================== */

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


            /* ==========================================
               SAVE TO SUPABASE
            ========================================== */

            const { error } = await supabaseClient
                .from("appointments")
                .insert([appointment]);

            if (error) {

                console.error("Supabase insert error:", error);

                alert(error.message);

                return;
            }


            /* ==========================================
               SHOW SUCCESS POPUP
            ========================================== */

            const popup = document.getElementById("bookingPopup");

            if (popup) {
                popup.style.display = "flex";
            }


            /* ==========================================
               CLEAR BOOKING FORM
            ========================================== */

            document.getElementById("clientName").value = "";

            document.getElementById("clientPhone").value = "";

            document.getElementById("appointmentDate").value = "";

            document.getElementById("serviceSelect").value = "";

            document.getElementById("polishSelect").value = "";

            document.getElementById("designSelect").value = "";

            selectedDate = "";

            selectedTime = "";

            selectedAdditionalServices = [];

            renderAdditionalServices();

            if (timeSlots) {
                timeSlots.innerHTML = "";
            }

        } catch (error) {

            console.error("Booking error:", error);

            alert(
                "Something went wrong while booking your appointment. Please try again."
            );

        }

    };

});
