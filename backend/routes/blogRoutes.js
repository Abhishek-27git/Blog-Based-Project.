const express = require("express");
const {
  createBlog,
  getBlogs,
  getMyBlogs,
  getBlogBySlug,
  updateBlog,
  deleteBlog,
  toggleLikeBlog,
  toggleBookmarkBlog,
  getBookmarkedBlogs,
  getFollowingFeed,
} = require("../controllers/blogController");

const auth = require("../middleware/auth");
const ownership = require("../middleware/ownership");
const upload = require("../middleware/upload");
const { blogCreateRules, blogUpdateRules, validate } = require("../validators/blogValidator");

const router = express.Router();

// ── Public Routes ───────────────────────────────────────────────────────────
router.get("/", getBlogs);
router.get("/post/:slug", getBlogBySlug); // nested under /post/ to avoid conflicts with special routes like /my-blogs

// ── Private Routes ──────────────────────────────────────────────────────────
router.get("/feed/following", auth, getFollowingFeed);
router.get("/my-blogs", auth, getMyBlogs);
router.get("/bookmarks", auth, getBookmarkedBlogs);
router.post("/", auth, upload.single("coverImage"), blogCreateRules, validate, createBlog);
router.put("/:id", auth, ownership("Blog"), upload.single("coverImage"), blogUpdateRules, validate, updateBlog);
router.delete("/:id", auth, ownership("Blog"), deleteBlog);
router.put("/:id/like", auth, toggleLikeBlog);
router.put("/:id/bookmark", auth, toggleBookmarkBlog);

// ── Comment Routes ──────────────────────────────────────────────────────────
router.use("/:blogId/comments", require("./commentRoutes"));

module.exports = router;
