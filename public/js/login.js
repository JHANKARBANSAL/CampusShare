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

    const msgEl = document.getElementById("message");
    msgEl.textContent = data.message;
    msgEl.style.color = response.ok ? "#22c55e" : "#ef4444";

    // Agar login successful hua, token save karo
    if (response.ok) {
        localStorage.setItem("token", data.token);

        // Agar email link se kisi specific chat pe jana tha to wahan bhej do
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get("redirect");
        if (redirect) {
            window.location.href = redirect;
        } else {
            window.location.href = "./dashboard.html";
        }
    }
});


// ==========================================
// FORGOT PASSWORD MODAL LOGIC
// ==========================================
const forgotLink = document.getElementById("forgotLink");
const forgotModal = document.getElementById("forgotModal");
const closeForgotModal = document.getElementById("closeForgotModal");
const forgotMessage = document.getElementById("forgotMessage");
const forgotStep1Form = document.getElementById("forgotStep1Form");
const forgotStep2Form = document.getElementById("forgotStep2Form");
const sendResetCodeBtn = document.getElementById("sendResetCodeBtn");
const confirmResetBtn = document.getElementById("confirmResetBtn");

let resetTargetEmail = "";

// Open modal
if (forgotLink) {
    forgotLink.addEventListener("click", (e) => {
        e.preventDefault();
        const currentEmail = document.getElementById("email").value.trim();
        if (currentEmail) {
            document.getElementById("forgotEmail").value = currentEmail;
        }
        forgotMessage.textContent = "";
        forgotStep1Form.style.display = "block";
        forgotStep2Form.style.display = "none";
        forgotModal.style.display = "flex";
    });
}

// Close modal
if (closeForgotModal) {
    closeForgotModal.addEventListener("click", () => {
        forgotModal.style.display = "none";
    });
}

// Close when clicking outside modal
window.addEventListener("click", (e) => {
    if (e.target === forgotModal) {
        forgotModal.style.display = "none";
    }
});

// Step 1: Send OTP
if (forgotStep1Form) {
    forgotStep1Form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("forgotEmail").value.trim();
        if (!email) return;

        resetTargetEmail = email;
        sendResetCodeBtn.disabled = true;
        sendResetCodeBtn.textContent = "Sending code...";
        forgotMessage.textContent = "";

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            const data = await res.json();

            if (!res.ok) {
                forgotMessage.textContent = data.message || "Failed to send code.";
                forgotMessage.style.color = "#ef4444";
                sendResetCodeBtn.disabled = false;
                sendResetCodeBtn.textContent = "Send Reset Code";
                return;
            }

            forgotMessage.textContent = "6-digit code sent to your email!";
            forgotMessage.style.color = "#16a34a";

            // Switch to Step 2
            forgotStep1Form.style.display = "none";
            forgotStep2Form.style.display = "block";
            document.getElementById("resetOtp").focus();

        } catch (err) {
            forgotMessage.textContent = "Something went wrong. Please try again.";
            forgotMessage.style.color = "#ef4444";
        } finally {
            sendResetCodeBtn.disabled = false;
            sendResetCodeBtn.textContent = "Send Reset Code";
        }
    });
}

// Step 2: Confirm Reset
if (forgotStep2Form) {
    forgotStep2Form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const otp = document.getElementById("resetOtp").value.trim();
        const newPassword = document.getElementById("resetNewPassword").value;

        if (!otp || !newPassword) return;

        confirmResetBtn.disabled = true;
        confirmResetBtn.textContent = "Updating...";
        forgotMessage.textContent = "";

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: resetTargetEmail,
                    otp,
                    newPassword
                })
            });

            const data = await res.json();

            if (!res.ok) {
                forgotMessage.textContent = data.message || "Reset failed.";
                forgotMessage.style.color = "#ef4444";
                confirmResetBtn.disabled = false;
                confirmResetBtn.textContent = "Update Password";
                return;
            }

            // Success! Close modal and show message on login page
            forgotModal.style.display = "none";
            document.getElementById("email").value = resetTargetEmail;
            document.getElementById("password").value = "";

            const mainMsg = document.getElementById("message");
            mainMsg.textContent = "Password reset successful! Please log in with your new password.";
            mainMsg.style.color = "#16a34a";

        } catch (err) {
            forgotMessage.textContent = "Something went wrong. Please try again.";
            forgotMessage.style.color = "#ef4444";
        } finally {
            confirmResetBtn.disabled = false;
            confirmResetBtn.textContent = "Update Password";
        }
    });
}
