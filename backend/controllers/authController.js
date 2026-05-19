const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const {
  generateAccessToken,
  generateRefreshToken,
  sendTokenCookies,
  clearTokenCookies,
} = require("../utils/generateToken");
const jwt = require("jsonwebtoken");

// ─────────────────────────────────────────────
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
// ─────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if email already taken
    const existing = await User.findOne({ email });
    if (existing) {
      return next(new ApiError(409, "An account with this email already exists."));
    }

    // SECURITY: role is NEVER taken from req.body — hardcoded to "user"
    const user = await User.create({
      name,
      email,
      password,
      role: "user",
      provider: "local",
    });

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to DB for rotation/invalidation
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    sendTokenCookies(res, accessToken, refreshToken);

    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      user: user.toPublicProfile(),
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// @desc    Login with email + password
// @route   POST /api/auth/login
// @access  Public
// ─────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Explicitly select password (it's select:false in schema)
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return next(new ApiError(401, "Invalid email or password."));
    }

    if (user.isBanned) {
      return next(new ApiError(403, "Your account has been banned. Contact support."));
    }

    // Prevent local login for OAuth-only accounts
    if (user.provider !== "local") {
      return next(new ApiError(400, `Please sign in with ${user.provider}.`));
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    sendTokenCookies(res, accessToken, refreshToken);

    res.status(200).json({
      success: true,
      message: "Logged in successfully.",
      user: user.toPublicProfile(),
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// @desc    Get currently authenticated user
// @route   GET /api/auth/me
// @access  Private (auth middleware)
// ─────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user.toPublicProfile(),
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// @desc    Issue new access token using refresh token
// @route   POST /api/auth/refresh
// @access  Public (uses refreshToken cookie)
// ─────────────────────────────────────────────
const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return next(new ApiError(401, "No refresh token. Please log in."));
    }

    // Verify the refresh token
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    // Find user and confirm stored refresh token matches (rotation check)
    const user = await User.findById(decoded.id).select("+refreshToken");

    if (!user || user.refreshToken !== token) {
      return next(new ApiError(401, "Invalid refresh token. Please log in again."));
    }

    if (user.isBanned) {
      return next(new ApiError(403, "Your account has been banned."));
    }

    // Issue new token pair (rotation)
    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    sendTokenCookies(res, newAccessToken, newRefreshToken);

    res.status(200).json({ success: true, message: "Token refreshed." });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// @desc    Logout — clear cookies and DB refresh token
// @route   POST /api/auth/logout
// @access  Private
// ─────────────────────────────────────────────
const logout = async (req, res, next) => {
  try {
    // Invalidate stored refresh token
    await User.findByIdAndUpdate(req.user._id, { refreshToken: "" });

    clearTokenCookies(res);

    res.status(200).json({ success: true, message: "Logged out successfully." });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// @desc    Google OAuth callback handler
// @route   Called by passport after Google verifies the user
// @access  Internal (passport strategy)
// ─────────────────────────────────────────────
const googleCallback = async (req, res, next) => {
  try {
    const user = req.user; // set by passport strategy

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    sendTokenCookies(res, accessToken, refreshToken);

    // Redirect to frontend dashboard after OAuth login
    res.redirect(`${process.env.CLIENT_URL}/dashboard`);
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, refreshToken, logout, googleCallback };
