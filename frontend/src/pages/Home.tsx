import { useNavigate } from "react-router-dom";
import Waveform from "../components/Waveform";

export default function Home() {
  const navigate = useNavigate();

  // Adjust this if your navbar height changes
  const NAV_OFFSET = 92;

  const scrollWithOffset = (selectorOrId) => {
    const el =
      selectorOrId.startsWith("#")
        ? document.querySelector(selectorOrId)
        : document.getElementById(selectorOrId);

    if (!el) return;

    const y = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  const goDashboardTop = () => {
    navigate("/dashboard");
    // Ensure scroll-to-top AFTER route change paints
    requestAnimationFrame(() => {
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
    });
  };

  return (
    <>
      <style>{css}</style>
      <div className="home-root">

        {/* ── NAVBAR ── */}
        <nav className="home-nav">
          <div className="home-nav-logo">
            <button
              type="button"
              className="home-logo-link"
              onClick={() => scrollWithOffset("#hero")}
              aria-label="Go to top"
            >
              <span className="home-logo-pulse">Pulse</span>
              <span className="home-logo-coach">Coach</span>
            </button>
          </div>

          <div className="home-nav-links">
            <button
              type="button"
              className="home-dashboard-link"
              onClick={() => scrollWithOffset("#purpose-title")}
            >
              Why PulseCoach
            </button>

            <button
              type="button"
              className="home-dashboard-link"
              onClick={goDashboardTop}
            >
              Dashboard
            </button>

            <button
              type="button"
              className="home-dashboard-link"
              onClick={() => scrollWithOffset("/#disclaimer")}
            >
              Disclaimer
            </button>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="home-hero" id="hero">
          <div className="home-hero-grid" aria-hidden="true" />
          <div className="home-hero-orb" aria-hidden="true" />

          <div className="home-hero-content">
            <div className="home-eyebrow">AI-Powered CPR Training</div>

            <h1 className="home-hero-title">
              Practice CPR with{" "}
              <span className="home-hero-accent">real-time feedback</span>
              {"… "}
              <span className="home-hero-dim">before a real emergency.</span>
            </h1>

            <p className="home-hero-sub">
              PulseCoach helps everyday people build confidence and muscle memory
              using AI-powered guidance, right from their webcam.
            </p>

            <div className="home-waveform-wrap">
              <Waveform />
            </div>

            <button className="home-try-btn" onClick={goDashboardTop}>
              Try it Out
            </button>
          </div>

          <div className="home-stat-row">
            {[
              { value: "100–120", label: "Target BPM" },
              { value: "5 cm",    label: "Compression Depth" },
              { value: "Live",    label: "Real-Time Feedback" },
            ].map((s) => (
              <div key={s.label} className="home-stat-chip">
                <span className="home-stat-value">{s.value}</span>
                <span className="home-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── PURPOSE ── */}
        <section className="home-section" id="purpose">
          <div className="home-section-inner">
            {/* ✅ give the title its own ID so we scroll to the exact right spot */}
            <h2 className="home-section-title" id="purpose-title">
              Why PulseCoach Exists
            </h2>

            <div className="home-purpose-grid">
              {[
                { n: "01", text: "Many people never receive CPR training, and even fewer get to practice it" },
                { n: "02", text: "PulseCoach makes CPR practice accessible and repeatable — anytime, anywhere" },
                { n: "03", text: "CPR skills fade without regular practice. Muscle memory requires repetition" },
                { n: "04", text: "Many people want to help in an emergency, but don't feel confident enough to act" },
              ].map((item) => (
                <div key={item.n} className="home-purpose-card">
                  <span className="home-purpose-num">{item.n}</span>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── DISCLAIMER ── */}
        <footer className="home-footer" id="disclaimer">
          <div className="home-footer-logo">
            <span className="home-logo-pulse">Pulse</span>
            <span className="home-logo-coach">Coach</span>
          </div>
          <p className="home-disclaimer">
            PulseCoach is a training and practice tool intended to support CPR
            learning and confidence-building. It does not provide medical diagnosis
            or replace in-person instruction or professional certification. In an
            emergency, always follow local emergency guidelines and contact
            emergency services.
          </p>
          <p className="home-disclaimer-small">Training tool, not a medical device.</p>
        </footer>

      </div>
    </>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

:root {
  --db-bg:          #000000;
  --db-surface:     #0e1018;
  --db-surface2:    #151823;
  --db-cyan:        #00e5ff;
  --db-cyan-dim:    rgba(0,229,255,0.15);
  --db-cyan-border: rgba(0,229,255,0.6);
  --db-cyan-glow:   0 0 32px rgba(0,229,255,0.45), 0 0 80px rgba(0,229,255,0.18);
  --db-text:        #ffffff;
  --db-muted:       rgba(255,255,255,0.55);
  --db-radius:      20px;
  --db-ease:        0.22s cubic-bezier(.4,0,.2,1);
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'DM Sans', sans-serif;
  background: var(--db-bg);
  color: var(--db-text);
}

.home-root { min-height: 100vh; overflow-x: hidden; }

/* ── Navbar ── */
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
.home-logo-pulse { color: var(--db-cyan); }
.home-logo-coach { color: var(--db-text); }

.home-nav-links {
  display: flex;
  align-items: center;
  gap: 32px;
}
.home-nav-links a {
  color: rgba(255,255,255,0.7);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: color var(--db-ease);
}
.home-nav-links a:hover { color: #fff; }

/* ✅ clickable logo as button */
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

/* ✅ nav buttons */
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

/* ── Hero ── */
.home-hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 140px 40px 80px;
  text-align: center;
  overflow: hidden;
  background: #000;
}
.home-hero-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(0,229,255,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,229,255,0.04) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 100%);
  pointer-events: none;
}
.home-hero-orb {
  position: absolute;
  top: 10%; left: 50%;
  transform: translateX(-50%);
  width: 600px; height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0,229,255,0.08) 0%, transparent 70%);
  pointer-events: none;
}
.home-hero-content {
  position: relative;
  max-width: 860px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}
.home-eyebrow {
  display: inline-block;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--db-cyan);
  background: var(--db-cyan-dim);
  border: 1px solid var(--db-cyan-border);
  padding: 6px 18px;
  border-radius: 50px;
}

/* ✅ smaller hero title */
.home-hero-title {
  font-family: 'Syne', sans-serif;
  font-size: clamp(2rem, 4.5vw, 3.2rem);
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.01em;
  color: #fff;
}
.home-hero-accent {
  color: var(--db-cyan);
  text-shadow: 0 0 20px rgba(0,229,255,0.4);
}
.home-hero-dim {
  color: rgba(255,255,255,0.55);
  font-style: italic;
}

.home-hero-sub {
  max-width: 520px;
  font-size: 1.05rem;
  line-height: 1.7;
  color: rgba(255,255,255,0.75);
}

.home-waveform-wrap {
  width: 100%;
  max-width: 560px;
}

/* ── Big blue Try it Out button ── */
.home-try-btn {
  margin-top: 8px;
  padding: 20px 64px;
  font-family: 'Syne', sans-serif;
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #fff;
  background: --db-cyan;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: 0 0 32px rgba(0,229,255,0.4), 0 0 80px rgba(0,102,255,0.2);
  transition: transform var(--db-ease), filter var(--db-ease), box-shadow var(--db-ease);
}
.home-try-btn:hover {
  transform: translateY(-3px) scale(1.03);
  filter: brightness(1.15);
  box-shadow: 0 0 48px rgba(0,102,255,0.75), 0 0 100px rgba(0,102,255,0.3);
}
.home-try-btn:active { transform: scale(0.98); }

/* stat chips */
.home-stat-row {
  position: relative;
  display: flex;
  gap: 16px;
  margin-top: 52px;
  flex-wrap: wrap;
  justify-content: center;
}
.home-stat-chip {
  background: var(--db-surface);
  border: 1px solid rgba(0,229,255,0.25);
  border-radius: 14px;
  padding: 16px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  min-width: 140px;
}
.home-stat-value {
  font-family: 'Syne', sans-serif;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--db-cyan);
}
.home-stat-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255,255,255,0.65);
}

