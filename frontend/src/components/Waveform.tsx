import "../styles/Waveform.css";
import React from "react";

export default function Waveform() {
  return (
    <div className="waveform-container">
      <svg
        className="waveform"
        viewBox="0 0 600 200"
        preserveAspectRatio="none"
      >
        <polyline
          className="wave"
          points="0,100 50,100 80,40 110,100 140,160 170,100 220,100 260,70 300,130 340,100 380,100 420,90 460,110 500,100 540,100 600,100"
        />
      </svg>
    </div>
  );
}
