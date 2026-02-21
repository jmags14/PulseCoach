import { useState, useRef, useEffect } from 'react'
import PoseCamera from './components/PoseCamera'
import { CPREngine } from './logic/CPRengine';
//import { useWebSocket } from './logic/useWebSocket';
import './App.css'

function App() {
  const [cameraOn, setCameraOn] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);
  const [readyToStart, setReadyToStart] = useState(false);
  //const [mode, setMode] = useState<"train" | "test">("train");  //add for modes section

  const compressionStartedRef = useRef(false);
  const engineRef = useRef(new CPREngine());
  
  // connect to backend AI WebSocket
  //const { connected, messages, sendMessage } = useWebSocket("ws://localhost:8080");


  const lastSpokenRef = useRef<string | null>(null);
  const speakingRef = useRef(false);
  const lastSpokenTimeRef = useRef(0);


  const speakFeedback = (text: string) => {
    if (!cameraOn) return;

    // Only speak if feedback changed
    if (lastSpokenRef.current === text) return;

    //limit to TTS can trigger ever 3 seconds
    const now = performance.now();
    if (now - lastSpokenTimeRef.current < 5000) return;
    lastSpokenTimeRef.current = now;


    lastSpokenRef.current = text;

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.onstart = () => {
      speakingRef.current = true;
    };

    utterance.onend = () => {
      speakingRef.current = false;
    };

    window.speechSynthesis.speak(utterance);
  };


  //called every frame and process the pose to calcuate metrics
  const handlePose = (coords: any[]) => {
    if (!coords) return;
    //process the landmarks through CPR engine
    const result = engineRef.current.processFrame(coords);
    //check if person is in correct start position
    const isReady = engineRef.current.isInStartPosition(coords);
    setReadyToStart(isReady);
    
    // send metrics to backend every second or so
    /*if (result) {
      sendMessage({
        type: "metrics",
        timestamp: Date.now(),
        ready: isReady,
        metrics: result,
      });
    }*/
    
    // Say start message only once
    if (isReady && !compressionStartedRef.current) {
      speakFeedback("Good position, start compressions");
      compressionStartedRef.current = true;
    }

    // Update metrics every frame
    if (result) {
      setMetrics(result);
      speakFeedback(result.feedback);
    }

  };

  
  // handle messages from AI/backend
  /*useEffect(() => {
    if (messages.length === 0) return;

    const msg = messages[messages.length - 1];

    if (msg.type === "feedback" && msg.text) {
      // play TTS
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(msg.text);
      window.speechSynthesis.speak(utterance);

      // optionally duck music or highlight skeleton
      if (msg.duckMusic) {
        console.log("Lower music volume temporarily");
      }
      if (msg.highlightColor) {
        console.log("Change skeleton color to", msg.highlightColor);
      }
    }

    if (msg.type === "summary") {
      console.log("Session summary:", msg.text);
    }
  }, [messages]);*/

  return (
    <div>
      <button onClick={() => setCameraOn((prev) => !prev)}>
        {cameraOn ? "Stop Camera" : "Start Camera"}
      </button>

      <PoseCamera running={cameraOn} onPoseDetected={handlePose} ready={readyToStart} />
      {metrics && (
        <div>
          <h2>BPM: {metrics.bpm}</h2>
          <h2>Depth: {metrics.relativeDepth .toFixed(4)}</h2>
          <h2>Elbows Locked: {metrics.elbowsLocked ? "Yes" : "No"}</h2>
          <h2>Feedback: {metrics.feedback}</h2>
        </div>
      )}
    </div>
  );
}
export default App