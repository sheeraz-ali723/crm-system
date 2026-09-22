require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function resetMasterAdmin() {
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/crm";
  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoUri);

  const email = (process.env.MASTER_ADMIN_EMAIL || "sh72342723@gmail.com").toLowerCase();
  
  // Set your desired master recovery password below
  const newPassword = process.env.MASTER_RESET_PASSWORD || "SheerazAdmin2026!";
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  let user = await User.findOne({ email });
  if (user) {
    user.password = hashedPassword;
    user.role = "admin";
    await user.save();
    console.log(`\n========================================`);
    console.log(`✅ Master Admin Password Successfully Updated!`);
    console.log(`Account Email:    ${email}`);
    console.log(`New Password:     ${newPassword}`);
    console.log(`========================================\n`);
  } else {
    await User.create({
      name: "Sheeraz Ali",
      email,
      password: hashedPassword,
      role: "admin",
    });
    console.log(`\n========================================`);
    console.log(`✅ Master Admin User Created!`);
    console.log(`Account Email:    ${email}`);
    console.log(`Password:         ${newPassword}`);
    console.log(`========================================\n`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

resetMasterAdmin().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});