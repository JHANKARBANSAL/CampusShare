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
        profileImage: {
    type: String,
    default: ""
},
idCardImage: {
    type: String,
    default: ""
},

verificationStatus: {
    type: String,
    enum: ["unverified", "pending", "verified", "rejected"],
    default: "unverified"
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