const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const uri = "mongodb+srv://sheerazalieng_db_user:Sheery2026@smartattend.j6dcgef.mongodb.net/SmartAttend?retryWrites=true&w=majority&appName=SmartAttend";

// User schema matching User.js
const userSchema = new mongoose.Schema({
  name: { type: String, default: "Sheeraz Ali" },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "admin" }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

async function reset() {
  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(uri);
  console.log("Connected!");

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("admin123", salt);

  const updatedUser = await User.findOneAndUpdate(
    { email: "sheeraz12@gmail.com" },
    {
      $set: {
        name: "Sheeraz Ali",
        email: "sheeraz12@gmail.com",
        password: hashedPassword,
        role: "admin"
      }
    },
    { upsert: true, returnDocument: 'after' }
  );

  console.log("--> User account ready in 'users' collection:", updatedUser.email);
  console.log("--> Password set to: admin123");
  process.exit(0);
}

reset().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});