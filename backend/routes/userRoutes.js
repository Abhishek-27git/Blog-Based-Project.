const express = require("express");
const { getUserProfile, updateUserProfile } = require("../controllers/userController");

const auth = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

// ── Public Routes ───────────────────────────────────────────────────────────
router.get("/profile/:id", getUserProfile);

// ── Private Routes ──────────────────────────────────────────────────────────
router.put("/profile", auth, upload.single("avatar"), updateUserProfile);

module.exports = router;
