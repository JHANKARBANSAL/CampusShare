const meraForm = document.getElementById("loginForm");

if (meraForm) {
    meraForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const emailEl = document.getElementById("loginEmail") || document.getElementById("email");
        const passwordEl = document.getElementById("loginPassword") || document.getElementById("password");
        const email = emailEl ? emailEl.value.trim() : "";
        const password = passwordEl ? passwordEl.value : "";

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

        const msgEl = document.getElementById("loginMessage") || document.getElementById("message");
        if (msgEl) {
            msgEl.textContent = data.message;
            msgEl.style.color = response.ok ? "#22c55e" : "#ef4444";
        }

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
}

// ==========================================
// SMOOTH TRANSITION BETWEEN SIGNUP & LOGIN
// ==========================================
const signupCard = document.getElementById("signupCard");
const loginCard = document.getElementById("loginCard");
const toLoginBtn = document.getElementById("toLoginBtn");
const toSignupBtn = document.getElementById("toSignupBtn");

function showLogin() {
    if (!loginCard || !signupCard) return;
    signupCard.classList.add("hidden");
    signupCard.classList.remove("fade-in");
    loginCard.classList.remove("hidden");
    loginCard.classList.add("fade-in");
    const emailEl = document.getElementById("loginEmail") || document.getElementById("email");
    if (emailEl) emailEl.focus();
}

function showSignup() {
    if (!loginCard || !signupCard) return;
    loginCard.classList.add("hidden");
    loginCard.classList.remove("fade-in");
    signupCard.classList.remove("hidden");
    signupCard.classList.add("fade-in");
    const nameEl = document.getElementById("fullName");
    if (nameEl) nameEl.focus();
}

if (toLoginBtn) {
    toLoginBtn.addEventListener("click", (e) => {
        e.preventDefault();
        showLogin();
        try {
            const url = new URL(window.location.href);
            url.searchParams.set("mode", "login");
            history.replaceState(null, "", url.toString());
        } catch (err) {}
    });
}

if (toSignupBtn) {
    toSignupBtn.addEventListener("click", (e) => {
        e.preventDefault();
        showSignup();
        try {
            const url = new URL(window.location.href);
            url.searchParams.delete("mode");
            history.replaceState(null, "", url.toString());
        } catch (err) {}
    });
}

// Auto-switch to login if page URL has ?mode=login
document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "login") {
        showLogin();
    }
});

// Password visibility toggle for login
const toggleLoginPassword = document.getElementById("toggleLoginPassword");
if (toggleLoginPassword) {
    toggleLoginPassword.addEventListener("click", () => {
        const passEl = document.getElementById("loginPassword") || document.getElementById("password");
        if (passEl) {
            const isPassword = passEl.type === "password";
            passEl.type = isPassword ? "text" : "password";
            toggleLoginPassword.textContent = isPassword ? "🙈" : "👁️";
        }
    });
}


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
        const emailEl = document.getElementById("loginEmail") || document.getElementById("email");
        const currentEmail = emailEl ? emailEl.value.trim() : "";
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
            const resetEmailInput = document.getElementById("loginEmail") || document.getElementById("email");
            const resetPassInput = document.getElementById("loginPassword") || document.getElementById("password");
            if (resetEmailInput) resetEmailInput.value = resetTargetEmail;
            if (resetPassInput) resetPassInput.value = "";

            const mainMsg = document.getElementById("loginMessage") || document.getElementById("message");
            if (mainMsg) {
                mainMsg.textContent = "Password reset successful! Please log in with your new password.";
                mainMsg.style.color = "#16a34a";
            }

        } catch (err) {
            forgotMessage.textContent = "Something went wrong. Please try again.";
            forgotMessage.style.color = "#ef4444";
        } finally {
            confirmResetBtn.disabled = false;
            confirmResetBtn.textContent = "Update Password";
        }
    });
}
