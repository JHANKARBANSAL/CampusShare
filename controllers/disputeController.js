const Dispute = require("../models/Dispute");
const Transaction = require("../models/Transaction");
const uploadBuffer = require("../utils/uploadBuffer");


// Ye teen status me hi issue report kar sakte hain.
// offered/rejected/withdrawn pe abhi kuch hua hi nahi,
// aur completed pe report band hai.
const REPORTABLE = ["accepted", "borrowed", "return_pending"];

// Sirf yahi 4 reasons allowed hain (model me bhi yahi likhe hain)
const REASONS = [
    "not_returned",
    "damaged",
    "wrong_item",
    "not_handed_over",
    "other"
];



// ==========================================
// ISSUE REPORT KARO
// POST /api/disputes
// ==========================================

const createDispute = async (req, res) => {

    try {

        const { transactionId, reason, description } = req.body;


        if (!transactionId || !reason || !description) {
            return res.status(400).json({
                message: "Please select a reason and describe the issue"
            });
        }


        if (!REASONS.includes(reason)) {
            return res.status(400).json({
                message: "Please select a valid reason"
            });
        }


        const transaction = await Transaction.findById(transactionId);

        if (!transaction) {
            return res.status(404).json({
                message: "Transaction not found"
            });
        }


        const me = req.user.id;

        const isBorrower = transaction.borrower.toString() === me;
        const isLender = transaction.lender.toString() === me;


        // Sirf isi transaction ke do log report kar sakte hain
        if (!isBorrower && !isLender) {
            return res.status(403).json({
                message: "You are not part of this transaction"
            });
        }


        if (!REPORTABLE.includes(transaction.status)) {
            return res.status(400).json({
                message: "An issue cannot be reported at this stage"
            });
        }


        // Ek banda ek transaction pe ek hi baar
        const alreadyReported = await Dispute.findOne({
            transaction: transaction._id,
            reportedBy: me
        });

        if (alreadyReported) {
            return res.status(400).json({
                message: "You have already reported an issue on this transaction"
            });
        }


        // Doosra banda hi wo hai jiske khilaf shikayat hai.
        // User se nahi poochhte, khud nikaal lete hain.
        const reportedAgainst = isBorrower
            ? transaction.lender
            : transaction.borrower;


        // Photos optional hain. Multer inhe req.files me
        // memory me deta hai, wahan se Cloudinary pe bhej dete hain
        // (wahi tarika jo profile photo me use hua hai).
        const photoUrls = [];

        if (req.files && req.files.length > 0) {

            for (const file of req.files) {

                const result = await uploadBuffer(
                    file.buffer,
                    "campusshare/disputes"
                );

                photoUrls.push(result.secure_url);
            }
        }


        const dispute = await Dispute.create({
            transaction: transaction._id,
            reportedBy: me,
            reportedAgainst: reportedAgainst,
            reason: reason,
            description: description,
            photos: photoUrls
        });


        // Ye zaroori hai warna transaction pe kahin nishaan hi nahi rahega
        transaction.hasIssue = true;
        await transaction.save();


        return res.status(201).json({
            message: "Issue reported",
            dispute: dispute
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: "Unable to report the issue"
        });
    }
};



// ==========================================
// MAINE IS TRANSACTION PE REPORT KIYA HAI KYA
// GET /api/disputes/transaction/:id
//
// Isse frontend ko pata chalta hai ki button
// dikhana hai ya "already reported" likhna hai.
// ==========================================

const getMyDisputeForTransaction = async (req, res) => {

    try {

        const dispute = await Dispute.findOne({
            transaction: req.params.id,
            reportedBy: req.user.id
        });


        return res.status(200).json({
            reported: dispute ? true : false,
            dispute: dispute
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: "Something went wrong"
        });
    }
};



module.exports = {
    createDispute,
    getMyDisputeForTransaction
};
