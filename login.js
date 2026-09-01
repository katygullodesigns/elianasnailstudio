const SUPABASE_URL =
  "https://kyonstvpolakjhrecqcj.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJrdW9uc3R2cG9sYWtqaHJlY3FjIiwicmVmIjoia3lvbnN0dnBvbGFramh ycmVjcWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTYxMjUsImV4cCI6MjA5NzI3MjEyNX0.oq6v7gEy8FJPh4NI3ngUYybwJcHF6rW6qkNtepCxr7Y"
    .replace(/\s/g, "");

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


// ==========================================
// OWNER EMAIL
// ==========================================

const OWNER_EMAIL = "enavejas005@gmail.com";


// ==========================================
// LOGIN
// ==========================================

document
  .getElementById("loginBtn")
  .addEventListener("click", async function () {

    const email =
      document
        .getElementById("username")
        .value
        .trim()
        .toLowerCase();

    const password =
      document.getElementById("password").value;

    const message =
      document.getElementById("loginMessage");


    message.textContent = "";


    if (!email || !password) {

      message.textContent =
        "Please enter your email and password.";

      return;
    }


    const {
      data,
      error
    } = await supabaseClient.auth.signInWithPassword({

      email: email,

      password: password

    });


    if (error) {

      console.error(
        "Login error:",
        error
      );

      message.textContent =
        error.message;

      return;
    }


    // ==========================================
    // OWNER
    // ==========================================

    if (
      data.user.email.toLowerCase() ===
      OWNER_EMAIL.toLowerCase()
    ) {

      window.location.href =
        "appointments.html";

      return;
    }


    // ==========================================
    // CUSTOMER
    // ==========================================

    window.location.href =
      "myappointments.html";

  });


// ==========================================
// CREATE ACCOUNT
// ==========================================

document
  .getElementById("createAccountBtn")
  .addEventListener("click", async function () {

    const email =
      document
        .getElementById("username")
        .value
        .trim()
        .toLowerCase();

    const password =
      document.getElementById("password").value;

    const message =
      document.getElementById("loginMessage");


    message.textContent = "";


    if (!email || !password) {

      message.textContent =
        "Enter an email and password to create your account.";

      return;
    }


    if (password.length < 6) {

      message.textContent =
        "Password must be at least 6 characters.";

      return;
    }


    const {
      data,
      error
    } = await supabaseClient.auth.signUp({

      email: email,

      password: password

    });


    if (error) {

      console.error(
        "Create account error:",
        error
      );

      message.textContent =
        error.message;

      return;
    }


    // Email confirmation required
    if (
      data.user &&
      !data.session
    ) {

      message.textContent =
        "Account created! Check your email to confirm your account.";

      return;
    }


    // Account immediately logged in
    if (data.session) {

      if (
        data.user.email.toLowerCase() ===
        OWNER_EMAIL.toLowerCase()
      ) {

        window.location.href =
          "appointments.html";

      } else {

        window.location.href =
          "myappointments.html";

      }

    }

  });