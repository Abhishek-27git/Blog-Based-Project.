const express = require("express");
const {
  getAnalytics,
  getAllUsers,
  toggleBanUser,
  deleteUserAndContent,
  toggleHideComment,
} = require("../controllers/adminController");

const auth = require("../middleware/auth");
const roleGuard = require("../middleware/roleGuard");

const router = express.Router();

// Apply auth and roleGuard("admin") to ALL routes in this router
router.use(auth);
router.use(roleGuard("admin"));

// ── Admin Endpoints ─────────────────────────────────────────────────────────
router.get("/analytics", getAnalytics);
router.get("/users", getAllUsers);
router.put("/users/:id/ban", toggleBanUser);
router.delete("/users/:id", deleteUserAndContent);
router.put("/comments/:id/hide", toggleHideComment);

module.exports = router;
