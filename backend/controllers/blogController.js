const Blog = require("../models/Blog");
const ApiError = require("../utils/ApiError");
const sanitizeHtml = require("sanitize-html");
const cloudinary = require("../config/cloudinary");

// Sanitize settings for rich text content
const sanitizeOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    "img", "h1", "h2", "h3", "h4", "h5", "h6", "span", "div", "pre", "code", "br"
  ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    "img": ["src", "alt", "title", "width", "height", "loading"],
    "code": ["class"],
    "pre": ["class"],
    "span": ["class", "style"],
    "div": ["class", "style"]
  },
  allowedSchemes: ["http", "https", "data"]
};

// @desc    Create a new blog post
// @route   POST /api/blogs
// @access  Private (User/Admin)
const createBlog = async (req, res, next) => {
  try {
    const { title, content, excerpt, category, tags, status } = req.body;

    let coverImage = "";
    if (req.file) {
      coverImage = req.file.path; // Cloudinary URL set by multer-storage-cloudinary
    }

    // Process tags (can be comma-separated string or array of strings)
    let processedTags = [];
    if (tags) {
      processedTags = Array.isArray(tags)
        ? tags
        : tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
    }

    // Sanitize content to prevent XSS
    const sanitizedContent = sanitizeHtml(content, sanitizeOptions);

    const blog = await Blog.create({
      title,
      content: sanitizedContent,
      excerpt,
      coverImage,
      category,
      tags: processedTags,
      status: status || "draft",
      author: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Blog created successfully.",
      blog,
    });
  } catch (err) {
    // If upload succeeded but DB save failed, clean up the uploaded image from Cloudinary
    if (req.file && req.file.filename) {
      await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
    }
    next(err);
  }
};

