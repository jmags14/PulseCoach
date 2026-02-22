// Dashboard.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import crazyInLove from "../assets/crazyinlove.png";
import dancingQueen from "../assets/dancingqueen.png";
import espresso from "../assets/espresso.jpg";
import everybodyWants from "../assets/everybodywantstoruletheworld.jpg";
import stayinAlive from "../assets/stayinalive.jpg";
import ticking from "../assets/ticking.jpg";

type Mode = "train" | "test";

interface Session {
  id: string;
  sessionId: string;
  mode: Mode;
  avgBPM: number;
  elbowLockedPercent: number;
  compressionCount: number;
  duration: number;
  score?: number;
  date: string;
  time: string;
  song?: string;
  createdAt?: string;
}

interface Song {
  id: string;
  title: string;
  artist: string;
  cover: string;
}

const SONGS: Song[] = [
  { id: "crazy_in_love",                     title: "Crazy in Love",                     artist: "Beyoncé",           cover: crazyInLove },
  { id: "dancing_queen",                     title: "Dancing Queen",                     artist: "ABBA",              cover: dancingQueen },
  { id: "espresso",                          title: "Espresso",                          artist: "Sabrina Carpenter", cover: espresso },
  { id: "everybody_wants_to_rule_the_world", title: "Everybody Wants to Rule the World", artist: "Tears for Fears",   cover: everybodyWants },
  { id: "staying_alive",                     title: "Stayin' Alive",                     artist: "Bee Gees",          cover: stayinAlive },
  { id: "ticking",                           title: "Ticking",                           artist: "Metronome",         cover: ticking },
];

const SONG_DISPLAY: Record<string, string> = {
  crazy_in_love:                     "Crazy in Love – Beyoncé",
  dancing_queen:                     "Dancing Queen – ABBA",
  espresso:                          "Espresso – Sabrina Carpenter",
  everybody_wants_to_rule_the_world: "Everybody Wants to Rule the World – Tears for Fears",
  staying_alive:                     "Stayin' Alive – Bee Gees",
  ticking:                           "Ticking",
};

