import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SongCarousel from "../components/SongCarousel";
import ModeSelector from "../components/ModeSelector";
import SessionCard from "../components/SessionCard";
import "../styles/Dashboard.css";

type Session = {
  id: string;
  sessionId: string;
  date: string;
  time: string;
  mode: "train" | "test";
  avgBPM: number;
  elbowLockedPercent: number;
  compressionCount: number;
  duration: number;
  score?: number;
  song?: string;
};

function Dashboard() {
  const navigate = useNavigate();

  const [selectedSong, setSelectedSong] = useState<string>("staying_alive");
  const [mode, setMode] = useState<"train" | "test">("train");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8080/api/sessions")
      .then((res) => res.json())
      .then((data) => {
        // MongoDB returns _id, map it to id for the component
        const mapped = data.map((s: any) => ({ ...s, id: s._id }));
        setSessions(mapped);
      })
      .catch((err) => console.error("Failed to load sessions:", err))
      .finally(() => setLoading(false));
  }, []);

  const startSession = () => {
    navigate(`/session/${mode}?song=${selectedSong}`);
  };

  return (
    <div className="dashboard-container">
      {/* Top Section */}
      <div className="dashboard-top">
        <div className="song-panel">
          <h2>Select Song</h2>
          <SongCarousel selected={selectedSong} onSelect={setSelectedSong} />
        </div>

        <div className="mode-panel">
          <ModeSelector mode={mode} onChange={setMode} onStart={startSession} />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="sessions-panel">
        <h2>Past Sessions</h2>
        {loading ? (
          <p className="sessions-loading">Loading sessions...</p>
        ) : sessions.length === 0 ? (
          <p className="sessions-empty">No sessions yet. Start your first one!</p>
        ) : (
          <div className="sessions-grid">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;