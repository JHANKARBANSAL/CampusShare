/* Signup — endpoint and request body unchanged (POST /api/auth/signup). */

document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("signupForm");
  const button = document.getElementById("signupBtn");
  const messageEl = document.getElementById("message");

  form.addEventListener("submit", async (event) => {

    event.preventDefault();
    CSAuth.setMessage(messageEl, "");

    if (!CSAuth.validateForm(form)) return;

    const name = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const branch = document.getElementById("branch").value.trim();
    const batch = document.getElementById("batch").value.trim();
    const enrollmentNumber = document.getElementById("enrollmentNumber").value.trim();
    const password = document.getElementById("password").value;

    CSAuth.setLoading(button, true, "Creating account");

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name,
          email: email,
          password: password,
          branch: branch,
          batch: batch,
          enrollmentNumber: enrollmentNumber
        })
      });

      const data = await response.json();

      if (response.ok) {
        CSAuth.setMessage(messageEl, data.message || "Account created. Taking you to log in...", "success");
        setTimeout(() => { window.location.href = "./login.html"; }, 1200);
        return;
      }

      CSAuth.setMessage(messageEl, data.message || "We could not create your account.", "error");
      CSAuth.setLoading(button, false);

    } catch (error) {
      console.log("Signup error:", error);
      CSAuth.setMessage(messageEl, "Network problem. Check your connection and try again.", "error");
      CSAuth.setLoading(button, false);
    }
  });
});
