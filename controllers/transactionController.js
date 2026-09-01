const Transaction = require("../models/Transaction");
const NeedPost = require("../models/NeedPost");


// ==========================================
// Chhota helper: duration ko milliseconds me badalta hai
// ==========================================

const durationToMs = (value, unit) => {

    const oneHour = 60 * 60 * 1000;

    if (unit === "hours") {
        return value * oneHour;
    }

    if (unit === "days") {
        return value * 24 * oneHour;
    }

    // weeks
    return value * 7 * 24 * oneHour;
};



// ==========================================
// 1. OFFER KARO  (lender dabata hai "I Can Help")
// ==========================================

const createOffer = async (req, res) => {

    try {

        const need = await NeedPost.findById(req.body.needId);

        if (!need) {
            return res.status(404).json({
                message: "Request not found"
            });
        }

        // Apni hi request pe offer nahi kar sakte
        if (need.requestedBy.toString() === req.user.id) {
            return res.status(400).json({
                message: "You cannot help on your own request"
            });
        }

        // Request pehle hi kisi se match ho chuki hai
        if (need.status !== "open") {
            return res.status(400).json({
                message: "This request is no longer open"
            });
        }

        // Ek banda do baar offer na kare
        const alreadyOffered = await Transaction.findOne({
            needPost: need._id,
            lender: req.user.id,
            status: { $in: ["offered", "accepted", "borrowed", "return_pending"] }
        });

        if (alreadyOffered) {
            return res.status(400).json({
                message: "You have already offered help on this request"
            });
        }

        const transaction = await Transaction.create({
            needPost: need._id,
            borrower: need.requestedBy,
            lender: req.user.id,
            status: "offered"
        });

        return res.status(201).json({
            message: "Offer sent",
            transaction
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: "Unable to send offer"
        });
    }
};



// ==========================================
// 2. ACCEPT KARO  (borrower dabata hai)
// ==========================================

const acceptOffer = async (req, res) => {

    try {

        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({
                message: "Transaction not found"
            });
        }

        // Sirf need wala banda accept kar sakta hai
        if (transaction.borrower.toString() !== req.user.id) {
            return res.status(403).json({
                message: "You cannot accept this offer"
            });
        }

        if (transaction.status !== "offered") {
            return res.status(400).json({
                message: "This offer cannot be accepted now"
            });
        }

        transaction.status = "accepted";
        transaction.acceptedAt = new Date();
        await transaction.save();

        // Baaki sab offers is need pe reject ho jaayenge
        await Transaction.updateMany(
            {
                needPost: transaction.needPost,
                _id: { $ne: transaction._id },
                status: "offered"
            },
            {
                status: "rejected"
            }
        );

        // Need ab matched
        await NeedPost.findByIdAndUpdate(
            transaction.needPost,
            { status: "matched" }
        );

        return res.status(200).json({
            message: "Offer accepted",
            transaction
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: "Unable to accept offer"
        });
    }
};



// ==========================================
// 3. ITEM HAND OVER  (lender dabata hai)
// ==========================================

const markHandover = async (req, res) => {

    try {

        const transaction = await Transaction
            .findById(req.params.id)
            .populate("needPost", "durationValue durationUnit");

        if (!transaction) {
            return res.status(404).json({
                message: "Transaction not found"
            });
        }

        if (transaction.lender.toString() !== req.user.id) {
            return res.status(403).json({
                message: "Only the lender can do this"
            });
        }

        if (transaction.status !== "accepted") {
            return res.status(400).json({
                message: "This item cannot be handed over now"
            });
        }

        const now = new Date();

        // Wapas karne ka time = abhi + need ki duration
        const extraMs = durationToMs(
            transaction.needPost.durationValue,
            transaction.needPost.durationUnit
        );

        transaction.status = "borrowed";
        transaction.handedOverAt = now;
        transaction.dueAt = new Date(now.getTime() + extraMs);

        await transaction.save();

        return res.status(200).json({
            message: "Item handed over",
            transaction
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: "Unable to update transaction"
        });
    }
};



// ==========================================
// 4. RETURN ITEM  (borrower dabata hai)
// ==========================================

