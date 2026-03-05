const mongoose = require("mongoose");

/**
 * CadetProfile stores ALL cadet data seeded from the Excel file.
 * After the one-time seed, this DB record is the single source of truth.
 * No live Excel reads are needed at runtime.
 *
 * Locked fields (seeded from Excel, not editable by cadet):
 *   name, rank, wing, battalion, phone, dateOfBirth, gender, joiningYear,
 *   attendancePct, totalParades, paradesPresent
 *
 * Editable fields (cadet can update):
 *   address, photo
 */
const cadetProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    regimentalNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    // --- Locked fields (seeded from Excel, admin-editable only) ---
    name:          { type: String, trim: true, default: "" },
    rank:          { type: String, trim: true, default: "" },
    wing:          { type: String, trim: true, default: "Army" },
    battalion:     { type: String, trim: true, default: "" },
    phone:         { type: String, trim: true, default: "" },
    dateOfBirth:   { type: Date, default: null },
    gender:        { type: String, trim: true, default: "" },
    joiningYear:   { type: Number, default: null },
    attendancePct: { type: Number, default: 0 },
    totalParades:  { type: Number, default: 0 },
    paradesPresent:{ type: Number, default: 0 },

    // --- Cadet-editable fields ---
    address: { type: String, trim: true, default: "" },
    photo:   { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CadetProfile", cadetProfileSchema);
