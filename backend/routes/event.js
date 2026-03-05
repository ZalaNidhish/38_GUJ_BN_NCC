const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const { protect, adminOnly } = require("../middleware/auth");

// @route   GET /api/events
// @desc    Get all events sorted by start date
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const events = await Event.find()
      .populate("createdBy", "regimentalNumber")
      .sort({ startDate: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/events/upcoming
// @desc    Get only upcoming/ongoing events
// @access  Private
router.get("/upcoming", protect, async (req, res) => {
  try {
    const today = new Date();
    const events = await Event.find({ endDate: { $gte: today } })
      .populate("createdBy", "regimentalNumber")
      .sort({ startDate: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/events/:id
// @desc    Get single event by ID
// @access  Private
router.get("/:id", protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate("createdBy", "regimentalNumber");
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   POST /api/events
// @desc    Create a new event
// @access  Private (admin only)
router.post("/", protect, adminOnly, async (req, res) => {
  const { title, description, eventCategory, startDate, endDate, location } = req.body;

  if (!title || !startDate)
    return res.status(400).json({ message: "Title and start date are required" });

  // For Parade: endDate = startDate (enforced in model too, but resolve here as well)
  // For Other Event: endDate is required
  const isParade = eventCategory === "Parade";
  if (!isParade && !endDate)
    return res.status(400).json({ message: "End date is required for Other Events" });

  const resolvedEndDate = isParade ? startDate : endDate;

  if (!isParade && new Date(resolvedEndDate) < new Date(startDate))
    return res.status(400).json({ message: "End date cannot be before start date" });

  try {
    const event = await Event.create({
      title,
      description,
      eventCategory: eventCategory || "Parade",
      startDate,
      endDate: resolvedEndDate,
      location,
      createdBy: req.user._id,
    });
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   PUT /api/events/:id
// @desc    Update an event
// @access  Private (admin only)
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    // If updating to Parade, force endDate = startDate
    if (req.body.eventCategory === "Parade" && req.body.startDate) {
      req.body.endDate = req.body.startDate;
    }
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete an event
// @access  Private (admin only)
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json({ message: "Event deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
