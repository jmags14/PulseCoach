function evaluateTriggers(metrics, mode, allMetrics) {
  const { bpm, relativeDepth, elbowsLocked } = metrics;

  const issues = [];

  // --- RATE CHECK (with buffer to prevent flicker)
  if (bpm < 99) {
    issues.push({
      issue: "slow_rate",
      text: "Push faster",
      color: "green",
      priority: 2,
    });
  } else if (bpm > 121) {
    issues.push({
      issue: "fast_rate",
      text: "Slow down slightly",
      color: "green",
      priority: 2,
    });
  }

  // --- DEPTH CHECK
  /*if (relativeDepth < 4.8) {
    issues.push({
      issue: "shallow_depth",
      text: "Push deeper",
      color: "orange",
      priority: 3,
    });
  }*/

  // --- ELBOW CHECK
  if (!elbowsLocked) {
    issues.push({
      issue: "elbows_bent",
      text: "Lock your elbows",
      color: "red",
      priority: 4,
    });
  }

  // --- FATIGUE DETECTION
  const fatigue = detectFatigue(allMetrics);
  if (fatigue) {
    issues.push({
      issue: "fatigue",
      text: "Keep consistent compressions",
      color: "yellow",
      priority: 1,
    });
  }

  if (issues.length === 0) return null;

  // TEST mode gives only top-priority hint
  if (mode === "test") {
    issues.sort((a, b) => b.priority - a.priority);
    const top = issues[0];
    return format(top);
  }

  // TRAIN mode prioritizes serious issues
  issues.sort((a, b) => b.priority - a.priority);
  const top = issues[0];

  return format(top);
}

function detectFatigue(metrics) {
  if (metrics.length < 10) return false;

  const recent = metrics.slice(-10);
  const firstHalf = recent.slice(0, 5);
  const secondHalf = recent.slice(5);

  const avg = (arr, key) =>
    arr.reduce((sum, m) => sum + m[key], 0) / arr.length;

  const depthDrop =
    avg(firstHalf, "relativeDepth") -
    avg(secondHalf, "relativeDepth");

  const rateDrop =
    avg(firstHalf, "bpm") -
    avg(secondHalf, "bpm");

  return depthDrop > 0.5 || rateDrop > 8;
}

function format(issueObj) {
  return {
    issue: issueObj.issue,
    payload: {
      type: "feedback",
      text: issueObj.text,
      highlightColor: issueObj.color,
      duckMusic: true,
    },
  };
}

module.exports = { evaluateTriggers };