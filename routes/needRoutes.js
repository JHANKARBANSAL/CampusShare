const express = require("express");
const router = express.Router();

const { createNeed , getAllNeeds } = require("../controllers/needController");
const authMiddleware = require("../middleware/authMiddleware");
router.get("/", getAllNeeds);
router.post("/", authMiddleware, createNeed);

module.exports = router;