const jwt = require("jsonwebtoken");

/**
 * Generate a short-lived access token (15m default).
 */
const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRE || "15m" }
  );
};

/**
 * Generate a long-lived refresh token (7d default).
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d" }
  );
};

/**
 * Set both tokens as httpOnly cookies on the response.
 * httpOnly + Secure + SameSite = protected from XSS and CSRF.
 */
const sendTokenCookies = (res, accessToken, refreshToken) => {
  const isProd = process.env.NODE_ENV === "production";

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

/**
 * Clear both auth cookies (used on logout).
 */
const clearTokenCookies = (res) => {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("accessToken", "", { httpOnly: true, secure: isProd, sameSite: isProd ? "none" : "lax", maxAge: 0 });
  res.cookie("refreshToken", "", { httpOnly: true, secure: isProd, sameSite: isProd ? "none" : "lax", maxAge: 0 });
};

module.exports = { generateAccessToken, generateRefreshToken, sendTokenCookies, clearTokenCookies };
