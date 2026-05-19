const Comment = require("../models/Comment");
const Blog = require("../models/Blog");
const ApiError = require("../utils/ApiError");

// @desc    Add a comment (or reply) to a blog
// @route   POST /api/blogs/:blogId/comments
// @access  Private
const addComment = async (req, res, next) => {
  try {
    const { blogId } = req.params;
    const { content, parentComment } = req.body;

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return next(new ApiError(404, "Blog not found."));
    }

    // If it's a reply, verify parent comment exists and belongs to the same blog
    if (parentComment) {
      const parent = await Comment.findById(parentComment);
      if (!parent) {
        return next(new ApiError(404, "Parent comment not found."));
      }
      if (parent.blog.toString() !== blogId) {
        return next(new ApiError(400, "Parent comment does not belong to this blog."));
      }
    }

    const comment = await Comment.create({
      content,
      blog: blogId,
      author: req.user._id,
      parentComment: parentComment || null,
    });

    // Increment comment count on blog
    blog.commentsCount += 1;
    await blog.save();

    // Populate author details to return
    const populatedComment = await comment.populate("author", "name email avatar");

    res.status(201).json({
      success: true,
      message: "Comment added successfully.",
      comment: populatedComment,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get comments for a blog as a threaded tree
// @route   GET /api/blogs/:blogId/comments
// @access  Public
const getComments = async (req, res, next) => {
  try {
    const { blogId } = req.params;

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return next(new ApiError(404, "Blog not found."));
    }

    // Fetch all comments for the blog
    const comments = await Comment.find({ blog: blogId, isHidden: false })
      .populate("author", "name email avatar")
      .sort({ createdAt: 1 });

    // Map comments to structure them as a tree
    const commentMap = {};
    const commentTree = [];

    // First pass: create a map and format deleted comments
    comments.forEach((c) => {
      const commentObj = c.toObject();
      if (commentObj.isDeleted) {
        commentObj.content = "[This comment was deleted by the user or moderator]";
        commentObj.author = { name: "[deleted]", avatar: "" };
      }
      commentObj.replies = [];
      commentMap[commentObj._id.toString()] = commentObj;
    });

    // Second pass: nest replies or push to root level
    comments.forEach((c) => {
      const commentObj = commentMap[c._id.toString()];
      if (commentObj.parentComment) {
        const parentIdStr = commentObj.parentComment.toString();
        if (commentMap[parentIdStr]) {
          commentMap[parentIdStr].replies.push(commentObj);
        } else {
          // If parent is hidden or missing, treat as root comment
          commentTree.push(commentObj);
        }
      } else {
        commentTree.push(commentObj);
      }
    });

    res.status(200).json({
      success: true,
      count: comments.length,
      comments: commentTree,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Edit a comment
// @route   PUT /api/blogs/:blogId/comments/:commentId
// @access  Private (Owner only)
const updateComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    // req.resource is attached by ownership middleware
    const comment = req.resource;

    if (comment.isDeleted) {
      return next(new ApiError(400, "Cannot edit a deleted comment."));
    }

    comment.content = content;
    await comment.save();

    const populatedComment = await comment.populate("author", "name email avatar");

    res.status(200).json({
      success: true,
      message: "Comment updated successfully.",
      comment: populatedComment,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a comment (soft delete if replies exist)
// @route   DELETE /api/blogs/:blogId/comments/:commentId
// @access  Private (Owner/Admin)
const deleteComment = async (req, res, next) => {
  try {
    const { blogId, commentId } = req.params;

    // req.resource is attached by ownership middleware
    const comment = req.resource;

    // Check if there are replies to this comment
    const hasReplies = await Comment.exists({ parentComment: commentId });

    if (hasReplies) {
      // Soft delete: keep structure for thread
      comment.isDeleted = true;
      await comment.save();
    } else {
      // Hard delete: remove completely
      await comment.deleteOne();
    }

    // Decrement comments count on the blog
    await Blog.findByIdAndUpdate(blogId, { $inc: { commentsCount: -1 } });

    res.status(200).json({
      success: true,
      message: hasReplies
        ? "Comment content removed, but structure kept for reply threads."
        : "Comment deleted successfully.",
      softDeleted: !!hasReplies,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  addComment,
  getComments,
  updateComment,
  deleteComment,
};
