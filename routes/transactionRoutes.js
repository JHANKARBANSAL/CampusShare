const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    createOffer,
    acceptOffer,
    markHandover,
    requestReturn,
    withdrawOffer,
    confirmReturn,
    getMyTransactions,
    getTransactionById
} = require("../controllers/transactionController");


// Mere saare transactions (My Activity page)
router.get("/me", authMiddleware, getMyTransactions);

// 1. Lender: "I Can Help"
router.post("/", authMiddleware, createOffer);

// 2. Borrower: offer accept
router.patch("/:id/accept", authMiddleware, acceptOffer);

// 3. Lender: item de diya
router.patch("/:id/handover", authMiddleware, markHandover);

// 4. Borrower: item wapas kar diya
router.patch("/:id/return-request", authMiddleware, requestReturn);

// 5. Lender: return confirm
router.patch("/:id/confirm-return", authMiddleware, confirmReturn);

// Lender: apna offer wapas le lo (sirf accept hone se pehle)
router.patch("/:id/withdraw", authMiddleware, withdrawOffer);


// Ek transaction ki puri detail
// NOTE: ye "/me" ke NEECHE hi rehna chahiye, warna Express
// "me" ko bhi ek id samajh lega
router.get("/:id", authMiddleware, getTransactionById);


module.exports = router;
