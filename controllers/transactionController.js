const Transaction = require("../models/Transaction");
const NeedPost = require("../models/NeedPost");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");


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

        // Borrower ko email notification bhejo (background me, failure won't block response)
        (async () => {
            try {
                const [borrower, lender] = await Promise.all([
                    User.findById(need.requestedBy).select("name email"),
                    User.findById(req.user.id).select("name")
                ]);

                if (borrower && borrower.email) {
                    const lenderName = lender?.name || "A classmate";
                    const baseUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 7000}`;
                    const chatUrl = `${baseUrl}/pages/activity.html?chat=${transaction._id}`;

                    console.log(`\n💌 [TESTING] Offer Email for ${borrower.email}: ${lenderName} offered to help! Chat URL: ${chatUrl}\n`);

                    await sendEmail({
                        to: borrower.email,
                        subject: `CampusShare: ${lenderName} offered to help with "${need.itemName}"!`,
                        text: `Hi ${borrower.name},\n\nGreat news! ${lenderName} offered to lend you "${need.itemName}".\n\nLog in to CampusShare to chat directly with ${lenderName}:\n${chatUrl}\n\nBest,\nCampusShare Team`,
                        html: `
                            <div style="font-family: sans-serif; max-width: 520px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
                                <div style="display: flex; align-items: center; margin-bottom: 16px;">
                                    <h2 style="color: #ff5a1f; margin: 0; font-size: 20px;">CampusShare</h2>
                                </div>
                                <h3 style="color: #111827; margin-top: 0;">Help is on the way! 🎉</h3>
                                <p style="color: #374151; font-size: 15px; line-height: 1.5;">Hi <b>${borrower.name}</b>,</p>
                                <p style="color: #374151; font-size: 15px; line-height: 1.5;">
                                    <b>${lenderName}</b> just offered to lend you <b>"${need.itemName}"</b>.
                                </p>
                                <p style="color: #374151; font-size: 15px; line-height: 1.5;">
                                    You can now chat directly in real-time to discuss where and when to meet on campus.
                                </p>
                                <div style="margin: 28px 0;">
                                    <a href="${chatUrl}" style="background-color: #ff5a1f; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
                                        Open CampusShare to Chat
                                    </a>
                                </div>
                                <p style="color: #6b7280; font-size: 12px; margin: 0 0 16px;">
                                    Direct link: <br />
                                    <a href="${chatUrl}" style="color: #ff5a1f; word-break: break-all;">${chatUrl}</a>
                                </p>
                                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
                                <p style="color: #6b7280; font-size: 12px; margin: 0;">
                                    CampusShare • Peer-to-peer sharing for college students.
                                </p>
                            </div>
                        `
                    });
                }
            } catch (emailErr) {
                console.log("Email notification error (offer):", emailErr);
            }
        })();

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

        // Atomic compare-and-swap: Sirf tabhi accept hoga agar need abhi bhi "open" hai (Fix 4: Race Condition)
        const matchedNeed = await NeedPost.findOneAndUpdate(
            { _id: transaction.needPost, status: "open" },
            { status: "matched" },
            { new: true }
        );

        if (!matchedNeed) {
            return res.status(400).json({
                message: "This request is no longer open or was already accepted"
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