function songLabel(id?: string): string {
  if (!id) return "—";
  return SONG_DISPLAY[id] ?? id;
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

function formatDateTime(date: string, time: string): string {
  const d = new Date(`${date}T${time}`);
  return (
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    "  ·  " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  );
}

function SessionCard({ session }: { session: Session }) {
  const isTest = session.mode === "test";
  const stats = [
    { icon: "❤️", label: "Avg BPM",      value: `${Math.round(session.avgBPM)}` },
    { icon: "✊", label: "Compressions", value: `${Math.round(session.compressionCount)}` },
    { icon: "💪", label: "Elbow Lock",   value: `${Math.round(session.elbowLockedPercent)}%` },
    { icon: "⏱", label: "Duration",     value: formatDuration(Math.round(session.duration)) },
  ];

  return (
    <div className="sc-card">
      <div className="sc-header">
        <div className="sc-left">
          <span className={`sc-mode-badge sc-mode-badge--${session.mode}`}>
            {isTest ? "🧪 Test" : "🎵 Train"}
          </span>
          <span className="sc-song">{songLabel(session.song)}</span>
        </div>
        <div className="sc-header-right">
          {session.score !== undefined && (
            <span className="sc-score">
              {Math.round(session.score)}<span className="sc-score-max">/100</span>
            </span>
          )}
          <span className="sc-date">{formatDateTime(session.date, session.time)}</span>
        </div>
      </div>

      <div className="sc-stats">
        {stats.map((s) => (
          <div key={s.label} className="sc-stat">
            <span className="sc-stat-icon">{s.icon}</span>
            <span className="sc-stat-value">{s.value}</span>
            <span className="sc-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="sc-bar-wrap">
        <div className="sc-bar-label">
          <span>Elbow Lock Consistency</span>
          <span className="sc-bar-pct">{Math.round(session.elbowLockedPercent)}%</span>
        </div>
        <div className="sc-bar-track">
          <div className="sc-bar-fill" style={{ width: `${session.elbowLockedPercent}%` }} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [selectedSong, setSelectedSong] = useState<string>("staying_alive");
  const [selectedMode, setSelectedMode] = useState<Mode>("train");
  const [activeIndex, setActiveIndex] = useState(0);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8080/api/sessions")
      .then((res) => res.json())
      .then((data) => {
        const mapped = data.map((s: any) => ({ ...s, id: s._id }));
        setSessions(mapped);
      })
      .catch((err) => console.error("Failed to load sessions:", err))
      .finally(() => setLoading(false));
  }, []);

  const startSession = () => {
    navigate(`/session/${selectedMode}?song=${selectedSong}`);
  };

  const prev = () => {
    const newIndex = (activeIndex - 1 + SONGS.length) % SONGS.length;
    setActiveIndex(newIndex);
    setSelectedSong(SONGS[newIndex].id);
  };

  const next = () => {
    const newIndex = (activeIndex + 1) % SONGS.length;
    setActiveIndex(newIndex);
    setSelectedSong(SONGS[newIndex].id);
  };

  const visibleSongs = [
    SONGS[(activeIndex - 1 + SONGS.length) % SONGS.length],
    SONGS[activeIndex],
    SONGS[(activeIndex + 1) % SONGS.length],
  ];

  return (
    <>
      <style>{css}</style>

      {/* ── NAVBAR ── */}
      <nav className="home-nav">
        <div className="home-nav-logo">
          <button
            type="button"
            className="home-logo-link"
            onClick={() => navigate("/#hero")}
            aria-label="Go to PulseCoach home"
          >
            <span className="home-logo-pulse">Pulse</span>
            <span className="home-logo-coach">Coach</span>
          </button>
        </div>

        <div className="home-nav-links">
          <button
            type="button"
            className="home-dashboard-link"
            onClick={() => navigate("/#purpose")}
          >
            Why PulseCoach
          </button>

          <button
            type="button"
            className="home-dashboard-link home-dashboard-link--active"
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </button>

          <button
            type="button"
            className="home-dashboard-link"
            onClick={() => navigate("/#disclaimer")}
          >
            Disclaimer
          </button>
        </div>
      </nav>

      <div className="db-container">
        {/* ── SONG PANEL ── */}
        <section className="db-song-panel">
          <h2 className="db-heading">Select Song</h2>
          <div className="db-carousel-row">
            <button className="db-arrow" onClick={prev} aria-label="Previous">
              &#9664;
            </button>
            <div className="db-track">
              {visibleSongs.map((song, i) => (
                <div
                  key={song.id}
                  className={`db-card${i === 1 ? " db-card--active" : " db-card--ghost"}`}
                  onClick={() => i !== 1 && (i === 0 ? prev() : next())}
                >
                  <img src={song.cover} alt={song.title} />
                  <div className="db-card-meta">
                    <div className="db-card-title">{song.title}</div>
                    <div className="db-card-artist">{song.artist}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="db-arrow" onClick={next} aria-label="Next">
              &#9654;
            </button>
          </div>
        </section>

        {/* ── MODE PANEL ── */}
        <section className="db-mode-panel">
          <h2 className="db-heading">Select Mode</h2>

          <div className="db-toggle">
            <button
              className={`db-mode-btn${selectedMode === "train" ? " db-mode-btn--active" : ""}`}
              onClick={() => setSelectedMode("train")}
            >
              Train
            </button>
            <button
              className={`db-mode-btn${selectedMode === "test" ? " db-mode-btn--active" : ""}`}
              onClick={() => setSelectedMode("test")}
            >
              Test
            </button>
          </div>

          <div className="db-desc-grid">
            <div className={`db-desc-card${selectedMode === "train" ? " db-desc-card--active" : ""}`}>
              <h3><span>🎵</span> Train Mode</h3>
              <p>A fully guided learning environment designed to build your CPR rhythm with confidence.</p>
              <ul>
                <li>Choose any song or lock to the built-in metronome</li>
                <li>Ask the voice assistant questions at any time</li>
                <li>Step-by-step guided assistance throughout</li>
                <li>Instant corrective feedback on every compression</li>
              </ul>
            </div>
            <div className={`db-desc-card${selectedMode === "test" ? " db-desc-card--active" : ""}`}>
              <h3><span>🧪</span> Test Mode</h3>
              <p>Simulate a real-world scenario — no music, no questions, just you and the patient.</p>
              <ul>
                <li>No background music or metronome</li>
                <li>Questions to the assistant are disabled</li>
                <li>Curated tips surface automatically to guide you</li>
                <li>Mirrors a real CPR assessment environment</li>
              </ul>
            </div>
          </div>

          <div className="db-shared">
            <span className="db-shared-label">Both modes include</span>
            {["🎙 Voice Assistant", "⚡ Live Feedback", "📊 Real-Time Metrics"].map((f) => (
              <span key={f} className="db-badge">{f}</span>
            ))}
          </div>

          <button className="db-start-btn" onClick={startSession}>
            Start Session
          </button>
        </section>

        {/* ── PAST SESSIONS ── */}
        <section className="db-sessions">
          <h2 className="db-heading" style={{ textAlign: "left", marginBottom: "20px" }}>
            Past Sessions
          </h2>
          {loading ? (
            <p className="db-empty">Loading sessions...</p>
          ) : sessions.length === 0 ? (
            <p className="db-empty">No sessions yet. Start your first one!</p>
          ) : (
            <div className="sc-grid">
              {sessions.map((s) => (
                <SessionCard key={s.id} session={s} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   Styles
───────────────────────────────────────────────────────────── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

:root {
  --db-bg:          #0b0d12;
  --db-surface:     #13161e;
  --db-surface2:    #1c2030;
  --db-cyan:        #00e5ff;
  --db-cyan-dim:    rgba(0,229,255,0.15);
  --db-cyan-border: rgba(0,229,255,0.6);
  --db-cyan-glow:   0 0 32px rgba(0,229,255,0.45), 0 0 80px rgba(0,229,255,0.18);
  --db-text:        #ffffff;
  --db-muted:       rgba(255,255,255,0.5);
  --db-radius:      20px;
  --db-ease:        0.22s cubic-bezier(.4,0,.2,1);
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'DM Sans', sans-serif;
  background: var(--db-bg);
  color: var(--db-text);
  min-height: 100vh;
}

/* ── NAVBAR (same feel as Home) ── */
.home-nav {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 40px;
  background: rgba(0,0,0,0.85);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.home-nav-logo {
  font-family: 'Syne', sans-serif;
  font-size: 1.4rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.home-logo-link {
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  gap: 2px;
  align-items: center;
}

.home-logo-pulse { color: var(--db-cyan); }
.home-logo-coach { color: var(--db-text); }

.home-nav-links {
  display: flex;
  align-items: center;
  gap: 32px;
}

/* reuse the same button style for nav actions */
.home-dashboard-link {
  background: transparent;
  border: none;
  padding: 0;
  color: rgba(255,255,255,0.8);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: color var(--db-ease);
}
.home-dashboard-link:hover { color: var(--db-cyan); }
.home-dashboard-link--active { color: #fff; }

/* layout spacing under fixed navbar */
.db-container {
  min-height: 100vh;
  padding: 110px 40px 60px; /* ✅ added top padding for navbar */
  display: flex;
  flex-direction: column;
  gap: 36px;
}

.db-heading {
  font-family: 'Syne', sans-serif;
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--db-text);
  text-align: center;
}

/* ── Song Panel ── */
.db-song-panel {
  width: 100%;
  background: var(--db-surface);
  border-radius: var(--db-radius);
  padding: 36px 28px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  border: 1px solid rgba(255,255,255,0.04);
  box-shadow: 0 0 60px rgba(0,229,255,0.06);
}

.db-carousel-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.db-arrow {
  background: none;
  border: none;
  color: var(--db-text);
  font-size: 1.4rem;
  cursor: pointer;
  opacity: 0.6;
  padding: 10px;
  flex-shrink: 0;
  transition: opacity var(--db-ease), transform var(--db-ease);
}
.db-arrow:hover { opacity: 1; transform: scale(1.15); }

.db-track {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 22px;
  flex: 1;
}

.db-card {
  background: #0e1118;
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  flex-shrink: 0;
  width: 170px;
  border: 2px solid transparent;
  transition: transform var(--db-ease), box-shadow var(--db-ease), opacity var(--db-ease);
}
.db-card img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  display: block;
}
.db-card-meta { padding: 10px 12px 12px; }
.db-card-title {
  font-family: 'Syne', sans-serif;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--db-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.db-card-artist {
  font-size: 0.75rem;
  color: var(--db-muted);
  margin-top: 2px;
}
.db-card--ghost {
  opacity: 0.35;
  transform: scale(0.88);
}
.db-card--active {
  border-color: var(--db-cyan-border);
  box-shadow: var(--db-cyan-glow);
  transform: scale(1.08);
}
.db-card--ghost:hover { opacity: 0.55; }

/* ── Mode Panel ── */
.db-mode-panel {
  width: 100%;
  background: var(--db-surface);
  border-radius: var(--db-radius);
  padding: 36px 40px;
  border: 1px solid rgba(255,255,255,0.04);
  box-shadow: 0 0 60px rgba(0,229,255,0.05);
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.db-toggle {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.db-mode-btn {
  font-family: 'Syne', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 14px 48px;
  border-radius: 50px;
  border: 2px solid var(--db-cyan-border);
  cursor: pointer;
  background: transparent;
  color: var(--db-text);
  transition: background var(--db-ease), box-shadow var(--db-ease),
              transform var(--db-ease), color var(--db-ease);
}
.db-mode-btn:hover {
  background: var(--db-cyan-dim);
  transform: translateY(-2px);
}
.db-mode-btn--active {
  background: var(--db-cyan);
  color: #000;
  border-color: var(--db-cyan);
  box-shadow: var(--db-cyan-glow);
}

.db-desc-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.db-desc-card {
  background: var(--db-surface2);
  border-radius: 14px;
  padding: 24px 26px;
  border: 1px solid rgba(255,255,255,0.06);
  position: relative;
  overflow: hidden;
  transition: border-color var(--db-ease), box-shadow var(--db-ease);
}
.db-desc-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: var(--db-cyan);
  opacity: 0;
  transition: opacity var(--db-ease);
}
.db-desc-card--active {
  border-color: var(--db-cyan-border);
  box-shadow: 0 0 24px rgba(0,229,255,0.12);
}
.db-desc-card--active::before { opacity: 1; }

.db-desc-card h3 {
  font-family: 'Syne', sans-serif;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--db-cyan);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.db-desc-card p {
  font-size: 0.88rem;
  line-height: 1.65;
  color: rgba(255,255,255,0.72);
}
.db-desc-card ul {
  list-style: none;
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.db-desc-card ul li {
  font-size: 0.83rem;
  color: rgba(255,255,255,0.6);
  padding-left: 18px;
  position: relative;
}
.db-desc-card ul li::before {
  content: '▸';
  position: absolute;
  left: 0;
  color: var(--db-cyan);
  font-size: 0.75rem;
}

.db-shared {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}
.db-shared-label {
  font-size: 0.75rem;
  color: var(--db-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 500;
}
.db-badge {
  background: var(--db-cyan-dim);
  border: 1px solid var(--db-cyan-border);
  color: var(--db-cyan);
  border-radius: 50px;
  padding: 5px 14px;
  font-size: 0.78rem;
  font-weight: 500;
}

.db-start-btn {
  display: block;
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  padding: 18px;
  font-family: 'Syne', sans-serif;
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #000;
  background: var(--db-cyan);
  border: none;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: var(--db-cyan-glow);
  transition: transform var(--db-ease), filter var(--db-ease), box-shadow var(--db-ease);
}
.db-start-btn:hover {
  transform: translateY(-3px) scale(1.02);
  filter: brightness(1.12);
  box-shadow: 0 0 48px rgba(0,229,255,0.65), 0 0 100px rgba(0,229,255,0.25);
}
.db-start-btn:active { transform: scale(0.98); }

/* ── Past Sessions ── */
.db-sessions { width: 100%; }
.db-empty { color: var(--db-muted); font-size: 0.95rem; padding: 20px 0; }

.sc-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.sc-card {
  background: var(--db-surface);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: var(--db-radius);
  padding: 22px 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  transition: border-color var(--db-ease), box-shadow var(--db-ease);
  position: relative;
  overflow: hidden;
}
.sc-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: var(--db-cyan);
  opacity: 0.35;
}
.sc-card:hover {
  border-color: var(--db-cyan-border);
  box-shadow: 0 0 28px rgba(0,229,255,0.1);
}

.sc-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.sc-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.sc-mode-badge {
  font-family: 'Syne', sans-serif;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 4px 12px;
  border-radius: 50px;
  border: 1px solid var(--db-cyan-border);
  color: var(--db-cyan);
  background: var(--db-cyan-dim);
  white-space: nowrap;
}
.sc-mode-badge--test {
  border-color: rgba(124,92,255,0.6);
  color: #a78bfa;
  background: rgba(124,92,255,0.12);
}
.sc-song {
  font-size: 0.85rem;
  color: rgba(255,255,255,0.65);
  font-style: italic;
}
.sc-header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}
.sc-score {
  font-family: 'Syne', sans-serif;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--db-cyan);
  line-height: 1;
}
.sc-score-max {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--db-muted);
}
.sc-date {
  font-size: 0.75rem;
  color: var(--db-muted);
  white-space: nowrap;
}

.sc-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.sc-stat {
  background: var(--db-surface2);
  border-radius: 12px;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  border: 1px solid rgba(255,255,255,0.05);
}
.sc-stat-icon { font-size: 1rem; }
.sc-stat-value {
  font-family: 'Syne', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  color: var(--db-cyan);
}
.sc-stat-label {
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--db-muted);
  text-align: center;
}

.sc-bar-wrap { display: flex; flex-direction: column; gap: 6px; }
.sc-bar-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: rgba(255,255,255,0.55);
}
.sc-bar-pct {
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  color: var(--db-cyan);
}
.sc-bar-track {
  width: 100%;
  height: 5px;
  background: rgba(255,255,255,0.08);
  border-radius: 99px;
  overflow: hidden;
}
.sc-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--db-cyan), rgba(0,229,255,0.5));
  border-radius: 99px;
  transition: width 0.6s cubic-bezier(.4,0,.2,1);
}

@media (max-width: 768px) {
  .home-nav { padding: 16px 20px; }
  .home-nav-links { gap: 18px; }

  .db-container { padding: 96px 16px 48px; }
  .db-desc-grid { grid-template-columns: 1fr; }
  .db-toggle { flex-direction: column; align-items: center; }
  .sc-grid { grid-template-columns: 1fr; }
}
`;