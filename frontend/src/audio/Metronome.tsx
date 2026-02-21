import { useState } from "react";
import { startMetronome, stopMetronome } from "../audio/script.ts";
import { useNavigate } from "react-router-dom"; // for navigation to TTS page

export const Metronome = () => {
  const [bpm, setBpm] = useState(110);
  const navigate = useNavigate();

  return (
    <div style={{ padding: "20px" }}>
      <h1>🫀 CPR Compression Metronome</h1>

      <div style={{ marginTop: "20px" }}>
          <button onClick={() => startMetronome(bpm)} style={{ marginRight: "10px" }}>
            Start
          </button>
        <button onClick={stopMetronome}>Stop</button>
      </div>

      <div style={{ marginTop: "20px" }}>
        <label htmlFor="bpmSlider">BPM:</label>
        <input
          type="range"
          id="bpmSlider"
          min={80}
          max={140}
          value={bpm}
          onChange={(e) => setBpm(parseInt(e.target.value))}
          style={{ margin: "0 10px" }}
        />
        <span>{bpm}</span>
      </div>

      <div style={{ marginTop: "20px" }}>
        <button onClick={() => navigate("/tts")}>TTS Testing</button>
      </div>
    </div>
  );
};