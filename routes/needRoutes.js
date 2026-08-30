const express = require("express");
const router = express.Router();

const { createNeed , getAllNeeds, getMyNeeds } = require("../controllers/needController");
const authMiddleware = require("../middleware/authMiddleware");
router.get("/", getAllNeeds);
router.get("/mine", authMiddleware, getMyNeeds);
router.post("/", authMiddleware, createNeed);

module.exports = router;