/* ── PURPOSE section ── */
.home-section {
  padding: 100px 40px;
  background: #000;
}
.home-section-inner {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 48px;
  text-align: center;
}

/* ✅ smaller section title */
.home-section-title {
  font-family: 'Syne', sans-serif;
  font-size: clamp(1.6rem, 3.5vw, 2.4rem);
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: #fff;
}

/* 2×2 square-ish grid */
.home-purpose-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  width: 100%;
  text-align: left;
}
.home-purpose-card {
  background: var(--db-surface2);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: var(--db-radius);
  min-height: 180px;
  padding: 28px 28px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: relative;
  overflow: hidden;
  transition: border-color var(--db-ease), box-shadow var(--db-ease);
}
.home-purpose-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: var(--db-cyan);
  opacity: 0;
  transition: opacity var(--db-ease);
}
.home-purpose-card:hover {
  border-color: var(--db-cyan-border);
  box-shadow: 0 0 28px rgba(0,229,255,0.1);
}
.home-purpose-card:hover::before { opacity: 1; }

.home-purpose-num {
  font-family: 'Syne', sans-serif;
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--db-cyan);
  line-height: 1;
}
.home-purpose-card p {
  font-size: 0.95rem;
  line-height: 1.65;
  color: #ffffff;
  font-weight: 400;
}

/* ── Footer / Disclaimer ── */
.home-footer {
  padding: 56px 40px;
  background: #000;
  border-top: 1px solid rgba(255,255,255,0.07);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}
.home-footer-logo {
  font-family: 'Syne', sans-serif;
  font-size: 1.2rem;
  font-weight: 800;
}
.home-disclaimer {
  max-width: 600px;
  font-size: 0.83rem;
  line-height: 1.75;
  color: rgba(255,255,255,0.45);
}
.home-disclaimer-small {
  font-size: 0.73rem;
  color: rgba(255,255,255,0.22);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .home-nav { padding: 16px 20px; }
  .home-nav-links { gap: 18px; }
  .home-hero { padding: 120px 20px 60px; }
  .home-section { padding: 70px 20px; }
  .home-purpose-grid { grid-template-columns: 1fr; }
  .home-footer { padding: 40px 20px; }
}
`;