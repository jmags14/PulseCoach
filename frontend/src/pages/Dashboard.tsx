import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SongCarousel from "../components/SongCarousel";
import ModeSelector from "../components/ModeSelector";
import SessionCard from "../components/SessionCard";
import "../styles/Dashboard.css";

type Session = {
  id: string;
  date: string;
  avgBPM: number;
  score: number;
  mode: "train" | "test";
};

function Dashboard() {
  const navigate = useNavigate();

  const [selectedSong, setSelectedSong] = useState<string>("staying_alive");
  const [mode, setMode] = useState<"train" | "test">("train");

  // In-memory sessions (replace later with backend)
  const [sessions] = useState<Session[]>([
    {
      id: "1",
      date: "2026-02-20",
      avgBPM: 108,
      score: 88,
      mode: "train",
    },
    {
      id: "2",
      date: "2026-02-18",
      avgBPM: 102,
      score: 91,
      mode: "test",
    },
  ]);

  const startSession = () => {
    navigate(`/session/${mode}?song=${selectedSong}`);
  };

  return (
    <div className="dashboard-container">
      {/* Top Section */}
      <div className="dashboard-top">
        <div className="song-panel">
          <h2>Select Song</h2>
          <SongCarousel
            selected={selectedSong}
            onSelect={setSelectedSong}
          />
        </div>

        <div className="mode-panel">
          <ModeSelector
            mode={mode}
            onChange={setMode}
            onStart={startSession}
          />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="sessions-panel">
        <h2>Past Sessions</h2>
        <div className="sessions-grid">
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;