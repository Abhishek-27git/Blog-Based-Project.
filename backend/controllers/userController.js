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
        followers: user.followers || [],
        following: user.following || [],
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

// @desc    Toggle follow/unfollow a user
// @route   PUT /api/users/:id/follow
// @access  Private
const toggleFollowUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return next(new ApiError(400, "You cannot follow yourself."));
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      return next(new ApiError(404, "User not found."));
    }

    // Initialize arrays if they don't exist
    if (!currentUser.following) currentUser.following = [];
    if (!targetUser.followers) targetUser.followers = [];

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== targetUserId
      );
      targetUser.followers = targetUser.followers.filter(
        (id) => id.toString() !== currentUserId.toString()
      );
    } else {
      // Follow
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
    }

    await currentUser.save();
    await targetUser.save();

    res.status(200).json({
      success: true,
      message: isFollowing ? "Unfollowed successfully." : "Followed successfully.",
      isFollowing: !isFollowing,
      currentUserProfile: currentUser.toPublicProfile(),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  toggleFollowUser,
};
