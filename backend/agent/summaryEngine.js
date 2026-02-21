const Session = require("../models/Session");

async function computeSummary(session) {
  const metrics = session.metrics;
  const duration = (Date.now() - session.startTime) / 1000;

  if (metrics.length === 0) {
    return { type: "summary", text: "Session ended. No data recorded." };
  }

  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const avgBPM = avg(metrics.map((m) => m.bpm));
  const elbowLockedPercent = (metrics.filter((m) => m.elbowsLocked).length / metrics.length) * 100;
  const compressionCount = metrics[metrics.length - 1].compressionCount;
  const score = computeScore(avgBPM, elbowLockedPercent);

  const now = new Date();

  // Save to MongoDB here
  try {
    await Session.create({
      sessionId: session.id,
      mode: session.mode,
      avgBPM,
      elbowLockedPercent,
      compressionCount,
      duration,
      score,
      date: now.toISOString().split("T")[0],
      time: now.toTimeString().split(" ")[0],
      song: session.song,
    });
  } catch (err) {
    console.error("Failed to save session:", err.message);
  }

  return {
    type: "summary",
    text: `Session complete. Avg BPM ${avgBPM.toFixed(0)}. Compressions: ${compressionCount}. Score: ${score}%`,
    stats: { avgBPM, elbowLockedPercent, compressionCount, duration, score },
  };
}