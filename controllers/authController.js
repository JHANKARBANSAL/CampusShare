const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");


// ==========================================
// OTP SETTINGS
// ==========================================

const OTP_MINUTES = 10;      // code kitni der tak chalega
const MAX_ATTEMPTS = 5;      // itne galat try ke baad naya code mangna padega
const RESEND_SECONDS = 60;   // do codes ke beech kam se kam itna gap



// ==========================================
// CHHOTE HELPERS
// ==========================================

// Email ko ek hi format me lao. User.js email ko lowercase me
// save karta hai, to dhoondhte waqt bhi lowercase hona chahiye -
// warna "ABC@bmu.edu.in" wala account milta hi nahi.
function cleanEmail(email) {
    return String(email || "").trim().toLowerCase();
}


// Sirf college ki email chalegi: kuch bhi + @bmu.edu.in
function isCollegeEmail(email) {
    return /^[^\s@]+@bmu\.edu\.in$/.test(email);
}


// Naya 6-digit code banao, uska hash save karo aur email bhejo.
// signup aur resendOtp dono isi ko use karte hain.
async function sendOtp(user) {

    // crypto.randomInt Node ka apna secure random hai
    // (Math.random ka code guess kiya ja sakta hai)
    const otp = crypto.randomInt(100000, 1000000).toString();

    user.otpHash = await bcrypt.hash(otp, 10);
    user.otpExpiresAt = new Date(Date.now() + OTP_MINUTES * 60 * 1000);
    user.otpAttempts = 0;
    user.otpSentAt = new Date();

    await user.save();


    await sendEmail({

        to: user.email,

        subject: "Your CampusShare verification code",

        text:
            "Your CampusShare verification code is " + otp + ".\n\n" +
            "It expires in " + OTP_MINUTES + " minutes. " +
            "If you didn't create a CampusShare account, you can ignore this email.",

        html:
            "<p>Your CampusShare verification code is <b>" + otp + "</b>.</p>" +
            "<p>It expires in " + OTP_MINUTES + " minutes. " +
            "If you didn't create a CampusShare account, you can ignore this email.</p>"
    });
}



// ==========================================
// SIGNUP
// Account banta hai isVerified = false ke saath,
// aur university email pe 6-digit code jaata hai.
// ==========================================

const signup = async (req, res) => {

    try {

        // Frontend signup form se data
        const name = String(req.body.name || "").trim();
        const email = cleanEmail(req.body.email);
        const password = String(req.body.password || "");
        const branch = String(req.body.branch || "").trim();
        const batch = String(req.body.batch || "").trim();
        const enrollmentNumber = String(req.body.enrollmentNumber || "").trim();


        if (!name || !email || !password || !branch || !batch || !enrollmentNumber) {
            return res.status(400).json({
                message: "Please fill in every field."
            });
        }


        // Asli rok yahi hai. Signup page ka pattern sirf suvidha
        // hai - koi bhi Postman se seedha request bhej sakta hai.
        if (!isCollegeEmail(email)) {
            return res.status(400).json({
                message: "Please use your BMU email address ending in @bmu.edu.in."
            });
        }


        // Pehle sirf email check hoti thi. enrollmentNumber bhi
        // unique hai, to wahi number dobara aane pe MongoDB save
        // pe crash karta tha aur sirf "Something went wrong" dikhta tha.
        const existingUser = await User.findOne({
            $or: [
                { email: email },
                { enrollmentNumber: enrollmentNumber }
            ]
        });

        if (existingUser) {

            return res.status(409).json({
                message: existingUser.email === email
                    ? "An account with this email already exists. Please log in."
                    : "This enrollment number is already registered."
            });
        }


        // Password hash
        const hashedPassword = await bcrypt.hash(password, 10);


        // MongoDB mein user save. isVerified apne aap false
        // (User.js default) - sahi OTP daalne pe true hoga.
        const user = await User.create({
            name: name,
            email: email,
            password: hashedPassword,
            branch: branch,
            batch: batch,
            enrollmentNumber: enrollmentNumber
        });


        try {

            await sendOtp(user);

        } catch (error) {

            // Account ban chuka hai. Email nahi gaya to user agle
            // page pe "Resend code" daba sakta hai - isliye poora
            // signup fail nahi karte.
            console.log("OTP email error:", error);

            return res.status(201).json({
                message: "Account created, but we couldn't send the code. Tap Resend on the next screen.",
                email: user.email
            });
        }


        return res.status(201).json({
            message: "Account created. We've sent a 6-digit code to your email.",
            email: user.email
        });


    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: "Something went wrong"
        });
    }
};



