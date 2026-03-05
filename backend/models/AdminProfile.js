const mongoose = require("mongoose");

const adminProfileSchema = new mongoose.Schema(
  {
    // Reference to the User account
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    name: { type: String, required: true, trim: true },
    regimentalNumber: { type: String, required: true, uppercase: true, trim: true },
    phone: { type: String, trim: true },

    // Admin designation (e.g., "ANO", "PI Staff")
    designation: { type: String, trim: true },
    wing: {
      type: String,
      enum: ["Army", "Navy", "Air Force"],
      default: "Army",
    },
    battalion: { type: String, trim: true },

    // Profile photo URL (optional)
    photo: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminProfile", adminProfileSchema);
