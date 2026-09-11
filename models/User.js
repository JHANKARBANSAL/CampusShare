const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        branch: {
            type: String,
            required: true
        },

        batch: {
            type: String,
            required: true
        },

        enrollmentNumber: {
            type: String,
            required: true,
            unique: true
        },

        profileImage: {
            type: String,
            default: ""
        },

        isVerified: {
            type: Boolean,
            default: false
        },


        // ---------- Email verification (OTP) ----------
        // 6-digit code khud kabhi save nahi hota - sirf uska
        // bcrypt hash, bilkul password ki tarah.
        //
        // select: false ka matlab: koi bhi query (jaise
        // /api/users/me) ye field apne aap nahi laati. Jise
        // chahiye use .select("+otpHash") likh ke maangna padta
        // hai - isliye ye galti se frontend tak nahi pahunchta.

        otpHash: {
            type: String,
            default: "",
            select: false
        },

        otpExpiresAt: {
            type: Date
        },

        // Galat code kitni baar daala. 5 ke baad naya code chahiye.
        otpAttempts: {
            type: Number,
            default: 0
        },

        // Aakhri code kab bheja - "Resend" ke beech 60 second
        // ka gap isi se nikalte hain.
        otpSentAt: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model("User", userSchema);

module.exports = User;

// isko hum authController.js me import karneg