const Session = require("../models/Session");

function computeScore(avgBPM, elbowLockedPercent) {
  const idealBPM = 110;
  const bpmDiff = Math.abs(avgBPM - idealBPM);
  const bpmScore = Math.max(0, 100 - bpmDiff * 2);
  return Math.round(bpmScore * 0.5 + elbowLockedPercent * 0.5);
}

async function computeSummary(session) {
  console.log("Session object:", JSON.stringify(session, null, 2)); // add this
  const metrics = session.metrics;
  const duration = (Date.now() - session.startTime) / 1000;

  if (metrics.length === 0) {
    return { 
      type: "summary", 
      text: "Session ended. No data recorded.", 
      stats: {} 
    };
  }

  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const bpmSamples = metrics
    .map((m) => m.bpm)
    .filter((bpm) => typeof bpm === "number" && bpm > 0);
  const avgBPM = bpmSamples.length > 0 ? avg(bpmSamples) : 0;
  const elbowLockedPercent = (metrics.filter((m) => m.elbowsLocked).length / metrics.length) * 100;
  const compressionSamples = metrics
    .map((m) => m.compressionCount)
    .filter((count) => typeof count === "number" && count >= 0);
  const compressionCount = compressionSamples.length > 0 ? Math.max(...compressionSamples) : 0;
  const score = computeScore(avgBPM, elbowLockedPercent);
  const now = new Date();

  // Save to MongoDB
  try {
    await Session.create({
      sessionId: session.id ?? `session_${Date.now()}`,
      mode: session.mode,
      avgBPM,
      elbowLockedPercent,
      compressionCount: compressionCount ?? 0,
      duration,
      score,
      date: now.toISOString().split("T")[0],
      time: now.toTimeString().split(" ")[0],
      song: session.song ?? "unknown",
    });
    console.log("✅ Session saved to DB:", session.id);
  } catch (err) {
    console.error("❌ Failed to save session:", err.message);
  }

  return {
    type: "summary",
    text: `Session complete. Avg BPM: ${avgBPM.toFixed(0)}. Compressions: ${compressionCount}. Score: ${score}%`,
    stats: { avgBPM, elbowLockedPercent, compressionCount, duration, score },
    date: now.toISOString().split("T")[0],
    time: now.toTimeString().split(" ")[0],
  };
}

module.exports = { computeSummary };