const Collection = require("../models/Collection");
const Blog = require("../models/Blog");
const ApiError = require("../utils/ApiError");

// @desc    Create a new reading collection
// @route   POST /api/collections
// @access  Private
const createCollection = async (req, res, next) => {
  try {
    const { name, description, isPublic } = req.body;

    if (!name) {
      return next(new ApiError(400, "Collection name is required."));
    }

    const collection = await Collection.create({
      name,
      description: description || "",
      isPublic: isPublic !== undefined ? isPublic : true,
      creator: req.user._id,
      blogs: [],
    });

    res.status(201).json({
      success: true,
      message: "Collection created successfully.",
      collection,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get reading collections (all public or current user's collections)
// @route   GET /api/collections
// @access  Public/Private (depending on optional user filter)
const getCollections = async (req, res, next) => {
  try {
    const query = {};

    // Filter by creator if specified, or if fetching personal dashboard collections
    if (req.query.creator) {
      query.creator = req.query.creator;
      // If fetching another user's collection, only return public ones
      if (!req.user || req.user._id.toString() !== req.query.creator) {
        query.isPublic = true;
      }
    } else {
      // General feed: only show public collections
      query.isPublic = true;
    }

    const collections = await Collection.find(query)
      .populate("creator", "name avatar")
      .populate({
        path: "blogs",
        select: "title category slug coverImage",
        match: { status: "published" } // Only load published essays
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      collections,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single collection details
// @route   GET /api/collections/:id
// @access  Public
const getCollectionById = async (req, res, next) => {
  try {
    const collection = await Collection.findById(req.params.id)
      .populate("creator", "name avatar bio")
      .populate({
        path: "blogs",
        populate: {
          path: "author",
          select: "name avatar",
        },
      });

    if (!collection) {
      return next(new ApiError(404, "Collection not found."));
    }

    if (!collection.isPublic && (!req.user || req.user._id.toString() !== collection.creator._id.toString())) {
      return next(new ApiError(403, "This collection is private."));
    }

    res.status(200).json({
      success: true,
      collection,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add a blog post to collection
// @route   PUT /api/collections/:id/add
// @access  Private
const addBlogToCollection = async (req, res, next) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return next(new ApiError(404, "Collection not found."));
    }

    // Verify ownership
    if (collection.creator.toString() !== req.user._id.toString()) {
      return next(new ApiError(403, "You do not own this collection."));
    }

    const { blogId } = req.body;
    if (!blogId) {
      return next(new ApiError(400, "Blog ID is required."));
    }

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return next(new ApiError(404, "Blog not found."));
    }

    // Prevent duplicates
    if (collection.blogs.includes(blogId)) {
      return res.status(200).json({
        success: true,
        message: "Manuscript already exists in collection.",
        collection,
      });
    }

    collection.blogs.push(blogId);
    await collection.save();

    res.status(200).json({
      success: true,
      message: "Manuscript added to collection.",
      collection,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Remove a blog post from collection
// @route   PUT /api/collections/:id/remove
// @access  Private
const removeBlogFromCollection = async (req, res, next) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return next(new ApiError(404, "Collection not found."));
    }

    // Verify ownership
    if (collection.creator.toString() !== req.user._id.toString()) {
      return next(new ApiError(403, "You do not own this collection."));
    }

    const { blogId } = req.body;
    if (!blogId) {
      return next(new ApiError(400, "Blog ID is required."));
    }

    collection.blogs = collection.blogs.filter((id) => id.toString() !== blogId.toString());
    await collection.save();

    res.status(200).json({
      success: true,
      message: "Manuscript removed from collection.",
      collection,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createCollection,
  getCollections,
  getCollectionById,
  addBlogToCollection,
  removeBlogFromCollection,
};
