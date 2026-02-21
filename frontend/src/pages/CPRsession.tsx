import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import PoseCamera from "../components/PoseCamera";
import MetricCard from "../components/MetricCard";
import { CPREngine } from "../logic/CPRengine";
import { AudioManager } from "../logic/audioManager";
import { useWebSocket } from "../logic/useWebSocket";
import { startMetronome, stopMetronome } from "../audio/script";
import { startTutorial } from "../audio/tts";
import "../styles/CPRsession.css";
// song imports
import dancingQueen from "../audio_clips/audio_dancingqueen.mp3";
import espresso from "../audio_clips/audio_espresso.mp3";
import stayinAlive from "../audio_clips/audio_stayinalive.mp3";
import ruleWorld from "../audio_clips/audio_ruletheworld.mp3";
import crazyLove from "../audio_clips/audio_crazyinlove.mp3";

type Metrics = {
  bpm: number;
  relativeDepth: number;
  elbowsLocked: boolean;
  compressionCount?: number;
};

export default function CPRsession() {
  const navigate = useNavigate();
  const { mode: modeParam } = useParams<{ mode: string }>();
  const [searchParams] = useSearchParams();
  const song = searchParams.get("song");

  // Lock mode from URL param, fall back to train
  const mode = (modeParam === "test" ? "test" : "train") as "train" | "test";

  // UI state
  const [cameraOn, setCameraOn] = useState(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [readyToStart, setReadyToStart] = useState(false);
  const [triggerFeedback, setTriggerFeedback] = useState<string | null>(null);
  const [voiceActive, setVoiceActive] = useState(false);
  const [caption, setCaption] = useState<string>("");

  // CPR logic
  const engineRef = useRef(new CPREngine());
  const lastSentRef = useRef(0);
  const sessionStartedRef = useRef(false);

  // Audio state refs
  const audioStartedRef = useRef(false);
  const tutorialDoneRef = useRef(false); // track if TTS has finished or been skipped

  // WebSocket
  const { connected, messages, sendMessage } = useWebSocket("http://localhost:8080");

  // Song audio manager
  const songAudioRef = useRef<HTMLAudioElement | null>(null);

  // Audio manager (voice commands)
  const audioRef = useRef<AudioManager | null>(null);

  // Handle pose detection
  const handlePose = (coords: any[]) => {
    if (!coords) return;
    const result = engineRef.current.processFrame(coords);
    const isReady = engineRef.current.isInStartPosition(coords);
    setReadyToStart(isReady);

    if (!result) return;

    const now = performance.now();
    if (now - lastSentRef.current > 1000) {
      sendMessage("metrics", {
        timestamp: Date.now(),
        ready: isReady,
        mode,
        metrics: result,
      });
      lastSentRef.current = now;
    }

    setMetrics(result);

    // Start metronome as soon as user is in position (training mode only)
    if (mode === "train" && isReady && !audioStartedRef.current) {
        audioStartedRef.current = true;

        // If TTS is still going, cancel it — metronome takes priority
        if (!tutorialDoneRef.current) {
            window.speechSynthesis.cancel();
            tutorialDoneRef.current = true;
            setCaption("");
        }

        // metronome only
        if(song === "beat_only") {
          startMetronome(110);
        }

        else {
          let audioSrc = stayinAlive; // default song

          if(song == "dancing_queen") audioSrc = dancingQueen;
          else if(song === "rule_world") audioSrc = ruleWorld;
          else if(song === "crazy_love") audioSrc = crazyLove;
          else if(song === "espresso") audioSrc = espresso;

          // stop any previous audio
          if(songAudioRef.current) {
            songAudioRef.current.pause();
            songAudioRef.current.currentTime = 0;
          }

          const audio = new Audio(audioSrc);

          audio.loop = true;
          audio.currentTime = 0;

          audio.play().catch(err => {
            console.warn("Audio play failed:", err);
          });

          songAudioRef.current = audio;
        }
    }

    // If user leaves position, stop metronome
    /*if (!isReady && metronomeRunningRef.current) {
      metronomeRunningRef.current = false;
      stopMetronome();
    }*/

    // Backend session start
    if (!connected) return;
    if (isReady && !sessionStartedRef.current) {
      sendMessage("startSession", { mode });
      sessionStartedRef.current = true;
    }
  };

  // Initialize audio manager
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

  // When camera turns on → start TTS tutorial (training mode only)
  useEffect(() => {
    if (!cameraOn) {
      // Camera off: stop everything
      stopMetronome();
      window.speechSynthesis.cancel();
      audioStartedRef.current = false;
      tutorialDoneRef.current = false;
      sessionStartedRef.current = false;
      setCaption("");
      if (connected) sendMessage("stopSession", {});
      return;
    }

    // Camera just turned on
    if (mode === "train") {
      // Start TTS tutorial immediately
      tutorialDoneRef.current = false;
      startTutorial((text: string) => {
        setCaption(text);
        // Mark tutorial done when last step finishes
        // tts.ts calls onend for each step; the final step will hit the
        // `currentStep >= steps.length` guard — we detect done by caption clearing
      });

      // Mark tutorial as done after its expected duration (or let position trigger stop it)
      // We rely on position detection to cancel TTS when user is ready
    }
  }, [cameraOn]);

  // Handle backend messages
  useEffect(() => {
    if (messages.length === 0) return;
    const msg = messages[messages.length - 1];

    if (msg.type === "feedback" && msg.text) {
      setTriggerFeedback(msg.text);
    }

    if (msg.type === "summary") {
      navigate("/results", { state: { metrics } });
    }

    if (msg.type === "voiceReply" && msg.text) {
      setTriggerFeedback(msg.text);
    }
  }, [messages, navigate, metrics]);

  const handleEndSession = () => {
    /*
    stopMetronome();
    window.speechSynthesis.cancel();
    audioStartedRef.current = false;
    setCameraOn(false);
    navigate("/results", { state: { metrics } });
    */
    stopMetronome();
    if(songAudioRef.current) {
      songAudioRef.current.pause();
      songAudioRef.current.currentTime = 0;
    }

    window.speechSynthesis.cancel();
    audioStartedRef.current = false;
    setCameraOn(false);

    navigate("/results", { state: { metrics } });
  };

  const bpmInRange = metrics?.bpm !== undefined && metrics.bpm >= 100 && metrics.bpm <= 120;
  const elbowsLocked = metrics?.elbowsLocked ?? false;

  return (
    <div className="session-container">
      {/* Fullscreen Camera */}
      <div className="camera-section">
        <PoseCamera
          running={cameraOn}
          onPoseDetected={handlePose}
          ready={readyToStart}
        />
      </div>

      {/* TTS caption overlay — bottom center */}
      {caption && (
        <div className="caption-overlay">
          {caption}
        </div>
      )}

      {/* Ready indicator overlay */}
      {cameraOn && (
        <div className={`ready-indicator ${readyToStart ? "ready" : "not-ready"}`}>
          {readyToStart ? "✓ In Position" : "Get into position"}
        </div>
      )}

      {/* Overlay Controls + Metrics */}
      <div className="controls-section">
        <h2>{mode === "train" ? "Training Mode" : "Testing Mode"}</h2>

        <button
          className={cameraOn ? "end-btn" : "start-btn"}
          onClick={() => {
            if (!cameraOn) setCameraOn(true);
            else handleEndSession();
          }}
        >
          {cameraOn ? "End Session" : "Start Session"}
        </button>

        {/* Voice button — only useful in train mode */}
        {mode === "train" && (
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
            {voiceActive ? "🎙 End Voice" : "🎙 Ask Question"}
          </button>
        )}

        <div className="metrics-grid">
          <MetricCard label="BPM" value={metrics?.bpm ?? "--"} highlight={bpmInRange} />
          <MetricCard label="Elbows Locked" value={elbowsLocked ? "Yes" : "No"} highlight={elbowsLocked} />
          <MetricCard label="Depth" value={metrics?.relativeDepth ?? "--"} />
          {metrics?.compressionCount !== undefined && (
            <MetricCard label="Compressions" value={metrics.compressionCount} />
          )}
        </div>

        {triggerFeedback && <div className="feedback">💬 {triggerFeedback}</div>}
      </div>
    </div>
  );
}