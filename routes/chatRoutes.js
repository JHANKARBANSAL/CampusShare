const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { getChatHistory, markMessagesRead } = require("../controllers/chatController");

router.get("/:transactionId", authMiddleware, getChatHistory);
router.patch("/:transactionId/read", authMiddleware, markMessagesRead);

module.exports = router;
