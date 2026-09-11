const meraForm = document.getElementById("loginForm");

meraForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const response = await fetch("/api/auth/login", {
        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            email: email,
            password: password
        })
    });

    const data = await response.json();

    // Account hai par email verify nahi hui - code daalne ke page pe bhejo
    if (response.status === 403 && data.needsVerification) {
        window.location.href =
            "./verify-email.html?email=" + encodeURIComponent(data.email);
        return;
    }

    // Backend ka message ab page par bhi dikhega (sirf console mein nahi)
    document.getElementById("message").textContent = data.message;

    // Agar login successful hua, token save karo aur dashboard par jao
    if (response.ok) {
        localStorage.setItem("token", data.token);
        window.location.href = "./dashboard.html";
    }
});
