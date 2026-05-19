const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");

/**
 * Protects routes — verifies the JWT access token from cookies.
 * Attaches the full user document to req.user.
 */
const auth = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      return next(new ApiError(401, "Access denied. Please log in."));
    }

    // Verify token signature and expiry
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Fetch fresh user from DB (catches banned/deleted users mid-session)
    const user = await User.findById(decoded.id).select("-password -refreshToken");

    if (!user) {
      return next(new ApiError(401, "User no longer exists."));
    }

    if (user.isBanned) {
      return next(new ApiError(403, "Your account has been banned. Contact support."));
    }

    req.user = user;
    next();
  } catch (err) {
    next(err); // passes JsonWebTokenError / TokenExpiredError to errorHandler
  }
};

module.exports = auth;
