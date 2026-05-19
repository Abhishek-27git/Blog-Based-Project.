const express = require("express");
const passport = require("passport");
const rateLimit = require("express-rate-limit");

const {
  register,
  login,
  getMe,
  refreshToken,
  logout,
  googleCallback,
} = require("../controllers/authController");

const auth = require("../middleware/auth");
const { registerRules, loginRules, validate } = require("../validators/authValidator");

const router = express.Router();

// ── Rate limiters ────────────────────────────────────────────────────────────
// Strict limit on login/register to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: "Too many attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Local Auth ───────────────────────────────────────────────────────────────
router.post("/register", authLimiter, registerRules, validate, register);
router.post("/login",    authLimiter, loginRules,    validate, login);
router.post("/logout",   auth, logout);
router.post("/refresh",  refreshToken);
router.get("/me",        auth, getMe);

// ── Google OAuth ─────────────────────────────────────────────────────────────
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth_failed`, session: false }),
  googleCallback
);

module.exports = router;
