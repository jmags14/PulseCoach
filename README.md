# Pulse Coach


PulseCoach is a real-time CPR training application that uses computer vision to analyze your compression technique and coach you through a session with live audio feedback. Built at Hacklytics 2026.

--- :)

## What It Does

Most people who learn CPR forget the technique within months because practice is infrequent and feedback is rare. PulseCoach puts a certified AI coach in your browser. You position yourself in front of your webcam, start a session, and the system watches your body in real time, tracking your compression rate, elbow lock consistency, and relative depth, then speaks corrections to you as you go.

When the session ends, you get a full breakdown of your performance: average BPM, compression count, elbow lock percentage, duration, and an overall score, all saved to your profile for tracking over time.

---

## How It Works

The CV pipeline runs entirely in the browser using MediaPipe Pose Landmarker. Each video frame is analyzed to extract upper body landmarks (shoulders, elbows, and wrists). From those landmarks, a custom CPREngine computes three things in real time:

**Compression rate (BPM):** The engine tracks the vertical position of the shoulder midpoint across frames. When it detects a full down-then-up cycle with sufficient depth, it registers a compression and timestamps it. BPM is calculated from the rolling average interval between the last 10 seconds of compressions.

**Relative depth:** Raw vertical displacement is normalized against shoulder width so the measurement is consistent regardless of how far the user sits from the camera.

**Elbow lock:** The angle at each elbow joint is computed using dot product geometry across the shoulder, elbow, and wrist landmarks. Both arms must exceed 160 degrees to be considered locked.

Pose data is sent over a WebSocket connection to a Node.js backend on every frame. The backend runs an AgentManager that evaluates the incoming metrics against a trigger engine, decides whether feedback is warranted based on issue type and a 5-second cooldown, and calls Gemini 2.5 Flash to generate a short corrective coaching message. That message is passed to ElevenLabs to generate voice audio, which is streamed back to the frontend and played in real time.

At the end of a session, the backend computes a summary by averaging all the frame metrics, scoring performance, and saving the result to MongoDB, then emits it back to the frontend where it renders as a results card matching the dashboard style.

---

## Modes

**Train mode** lets you choose a background song to compress to (Stayin' Alive, Crazy in Love, Espresso, and others at the right BPM range), asks the voice assistant questions mid-session, and receives step-by-step corrective feedback throughout.

**Test mode** simulates a real assessment environment. No music, no questions, just automatic tips that surface when the system detects an issue. It mirrors what a formal CPR evaluation would feel like.

---

## Tech Stack

**Frontend:** React 19, TypeScript, Vite, Socket.IO client, MediaPipe Tasks Vision

**Backend:** Node.js, Express, Socket.IO, Mongoose, MongoDB

**AI:** Gemini 2.5 Flash (live feedback and session summaries), ElevenLabs (text-to-speech voice coaching)

**CV:** MediaPipe Pose Landmarker Lite running in VIDEO mode entirely client-side

---

## Running Locally

Clone the repo, then in one terminal:

```
cd backend
npm install
cp .env.example .env   # add your GEMINI_API_KEY, ELEVENLABS_API_KEY, MONGODB_URI
node index.js
```

In another terminal:

```
cd frontend
npm install
npm run dev
```

Open your browser to the Vite dev server (default http://localhost:5173), allow camera access, and start a session.

---

## Project Structure

```
PulseCoach/
  frontend/
    src/
      components/       UI components including PoseCamera and MetricCard
      logic/            CPREngine, useWebSocket hook, AudioManager
      pages/            Dashboard, Session, Results
      styles/           CSS per page
  backend/
    agent/
      agentManager.js   Session lifecycle, metrics handling, WebSocket events
      triggerEngine.js  Rule-based issue detection (rate, elbow, fatigue)
      summaryEngine.js  Session scoring and MongoDB persistence
      llmWrapper.js     Gemini API calls for feedback and summaries
      ttsElevenLabs.js  ElevenLabs voice synthesis
    models/
      Session.js        Mongoose schema for saved sessions
    index.js            Express and Socket.IO server entry point
```

---

## Environment Variables

```
GEMINI_API_KEY=
ELEVENLABS_API_KEY=
MONGODB_URI=
```