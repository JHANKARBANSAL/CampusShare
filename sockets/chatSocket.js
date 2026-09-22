const jwt = require("jsonwebtoken");
const Message = require("../models/Message");
const Transaction = require("../models/Transaction");

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
