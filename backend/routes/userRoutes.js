const express = require("express");
const { getUserProfile, updateUserProfile, toggleFollowUser } = require("../controllers/userController");

const auth = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

// ── Public Routes ───────────────────────────────────────────────────────────
router.get("/profile/:id", getUserProfile);

// ── Private Routes ──────────────────────────────────────────────────────────
router.put("/profile", auth, upload.single("avatar"), updateUserProfile);
router.put("/:id/follow", auth, toggleFollowUser);

module.exports = router;
