const jwt = require("jsonwebtoken");
const Message = require("../models/Message");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

const escapeHtml = (str) => {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

// Map to avoid spamming email notifications: `${txnId}_${receiverId}` -> timestamp
const lastEmailNotification = new Map();

const initChatSocket = (io) => {
    // Map to track online users: userId -> Set(socketId)
    const onlineUsers = new Map();

    // 1. JWT Authentication Middleware for Socket.IO
    io.use((socket, next) => {
        try {
            const token =
                socket.handshake.auth?.token ||
                socket.handshake.headers?.authorization?.split(" ")[1];

            if (!token) {
                return next(new Error("Authentication token missing"));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.userId;
            next();
        } catch (error) {
            return next(new Error("Invalid authentication token"));
        }
    });

    // 2. Connection handler
    io.on("connection", (socket) => {
        const userId = socket.userId;

        // Register online socket
        if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, new Set());
        }
        onlineUsers.get(userId).add(socket.id);

        // Notify that user is online
        io.emit("user_online_status", { userId, isOnline: true });

        // Join specific transaction chat room
        socket.on("join_chat", async ({ transactionId }) => {
            try {
                if (!transactionId) return;

                const transaction = await Transaction.findById(transactionId);
                if (!transaction) return;

                const isParticipant =
                    transaction.borrower.toString() === userId ||
                    transaction.lender.toString() === userId;

                if (!isParticipant) return;

                const room = `txn_${transactionId}`;
                socket.join(room);

                const otherUserId =
                    transaction.borrower.toString() === userId
                        ? transaction.lender.toString()
                        : transaction.borrower.toString();

                const isOtherOnline = onlineUsers.has(otherUserId);

                socket.emit("chat_joined", {
                    transactionId,
                    otherUserOnline: isOtherOnline
                });
            } catch (err) {
                console.log("Socket join_chat error:", err);
            }
        });

        // Leave transaction chat room
        socket.on("leave_chat", ({ transactionId }) => {
            if (transactionId) {
                socket.leave(`txn_${transactionId}`);
            }
        });

        // Send message event
        socket.on("send_message", async ({ transactionId, text }) => {
            try {
                if (!text || !text.trim() || !transactionId) return;

                const transaction = await Transaction.findById(transactionId);
                if (!transaction) return;

                const isBorrower = transaction.borrower.toString() === userId;
                const isLender = transaction.lender.toString() === userId;

                if (!isBorrower && !isLender) return;

                const receiverId = isBorrower
                    ? transaction.lender
                    : transaction.borrower;

                const message = await Message.create({
                    transaction: transactionId,
                    sender: userId,
                    receiver: receiverId,
                    text: text.trim().slice(0, 1000)
                });

                await message.populate("sender", "name profileImage");

                const room = `txn_${transactionId}`;
                io.to(room).emit("receive_message", message);

                // Email notification: Sirf PEHLE message par helper se receiver ko email bhejo
                (async () => {
                    try {
                        const isHelper = isLender;
                        // Check karo is transaction me kitne messages hain
                        const messageCount = await Message.countDocuments({ transaction: transactionId });

                        // Agar ye Helper ka sabse pehla message hai (count === 1)
                        if (isHelper && messageCount === 1) {
                            const [receiver, fullTxn] = await Promise.all([
                                User.findById(receiverId).select("name email"),
                                Transaction.findById(transactionId).populate("needPost", "itemName")
                            ]);

                            if (receiver && receiver.email) {
                                const helperName = message.sender?.name || "Someone";
                                const itemName = fullTxn?.needPost?.itemName || "your requested item";
                                const baseUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 7000}`;
                                const chatUrl = `${baseUrl}/pages/activity.html?chat=${transactionId}`;

                                const subject = `💬 ${helperName} has sent you a message`;
                                const emailText = `Hi ${receiver.name},\n\n${helperName} has sent you a message regarding "${itemName}":\n\n"${message.text}"\n\nClick here to open chat & reply:\n${chatUrl}\n\nBest,\nCampusShare Team`;
                                const emailHtml = `
                                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff; color: #1f2937;">
                                        <div style="display: flex; align-items: center; margin-bottom: 16px;">
                                            <h2 style="color: #ff5a1f; margin: 0; font-size: 20px; font-weight: 700;">CampusShare</h2>
                                        </div>
                                        <h3 style="color: #111827; margin: 0 0 12px; font-size: 18px;">💬 New Message from Helper</h3>
                                        <p style="color: #374151; font-size: 15px; line-height: 1.5; margin: 0 0 16px;">
                                            Hi <b>${escapeHtml(receiver.name)}</b>,<br/>
                                            <b>${escapeHtml(helperName)}</b> has sent you a message regarding <b>"${escapeHtml(itemName)}"</b>:
                                        </p>
                                        <div style="background-color: #f8fafc; border-left: 4px solid #ff5a1f; padding: 14px 18px; border-radius: 6px; margin: 16px 0; font-size: 15px; color: #1e293b; line-height: 1.5;">
                                            "${escapeHtml(message.text)}"
                                        </div>
                                        <div style="margin: 28px 0;">
                                            <a href="${chatUrl}" style="background-color: #ff5a1f; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
                                                Open Message Box &amp; Reply
                                            </a>
                                        </div>
                                        <p style="color: #6b7280; font-size: 13px; line-height: 1.4; margin: 20px 0 0;">
                                            Direct link: <br />
                                            <a href="${chatUrl}" style="color: #ff5a1f; word-break: break-all;">${chatUrl}</a>
                                        </p>
                                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
                                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                                            CampusShare • Peer-to-peer sharing on campus.
                                        </p>
                                    </div>
                                `;

                                await sendEmail({
                                    to: receiver.email,
                                    subject,
                                    text: emailText,
                                    html: emailHtml
                                });
                                console.log(`[First Message Email] Sent to ${receiver.email} for transaction ${transactionId}`);
                            }
                        }
                    } catch (emailErr) {
                        console.log("First message email notification error:", emailErr);
                    }
                })();
            } catch (err) {
                console.log("Socket send_message error:", err);
            }
        });

        // Typing indicator
        socket.on("typing", ({ transactionId }) => {
            if (transactionId) {
                socket.to(`txn_${transactionId}`).emit("user_typing", {
                    transactionId,
                    userId
                });
            }
        });

        socket.on("stop_typing", ({ transactionId }) => {
            if (transactionId) {
                socket.to(`txn_${transactionId}`).emit("user_stop_typing", {
                    transactionId,
                    userId
                });
            }
        });

        // Check if a specific user is currently online
        socket.on("check_user_online", ({ targetUserId }, callback) => {
            const isOnline = onlineUsers.has(targetUserId);
            if (typeof callback === "function") {
                callback({ targetUserId, isOnline });
            }
        });

        // Disconnect handler
        socket.on("disconnect", () => {
            if (onlineUsers.has(userId)) {
                const userSockets = onlineUsers.get(userId);
                userSockets.delete(socket.id);
                if (userSockets.size === 0) {
                    onlineUsers.delete(userId);
                    io.emit("user_online_status", { userId, isOnline: false });
                }
            }
        });
    });
};

module.exports = initChatSocket;