// ==========================================
// VERIFY OTP
// POST /api/auth/verify-otp   { email, otp }
// ==========================================

const verifyOtp = async (req, res) => {

    try {

        const email = cleanEmail(req.body.email);
        const otp = String(req.body.otp || "").trim();


        if (!email || !/^\d{6}$/.test(otp)) {
            return res.status(400).json({
                message: "Enter the 6-digit code from your email."
            });
        }


        // otpHash User.js me select: false hai, isliye yahan
        // alag se maangna padta hai
        const user = await User.findOne({ email: email }).select("+otpHash");

        if (!user) {
            return res.status(404).json({
                message: "No account found for this email."
            });
        }

        if (user.isVerified) {
            return res.status(200).json({
                message: "Your email is already verified. You can log in."
            });
        }

        if (!user.otpHash || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
            return res.status(400).json({
                message: "This code has expired. Please request a new one."
            });
        }

        // Bina is limit ke koi 000000 se 999999 tak sab try kar leta
        if (user.otpAttempts >= MAX_ATTEMPTS) {
            return res.status(429).json({
                message: "Too many incorrect attempts. Please request a new code."
            });
        }


        const isCorrect = await bcrypt.compare(otp, user.otpHash);

        if (!isCorrect) {

            user.otpAttempts = user.otpAttempts + 1;
            await user.save();

            return res.status(400).json({
                message: "Wrong code. Attempts left: " + (MAX_ATTEMPTS - user.otpAttempts)
            });
        }


        // Sahi code - account verify, aur code hata do taaki
        // dobara use na ho
        user.isVerified = true;
        user.otpHash = "";
        user.otpExpiresAt = undefined;
        user.otpAttempts = 0;

        await user.save();

        // Account verify hote hi JWT token de do taaki direct dashboard ja sake
        const token = jwt.sign(
            {
                userId: user._id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        return res.status(200).json({
            message: "Email verified successfully!",
            token: token
        });

    } catch (error) {

        console.log("Verify OTP error:", error);

        return res.status(500).json({
            message: "Something went wrong"
        });
    }
};



// ==========================================
// RESEND OTP
// POST /api/auth/resend-otp   { email }
// ==========================================

const resendOtp = async (req, res) => {

    try {

        const email = cleanEmail(req.body.email);


        // College rule yahan bhi. Warna purana @gmail.com wala
        // account resend karke verify ho jaata aur rule toot jaata.
        if (!isCollegeEmail(email)) {
            return res.status(400).json({
                message: "Only @bmu.edu.in email addresses can be verified."
            });
        }


        const user = await User.findOne({ email: email });

        if (!user) {
            return res.status(404).json({
                message: "No account found for this email."
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                message: "This email is already verified. Please log in."
            });
        }


        // Resend ko spam hone se roko
        if (user.otpSentAt) {

            const secondsPassed = (Date.now() - user.otpSentAt.getTime()) / 1000;

            if (secondsPassed < RESEND_SECONDS) {

                const secondsLeft = Math.ceil(RESEND_SECONDS - secondsPassed);

                return res.status(429).json({
                    message: "Please wait " + secondsLeft + " seconds before requesting a new code.",
                    secondsLeft: secondsLeft
                });
            }
        }


        await sendOtp(user);

        return res.status(200).json({
            message: "A new code has been sent to your email."
        });

    } catch (error) {

        console.log("Resend OTP error:", error);

        return res.status(500).json({
            message: "We couldn't send the email. Please try again in a minute."
        });
    }
};



// ==========================================
// LOGIN
// ==========================================

const login = async (req, res) => {

    try {

        const email = cleanEmail(req.body.email);
        const password = String(req.body.password || "");


        // checking if it matches with the stored data
        const user = await User.findOne({ email: email });

        if (!user) {
            return res.status(401).json({
                message: "user not found"
            });
        }


        // compare the entered password with the encrypted password from the database
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }


        // Password correct → JWT token generate
        const token = jwt.sign(
            {
                userId: user._id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );


        // Token frontend ko bhej diya
        return res.status(200).json({
            message: "Login successful",
            token: token
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: "Something went wrong"
        });
    }
};


// ==========================================
// FORGOT PASSWORD
// POST /api/auth/forgot-password  { email }
// ==========================================
const forgotPassword = async (req, res) => {
    try {
        const email = cleanEmail(req.body.email);

        if (!email) {
            return res.status(400).json({ message: "Please enter your university email." });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "No account found with this email." });
        }

        // Resend rate limit check (60s)
        if (user.otpSentAt) {
            const secondsPassed = (Date.now() - user.otpSentAt.getTime()) / 1000;
            if (secondsPassed < RESEND_SECONDS) {
                const secondsLeft = Math.ceil(RESEND_SECONDS - secondsPassed);
                return res.status(429).json({
                    message: `Please wait ${secondsLeft} seconds before requesting a new code.`
                });
            }
        }

        const otp = crypto.randomInt(100000, 1000000).toString();
        user.otpHash = await bcrypt.hash(otp, 10);
        user.otpExpiresAt = new Date(Date.now() + OTP_MINUTES * 60 * 1000);
        user.otpAttempts = 0;
        user.otpSentAt = new Date();
        await user.save();

        await sendEmail({
            to: user.email,
            subject: "CampusShare Password Reset Code",
            text: `Your CampusShare password reset code is ${otp}. It expires in ${OTP_MINUTES} minutes.`,
            html: `
                <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 12px; background: #ffffff;">
                    <h2 style="color: #ff5a1f; margin-top: 0;">CampusShare Password Reset</h2>
                    <p style="color: #333; font-size: 15px;">Hi <b>${user.name}</b>,</p>
                    <p style="color: #444; font-size: 14px;">We received a request to reset your password. Use this 6-digit verification code:</p>
                    <div style="margin: 24px 0; font-size: 26px; font-weight: bold; letter-spacing: 6px; color: #ff5a1f; background: #fff4ed; padding: 14px; text-align: center; border-radius: 8px; border: 1px solid #ffe2d4;">
                        ${otp}
                    </div>
                    <p style="color: #666; font-size: 13px;">This code expires in ${OTP_MINUTES} minutes. If you did not request this, you can safely ignore this email.</p>
                </div>
            `
        });

        return res.status(200).json({
            message: "A 6-digit reset code has been emailed to you."
        });

    } catch (error) {
        console.log("Forgot password error:", error);
        return res.status(500).json({
            message: "Unable to send reset code. Please try again."
        });
    }
};


