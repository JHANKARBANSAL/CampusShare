const mongoose = require("mongoose");

// Ek Dispute = kisi transaction pe ek banda shikayat karta hai.
//
// Do alag log hote hain:
//   reportedBy       -> jisne shikayat ki
//   reportedAgainst  -> jiski galti hai
//
// Ye dono alag isliye rakhe hain kyunki shikayat dono taraf se
// ho sakti hai (lender bhi kar sakta hai, borrower bhi).
// Trust score ki penalty reportedAgainst wale bande pe lagti hai.

const disputeSchema = new mongoose.Schema(
    {
        transaction: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Transaction",
            required: true
        },

        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        reportedAgainst: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // Pehle do reasons lender ke liye hain (borrower ki galti),
        // agle do borrower ke liye (lender ki galti).
        reason: {
            type: String,
            enum: [
                "not_returned",     // lender: cheez wapas hi nahi mili
                "damaged",          // lender: tooti hui wapas aayi
                "wrong_item",       // borrower: galat/alag cheez di
                "not_handed_over",  // borrower: lender accept karke mukar gaya
                "other"
            ],
            required: true
        },

        // Cloudinary ke URLs (optional proof photos)
        photos: {
            type: [String],
            default: []
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        // Abhi sab "open" hi rahenge.
        // Admin resolution baad me banayenge.
        status: {
            type: String,
            enum: ["open", "resolved"],
            default: "open"
        }
    },
    {
        timestamps: true
    }
);

const Dispute = mongoose.model("Dispute", disputeSchema);

module.exports = Dispute;
