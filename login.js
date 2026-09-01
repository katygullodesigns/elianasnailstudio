const SUPABASE_URL =
  "https://kyonstvpolakjhrecqcj.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5b25zdHZwb2xha2pyZWNxY2oiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc4MTY5NjEyNSwiZXhwIjoyMDk3MjcyMTI1fQ.oq6v7gEy8FJPh4NI3ngUYybwJcHF6rW6qkNtepCxr7Y";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


// ==========================================
// OWNER EMAIL
// ==========================================

const OWNER_EMAIL = "enavejas005@gmail.com";


// ==========================================
// GET ELEMENTS
// ==========================================

const loginBtn =
  document.getElementById("loginBtn");

const createAccountBtn =
  document.getElementById("createAccountBtn");

const usernameInput =
  document.getElementById("username");

const passwordInput =
  document.getElementById("password");

const loginMessage =
  document.getElementById("loginMessage");


// ==========================================
// REDIRECT USER
// ==========================================

function redirectUser(user) {

  if (!user || !user.email) {
    return;
  }

  const email =
    user.email.trim().toLowerCase();

  console.log("Logged in user:", email);


  // OWNER
  if (email === OWNER_EMAIL.toLowerCase()) {

    console.log("Owner detected.");

    window.location.href =
      "appointments.html";

    return;
  }


  // CUSTOMER
  console.log("Customer detected.");

  window.location.href =
    "myappointments.html";
}


// ==========================================
// LOGIN
// ==========================================

if (loginBtn) {

  loginBtn.addEventListener(
    "click",
    async function () {

      const email =
        usernameInput.value
          .trim()
          .toLowerCase();

      const password =
        passwordInput.value;


      loginMessage.textContent = "";


      if (!email || !password) {

        loginMessage.textContent =
          "Please enter your email and password.";

        return;
      }


      loginBtn.disabled = true;

      loginBtn.textContent =
        "Logging in...";


      try {

        const {
          data,
          error
        } =
          await supabaseClient.auth
            .signInWithPassword({

              email: email,

              password: password

            });


        if (error) {

          console.error(
            "Login error:",
            error
          );

          loginMessage.textContent =
            error.message;

          loginBtn.disabled = false;

          loginBtn.textContent =
            "Login";

          return;
        }


        if (!data || !data.user) {

          loginMessage.textContent =
            "Login succeeded, but no user was returned.";

          loginBtn.disabled = false;

          loginBtn.textContent =
            "Login";

          return;
        }


        console.log(
          "Login successful:",
          data.user.email
        );


        redirectUser(data.user);

      }

      catch (err) {

        console.error(
          "Unexpected login error:",
          err
        );

        loginMessage.textContent =
          "Something went wrong while logging in.";

        loginBtn.disabled = false;

        loginBtn.textContent =
          "Login";

      }

    }
  );

}


// ==========================================
// CREATE ACCOUNT
// ==========================================

if (createAccountBtn) {

  createAccountBtn.addEventListener(
    "click",
    async function () {

      const email =
        usernameInput.value
          .trim()
          .toLowerCase();

      const password =
        passwordInput.value;


      loginMessage.textContent = "";


      if (!email || !password) {

        loginMessage.textContent =
          "Enter an email and password to create your account.";

        return;
      }


      if (password.length < 6) {

        loginMessage.textContent =
          "Password must be at least 6 characters.";

        return;
      }


      createAccountBtn.disabled = true;

      createAccountBtn.textContent =
        "Creating Account...";


      try {

        const {
          data,
          error
        } =
          await supabaseClient.auth
            .signUp({

              email: email,

              password: password

            });


        if (error) {

          console.error(
            "Create account error:",
            error
          );

          loginMessage.textContent =
            error.message;

          createAccountBtn.disabled = false;

          createAccountBtn.textContent =
            "Create Account";

          return;
        }


        console.log(
          "Account created:",
          data.user
        );


        // Email confirmation required
        if (
          data.user &&
          !data.session
        ) {

          loginMessage.textContent =
            "Account created! Check your email to confirm your account.";

          createAccountBtn.disabled = false;

          createAccountBtn.textContent =
            "Create Account";

          return;
        }


        // User was automatically logged in
        if (data.session && data.user) {

          redirectUser(data.user);

          return;
        }


        loginMessage.textContent =
          "Account created successfully.";

        createAccountBtn.disabled = false;

        createAccountBtn.textContent =
          "Create Account";

      }

      catch (err) {

        console.error(
          "Unexpected account creation error:",
          err
        );

        loginMessage.textContent =
          "Something went wrong while creating the account.";

        createAccountBtn.disabled = false;

        createAccountBtn.textContent =
          "Create Account";

      }

    }
  );

}


// ==========================================
// CHECK FOR EXISTING SESSION
// ==========================================

async function checkExistingSession() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.getSession();


    if (error) {

      console.error(
        "Session check error:",
        error
      );

      return;
    }


    if (data.session && data.session.user) {

      console.log(
        "Existing session found:",
        data.session.user.email
      );

      redirectUser(
        data.session.user
      );

    }

  }

  catch (err) {

    console.error(
      "Session check failed:",
      err
    );

  }

}


// ==========================================
// START
// ==========================================

checkExistingSession();
