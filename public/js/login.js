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

    // Backend ka message ab page par bhi dikhega (sirf console mein nahi)
    document.getElementById("message").textContent = data.message;

    // Agar login successful hua, token save karo aur dashboard par jao
    if (response.ok) {
        localStorage.setItem("token", data.token);
        window.location.href = "./dashboard.html";
    }
});
