const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    // Which event this attendance belongs to
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    // Which cadet
    cadet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // The specific date this attendance record is for.
    // For Parade: same as event.startDate (single day).
    // For Other Event: one record per day within the event date range.
    date: {
      type: Date,
      required: true,
    },

    // Present or Absent
    status: {
      type: String,
      enum: ["Present", "Absent"],
      default: "Absent",
    },

    // Admin who marked this attendance
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// One attendance record per cadet per event per date
attendanceSchema.index({ event: 1, cadet: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
