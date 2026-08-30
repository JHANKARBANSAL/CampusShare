const express = require("express");
const router = express.Router();

const {
    getMyProfile,
    uploadProfilePhoto,
    uploadIdCard
} = require("../controllers/userController");

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

// Mera profile + stats mangwana
router.get("/me", authMiddleware, getMyProfile);

// Profile photo change karna (form field ka naam "profileImage" hona chahiye)
router.post("/me/profile-photo", authMiddleware, upload.single("profileImage"), uploadProfilePhoto);

// ID card upload karna (form field ka naam "idCard" hona chahiye)
router.post("/me/id-card", authMiddleware, upload.single("idCard"), uploadIdCard);

module.exports = router;
