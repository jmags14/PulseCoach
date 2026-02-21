import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import MetricCard from "../components/MetricCard";
import { useWebSocket } from "../logic/useWebSocket";
import { AudioManager } from "../logic/audioManager";
import "../styles/Results.css";

type Metrics = {
  bpm?: number;
  relativeDepth?: number;
  elbowsLocked?: boolean;
  compressionCount?: number;
};

export default function Results() {
  const navigate = useNavigate();
  const locationState = useLocation().state as { metrics?: Metrics } | undefined;
  const metrics = locationState?.metrics;
  const bpmInRange = metrics?.bpm !== undefined && metrics.bpm >= 100 && metrics.bpm <= 120;
  const elbowsLocked = metrics?.elbowsLocked ?? false;

  const [voiceActive, setVoiceActive] = useState(false);
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

  return (
    <div className="results-container">
      {metrics ? (
        <>
          <h1>Session Summary</h1>

          <div className="metrics-grid">
            <MetricCard label="BPM" value={metrics?.bpm ?? "--"} highlight={bpmInRange} />
            <MetricCard label="Elbows Locked" value={elbowsLocked ? "Yes" : "No"} highlight={elbowsLocked} />
            <MetricCard label="Depth" value={metrics?.relativeDepth ?? "--"} />
            <MetricCard label="Compressions" value={metrics?.compressionCount ?? "--"} />
          </div>
        </>
      ) : (
        <>
          <h1>No Session Data Found</h1>
          <p>
            Press "Start Session" in the CPR screen and get into position. 
            Your session metrics will appear here after you finish.
          </p>
        </>
      )}

      <button
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
  );
}