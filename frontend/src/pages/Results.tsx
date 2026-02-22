import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import MetricCard from "../components/MetricCard";
import { useWebSocket } from "../logic/useWebSocket";
import { AudioManager } from "../logic/audioManager";
import "../styles/Results.css";

type Summary = {
  avgBPM: number;
  elbowLockedPercent: number;
  compressionCount: number;
  duration: number;
  score: number;
};

export default function Results() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [voiceActive, setVoiceActive] = useState(false);
  const audioRef = useRef<AudioManager | null>(null);

  const { connected, messages, sendMessage } = useWebSocket("http://localhost:8080");

  // Listen for summary event from backend
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last) return;
    if (last.type === "summary" && last.stats) {
      setSummary(last.stats as Summary);
    }
  }, [messages]);

  useEffect(() => {
    audioRef.current = new AudioManager({
      onTranscript: (text: string) => {
        if (text === "__END__") {
          setVoiceActive(false);
          return;
        }
        sendMessage("voiceCommand", { text, timestamp: Date.now() });
      },
    });
  }, []);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}m ${s}s`;
  };

  const bpmInRange =
    summary?.avgBPM !== undefined &&
    summary.avgBPM >= 100 &&
    summary.avgBPM <= 120;

  return (
    <div className="results-container">
      {summary ? (
        <>
          <h1>Session Summary</h1>

          <div className="score-banner">
            <span className="score-label">Score</span>
            <span className="score-value">{summary.score}%</span>
          </div>

          <div className="metrics-grid">
            <MetricCard
              label="Avg BPM"
              value={summary.avgBPM.toFixed(0)}
              highlight={bpmInRange}
            />
            <MetricCard
              label="Elbow Lock"
              value={`${summary.elbowLockedPercent.toFixed(0)}%`}
              highlight={summary.elbowLockedPercent >= 80}
            />
            <MetricCard
              label="Compressions"
              value={summary.compressionCount}
            />
            <MetricCard
              label="Duration"
              value={formatDuration(summary.duration)}
            />
          </div>
        </>
      ) : (
        <>
          <h1>Waiting for Results...</h1>
          <p>
            {connected
              ? "Session complete — loading your summary."
              : "Connecting to server..."}
          </p>
        </>
      )}

      <div className="results-actions">
        <button
          className="voice-btn"
          onClick={() => {
            if (!voiceActive) {
              audioRef.current?.start();
              setVoiceActive(true);
            } else {
              audioRef.current?.stop();
              setVoiceActive(false);
            }
          }}
        >
          {voiceActive ? "End Voice" : "Ask Question"}
        </button>

        <button
          className="back-btn"
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}