// ==========================================
// RESET PASSWORD
// POST /api/auth/reset-password  { email, otp, newPassword }
// ==========================================
const resetPassword = async (req, res) => {
    try {
        const email = cleanEmail(req.body.email);
        const otp = String(req.body.otp || "").trim();
        const newPassword = String(req.body.newPassword || "");

        if (!email || !/^\d{6}$/.test(otp) || !newPassword) {
            return res.status(400).json({
                message: "Please enter your email, the 6-digit code, and your new password."
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                message: "New password must be at least 6 characters long."
            });
        }

        const user = await User.findOne({ email }).select("+otpHash");

        if (!user) {
            return res.status(404).json({ message: "No account found with this email." });
        }

        if (!user.otpHash || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
            return res.status(400).json({
                message: "This code has expired. Please request a new one."
            });
        }

        if (user.otpAttempts >= MAX_ATTEMPTS) {
            return res.status(429).json({
                message: "Too many incorrect attempts. Please request a new code."
            });
        }

        const isCorrect = await bcrypt.compare(otp, user.otpHash);

        if (!isCorrect) {
            user.otpAttempts += 1;
            await user.save();
            return res.status(400).json({
                message: `Wrong code. Attempts left: ${MAX_ATTEMPTS - user.otpAttempts}`
            });
        }

        // Hash new password and save
        user.password = await bcrypt.hash(newPassword, 10);
        user.otpHash = "";
        user.otpExpiresAt = undefined;
        user.otpAttempts = 0;
        await user.save();

        return res.status(200).json({
            message: "Password reset successful! You can now log in with your new password."
        });

    } catch (error) {
        console.log("Reset password error:", error);
        return res.status(500).json({
            message: "Unable to reset password. Please try again."
        });
    }
};


module.exports = {
    signup,
    login,
    verifyOtp,
    resendOtp,
    forgotPassword,
    resetPassword
};
