const express = require("express");
const router = express.Router();
const User = require("../models/User");
const CadetProfile = require("../models/CadetProfile");
const { protect, adminOnly } = require("../middleware/auth");

// @route   GET /api/admin/profile
// @desc    Get logged-in admin's profile (from CadetProfile)
// @access  Private (admin)
router.get("/profile", protect, adminOnly, async (req, res) => {
  try {
    const profile = await CadetProfile.findOne({ user: req.user._id });
    if (!profile) {
      // FIX: Auto-create admin profile if missing (backward compat)
      const newProfile = await CadetProfile.create({
        user:             req.user._id,
        regimentalNumber: req.user.regimentalNumber,
        name:             "Administrator",
        rank:             "ANO",
        wing:             "Army",
        battalion:        "NCC Battalion",
        phone:            "",
        gender:           "",
        joiningYear:      null,
        address:          "",
        attendancePct:    0,
        totalParades:     0,
        paradesPresent:   0,
      });
      return res.json(formatProfile(newProfile));
    }
    res.json(formatProfile(profile));
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   PUT /api/admin/profile
// @desc    Update admin's editable fields (address, photo, name, rank, designation)
// @access  Private (admin)
router.put("/profile", protect, adminOnly, async (req, res) => {
  try {
    let profile = await CadetProfile.findOne({ user: req.user._id });
    if (!profile) {
      profile = await CadetProfile.create({
        user: req.user._id,
        regimentalNumber: req.user.regimentalNumber,
        name: "Administrator",
        rank: "ANO",
        wing: "Army",
        battalion: "NCC Battalion",
      });
    }

    // Admin can edit more fields than regular cadets
    const allowed = ["address", "photo", "name", "rank", "phone", "battalion", "wing"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) profile[key] = req.body[key];
    }

    await profile.save();
    res.json(formatProfile(profile));
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/admin/cadets
// @desc    Get list of all cadets (role=cadet) from DB
// @access  Private (admin)
router.get("/cadets", protect, adminOnly, async (req, res) => {
  try {
    const cadetUsers = await User.find({ role: "cadet" }).select("_id regimentalNumber");
    const cadetIds = cadetUsers.map((u) => u._id);

    const profiles = await CadetProfile.find({ user: { $in: cadetIds } }).populate("user", "_id regimentalNumber role");

    const result = profiles.map((p) => ({
      user:             p.user?._id || p.user,
      regimentalNumber: p.regimentalNumber,
      name:             p.name,
      rank:             p.rank,
      wing:             p.wing,
      battalion:        p.battalion,
      phone:            p.phone,
      dateOfBirth:      p.dateOfBirth,
      gender:           p.gender,
      joiningYear:      p.joiningYear,
      attendancePct:    p.attendancePct,
      totalParades:     p.totalParades,
      paradesPresent:   p.paradesPresent,
      address:          p.address,
      photo:            p.photo,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   POST /api/admin/register-cadet
// @desc    Register a single new cadet manually (CRUD)
// @access  Private (admin)
router.post("/register-cadet", protect, adminOnly, async (req, res) => {
  const { regimentalNumber, name, rank, wing, battalion, phone, gender, joiningYear, address } = req.body;
  if (!regimentalNumber)
    return res.status(400).json({ message: "Regimental number is required" });

  try {
    const existing = await User.findOne({ regimentalNumber: regimentalNumber.toUpperCase() });
    if (existing)
      return res.status(400).json({ message: "Cadet with this regimental number already exists" });

    const userDoc = await User.create({
      regimentalNumber: regimentalNumber.toUpperCase(),
      password: regimentalNumber.toUpperCase(),
      role: "cadet",
      isDefaultPassword: true,
    });

    // FIX: Also create CadetProfile so cadet has profile data from day 1
    await CadetProfile.create({
      user:             userDoc._id,
      regimentalNumber: regimentalNumber.toUpperCase(),
      name:             name             || "",
      rank:             rank             || "",
      wing:             wing             || "Army",
      battalion:        battalion        || "",
      phone:            phone            || "",
      gender:           gender           || "",
      joiningYear:      joiningYear      ? parseInt(joiningYear) : null,
      address:          address          || "",
      attendancePct:    0,
      totalParades:     0,
      paradesPresent:   0,
    });

    res.status(201).json({
      message: "Cadet registered successfully",
      regimentalNumber: userDoc.regimentalNumber,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   PUT /api/admin/cadets/:userId
// @desc    Update cadet profile fields (admin can edit all locked fields)
// @access  Private (admin)
router.put("/cadets/:userId", protect, adminOnly, async (req, res) => {
  try {
    const profile = await CadetProfile.findOne({ user: req.params.userId });
    if (!profile) return res.status(404).json({ message: "Cadet profile not found" });

    const allowed = ["name", "rank", "wing", "battalion", "phone", "gender", "joiningYear",
                     "address", "photo", "attendancePct", "totalParades", "paradesPresent", "dateOfBirth"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) profile[key] = req.body[key];
    }

    await profile.save();
    res.json({ message: "Cadet updated successfully", profile });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   DELETE /api/admin/cadets/:userId
// @desc    Delete a cadet (admin only)
// @access  Private (admin)
router.delete("/cadets/:userId", protect, adminOnly, async (req, res) => {
  try {
    await CadetProfile.deleteOne({ user: req.params.userId });
    await User.findByIdAndDelete(req.params.userId);
    res.json({ message: "Cadet deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

function formatProfile(p) {
  return {
    regimentalNumber: p.regimentalNumber,
    name:             p.name,
    rank:             p.rank,
    wing:             p.wing,
    battalion:        p.battalion,
    phone:            p.phone,
    dateOfBirth:      p.dateOfBirth,
    gender:           p.gender,
    joiningYear:      p.joiningYear,
    attendancePct:    p.attendancePct,
    totalParades:     p.totalParades,
    paradesPresent:   p.paradesPresent,
    address:          p.address,
    photo:            p.photo,
  };
}

module.exports = router;
