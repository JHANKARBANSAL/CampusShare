const Message = require("../models/Message");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

// ==========================================================
// 1. CHAT HISTORY FETCH KARO
// GET /api/chat/:transactionId
// ==========================================================
const getChatHistory = async (req, res) => {
    try {
        const { transactionId } = req.params;

        const transaction = await Transaction.findById(transactionId)
            .populate("needPost", "itemName durationValue durationUnit neededBy")
            .populate("borrower", "name profileImage")
            .populate("lender", "name profileImage");

        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        const userId = req.user.id;
        const isBorrower = transaction.borrower._id.toString() === userId;
        const isLender = transaction.lender._id.toString() === userId;

        if (!isBorrower && !isLender) {
            return res.status(403).json({ message: "You are not authorized to view this chat" });
        }

        const otherUser = isBorrower ? transaction.lender : transaction.borrower;

        const messages = await Message.find({ transaction: transactionId })
            .populate("sender", "name profileImage")
            .sort({ createdAt: 1 });

        return res.status(200).json({
            transaction: {
                id: transaction._id,
                status: transaction.status,
                itemName: transaction.needPost?.itemName || "Item",
                duration: transaction.needPost ? `${transaction.needPost.durationValue} ${transaction.needPost.durationUnit}` : "",
                otherUser: {
                    id: otherUser._id,
                    name: otherUser.name,
                    profileImage: otherUser.profileImage
                },
                role: isBorrower ? "borrower" : "lender"
            },
            messages
        });
    } catch (error) {
        console.log("Chat history error:", error);
        return res.status(500).json({ message: "Unable to load messages" });
    }
};

// ==========================================================
// 2. MARK MESSAGES AS READ
// PATCH /api/chat/:transactionId/read
// ==========================================================
const markMessagesRead = async (req, res) => {
    try {
        const { transactionId } = req.params;
        const userId = req.user.id;

        await Message.updateMany(
            {
                transaction: transactionId,
                receiver: userId,
                read: false
            },
            {
                $set: { read: true }
            }
        );

        return res.status(200).json({ message: "Marked as read" });
    } catch (error) {
        console.log("Mark read error:", error);
        return res.status(500).json({ message: "Unable to update read status" });
    }
};

module.exports = {
    getChatHistory,
    markMessagesRead
};
