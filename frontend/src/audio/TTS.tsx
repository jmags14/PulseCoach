import { useState, useRef } from "react";
import { startTutorial, pauseTutorial, resumeTutorial, replayTutorial } from "../audio/tts"; // adjust path

export const TTS = () => {
  const [caption, setCaption] = useState(""); // displays current TTS caption

  // Optionally, pass a callback to update caption from your tts.ts logic
  const captionCallback = useRef<(text: string) => void>(() => {
    setCaption(""); // default empty
  });

  return (
    <div style={{ padding: "20px" }}>
      <h1>CPR TTS Test</h1>

      {/* Caption display */}
      <p style={{ fontSize: "24px" }}>{caption}</p>

      {/* Controls */}
      <div style={{ marginTop: "20px" }}>
        <button onClick={() => startTutorial(captionCallback.current)} style={{ marginRight: "10px" }}>
          Start
        </button>
        <button onClick={pauseTutorial} style={{ marginRight: "10px" }}>
          Pause
        </button>
        <button onClick={resumeTutorial} style={{ marginRight: "10px" }}>
          Resume
        </button>
        <button onClick={() => replayTutorial(captionCallback.current)}>
          Replay
        </button>
      </div>
    </div>
  );
};