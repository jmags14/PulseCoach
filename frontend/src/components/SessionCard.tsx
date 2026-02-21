import "../styles/SessionCard.css";

type Session = {
  id: string;
  date: string;
  avgBPM: number;
  score: number;
  mode: "train" | "test";
};

function SessionCard({ session }: { session: Session }) {
  return (
    <div className="session-card">
      <h3>{session.date}</h3>
      <p>Mode: {session.mode}</p>
      <p>Avg BPM: {session.avgBPM}</p>
      <p>Score: {session.score}%</p>
    </div>
  );
}

export default SessionCard;