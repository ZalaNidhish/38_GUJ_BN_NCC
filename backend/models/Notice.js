const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },

    content: { type: String, required: true, trim: true },

    // Priority level for visual distinction on frontend
    priority: {
      type: String,
      enum: ["Normal", "Important", "Urgent"],
      default: "Normal",
    },

    // Notice auto-expires after this date (frontend/backend filters it out)
    expiryDate: { type: Date, required: true },

    // Admin who posted this notice
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notice", noticeSchema);
