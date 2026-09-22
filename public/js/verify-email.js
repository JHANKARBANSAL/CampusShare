// ==========================================================
// VERIFY EMAIL (OTP)
// Signup ke baad yahan aate hain: verify-email.html?email=...&sent=1
// ==========================================================

const params = new URLSearchParams(window.location.search);

const email = params.get("email") || "";
const justSent = params.get("sent") === "1";

const boxes = document.querySelectorAll(".otp-box");
const otpForm = document.getElementById("otpForm");
const verifyBtn = document.getElementById("verifyBtn");
const resendBtn = document.getElementById("resendBtn");
const message = document.getElementById("message");


// Message dikhao. Normal red hota hai (login.css), success pe green.
function showMessage(text, isSuccess) {
    message.textContent = text;
    message.classList.toggle("is-success", isSuccess === true);
}



// ==========================================
// PAGE KHULTE HI
// ==========================================

if (!email) {

    // Bina email ke pata hi nahi ki kis account ka code check karein
    showMessage("We don't know which email to verify. Please sign up again.");

    verifyBtn.disabled = true;
    resendBtn.disabled = true;

} else {

    document.getElementById("emailShown").textContent = email;

    if (justSent) {
        document.getElementById("verifyIntro").textContent = "We sent a 6-digit code to";
    }

    boxes[0].focus();
}



// ==========================================
// DIGIT BOXES
// ==========================================

// start wale box se shuru karke digits bhar do.
// Typing, paste aur phone ka autofill - teeno isi se chalte hain.
function fillFrom(start, text) {

    const digits = String(text).replace(/\D/g, "").split("");

    let index = start;

    digits.forEach((digit) => {
        if (index < boxes.length) {
            boxes[index].value = digit;
            index = index + 1;
        }
    });

    // Aakhri bhare box ke agle pe cursor, ya last box pe ruk jao
    boxes[Math.min(index, boxes.length - 1)].focus();
}


boxes.forEach((box, index) => {

    // Box pe aate hi pura select - naya digit purane ko replace kare
    box.addEventListener("focus", () => {
        box.select();
    });


    box.addEventListener("input", () => {

        const typed = box.value;

        box.value = "";

        // Phone kabhi pehle box me pure 6 digit daal deta hai -
        // fillFrom unhe baaki boxes me baant deta hai
        fillFrom(index, typed);
    });


    // Khaali box pe Backspace = pichhle box pe jao
    box.addEventListener("keydown", (event) => {

        if (event.key === "Backspace" && box.value === "" && index > 0) {
            boxes[index - 1].focus();
        }
    });


    // Email se "123456" copy karke paste karo to sab bhar jaaye
    box.addEventListener("paste", (event) => {

        event.preventDefault();

        fillFrom(index, event.clipboardData.getData("text"));
    });
});



// ==========================================
// VERIFY
// ==========================================

otpForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const otp = Array.from(boxes).map((box) => box.value).join("");

    if (otp.length !== 6) {
        showMessage("Enter all 6 digits of the code.");
        return;
    }


    verifyBtn.disabled = true;
    verifyBtn.textContent = "Verifying...";


    try {

        const response = await fetch("/api/auth/verify-otp", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email: email,
                otp: otp
            })
        });

        const data = await response.json();


        if (!response.ok) {

            showMessage(data.message);

            // Galat code - boxes khaali karke dobara shuru
            boxes.forEach((box) => {
                box.value = "";
            });
            boxes[0].focus();

            verifyBtn.disabled = false;
            verifyBtn.textContent = "Verify email";
            return;
        }


        showMessage(data.message, true);

        if (data.token) {
            localStorage.setItem("token", data.token);
            setTimeout(() => {
                window.location.href = "./dashboard.html";
            }, 1500);
        } else {
            setTimeout(() => {
                window.location.href = "./login.html";
            }, 1500);
        }

    }

    catch (error) {

        console.log("Verify error:", error);

        showMessage("Something went wrong. Check your connection and try again.");

        verifyBtn.disabled = false;
        verifyBtn.textContent = "Verify email";
    }
});



// ==========================================
// RESEND (60 second ka gap)
// ==========================================

let countdown = null;


function startCooldown(seconds) {

    let left = seconds;

    resendBtn.disabled = true;
    resendBtn.textContent = "Resend in " + left + "s";

    clearInterval(countdown);

    countdown = setInterval(() => {

        left = left - 1;

        if (left <= 0) {
            clearInterval(countdown);
            resendBtn.disabled = false;
            resendBtn.textContent = "Resend code";
            return;
        }

        resendBtn.textContent = "Resend in " + left + "s";

    }, 1000);
}


resendBtn.addEventListener("click", async () => {

    resendBtn.disabled = true;

    try {

        const response = await fetch("/api/auth/resend-otp", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email: email
            })
        });

        const data = await response.json();

        showMessage(data.message, response.ok);


        if (response.ok) {
            startCooldown(60);
        } else if (data.secondsLeft) {
            // Server ne bataya kitna ruk na hai
            startCooldown(data.secondsLeft);
        } else {
            resendBtn.disabled = false;
        }

    }

    catch (error) {

        console.log("Resend error:", error);

        showMessage("Something went wrong. Check your connection and try again.");

        resendBtn.disabled = false;
    }
});


// Signup ne abhi-abhi code bheja hai - to Resend turant nahi
if (email && justSent) {
    startCooldown(60);
}
