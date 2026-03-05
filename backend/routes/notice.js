const express = require("express");
const router = express.Router();
const Notice = require("../models/Notice");
const { protect, adminOnly } = require("../middleware/auth");

// @route   GET /api/notices
// @desc    Get all active (non-expired) notices
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const today = new Date();

    // Only return notices that haven't expired yet
    const notices = await Notice.find({ expiryDate: { $gte: today } })
      .populate("createdBy", "regimentalNumber")
      .sort({ createdAt: -1 }); // Newest first

    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/notices/all
// @desc    Get all notices including expired (admin only)
// @access  Private (admin)
router.get("/all", protect, adminOnly, async (req, res) => {
  try {
    const notices = await Notice.find()
      .populate("createdBy", "regimentalNumber")
      .sort({ createdAt: -1 });

    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   POST /api/notices
// @desc    Create a notice
// @access  Private (admin only)
router.post("/", protect, adminOnly, async (req, res) => {
  const { title, content, priority, expiryDate } = req.body;

  if (!title || !content || !expiryDate)
    return res.status(400).json({ message: "Title, content and expiry date are required" });

  try {
    const notice = await Notice.create({
      title, content, priority, expiryDate,
      createdBy: req.user._id,
    });

    res.status(201).json(notice);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   PUT /api/notices/:id
// @desc    Update a notice
// @access  Private (admin only)
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const notice = await Notice.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!notice) return res.status(404).json({ message: "Notice not found" });
    res.json(notice);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   DELETE /api/notices/:id
// @desc    Delete a notice
// @access  Private (admin only)
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);
    if (!notice) return res.status(404).json({ message: "Notice not found" });
    res.json({ message: "Notice deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
