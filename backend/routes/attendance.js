const express = require("express");
const router = express.Router();
const Attendance = require("../models/Attendance");
const Event = require("../models/Event");
const { protect, adminOnly } = require("../middleware/auth");

// Helper: strip time from a date for clean day-level comparison
function toDateOnly(d) {
  const dt = new Date(d);
  dt.setUTCHours(0, 0, 0, 0);
  return dt;
}

// Helper: build array of "YYYY-MM-DD" strings for every day in a range (inclusive)
function buildDateRange(startDate, endDate) {
  const dates = [];
  const cur = toDateOnly(startDate);
  const end = toDateOnly(endDate);
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

// @route   GET /api/attendance/my
// @desc    Get all attendance records for the logged-in cadet
// @access  Private
router.get("/my", protect, async (req, res) => {
  try {
    const records = await Attendance.find({ cadet: req.user._id })
      .populate("event", "title startDate endDate location eventCategory")
      .sort({ date: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/attendance/event/:eventId
// @desc    Get all attendance records for an event (all dates)
// @access  Private (admin only)
router.get("/event/:eventId", protect, adminOnly, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const records = await Attendance.find({ event: req.params.eventId })
      .populate("cadet", "regimentalNumber")
      .populate("markedBy", "regimentalNumber")
      .sort({ date: 1, createdAt: 1 });

    res.json({ event, records });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/attendance/event/:eventId/date/:date
// @desc    Get attendance records for a specific event on a specific date (YYYY-MM-DD)
// @access  Private (admin only)
router.get("/event/:eventId/date/:date", protect, adminOnly, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const dayStart = toDateOnly(req.params.date);
    const dayEnd   = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const records = await Attendance.find({
      event: req.params.eventId,
      date: { $gte: dayStart, $lt: dayEnd },
    })
      .populate("cadet", "regimentalNumber")
      .populate("markedBy", "regimentalNumber")
      .sort({ createdAt: 1 });

    res.json({ event, records, date: req.params.date });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/attendance/all-events
// @desc    Get all past events with attendance summary (admin)
// @access  Private (admin only)
router.get("/all-events", protect, adminOnly, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const events = await Event.find({ startDate: { $lte: today } }).sort({ startDate: -1 });

    const result = await Promise.all(
      events.map(async (ev) => {
        const total   = await Attendance.countDocuments({ event: ev._id });
        const present = await Attendance.countDocuments({ event: ev._id, status: "Present" });
        return {
          _id: ev._id,
          title: ev.title,
          eventCategory: ev.eventCategory,
          startDate: ev.startDate,
          endDate:   ev.endDate,
          location:  ev.location,
          attendanceMarked: total > 0,
          presentCount: present,
          totalMarked:  total,
        };
      })
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   POST /api/attendance/mark
// @desc    Mark or update attendance for multiple cadets for a specific event + date
// @access  Private (admin only)
// Body: { eventId, date: "YYYY-MM-DD", attendance: [{ cadetId, status }] }
router.post("/mark", protect, adminOnly, async (req, res) => {
  const { eventId, date, attendance } = req.body;

  if (!eventId || !date || !Array.isArray(attendance) || attendance.length === 0)
    return res.status(400).json({ message: "eventId, date (YYYY-MM-DD), and attendance array are required" });

  try {
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Cannot mark future dates
    const targetDay = toDateOnly(date);
    const todayDay  = toDateOnly(new Date());
    if (targetDay > todayDay)
      return res.status(400).json({ message: "Cannot mark attendance for a future date" });

    // Date must be within the event's range
    const evStart = toDateOnly(event.startDate);
    const evEnd   = toDateOnly(event.endDate);
    if (targetDay < evStart || targetDay > evEnd)
      return res.status(400).json({ message: "Date is outside the event date range" });

    const operations = attendance.map(({ cadetId, status }) => ({
      updateOne: {
        filter: { event: eventId, cadet: cadetId, date: targetDay },
        update: {
          $set: {
            status: status || "Absent",
            markedBy: req.user._id,
          },
        },
        upsert: true,
      },
    }));

    await Attendance.bulkWrite(operations);
    res.json({ message: `Attendance marked for ${attendance.length} cadet(s) on ${date}` });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/attendance/summary/:cadetId
// @desc    Attendance summary for a cadet split by Parade vs Other Event
// @access  Private (admin only)
router.get("/summary/:cadetId", protect, adminOnly, async (req, res) => {
  try {
    const records = await Attendance.find({ cadet: req.params.cadetId })
      .populate("event", "title startDate eventCategory")
      .sort({ date: -1 });

    const paradeRecords = records.filter((r) => r.event?.eventCategory === "Parade");
    const otherRecords  = records.filter((r) => r.event?.eventCategory === "Other Event");

    const paradeTotal   = paradeRecords.length;
    const paradePresent = paradeRecords.filter((r) => r.status === "Present").length;
    const otherTotal    = otherRecords.length;
    const otherPresent  = otherRecords.filter((r) => r.status === "Present").length;
    const total         = paradeTotal + otherTotal;
    const present       = paradePresent + otherPresent;

    res.json({
      total, present,
      absent:     total - present,
      percentage: total > 0 ? ((present / total) * 100).toFixed(1) : 0,
      paradeTotal, paradePresent,
      paradeAbsent: paradeTotal - paradePresent,
      paradePct: paradeTotal > 0 ? ((paradePresent / paradeTotal) * 100).toFixed(1) : 0,
      otherTotal, otherPresent,
      otherAbsent: otherTotal - otherPresent,
      otherPct: otherTotal > 0 ? ((otherPresent / otherTotal) * 100).toFixed(1) : 0,
      records,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
