const User = require("../models/User");
const Blog = require("../models/Blog");
const Comment = require("../models/Comment");
const Bookmark = require("../models/Bookmark");
const ApiError = require("../utils/ApiError");

// @desc    Get dashboard analytics (stats, top posts, category breakdown)
// @route   GET /api/admin/analytics
// @access  Private (Admin only)
const getAnalytics = async (req, res, next) => {
  try {
    // 1. Total counts
    const totalUsers = await User.countDocuments();
    const bannedUsers = await User.countDocuments({ isBanned: true });
    
    const totalBlogs = await Blog.countDocuments();
    const publishedBlogs = await Blog.countDocuments({ status: "published" });
    const draftBlogs = await Blog.countDocuments({ status: "draft" });

    const totalComments = await Comment.countDocuments();

    // 2. Sum of all blog views
    const viewsAggregation = await Blog.aggregate([
      { $group: { _id: null, totalViews: { $sum: "$views" } } }
    ]);
    const totalViews = viewsAggregation[0]?.totalViews || 0;

    // 3. Top 5 popular blogs by views
    const topBlogs = await Blog.find({ status: "published" })
      .populate("author", "name email avatar")
      .sort({ views: -1 })
      .limit(5);

    // 4. Category breakdown
    const categoryBreakdown = await Blog.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 5. Recent signups
    const recentUsers = await User.find()
      .select("name email role provider isBanned createdAt")
      .sort({ createdAt: -1 })
      .limit(5);

    // 6. Recent comments
    const recentComments = await Comment.find()
      .populate("author", "name avatar")
      .populate("blog", "title slug")
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      analytics: {
        counts: {
          users: { total: totalUsers, banned: bannedUsers },
          blogs: { total: totalBlogs, published: publishedBlogs, drafts: draftBlogs },
          comments: totalComments,
          views: totalViews,
        },
        topBlogs,
        categoryBreakdown,
        recentUsers,
        recentComments,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all users with search and pagination
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), "i");
      query.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    if (req.query.role) {
      query.role = req.query.role;
    }

    const users = await User.find(query)
      .select("-password -refreshToken")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
      },
      users,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle Ban/Unban status of a user
// @route   PUT /api/admin/users/:id/ban
// @access  Private (Admin only)
const toggleBanUser = async (req, res, next) => {
  try {
    const userId = req.params.id;

    if (userId.toString() === req.user._id.toString()) {
      return next(new ApiError(400, "You cannot ban yourself."));
    }

    const user = await User.findById(userId);
    if (!user) {
      return next(new ApiError(404, "User not found."));
    }

    if (user.role === "admin") {
      return next(new ApiError(400, "You cannot ban another admin."));
    }

    user.isBanned = !user.isBanned;
    
    // Invalidate refresh token to force immediate logout
    if (user.isBanned) {
      user.refreshToken = "";
    }
    
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: user.isBanned ? "User has been banned." : "User has been unbanned.",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isBanned: user.isBanned,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete user and all their content (GDPR / Clean sweep)
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
const deleteUserAndContent = async (req, res, next) => {
  try {
    const userId = req.params.id;

    if (userId.toString() === req.user._id.toString()) {
      return next(new ApiError(400, "You cannot delete your own admin account."));
    }

    const user = await User.findById(userId);
    if (!user) {
      return next(new ApiError(404, "User not found."));
    }

    if (user.role === "admin") {
      return next(new ApiError(400, "You cannot delete another admin account."));
    }

    // 1. Delete user's comments
    await Comment.deleteMany({ author: userId });

    // 2. Delete user's bookmarks
    await Bookmark.deleteMany({ user: userId });

    // 3. Find and delete user's blogs (including cover images on Cloudinary)
    const userBlogs = await Blog.find({ author: userId });
    for (const blog of userBlogs) {
      if (blog.coverImage) {
        const parts = blog.coverImage.split("/");
        const folder = parts[parts.length - 2];
        const filenameWithExt = parts[parts.length - 1];
        const filename = filenameWithExt.split(".")[0];
        const publicId = `${folder}/${filename}`;
        await cloudinary.uploader.destroy(publicId).catch(() => {});
      }
      
      // Delete comments & bookmarks associated with this user's blogs
      await Comment.deleteMany({ blog: blog._id });
      await Bookmark.deleteMany({ blog: blog._id });
      await blog.deleteOne();
    }

    // 4. Delete the user
    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: "User and all their associated blogs, comments, and bookmarks have been deleted.",
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle Comment Visibility (Hide/Unhide for moderation)
// @route   PUT /api/admin/comments/:id/hide
// @access  Private (Admin only)
const toggleHideComment = async (req, res, next) => {
  try {
    const commentId = req.params.id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return next(new ApiError(404, "Comment not found."));
    }

    comment.isHidden = !comment.isHidden;
    await comment.save();

    res.status(200).json({
      success: true,
      message: comment.isHidden
        ? "Comment is now hidden from public views."
        : "Comment is now visible to public views.",
      comment: {
        _id: comment._id,
        isHidden: comment.isHidden,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAnalytics,
  getAllUsers,
  toggleBanUser,
  deleteUserAndContent,
  toggleHideComment,
};
