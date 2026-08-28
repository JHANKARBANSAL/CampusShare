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
        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model("User", userSchema);

module.exports = User;

// isko hum authController.js me import karneg