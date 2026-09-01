const mongoose = require("mongoose");

// Ek Transaction = ek banda ek need pe help offer karta hai.
// Shuru se aakhir tak yahi document chalta hai, bas status badalta hai:
//
// offered -> accepted -> borrowed -> return_pending -> completed
//
const transactionSchema = new mongoose.Schema(
    {
        // Kis request par ye transaction hai
        needPost: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "NeedPost",
            required: true
        },

        // Jisne need post ki thi (maangne wala)
        borrower: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // Jisne help offer ki (dene wala)
        lender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        status: {
            type: String,
            enum: [
                "offered",
                "accepted",
                "borrowed",
                "return_pending",
                "completed",
                "rejected",
                "withdrawn"
            ],
            default: "offered"
        },

        // Offer kab accept hua
        acceptedAt: {
            type: Date,
            default: null
        },

        // Item kab diya gaya
        handedOverAt: {
            type: Date,
            default: null
        },

        // Kab tak wapas karna hai (handover time + need ki duration)
        dueAt: {
            type: Date,
            default: null
        },

        // Borrower ne "Return Item" kab dabaya
        returnRequestedAt: {
            type: Date,
            default: null
        },

        // Lender ne return kab confirm kiya
        completedAt: {
            type: Date,
            default: null
        },

        // Time par wapas hua ya nahi (complete hote waqt calculate hota hai)
        returnedOnTime: {
            type: Boolean,
            default: false
        },

        // Koi dispute / problem hui thi kya (UI baad me banayenge)
        hasIssue: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
