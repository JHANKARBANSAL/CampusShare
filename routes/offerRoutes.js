const express = require("express");
const router = express.Router();

const { createOffer, getReceivedOffers, acceptOffer, rejectOffer } = require("../controllers/offerController");
const authMiddleware = require("../middleware/authMiddleware");

router.get(
    "/received",
    authMiddleware,
    getReceivedOffers
);

router.post(
    "/:needId",
    authMiddleware,
    createOffer
);

router.patch(
    "/:offerId/accept",
    authMiddleware,
    acceptOffer
);

router.patch(
    "/:offerId/reject",
    authMiddleware,
    rejectOffer
);

module.exports = router;