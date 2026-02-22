import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import PoseCamera from "../components/PoseCamera";
import MetricCard from "../components/MetricCard";
import { CPREngine } from "../logic/CPRengine";
import { AudioManager } from "../logic/audioManager";
import { useWebSocket } from "../logic/useWebSocket";
import { startMetronome, stopMetronome } from "../audio/script";
import { startTutorial } from "../audio/tts";
// song imports
import dancingQueen from "../audio_clips/audio_dancingqueen.mp3";
import espresso from "../audio_clips/audio_espresso.mp3";
import stayinAlive from "../audio_clips/audio_stayinalive.mp3";
import ruleWorld from "../audio_clips/audio_ruletheworld.mp3";
import crazyLove from "../audio_clips/audio_crazyinlove.mp3";

type Metrics = {
  bpm: number;
  // relativeDepth: number;
  elbowsLocked: boolean;
  compressionCount?: number;
};

type SummaryStats = {
  avgBPM?: number;
  compressionCount?: number;
  elbowLockedPercent?: number;
  duration?: number;
  score?: number;
};

export default function CPRsession() {
  const navigate = useNavigate();
  const { mode: modeParam } = useParams<{ mode: string }>();
  const [searchParams] = useSearchParams();
  const song = searchParams.get("song");
  const mode = (modeParam === "test" ? "test" : "train") as "train" | "test";

  const [cameraOn, setCameraOn] = useState(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [readyToStart, setReadyToStart] = useState(false);
  const [triggerFeedback, setTriggerFeedback] = useState<string | null>(null);
  const [voiceActive, setVoiceActive] = useState(false);
  const [caption, setCaption] = useState<string>("");

  const engineRef = useRef(new CPREngine());
  const lastSentRef = useRef(0);
  const sessionStartedRef = useRef(false);
  const endingSessionRef = useRef(false);
  const fallbackNavTimerRef = useRef<number | null>(null);
  const audioStartedRef = useRef(false);
  const tutorialDoneRef = useRef(false);
  const songAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioRef = useRef<AudioManager | null>(null);

  const { connected, messages, sendMessage } = useWebSocket("http://localhost:8080");

  const speakWithDucking = (text: string) => {
    if (!text) return;
    if (songAudioRef.current) songAudioRef.current.volume = 0.2;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => {
      if (songAudioRef.current) songAudioRef.current.volume = 1.0;
    };
    window.speechSynthesis.speak(utterance);
  };

  const handlePose = (coords: any[]) => {
    if (!coords) return;
    const result = engineRef.current.processFrame(coords);
    const isReady = engineRef.current.isInStartPosition(coords);
    setReadyToStart(isReady);
    if (!result) return;

    const now = performance.now();
    if (now - lastSentRef.current > 1000) {
      sendMessage("metrics", { timestamp: Date.now(), ready: isReady, mode, metrics: result });
      lastSentRef.current = now;
    }
    setMetrics(result);

    if (mode === "train" && isReady && !audioStartedRef.current) {
      audioStartedRef.current = true;
      if (!tutorialDoneRef.current) {
        window.speechSynthesis.cancel();
        tutorialDoneRef.current = true;
        setCaption("");
      }
      if (song === "beat_only") {
        startMetronome(110);
      } else {
        let audioSrc = stayinAlive;
        if (song === "dancing_queen") audioSrc = dancingQueen;
        else if (song === "everybody_wants_to_rule_the_world") audioSrc = ruleWorld;
        else if (song === "crazy_in_love") audioSrc = crazyLove;
        else if (song === "espresso") audioSrc = espresso;

        if (songAudioRef.current) {
          songAudioRef.current.pause();
          songAudioRef.current.currentTime = 0;
        }
        const audio = new Audio(audioSrc);
        audio.loop = true;
        audio.currentTime = 0;
        audio.play().catch(err => console.warn("Audio play failed:", err));
        songAudioRef.current = audio;
      }
    }

    if (!connected) return;
    if (isReady && !sessionStartedRef.current) {
      sendMessage("startSession", { mode, song });
      sessionStartedRef.current = true;
    }
  };

  useEffect(() => {
    audioRef.current = new AudioManager({
      onTranscript: (text: string) => {
        if (text === "__END__") { setVoiceActive(false); return; }
        sendMessage("voiceCommand", { text, timestamp: Date.now() });
      },
    });
  }, []);

  useEffect(() => {
    if (!cameraOn) {
      stopMetronome();
      window.speechSynthesis.cancel();
      audioStartedRef.current = false;
      tutorialDoneRef.current = false;
      sessionStartedRef.current = false;
      setCaption("");
      return;
    }
    if (mode === "train") {
      tutorialDoneRef.current = false;
      startTutorial((text: string) => setCaption(text));
    }
  }, [cameraOn]);

  useEffect(() => {
    if (messages.length === 0) return;
    const msg = messages[messages.length - 1];

    if (songAudioRef.current) {
      songAudioRef.current.volume = msg.duckMusic === true ? 0.2 : 1.0;
    }
    if (msg.type === "feedback" && msg.text) {
      setTriggerFeedback(msg.text);
      speakWithDucking(msg.text);
    }
    if (msg.type === "summary") {
      if (fallbackNavTimerRef.current) {
        window.clearTimeout(fallbackNavTimerRef.current);
        fallbackNavTimerRef.current = null;
      }
      const summaryStats = (msg.stats ?? {}) as SummaryStats;
      navigate("/results", { state: { metrics, summaryStats } });
      endingSessionRef.current = false;
    }
    if (msg.type === "voiceReply" && msg.text) {
      setTriggerFeedback(msg.text);
    }
  }, [messages, navigate, metrics]);

  const handleEndSession = () => {
    stopMetronome();
    window.speechSynthesis.cancel();
    if (songAudioRef.current) {
      songAudioRef.current.pause();
      songAudioRef.current.currentTime = 0;
    }
    audioStartedRef.current = false;
    endingSessionRef.current = true;

    if (connected) sendMessage("stopSession", {});

    if (fallbackNavTimerRef.current) window.clearTimeout(fallbackNavTimerRef.current);
    fallbackNavTimerRef.current = window.setTimeout(() => {
      if (endingSessionRef.current) {
        navigate("/results", { state: { metrics } });
        endingSessionRef.current = false;
      }
    }, 2000);

    setCameraOn(false);
  };

  useEffect(() => {
    return () => {
      if (fallbackNavTimerRef.current) window.clearTimeout(fallbackNavTimerRef.current);
    };
  }, []);

  const bpmInRange = metrics?.bpm !== undefined && metrics.bpm >= 100 && metrics.bpm <= 120;
  const elbowsLocked = metrics?.elbowsLocked ?? false;

  return (
    <>
      <style>{css}</style>
      <div className="cpr-root">

        {/* ── NAVBAR ── */}
        <nav className="cpr-nav">
          <div className="cpr-nav-logo">
            <span className="cpr-logo-pulse">Pulse</span>
            <span className="cpr-logo-coach">Coach</span>
          </div>
          <div className="cpr-nav-center">
            <span className={`cpr-mode-badge cpr-mode-badge--${mode}`}>
              {mode === "train" ? "🎵 Training Mode" : "🧪 Test Mode"}
            </span>
          </div>
          <div className="cpr-nav-right">
            {cameraOn && (
              <div className={`cpr-ready-pill ${readyToStart ? "cpr-ready-pill--ready" : ""}`}>
                {readyToStart ? "✓ In Position" : "Get into position"}
              </div>
            )}
          </div>
        </nav>

        {/* ── MAIN LAYOUT ── */}
        <div className="cpr-body">

          {/* Camera — takes up the left/main area */}
          <div className="cpr-camera-wrap">
            <PoseCamera running={cameraOn} onPoseDetected={handlePose} ready={readyToStart} />
            {caption && <div className="cpr-caption">{caption}</div>}
          </div>

          {/* ── SIDE PANEL ── */}
          <aside className="cpr-panel">

            {/* Session toggle */}
            <button
              className={cameraOn ? "cpr-btn cpr-btn--end" : "cpr-btn cpr-btn--start"}
              onClick={() => { if (!cameraOn) setCameraOn(true); else handleEndSession(); }}
            >
              {cameraOn ? "End Session" : "Start Session"}
            </button>

            {/* Voice button — train mode only */}
            {mode === "train" && (
              <button
                className={`cpr-btn cpr-btn--voice${voiceActive ? " cpr-btn--voice-active" : ""}`}
                onClick={() => {
                  if (!voiceActive) { audioRef.current?.start(); setVoiceActive(true); }
                  else { audioRef.current?.stop(); setVoiceActive(false); }
                }}
              >
                {voiceActive ? "🎙 End Voice" : "🎙 Ask Question"}
              </button>
            )}

            {/* Divider */}
            <div className="cpr-divider" />

            {/* Metrics — stacked vertically */}
            <div className="cpr-metrics">
              <div className={`cpr-metric${bpmInRange ? " cpr-metric--good" : ""}`}>
                <span className="cpr-metric-label">BPM</span>
                <span className="cpr-metric-value">{metrics?.bpm ?? "—"}</span>
                <span className="cpr-metric-sub">{bpmInRange ? "✓ In range" : "Target: 100–120"}</span>
              </div>

              <div className={`cpr-metric${elbowsLocked ? " cpr-metric--good" : ""}`}>
                <span className="cpr-metric-label">Elbows Locked</span>
                <span className="cpr-metric-value">{elbowsLocked ? "Yes" : "No"}</span>
                <span className="cpr-metric-sub">{elbowsLocked ? "✓ Good form" : "Keep arms straight"}</span>
              </div>

              {/*<div className="cpr-metric">
                <span className="cpr-metric-label">Depth</span>
                <span className="cpr-metric-value">{metrics?.relativeDepth ?? "—"}</span>
                <span className="cpr-metric-sub">Relative depth</span>
              </div>
              */}

              {metrics?.compressionCount !== undefined && (
                <div className="cpr-metric">
                  <span className="cpr-metric-label">Compressions</span>
                  <span className="cpr-metric-value">{metrics.compressionCount}</span>
                  <span className="cpr-metric-sub">Total count</span>
                </div>
              )}
            </div>

            {/* Feedback */}
            {triggerFeedback && (
              <div className="cpr-feedback">
                💬 {triggerFeedback}
              </div>
            )}

          </aside>
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

html, body, #root {
  background: #000;
  font-family: 'DM Sans', sans-serif;
  color: var(--db-text);
  height: 100%;
}

.cpr-root {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #000;
  overflow: hidden;
}

/* ── Navbar ── */
.cpr-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 28px;
  background: rgba(0,0,0,0.9);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
  z-index: 10;
}
.cpr-nav-logo {
  font-family: 'Syne', sans-serif;
  font-size: 1.3rem;
  font-weight: 800;
}
.cpr-logo-pulse { color: var(--db-cyan); }
.cpr-logo-coach { color: var(--db-text); }

.cpr-nav-center {
  display: flex;
  align-items: center;
}
.cpr-mode-badge {
  font-family: 'Syne', sans-serif;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 6px 16px;
  border-radius: 50px;
  border: 1px solid var(--db-cyan-border);
  color: var(--db-cyan);
  background: var(--db-cyan-dim);
}
.cpr-mode-badge--test {
  border-color: rgba(124,92,255,0.6);
  color: #a78bfa;
  background: rgba(124,92,255,0.12);
}

.cpr-nav-right {
  display: flex;
  align-items: center;
  min-width: 160px;
  justify-content: flex-end;
}
.cpr-ready-pill {
  font-size: 0.78rem;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 50px;
  background: rgba(255,255,255,0.08);
  color: var(--db-muted);
  border: 1px solid rgba(255,255,255,0.1);
  transition: all var(--db-ease);
}
.cpr-ready-pill--ready {
  background: rgba(0,229,255,0.12);
  color: var(--db-cyan);
  border-color: var(--db-cyan-border);
  box-shadow: 0 0 16px rgba(0,229,255,0.2);
}

/* ── Body layout ── */
.cpr-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Camera */
.cpr-camera-wrap {
  flex: 1;
  position: relative;
  background: #000;
  overflow: hidden;
}
.cpr-caption {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.75);
  border: 1px solid var(--db-cyan-border);
  color: var(--db-text);
  font-size: 0.95rem;
  padding: 10px 20px;
  border-radius: 12px;
  backdrop-filter: blur(8px);
  max-width: 80%;
  text-align: center;
}

