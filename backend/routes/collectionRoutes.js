const express = require("express");
const {
  createCollection,
  getCollections,
  getCollectionById,
  addBlogToCollection,
  removeBlogFromCollection,
} = require("../controllers/collectionController");

const auth = require("../middleware/auth");

const router = express.Router();

// ── Public/Optional Auth Routes ─────────────────────────────────────────────
router.get("/", getCollections);
router.get("/:id", getCollectionById);

// ── Private Routes (Requires Auth) ──────────────────────────────────────────
router.post("/", auth, createCollection);
router.put("/:id/add", auth, addBlogToCollection);
router.put("/:id/remove", auth, removeBlogFromCollection);

module.exports = router;
