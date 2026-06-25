const mongoose = require("mongoose");

const { Schema } = mongoose;

const collectionSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Collection name is required"],
      trim: true,
      maxlength: [100, "Collection name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      default: "",
      maxlength: [300, "Collection description cannot exceed 300 characters"],
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    blogs: [
      {
        type: Schema.Types.ObjectId,
        ref: "Blog",
      },
    ],
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for query performance
collectionSchema.index({ creator: 1 });
collectionSchema.index({ isPublic: 1 });

module.exports = mongoose.model("Collection", collectionSchema);
