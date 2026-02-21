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
  const depths = metrics.map((m) => m.relativeDepth);

  const elbowLockedPercent =
    (metrics.filter((m) => m.elbowsLocked).length / metrics.length) * 100;

  return {
    type: "summary",
    text: `Session complete. Avg BPM ${avgBPM.toFixed(
      0
    )}. Avg depth ${avg(depths).toFixed(1)}cm.`,
    stats: {
      avgBPM,
      avgDepth: avg(depths),
      minDepth: Math.min(...depths),
      maxDepth: Math.max(...depths),
      elbowLockedPercent,
      compressionCount: metrics[metrics.length - 1].compressionCount,
      duration,
    },
  };
}

module.exports = { computeSummary };