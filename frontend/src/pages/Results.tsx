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

type SummaryStats = {
  avgBPM?: number;
  compressionCount?: number;
};

export default function Results() {
  const navigate = useNavigate();
  const locationState = useLocation().state as { metrics?: Metrics; summaryStats?: SummaryStats } | undefined;
  const metrics = locationState?.metrics;
  const summaryStats = locationState?.summaryStats;

  console.log("Received metrics:", JSON.stringify(metrics, null, 2)); // delete if needed man
  console.table(metrics);

  const displayedBpm = summaryStats?.avgBPM ?? metrics?.bpm;
  const displayedCompressionCount = summaryStats?.compressionCount ?? metrics?.compressionCount;
  const bpmInRange = displayedBpm !== undefined && displayedBpm >= 100 && displayedBpm <= 120;
  const elbowsLocked = metrics?.elbowsLocked ?? false;

  const [voiceActive, setVoiceActive] = useState(false);
  const audioRef = useRef<AudioManager | null>(null);

const { sendMessage } = useWebSocket("http://localhost:8080");
  
  
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
            <MetricCard label="BPM" value={displayedBpm !== undefined ? Math.round(displayedBpm) : "--"} highlight={bpmInRange} />
            <MetricCard label="Elbows Locked" value={elbowsLocked ? "Yes" : "No"} highlight={elbowsLocked} />
            <MetricCard label="Compressions" value={displayedCompressionCount ?? "--"} />
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