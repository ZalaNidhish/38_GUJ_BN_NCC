const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // Regimental number is used as username (e.g., "UP17BATT0042")
    regimentalNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    // Password (hashed). Default = regimental number (set during seed/registration)
    password: {
      type: String,
      required: true,
    },

    // Role: "cadet" or "admin"
    role: {
      type: String,
      enum: ["cadet", "admin"],
      default: "cadet",
    },

    // Whether the user has changed their default password
    isDefaultPassword: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Hash password before saving if it was modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with stored hash
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
