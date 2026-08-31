// Signup form ko HTML se pakda
const signupForm = document.getElementById("signupForm");


// Jab user Sign Up button dabaye
signupForm.addEventListener("submit", async (event) => {

    // Form ka normal reload rok diya
    event.preventDefault();


    // HTML inputs se values nikali
    const name = document.getElementById("fullName").value;
    const email = document.getElementById("email").value;
    const branch = document.getElementById("branch").value;
    const batch = document.getElementById("batch").value;
    const enrollmentNumber =
        document.getElementById("enrollmentNumber").value;
    const password = document.getElementById("password").value;
    


    // Backend ko request bheji
    const response = await fetch("/api/auth/signup", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            name: name,
            email: email,
            password: password,
            branch: branch,
            batch: batch,
            enrollmentNumber: enrollmentNumber
        })
    });


    // Backend ke JSON response ko JS object banaya
    const data = await response.json();


    // Backend ka message HTML par show karo
    document.getElementById("message").textContent =
        data.message;


    // Agar signup successful hua, to thodi der baad login page par le jao
    if (response.ok) {
        setTimeout(() => {
            window.location.href = "./login.html";
        }, 1200);
    }

});