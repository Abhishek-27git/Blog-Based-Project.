const express = require("express");
const {
  addComment,
  getComments,
  updateComment,
  deleteComment,
} = require("../controllers/commentController");

const auth = require("../middleware/auth");
const ownership = require("../middleware/ownership");
const { commentRules, validate } = require("../validators/commentValidator");

// Merge params to access blogId from parent router
const router = express.Router({ mergeParams: true });

// ── Public Routes ───────────────────────────────────────────────────────────
router.get("/", getComments);

// ── Private Routes ──────────────────────────────────────────────────────────
router.post("/", auth, commentRules, validate, addComment);
router.put("/:commentId", auth, ownership("Comment"), commentRules, validate, updateComment);
router.delete("/:commentId", auth, ownership("Comment"), deleteComment);

module.exports = router;
