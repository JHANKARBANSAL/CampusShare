const express = require("express");

const router = express.Router();

const authMiddleware =
  require("../middleware/authMiddleware");

const upload =
  require("../middleware/uploadMiddleware");

const {
  getMyProfile,
  uploadProfilePhoto,
  getMyStats
} = require("../controllers/userController");



// Get logged-in user's profile

router.get(
  "/me",
  authMiddleware,
  getMyProfile
);



// Stats + trust score (profile page ke numbers)

router.get(
  "/me/stats",
  authMiddleware,
  getMyStats
);



// Change profile photo

router.post(
  "/me/profile-photo",
  authMiddleware,
  upload.single("profileImage"),
  uploadProfilePhoto
);


module.exports = router;
