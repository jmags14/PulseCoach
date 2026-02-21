import { useState, useRef, useEffect } from 'react';
import PoseCamera from '../components/PoseCamera';
import { CPREngine } from '../logic/CPRengine';
import { AudioManager } from "../logic/audioManager";
import { useWebSocket } from '../logic/useWebSocket';
//import './App.css';

type Metrics = {
  bpm: number;
  relativeDepth: number;
  elbowsLocked: boolean;
  compressionCount?: number;
  //feedback?: string;
};

type Summary = {
  text: string;
  stats?: {
    avgBPM?: number;
    avgDepth?: number;
    elbowLockedPercent?: number;
    duration?: number;
  };
};

function CPRsession() {
  //UI state
  const [cameraOn, setCameraOn] = useState(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [readyToStart, setReadyToStart] = useState(false);
  const [mode, setMode] = useState<"train" | "test">("train");  //add for modes section
  const [summary, setSummary] = useState<Summary | null>(null);
  //const [highlightColor, setHighlightColor] = useState<string | null>(null);
  const [triggerFeedback, setTriggerFeedback] = useState<string | null>(null);

  //cpr logic and timming
  const engineRef = useRef(new CPREngine());
  const lastSentRef = useRef(0);
  const sessionStartedRef = useRef(false);

  // connect to backend AI WebSocket
 const { connected, messages, sendMessage} = useWebSocket("http://localhost:8080");

  //tts and audio
  const lastSpokenRef = useRef<string | null>(null);
  const lastSpokenTimeRef = useRef(0);
  const audioRef = useRef<AudioManager | null>(null);
  const [voiceActive, setVoiceActive] = useState(false);

  const speakFeedback = (text: string, force = false) => {
    if (!cameraOn && !force) return;

    // Only speak if feedback changed
    if (lastSpokenRef.current === text) return;

    //limit to TTS can trigger ever 4 seconds
    const now = performance.now();
    if (now - lastSpokenTimeRef.current < 4000) return;
    lastSpokenTimeRef.current = now;
    lastSpokenRef.current = text;

    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };


  //called every frame and process the pose to calcuate metrics
  const handlePose = (coords: any[]) => {
    if (!coords) return;
    const result = engineRef.current.processFrame(coords);
    const isReady = engineRef.current.isInStartPosition(coords);
    setReadyToStart(isReady);
    
    if (!result) return;

    // send metrics to backend every second or so
    const now = performance.now();
    if (now - lastSentRef.current > 1000) { // 1 second
      sendMessage("metrics", {
        timestamp: Date.now(),
        ready: isReady,
        mode,
        metrics: result,
      });
      lastSentRef.current = now;
    }
    setMetrics(result); 
    // Say start message only once
    /*if (isReady && !compressionStartedRef.current) {
      speakFeedback("Good position, start compressions");
      compressionStartedRef.current = true;
    }

    // Update metrics every frame
    if (result) {
      setMetrics(result);
      speakFeedback(result.feedback);
    }*/

  };

  //for audio set up
  useEffect(() => {
    audioRef.current = new AudioManager({
      onTranscript: (text: string) => {
        if (text === "__END__") {
          setVoiceActive(false);
          return;
        }

        // send to backend through your existing WebSocket
        sendMessage("voiceCommand", {
          text,
          timestamp: Date.now(),
        });
      },
    });
  }, []);

  useEffect(() => {
    if (!connected) return;
    if (cameraOn) {
      setSummary(null); //reset session if new
      if (readyToStart && !sessionStartedRef.current){
      sendMessage("startSession", { mode });
      sessionStartedRef.current = true;        
      }
    }
    
    if(!cameraOn){
      sendMessage("stopSession", {});
      sessionStartedRef.current = false;
    }
  }, [cameraOn, readyToStart, connected]);

  // handle messages from AI/backend
  useEffect(() => {
    if (messages.length === 0) return;
    const msg = messages[messages.length - 1];

    if (msg.type === "feedback" && msg.text) {
      // play TTS
      setTriggerFeedback(msg.text);
      speakFeedback(msg.text);
      //setHighlightColor(msg.highlightColor || null);

      // optionally duck music or highlight skeleton
      if (msg.duckMusic) {
        console.log("Lower music volume temporarily");
      }
    }

    if (msg.type === "summary") {
      setSummary({
        text: msg.text || "No summary available",
        stats: msg.stats,
      });
      speakFeedback(msg.text || "No summary available", true);
    }

    if (msg.type === "voiceReply" && msg.text) {
      speakFeedback(msg.text, true);    
    }
  }, [messages]);

  return (
    <div>
      <button onClick={() => setCameraOn((prev) => !prev)}>
        {cameraOn ? "Stop Camera" : "Start Camera"}
      </button>

      <button
        onClick={() =>
          setMode((prev) => (prev === "train" ? "test" : "train"))
        }
      >
        Mode: {mode.toUpperCase()}
      </button>

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


      <PoseCamera
        running={cameraOn}
        onPoseDetected={handlePose}
        ready={readyToStart}
      />
      {triggerFeedback && (
        <div>
          <h2>Feedback: {triggerFeedback}</h2>
        </div>
      )}

      {metrics && (
        <div>
            <h2>Live Metrics</h2>
            <h2>BPM: {metrics.bpm}</h2>
            <h2>Elbows Locked: {metrics.elbowsLocked ? "Yes" : "No"}</h2>
            {/*<h2>Feedback: {metrics.feedback || "..."}</h2>*/}
        </div>
      )}

      {summary ? (
        <div style={{ marginTop: "20px", padding: "15px", border: "2px solid green" }}>
          <h2>Session Summary</h2>
          <p>{summary.text}</p>

          {summary.stats && (
            <>
              <p>Avg BPM: {summary.stats.avgBPM?.toFixed(0)}</p>
              <p>Elbows Locked: {summary.stats.elbowLockedPercent?.toFixed(0)}%</p>
              <p>Duration: {summary.stats.duration?.toFixed(1)}s</p>
            </>
          )}
        </div>
      ) : (
        <div style={{ marginTop: "20px", padding: "15px", border: "2px solid red" }}>
          <h2>No Session Data</h2>
          <p>No data was received for this session.</p>
        </div>
      )}
    </div>
  );
}
export default CPRsession
