const SUPABASE_URL = "https://kyonstvpolakjhrecqcj.supabase.co/rest/v1/";

const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5b25zdHZwb2xha2pocmVjcWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTYxMjUsImV4cCI6MjA5NzI3MjEyNX0.oq6v7gEy8FJPh4NI3ngUYybwJcHF6rW6qkNtepCxr7Y"";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


// ==========================================
// LOGIN
// ==========================================

document.getElementById("loginBtn").addEventListener("click", async function () {

  const email = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const message = document.getElementById("loginMessage");

  message.textContent = "";

  if (!email || !password) {
    message.textContent = "Please enter your email and password.";
    return;
  }

  const { error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    console.error(error);
    message.textContent = error.message;
    return;
  }

  // Login successful
  window.location.href = "appointments.html";

});


// ==========================================
// CREATE ACCOUNT
// ==========================================

document.getElementById("createAccountBtn").addEventListener("click", async function () {

  const email = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const message = document.getElementById("loginMessage");

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


  const { data, error } = await supabaseClient.auth.signUp({
    email: email,
    password: password
  });


  if (error) {

    console.error(error);

    message.textContent = error.message;

    return;
  }


  // Email confirmation is enabled
  if (data.user && !data.session) {

    message.textContent =
      "Account created! Check your email to confirm your account.";

    return;
  }


  // Email confirmation is disabled
  if (data.session) {

    window.location.href = "appointments.html";

  }

});
```