const requestReturn = async (req, res) => {

    try {

        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({
                message: "Transaction not found"
            });
        }

        if (transaction.borrower.toString() !== req.user.id) {
            return res.status(403).json({
                message: "Only the borrower can do this"
            });
        }

        if (transaction.status !== "borrowed") {
            return res.status(400).json({
                message: "This item cannot be returned now"
            });
        }

        transaction.status = "return_pending";
        transaction.returnRequestedAt = new Date();

        await transaction.save();

        return res.status(200).json({
            message: "Return marked, waiting for lender to confirm",
            transaction
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: "Unable to update transaction"
        });
    }
};



// ==========================================
// 4.5 OFFER WAPAS LO  (lender dabata hai)
//     Sirf tab tak jab tak borrower ne accept nahi kiya
// ==========================================

const withdrawOffer = async (req, res) => {

    try {

        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({
                message: "Transaction not found"
            });
        }

        // Offer lender ka hai, isliye wahi wapas le sakta hai
        if (transaction.lender.toString() !== req.user.id) {
            return res.status(403).json({
                message: "Only the lender can do this"
            });
        }

        // Accept hone ke baad wapas nahi le sakte
        if (transaction.status !== "offered") {
            return res.status(400).json({
                message: "This offer cannot be withdrawn now"
            });
        }

        transaction.status = "withdrawn";

        await transaction.save();

        return res.status(200).json({
            message: "Offer withdrawn",
            transaction
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: "Unable to withdraw offer"
        });
    }
};



// ==========================================
// 5. CONFIRM RETURN  (lender dabata hai)
// ==========================================

const confirmReturn = async (req, res) => {

    try {

        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({
                message: "Transaction not found"
            });
        }

        if (transaction.lender.toString() !== req.user.id) {
            return res.status(403).json({
                message: "Only the lender can do this"
            });
        }

        if (transaction.status !== "return_pending") {
            return res.status(400).json({
                message: "This return cannot be confirmed now"
            });
        }

        const now = new Date();

        transaction.status = "completed";
        transaction.completedAt = now;

        // Time par wapas hua ya late
        transaction.returnedOnTime = now <= transaction.dueAt;

        await transaction.save();

        // Need ab band
        await NeedPost.findByIdAndUpdate(
            transaction.needPost,
            { status: "closed" }
        );

        return res.status(200).json({
            message: "Return confirmed",
            transaction
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: "Unable to confirm return"
        });
    }
};



// ==========================================
// 6. MERE SAARE TRANSACTIONS  (My Activity page ke liye)
// ==========================================

const getMyTransactions = async (req, res) => {

    try {

        const transactions = await Transaction
            .find({
                $or: [
                    { borrower: req.user.id },
                    { lender: req.user.id }
                ]
            })
            .populate("needPost", "itemName description durationValue durationUnit")
            .populate("borrower", "name branch batch")
            .populate("lender", "name branch batch")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            transactions
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: "Unable to load your activity"
        });
    }
};



// ==========================================
// 7. EK TRANSACTION KI PURI DETAIL
//    GET /api/transactions/:id
// ==========================================

const getTransactionById = async (req, res) => {

    try {

        const transaction = await Transaction.findById(req.params.id)

            .populate({
                path: "needPost",
                select: "itemName description neededBy durationValue durationUnit status createdAt"
            })

            .populate({
                path: "borrower",
                select: "name branch batch profileImage"
            })

            .populate({
                path: "lender",
                select: "name branch batch profileImage"
            });


        if (!transaction) {
            return res.status(404).json({
                message: "Transaction not found"
            });
        }


        const loggedInUserId = req.user.id;

        const isBorrower =
            transaction.borrower._id.toString() === loggedInUserId;

        const isLender =
            transaction.lender._id.toString() === loggedInUserId;


        // Random banda kisi aur ka transaction nahi dekh sakta
        if (!isBorrower && !isLender) {
            return res.status(403).json({
                message: "You are not allowed to view this transaction"
            });
        }


        return res.status(200).json({

            transaction: transaction,

            myRole: isBorrower ? "borrower" : "lender"

        });

    } catch (error) {

        console.log("Get transaction error:", error);

        return res.status(500).json({
            message: "Something went wrong"
        });
    }
};



module.exports = {
    createOffer,
    acceptOffer,
    markHandover,
    requestReturn,
    withdrawOffer,
    confirmReturn,
    getMyTransactions,
    getTransactionById
};
