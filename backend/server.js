const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Route imports
const authRoutes       = require("./routes/auth");
const cadetRoutes      = require("./routes/cadet");
const adminRoutes      = require("./routes/admin");
const eventRoutes      = require("./routes/event");
const noticeRoutes     = require("./routes/notice");
const attendanceRoutes = require("./routes/attendance");

// Mount routes
app.use("/api/auth",       authRoutes);
app.use("/api/cadet",      cadetRoutes);
app.use("/api/admin",      adminRoutes);
app.use("/api/events",     eventRoutes);
app.use("/api/notices",    noticeRoutes);
app.use("/api/attendance", attendanceRoutes);

// Health check
app.get("/", (req, res) => res.send("NCC Portal API running"));

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");

    // ── One-time migration ──────────────────────────────────────────────────
    // The old Attendance model had a unique index on {event, cadet} which
    // only allowed ONE record per cadet per event.
    // The new model uses {event, cadet, date} to support per-day attendance.
    // Drop the old index automatically if it still exists.
    try {
      await mongoose.connection.collection("attendances").dropIndex("event_1_cadet_1");
      console.log("Migration: dropped old attendance index (event_1_cadet_1)");
    } catch (_) {
      // Index already gone — nothing to do
    }
    // ────────────────────────────────────────────────────────────────────────

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error("MongoDB connection error:", err));
