const mongoose = require("mongoose");
const favoriteSongSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  songId: { type: mongoose.Schema.Types.ObjectId, ref: "Song", required: true },
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model("FavoriteSong", favoriteSongSchema);
