const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(new Error("No email returned from Google."), null);
        }

        // Check if a local account exists with this email
        let user = await User.findOne({ email });

        if (user && user.provider === "local") {
          // Link Google to the existing local account
          user.googleId = profile.id;
          user.provider = "google";
          if (!user.avatar) user.avatar = profile.photos?.[0]?.value || "";
          await user.save({ validateBeforeSave: false });
          return done(null, user);
        }

        if (!user) {
          // Create a brand-new Google user
          // SECURITY: role is NEVER set from Google profile — hardcoded "user"
          user = await User.create({
            name:      profile.displayName,
            email,
            avatar:    profile.photos?.[0]?.value || "",
            provider:  "google",
            googleId:  profile.id,
            role:      "user",
            isVerified: true, // Google accounts are pre-verified
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// We use stateless JWT, so no session serialization needed
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
