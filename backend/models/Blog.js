const mongoose = require("mongoose");
const slugify = require("slugify");

const { Schema } = mongoose;

const blogSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    excerpt: {
      type: String,
      maxlength: [500, "Excerpt cannot exceed 500 characters"],
    },
    coverImage: {
      type: String,
      default: "",
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    tags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    likesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    readTime: {
      type: Number, // estimated reading time in minutes
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Pre-save middleware: handles slug, read time, and excerpt auto-generation
blogSchema.pre("save", async function () {
  // 1. Auto-generate slug from title
  if (this.isModified("title")) {
    let baseSlug = slugify(this.title, { lower: true, strict: true });
    let slug = baseSlug;
    let count = 1;

    // Ensure slug uniqueness
    while (await mongoose.model("Blog").findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${count++}`;
    }

    this.slug = slug;
  }

  // 2. Auto-calculate read time from content (avg 200 words/min)
  if (this.isModified("content") && this.content) {
    const wordCount = this.content.replace(/<[^>]+>/g, "").split(/\s+/).length;
    this.readTime = Math.ceil(wordCount / 200);
  }

  // 3. Auto-generate excerpt if not provided
  if (!this.excerpt && this.content) {
    const plainText = this.content.replace(/<[^>]+>/g, "");
    this.excerpt = plainText.substring(0, 497).trim() + "...";
  }
});

// Indexes for performance
blogSchema.index({ author: 1, status: 1 });
blogSchema.index({ category: 1, status: 1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Blog", blogSchema);
