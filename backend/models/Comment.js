const mongoose = require("mongoose");

const { Schema } = mongoose;

const commentSchema = new Schema(
  {
    content: {
      type: String,
      required: [true, "Comment content is required"],
      trim: true,
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },
    blog: {
      type: Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // null = top-level comment; ObjectId = a reply to another comment
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    // Soft delete — keeps thread structure intact for admin moderation
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isHidden: {
      type: Boolean,
      default: false, // admin can hide without deleting
    },
  },
  { timestamps: true }
);

// Indexes for fast lookup
commentSchema.index({ blog: 1, createdAt: 1 });
commentSchema.index({ parentComment: 1 });

module.exports = mongoose.model("Comment", commentSchema);
