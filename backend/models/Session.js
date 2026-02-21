const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  mode: { type: String, enum: ["train", "test"], required: true },
  avgBPM: { type: Number, required: true },
  elbowLockedPercent: { type: Number, required: true },
  compressionCount: { type: Number, required: true },
  duration: { type: Number, required: true }, // in seconds
  score: { type: Number },                    // optional overall score
  date: { type: String, required: true },     // "2026-02-21"
  time: { type: String, required: true },     // "14:30:00"
  song: { type: String },                     // song id e.g. "staying_alive"
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Session", SessionSchema);