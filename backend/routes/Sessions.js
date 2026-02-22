const express = require("express");
const router = express.Router();
const Session = require("../models/Session");

// POST /api/sessions — save a new session summary
router.post("/", async (req, res) => {
  try {
    const session = new Session(req.body);
    await session.save();
    res.status(201).json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/sessions — get all sessions, newest first
router.get("/", async (req, res) => {
  try {
    const sessions = await Session.find().sort({ createdAt: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sessions/:id — get one session by sessionId
router.get("/:id", async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.id });
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/sessions/:id — delete a session by sessionId
router.delete("/:id", async (req, res) => {
  try {
    const session = await Session.findOneAndDelete({ sessionId: req.params.id });
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.status(200).json({ message: "Session deleted successfully", session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;