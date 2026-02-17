const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");

dotenv.config();

const User = require("./models/User");

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("Admin account already exists:");
      console.log(`  Email: ${existingAdmin.email}`);
      console.log("Skipping seed.");
      process.exit(0);
    }

    // Admin credentials from env or defaults
    const adminEmail = process.env.ADMIN_EMAIL ;
    const adminPassword = process.env.ADMIN_PASSWORD ;

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = await User.create({
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      isApproved: true
    });

    console.log("Admin account created successfully:");
    console.log(`  Email: ${admin.email}`);
    console.log(`  Password: ${adminPassword}`);
    console.log("Store these credentials securely.");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding admin:", error);
    process.exit(1);
  }
};

seedAdmin();
