const mongoose = require("mongoose");

const { Schema } = mongoose;

const bookmarkSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    blog: {
      type: Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
    },
  },
  { timestamps: true }
);

// Compound unique index — one bookmark per user per blog
bookmarkSchema.index({ user: 1, blog: 1 }, { unique: true });

module.exports = mongoose.model("Bookmark", bookmarkSchema);
