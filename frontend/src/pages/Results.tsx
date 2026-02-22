import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import MetricCard from "../components/MetricCard";
import { useWebSocket } from "../logic/useWebSocket";
import { AudioManager } from "../logic/audioManager";

type Metrics = {
  bpm?: number;
  relativeDepth?: number;
  elbowsLocked?: boolean;
  compressionCount?: number;
};

interface Session {
  sessionId: string;
  mode: "train" | "test";
  avgBPM: number;
  elbowLockedPercent: number;
  compressionCount: number;
  duration: number;
  score?: number;
  date: string;
  time: string;
  song?: string;
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export default function Results() {
  const navigate = useNavigate();
  const locationState = useLocation().state as { metrics?: Metrics } | undefined;
  const metrics = locationState?.metrics;
  const bpmInRange = metrics?.bpm !== undefined && metrics.bpm >= 100 && metrics.bpm <= 120;
  const elbowsLocked = metrics?.elbowsLocked ?? false;

  const [voiceActive, setVoiceActive] = useState(false);
  const [latestSession, setLatestSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const audioRef = useRef<AudioManager | null>(null);

  const { connected, messages, sendMessage } = useWebSocket("http://localhost:8080");

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

  // Fetch the most recent session from the API
  useEffect(() => {
    fetch("http://localhost:8080/api/sessions")
      .then((r) => r.json())
      .then((data: Session[]) => {
        if (data && data.length > 0) {
          // Sessions are returned newest-first; take the first one
          setLatestSession(data[0]);
        }
      })
      .catch((err) => console.error("Failed to fetch latest session:", err))
      .finally(() => setLoadingSession(false));
  }, []);

  const hasMetrics = !!metrics;

  return (
    <>
      <style>{css}</style>
      <div className="rs-container">

        {/* ── HEADER — always show Most Recent Session ── */}
        <div className="rs-header">
          <div className="rs-eyebrow">{hasMetrics ? "Session Complete" : "Results"}</div>
          <h1 className="rs-title">
            {loadingSession ? "Loading..." : latestSession ? "Most Recent Session" : "No Session Data Found"}
          </h1>
          {!latestSession && !loadingSession && (
            <p className="rs-empty-sub">
              Press "Start Session" in the CPR screen and get into position.
              Your session metrics will appear here after you finish.
            </p>
          )}
        </div>

        {/* ── SESSION CARD — always use API data ── */}
        {latestSession && !loadingSession && (
          <div className="rs-recent">
            <div className="rs-recent-meta">
              <span className={`rs-mode-badge rs-mode-badge--${latestSession.mode}`}>
                {latestSession.mode === "test" ? "🧪 Test" : "🎵 Train"}
              </span>
              <span className="rs-recent-date">
                {new Date(`${latestSession.date}T${latestSession.time}`).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric",
                })}
                {"  ·  "}
                {new Date(`${latestSession.date}T${latestSession.time}`).toLocaleTimeString("en-US", {
                  hour: "numeric", minute: "2-digit",
                })}
              </span>
            </div>

            <div className="rs-metrics-grid">
              {[
                { label: "Avg BPM",      value: Math.round(latestSession.avgBPM),                    sub: "Target: 100–120" },
                { label: "Elbow Lock",   value: `${Math.round(latestSession.elbowLockedPercent)}%`,   sub: "Consistency" },
                { label: "Compressions", value: Math.round(latestSession.compressionCount),            sub: "Total count" },
                { label: "Duration",     value: formatDuration(Math.round(latestSession.duration)),    sub: "Session length" },
              ].map((m) => (
                <div key={m.label} className="rs-metric-card">
                  <span className="rs-metric-label">{m.label}</span>
                  <span className="rs-metric-value">{m.value}</span>
                  <span className="rs-metric-sub">{m.sub}</span>
                </div>
              ))}
            </div>

            <div className="rs-bar-wrap">
              <div className="rs-bar-label">
                <span>Elbow Lock Consistency</span>
                <span className="rs-bar-pct">{Math.round(latestSession.elbowLockedPercent)}%</span>
              </div>
              <div className="rs-bar-track">
                <div className="rs-bar-fill" style={{ width: `${latestSession.elbowLockedPercent}%` }} />
              </div>
            </div>

            {latestSession.score !== undefined && (
              <div className="rs-score-wrap">
                <span className="rs-score-label">Overall Score</span>
                <span className="rs-score-value">
                  {Math.round(latestSession.score)}<span className="rs-score-max">/100</span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── ACTIONS ── */}
        <div className="rs-actions">
          <button
            className={`rs-voice-btn${voiceActive ? " rs-voice-btn--active" : ""}`}
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
            {voiceActive ? "🎙 End Voice" : "🎙 Ask Question"}
          </button>

          <button className="rs-back-btn" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </button>
        </div>

      </div>
    </>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

:root {
  --db-bg:          #000000;
  --db-surface:     #13161e;
  --db-surface2:    #1c2030;
  --db-cyan:        #00e5ff;
  --db-cyan-dim:    rgba(0,229,255,0.15);
  --db-cyan-border: rgba(0,229,255,0.6);
  --db-cyan-glow:   0 0 32px rgba(0,229,255,0.45), 0 0 80px rgba(0,229,255,0.18);
  --db-text:        #ffffff;
  --db-muted:       rgba(255,255,255,0.5);
  --db-radius:      20px;
  --db-ease:        0.22s cubic-bezier(.4,0,.2,1);
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  font-family: 'DM Sans', sans-serif;
  background: #000 !important;
  color: var(--db-text);
  min-height: 100%;
}

#root {
  background: #000;
  min-height: 100vh;
}

.rs-container {
  min-height: 100vh;
  padding: 40px 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  max-width: 820px;
  margin: 0 auto;
}

/* ── Header ── */
.rs-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.rs-eyebrow {
  display: inline-block;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--db-cyan);
  background: var(--db-cyan-dim);
  border: 1px solid var(--db-cyan-border);
  padding: 6px 18px;
  border-radius: 50px;
}
.rs-title {
  font-family: 'Syne', sans-serif;
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 800;
  color: var(--db-text);
  letter-spacing: -0.02em;
}
.rs-empty-sub {
  max-width: 480px;
  font-size: 0.95rem;
  line-height: 1.7;
  color: var(--db-muted);
  text-align: center;
}

/* ── Metrics grid ── */
.rs-metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  width: 100%;
}
.rs-metric-card {
  background: var(--db-surface);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: var(--db-radius);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 4px;
  position: relative;
  overflow: hidden;
  transition: border-color var(--db-ease), box-shadow var(--db-ease);
}
.rs-metric-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: var(--db-cyan);
  opacity: 0.3;
}
.rs-metric-card--good {
  border-color: var(--db-cyan-border);
  box-shadow: 0 0 24px rgba(0,229,255,0.12);
}
.rs-metric-card--good::before { opacity: 1; }

.rs-metric-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--db-muted);
}
.rs-metric-value {
  font-family: 'Syne', sans-serif;
  font-size: 2rem;
  font-weight: 800;
  color: var(--db-cyan);
  line-height: 1;
  text-align: center;
  word-break: break-word;
}
.rs-metric-sub {
  font-size: 0.75rem;
  color: var(--db-muted);
  text-align: center;
}

