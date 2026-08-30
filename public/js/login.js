/* Login — endpoint and request body unchanged (POST /api/auth/login). */

document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("loginForm");
  const button = document.getElementById("loginBtn");
  const messageEl = document.getElementById("message");

  form.addEventListener("submit", async (event) => {

    event.preventDefault();
    CSAuth.setMessage(messageEl, "");

    if (!CSAuth.validateForm(form)) return;

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    CSAuth.setLoading(button, true, "Signing in");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password: password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        CSAuth.setMessage(messageEl, data.message || "Welcome back", "success");
        window.location.href = "./dashboard.html";
        return;
      }

      CSAuth.setMessage(messageEl, data.message || "We could not sign you in.", "error");
      CSAuth.setLoading(button, false);

    } catch (error) {
      console.log("Login error:", error);
      CSAuth.setMessage(messageEl, "Network problem. Check your connection and try again.", "error");
      CSAuth.setLoading(button, false);
    }
  });
});
