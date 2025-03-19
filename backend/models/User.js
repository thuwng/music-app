// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Storing as plain text for simplicity (not recommended for production)
});

module.exports = mongoose.model("User", userSchema);