/* ── Recent session card ── */
.rs-recent {
  width: 100%;
  background: var(--db-surface);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: var(--db-radius);
  padding: 22px 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 0 60px rgba(0,229,255,0.05);
}
.rs-recent-meta {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.rs-mode-badge {
  font-family: 'Syne', sans-serif;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 4px 12px;
  border-radius: 50px;
  border: 1px solid var(--db-cyan-border);
  color: var(--db-cyan);
  background: var(--db-cyan-dim);
}
.rs-mode-badge--test {
  border-color: rgba(124,92,255,0.6);
  color: #a78bfa;
  background: rgba(124,92,255,0.12);
}
.rs-recent-date {
  font-size: 0.8rem;
  color: var(--db-muted);
}

/* ── Elbow bar ── */
.rs-bar-wrap { display: flex; flex-direction: column; gap: 8px; }
.rs-bar-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: rgba(255,255,255,0.6);
}
.rs-bar-pct {
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  color: var(--db-cyan);
}
.rs-bar-track {
  width: 100%;
  height: 6px;
  background: rgba(255,255,255,0.08);
  border-radius: 99px;
  overflow: hidden;
}
.rs-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--db-cyan), rgba(0,229,255,0.5));
  border-radius: 99px;
  transition: width 0.8s cubic-bezier(.4,0,.2,1);
}

/* ── Score ── */
.rs-score-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--db-surface2);
  border-radius: 14px;
  padding: 16px 22px;
  border: 1px solid rgba(0,229,255,0.15);
}
.rs-score-label {
  font-size: 0.85rem;
  color: var(--db-muted);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.rs-score-value {
  font-family: 'Syne', sans-serif;
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--db-cyan);
}
.rs-score-max {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--db-muted);
}

/* ── Actions ── */
.rs-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  width: 100%;
  max-width: 420px;
}

.rs-voice-btn {
  width: 100%;
  padding: 14px;
  font-family: 'Syne', sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border-radius: 50px;
  border: 2px solid var(--db-cyan-border);
  background: transparent;
  color: var(--db-cyan);
  cursor: pointer;
  transition: background var(--db-ease), box-shadow var(--db-ease), transform var(--db-ease);
}
.rs-voice-btn:hover {
  background: var(--db-cyan-dim);
  transform: translateY(-2px);
}
.rs-voice-btn--active {
  background: var(--db-cyan-dim);
  box-shadow: var(--db-cyan-glow);
}

.rs-back-btn {
  width: 100%;
  padding: 16px;
  font-family: 'Syne', sans-serif;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #000;
  background: var(--db-cyan);
  border: none;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: var(--db-cyan-glow);
  transition: transform var(--db-ease), filter var(--db-ease);
}
.rs-back-btn:hover {
  transform: translateY(-3px) scale(1.02);
  filter: brightness(1.12);
}
.rs-back-btn:active { transform: scale(0.98); }

@media (max-width: 600px) {
  .rs-container { padding: 40px 20px; }
  .rs-metrics-grid { grid-template-columns: repeat(2, 1fr); }
  .rs-recent { padding: 20px 18px; }
}
`;