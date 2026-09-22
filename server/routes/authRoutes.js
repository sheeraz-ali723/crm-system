const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const PROTECTED_EMAILS = [
  "sh72342723@gmail.com",
  "sheeraz@example.com",
  (process.env.MASTER_ADMIN_EMAIL || "").toLowerCase(),
].filter(Boolean);

// ==================== SIGNUP ====================
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const assignedRole = PROTECTED_EMAILS.includes(normalizedEmail) ? "admin" : "staff";

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: assignedRole,
      avatar: "",
    });

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isMasterAdmin: PROTECTED_EMAILS.includes(user.email.toLowerCase()),
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: error.message,
    });
  }
});

// ==================== LOGIN ====================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role || "admin",
      },
      process.env.JWT_SECRET || "fallback_secret_key_12345",
      {
        expiresIn: "7d",
      }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || "admin",
        avatar: user.avatar || "",
        isMasterAdmin: PROTECTED_EMAILS.includes(user.email.toLowerCase()),
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: error.message,
    });
  }
});

// ==================== VERIFY MASTER VAULT KEY ====================
router.post("/verify-vault-key", authMiddleware, async (req, res) => {
  try {
    const { masterKey } = req.body;
    const configuredKey = process.env.MASTER_VAULT_KEY || "SuperMaster2026!";

    if (!masterKey || masterKey !== configuredKey) {
      return res.status(401).json({
        success: false,
        message: "Invalid Master Passcode. Access denied.",
      });
    }

    res.json({
      success: true,
      message: "Vault unlocked successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error during verification",
      error: error.message,
    });
  }
});

// ==================== UPDATE PROFILE & AVATAR ====================
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (name) user.name = name.trim();
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || "admin",
        avatar: user.avatar || "",
        isMasterAdmin: PROTECTED_EMAILS.includes(user.email.toLowerCase()),
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
});

// ==================== CHANGE PASSWORD (VAULT PROTECTED) ====================
router.put("/change-password", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { currentPassword, newPassword, masterKey } = req.body;
    const configuredKey = process.env.MASTER_VAULT_KEY || "SuperMaster2026!";

    // If master account, require valid masterKey from the unlocked vault
    if (PROTECTED_EMAILS.includes(user.email.toLowerCase())) {
      if (!masterKey || masterKey !== configuredKey) {
        return res.status(403).json({
          success: false,
          message: "Access Denied: Master account password changes require Master Vault authorization.",
        });
      }
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

module.exports = router;