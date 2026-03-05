const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },

    description: { type: String, trim: true },

    // "Parade"      → single day event (endDate = startDate, set automatically)
    // "Other Event" → multi-day event (startDate to endDate, attendance per day)
    eventCategory: {
      type: String,
      enum: ["Parade", "Other Event"],
      default: "Parade",
    },

    startDate: { type: Date, required: true },
    endDate:   { type: Date, required: true },

    location: { type: String, trim: true },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Auto-enforce: Parade events always have endDate = startDate
eventSchema.pre("save", function (next) {
  if (this.eventCategory === "Parade") {
    this.endDate = this.startDate;
  }
  next();
});

module.exports = mongoose.model("Event", eventSchema);