// @desc    Get all published blogs (paginated, filtered, search)
// @route   GET /api/blogs
// @access  Public
const getBlogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = { status: "published" };

    // Filtering by category
    if (req.query.category) {
      query.category = req.query.category.trim();
    }

    // Filtering by tag
    if (req.query.tag) {
      query.tags = req.query.tag.trim().toLowerCase();
    }

    // Filtering by author
    if (req.query.author) {
      query.author = req.query.author;
    }

    // Search functionality (title, excerpt, content)
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), "i");
      query.$or = [
        { title: searchRegex },
        { excerpt: searchRegex },
        { content: searchRegex },
      ];
    }

    const blogs = await Blog.find(query)
      .populate("author", "name email avatar bio")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Blog.countDocuments(query);

    res.status(200).json({
      success: true,
      count: blogs.length,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalBlogs: total,
      },
      blogs,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current user's own blogs (drafts & published)
// @route   GET /api/blogs/my-blogs
// @access  Private (User/Admin)
const getMyBlogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = { author: req.user._id };

    // Filter by status if provided (draft/published)
    if (req.query.status) {
      query.status = req.query.status;
    }

    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Blog.countDocuments(query);

    res.status(200).json({
      success: true,
      count: blogs.length,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalBlogs: total,
      },
      blogs,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single blog by slug (increments views count)
// @route   GET /api/blogs/:slug
// @access  Public
const getBlogBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Find and update blog
    let blog = await Blog.findOne({ slug, status: "published" });
    if (!blog) {
      return next(new ApiError(404, "Blog not found or is still a draft."));
    }

    blog.views = (blog.views || 0) + 1;

    // Log daily view counts
    if (!blog.viewsHistory) blog.viewsHistory = [];
    const dateIndex = blog.viewsHistory.findIndex((h) => h.date === today);
    if (dateIndex === -1) {
      blog.viewsHistory.push({ date: today, count: 1 });
    } else {
      blog.viewsHistory[dateIndex].count += 1;
    }

    // Keep history trimmed to the last 30 days
    if (blog.viewsHistory.length > 30) {
      blog.viewsHistory = blog.viewsHistory.slice(-30);
    }

    await blog.save();
    blog = await blog.populate("author", "name email avatar bio");

    res.status(200).json({
      success: true,
      blog,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update blog post
// @route   PUT /api/blogs/:id
// @access  Private (Owner/Admin)
const updateBlog = async (req, res, next) => {
  try {
    // req.resource is attached by ownership middleware
    const blog = req.resource;

    const { title, content, excerpt, category, tags, status } = req.body;

    if (title) blog.title = title;
    if (category) blog.category = category;
    if (status) blog.status = status;
    if (excerpt !== undefined) blog.excerpt = excerpt;

    if (content) {
      blog.content = sanitizeHtml(content, sanitizeOptions);
    }

    if (tags) {
      blog.tags = Array.isArray(tags)
        ? tags
        : tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
    }

    // Handle cover image replacement
    if (req.file) {
      // If there's an existing cover image, try to delete it from Cloudinary
      if (blog.coverImage) {
        // Extract public ID from Cloudinary URL: e.g. https://res.cloudinary.com/.../folder/publicId.jpg
        const parts = blog.coverImage.split("/");
        const folder = parts[parts.length - 2];
        const filenameWithExt = parts[parts.length - 1];
        const filename = filenameWithExt.split(".")[0];
        const publicId = `${folder}/${filename}`;
        
        await cloudinary.uploader.destroy(publicId).catch(() => {});
      }
      blog.coverImage = req.file.path;
    }

    const updatedBlog = await blog.save();

    res.status(200).json({
      success: true,
      message: "Blog updated successfully.",
      blog: updatedBlog,
    });
  } catch (err) {
    if (req.file && req.file.filename) {
      await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
    }
    next(err);
  }
};

// @desc    Delete a blog post
// @route   DELETE /api/blogs/:id
// @access  Private (Owner/Admin)
const deleteBlog = async (req, res, next) => {
  try {
    // req.resource is attached by ownership middleware
    const blog = req.resource;

    // Delete cover image from Cloudinary if it exists
    if (blog.coverImage) {
      const parts = blog.coverImage.split("/");
      const folder = parts[parts.length - 2];
      const filenameWithExt = parts[parts.length - 1];
      const filename = filenameWithExt.split(".")[0];
      const publicId = `${folder}/${filename}`;
      
      await cloudinary.uploader.destroy(publicId).catch(() => {});
    }

    // Also delete any comments associated with this blog
    const Comment = require("../models/Comment");
    await Comment.deleteMany({ blog: blog._id });

    // Also delete any bookmarks of this blog
    const Bookmark = require("../models/Bookmark");
    await Bookmark.deleteMany({ blog: blog._id });

    await blog.deleteOne();

    res.status(200).json({
      success: true,
      message: "Blog and its associated data deleted successfully.",
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle like status on a blog
// @route   PUT /api/blogs/:id/like
// @access  Private (User/Admin)
const toggleLikeBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return next(new ApiError(404, "Blog not found."));
    }

    const userIndex = blog.likes.indexOf(req.user._id);
    let isLiked = false;

    if (userIndex === -1) {
      // Like the blog
      blog.likes.push(req.user._id);
      isLiked = true;
    } else {
      // Unlike the blog
      blog.likes.splice(userIndex, 1);
    }

    blog.likesCount = blog.likes.length;
    await blog.save();

    res.status(200).json({
      success: true,
      message: isLiked ? "Blog liked." : "Blog unliked.",
      likesCount: blog.likesCount,
      isLiked,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle bookmark status on a blog
// @route   PUT /api/blogs/:id/bookmark
// @access  Private (User/Admin)
const toggleBookmarkBlog = async (req, res, next) => {
  try {
    const blogId = req.params.id;
    const userId = req.user._id;

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return next(new ApiError(404, "Blog not found."));
    }

    const Bookmark = require("../models/Bookmark");
    const existingBookmark = await Bookmark.findOne({ user: userId, blog: blogId });

    let isBookmarked = false;
    if (existingBookmark) {
      await existingBookmark.deleteOne();
    } else {
      await Bookmark.create({ user: userId, blog: blogId });
      isBookmarked = true;
    }

    res.status(200).json({
      success: true,
      message: isBookmarked ? "Blog bookmarked." : "Bookmark removed.",
      isBookmarked,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all bookmarked blogs for the current user
// @route   GET /api/blogs/bookmarks
// @access  Private (User/Admin)
const getBookmarkedBlogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const Bookmark = require("../models/Bookmark");
    const total = await Bookmark.countDocuments({ user: req.user._id });

    const bookmarks = await Bookmark.find({ user: req.user._id })
      .populate({
        path: "blog",
        populate: {
          path: "author",
          select: "name email avatar bio",
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Filter out any bookmarks where the blog was deleted in the background
    const validBlogs = bookmarks
      .map((b) => b.blog)
      .filter(Boolean);

    res.status(200).json({
      success: true,
      count: validBlogs.length,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalBlogs: total,
      },
      blogs: validBlogs,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get published blogs from authors the current user follows
// @route   GET /api/blogs/feed/following
// @access  Private (User/Admin)
const getFollowingFeed = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const User = require("../models/User");
    const currentUser = await User.findById(req.user._id);

    if (!currentUser || !currentUser.following || currentUser.following.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        pagination: {
          page,
          limit,
          totalPages: 0,
          totalBlogs: 0,
        },
        blogs: [],
      });
    }

    const query = {
      author: { $in: currentUser.following },
      status: "published",
    };

    const blogs = await Blog.find(query)
      .populate("author", "name email avatar bio")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Blog.countDocuments(query);

    res.status(200).json({
      success: true,
      count: blogs.length,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalBlogs: total,
      },
      blogs,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
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
};
