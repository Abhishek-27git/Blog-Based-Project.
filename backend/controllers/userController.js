const User = require("../models/User");
const Blog = require("../models/Blog");
const ApiError = require("../utils/ApiError");
const cloudinary = require("../config/cloudinary");

// @desc    Get public profile of a user & their published blogs
// @route   GET /api/users/profile/:id
// @access  Public
const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId).select("-password -refreshToken");
    if (!user) {
      return next(new ApiError(404, "User not found."));
    }

    if (user.isBanned) {
      return next(new ApiError(403, "This user profile is suspended."));
    }

    // Fetch user's published blogs
    const blogs = await Blog.find({ author: userId, status: "published" })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      profile: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role,
        createdAt: user.createdAt,
      },
      blogs,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update current user's profile (name, bio, avatar)
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    const { name, bio } = req.body;

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;

    // Handle avatar image upload
    if (req.file) {
      // If there's an existing avatar from Cloudinary, delete it
      if (user.avatar && user.avatar.includes("cloudinary.com")) {
        try {
          const parts = user.avatar.split("/");
          const folder = parts[parts.length - 2];
          const filenameWithExt = parts[parts.length - 1];
          const filename = filenameWithExt.split(".")[0];
          const publicId = `${folder}/${filename}`;
          
          await cloudinary.uploader.destroy(publicId);
        } catch (e) {
          // ignore failures to delete old images
        }
      }
      user.avatar = req.file.path;
    }

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: updatedUser.toPublicProfile(),
    });
  } catch (err) {
    if (req.file && req.file.filename) {
      await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
    }
    next(err);
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
};
