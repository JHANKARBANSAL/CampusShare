const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
    createDispute,
    getMyDisputeForTransaction
} = require("../controllers/disputeController");


// Issue report karo.
// upload.array("photos", 3) => zyada se zyada 3 photo, optional.
router.post(
    "/",
    authMiddleware,
    upload.array("photos", 3),
    createDispute
);

// Maine is transaction pe pehle se report kiya hai kya
router.get(
    "/transaction/:id",
    authMiddleware,
    getMyDisputeForTransaction
);


module.exports = router;
