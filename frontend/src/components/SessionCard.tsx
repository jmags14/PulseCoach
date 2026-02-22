import "../styles/SessionCard.css";

type Session = {
  id: string;
  sessionId?: string;
  date: string;
  time?: string;
  mode: "train" | "test";
  avgBPM: number;
  elbowLockedPercent: number;
  compressionCount: number;
  duration: number; // seconds
  score?: number;
  song?: string;
};

function SessionCard({ session }: { session: Session }) {
  const minutes = Math.floor(session.duration / 60);
  const seconds = Math.round(session.duration % 60);
  const durationStr = `${minutes}m ${seconds}s`;

  return (
    <div className="session-card">
      <div className="session-card-header">
        <h3>{session.date}</h3>
        {session.time && <span className="session-time">{session.time}</span>}
      </div>

      <div className="session-badge">{session.mode.toUpperCase()}</div>

      <div className="session-stats">
        <div className="stat">
          <span className="stat-label">Avg BPM</span>
          <span className="stat-value">{session.avgBPM.toFixed(0)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Elbow Lock</span>
          <span className="stat-value">{session.elbowLockedPercent.toFixed(0)}%</span>
        </div>
        <div className="stat">
          <span className="stat-label">Compressions</span>
          <span className="stat-value">{session.compressionCount}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Duration</span>
          <span className="stat-value">{durationStr}</span>
        </div>
      </div>
    </div>
  );
}

export default SessionCard;