/* ── Side Panel ── */
.cpr-panel {
  width: 280px;
  flex-shrink: 0;
  background: var(--db-surface);
  border-left: 1px solid rgba(255,255,255,0.06);
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
}

/* Buttons */
.cpr-btn {
  width: 100%;
  padding: 14px;
  font-family: 'Syne', sans-serif;
  font-size: 0.88rem;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  border-radius: 50px;
  border: none;
  cursor: pointer;
  transition: transform var(--db-ease), filter var(--db-ease), box-shadow var(--db-ease);
}
.cpr-btn--start {
  background: var(--db-cyan);
  color: #000;
  box-shadow: var(--db-cyan-glow);
}
.cpr-btn--start:hover {
  transform: translateY(-2px) scale(1.02);
  filter: brightness(1.1);
}
.cpr-btn--end {
  background: #ff4455;
  color: #fff;
  box-shadow: 0 0 24px rgba(255,68,85,0.4);
}
.cpr-btn--end:hover {
  transform: translateY(-2px);
  filter: brightness(1.1);
}
.cpr-btn--voice {
  background: transparent;
  color: var(--db-cyan);
  border: 2px solid var(--db-cyan-border) !important;
  border-radius: 50px;
}
.cpr-btn--voice:hover { background: var(--db-cyan-dim); }
.cpr-btn--voice-active {
  background: var(--db-cyan-dim);
  box-shadow: var(--db-cyan-glow);
}

.cpr-divider {
  width: 100%;
  height: 1px;
  background: rgba(255,255,255,0.07);
}

/* ── Metrics stacked ── */
.cpr-metrics {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.cpr-metric {
  background: var(--db-surface2);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  position: relative;
  overflow: hidden;
  transition: border-color var(--db-ease), box-shadow var(--db-ease);
}
.cpr-metric::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: var(--db-cyan);
  opacity: 0.2;
  transition: opacity var(--db-ease);
}
.cpr-metric--good {
  border-color: var(--db-cyan-border);
  box-shadow: 0 0 16px rgba(0,229,255,0.1);
}
.cpr-metric--good::before { opacity: 1; }

.cpr-metric-label {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--db-muted);
}
.cpr-metric-value {
  font-family: 'Syne', sans-serif;
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--db-cyan);
  line-height: 1;
}
.cpr-metric-sub {
  font-size: 0.7rem;
  color: var(--db-muted);
}

/* Feedback */
.cpr-feedback {
  background: var(--db-surface2);
  border: 1px solid rgba(0,229,255,0.2);
  border-radius: 14px;
  padding: 14px 16px;
  font-size: 0.85rem;
  line-height: 1.55;
  color: rgba(255,255,255,0.8);
}
`;