import "../styles/ModelSelector.css";

type Props = {
  mode: "train" | "test";
  onChange: (mode: "train" | "test") => void;
  onStart: () => void;
};

function ModeSelector({ mode, onChange, onStart }: Props) {
  return (
    <div className="mode-container">
      <h2>Select Mode</h2>

      <div className="mode-buttons">
        <button
          className={mode === "train" ? "active" : ""}
          onClick={() => onChange("train")}
        >
          Train
        </button>

        <button
          className={mode === "test" ? "active" : ""}
          onClick={() => onChange("test")}
        >
          Test
        </button>
      </div>

      <button className="start-button" onClick={onStart}>
        Start Session
      </button>
    </div>
  );
}

export default ModeSelector;