const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

// Helper: generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// @route   POST /api/auth/login
// @desc    Login with regimental number and password
// @access  Public
router.post("/login", async (req, res) => {
  const { regimentalNumber, password } = req.body;

  if (!regimentalNumber || !password)
    return res.status(400).json({ message: "Please provide regimental number and password" });

  try {
    // Find user by regimental number (case-insensitive)
    const user = await User.findOne({ regimentalNumber: regimentalNumber.toUpperCase() });

    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    res.json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        regimentalNumber: user.regimentalNumber,
        role: user.role,
        isDefaultPassword: user.isDefaultPassword,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change password (logged in user)
// @access  Private
router.put("/change-password", protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword)
    return res.status(400).json({ message: "Please provide current and new password" });

  if (newPassword.length < 6)
    return res.status(400).json({ message: "New password must be at least 6 characters" });

  try {
    const user = await User.findById(req.user._id);

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) return res.status(401).json({ message: "Current password is incorrect" });

    // Update password
    user.password = newPassword;
    user.isDefaultPassword = false; // Mark that password has been changed
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged-in user info
// @access  Private
router.get("/me", protect, async (req, res) => {
  res.json({
    id: req.user._id,
    regimentalNumber: req.user.regimentalNumber,
    role: req.user.role,
    isDefaultPassword: req.user.isDefaultPassword,
  });
});

module.exports = router;
