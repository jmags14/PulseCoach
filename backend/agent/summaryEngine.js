// Responsible for turning the metrics it receives into a session summary

function computeSummary(session) {
  const metrics = session.metrics;
  const duration = (Date.now() - session.startTime) / 1000;

  if (metrics.length === 0) {
    return {
      type: "summary",
      text: "Session ended. No data recorded.",
    };
  }

  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

  const avgBPM = avg(metrics.map((m) => m.bpm));

  const elbowLockedPercent =
    (metrics.filter((m) => m.elbowsLocked).length / metrics.length) * 100;

  return {
    type: "summary",
    text: `Session complete. Avg BPM ${avgBPM.toFixed(
      0
    )}. Compression Count ${metrics[metrics.length - 1].compressionCount}.`,
    stats: {
      avgBPM,
      elbowLockedPercent,
      compressionCount: metrics[metrics.length - 1].compressionCount,
      duration,
    },
  };
}

module.exports = { computeSummary };