const SUPABASE_URL = "https://kyonstvpolakjhrecqcj.supabase.co";
const SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5b25zdHZwb2xha2pocmVjcWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTYxMjUsImV4cCI6MjA5NzI3MjEyNX0.oq6v7gEy8FJPh4NI3ngUYybwJcHF6rW6qkNtepCxr7Y
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function toggleMenu() {
  const nav = document.querySelector("nav");
  const btn = document.querySelector(".mobile-menu-btn");

  nav.classList.toggle("mobile-open");
  document.body.classList.toggle("menu-open");

  if (btn) {
    btn.innerHTML = nav.classList.contains("mobile-open") ? "✕" : "☰";
  }
}

document.querySelectorAll("nav a").forEach(function (link) {
  link.addEventListener("click", function () {
    const nav = document.querySelector("nav");
    const btn = document.querySelector(".mobile-menu-btn");

    nav.classList.remove("mobile-open");
    document.body.classList.remove
