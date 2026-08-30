const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
    {
        need: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "NeedPost",
            required: true
        },

        offeredBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        status: {
            type: String,
            enum: ["pending", "accepted", "rejected"],
            default: "pending"
        }
    },
    {
        timestamps: true
    }
);

const Offer = mongoose.model("Offer", offerSchema);

module.exports = Offer;