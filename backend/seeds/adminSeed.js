require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

/**
 * Admin Seed Script
 * -----------------
 * Run ONCE to create the initial admin account.
 * Never expose this via an API endpoint.
 *
 * Usage:
 *   node seeds/adminSeed.js
 */
const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME || "Admin";

    if (!email || !password) {
      console.error("❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
      process.exit(1);
    }

    // Check if admin already exists
    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`⚠️  Admin already exists: ${email}`);
      process.exit(0);
    }

    // Let the User model's pre-save hook handle password hashing
    const admin = await User.create({
      name,
      email,
      password,
      role:       "admin",      // ← the ONLY place role is ever set to "admin"
      provider:   "local",
      isVerified: true,
    });

    console.log(`✅ Admin created successfully!`);
    console.log(`   Name  : ${admin.name}`);
    console.log(`   Email : ${admin.email}`);
    console.log(`   Role  : ${admin.role}`);
    console.log(`   ID    : ${admin._id}`);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedAdmin();
