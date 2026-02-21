require("dotenv").config(); 
const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const cors = require("cors");
const sessionRoutes = require("./routes/Sessions");
const { Server } = require("socket.io");
const { AgentManager } = require("./agent/agentManager");
const { getTtsRuntimeConfig } = require("./agent/ttsElevenLabs");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/sessions", sessionRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  const agent = new AgentManager(socket);

  socket.on("startSession", (data) => {
    agent.startSession(data.mode);
  });

  socket.on("metrics", (data) => {
    agent.handleMetrics(data);
  });

  socket.on("stopSession", () => {
    agent.endSession();
  });

  socket.on("voiceCommand", (data) => {
    agent.handleVoiceCommand(data.text);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    agent.resetSession();
  });
});

// Connect to MongoDB THEN start the single server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");

    server.listen(8080, () => {
      console.log("Server running on port 8080");

      const ttsConfig = getTtsRuntimeConfig();
      console.log(
        "TTS config:",
        `provider=${ttsConfig.provider} model=${ttsConfig.modelId} voice=${ttsConfig.voiceId} keyLoaded=${ttsConfig.hasApiKey}`
      );
    });
  })
  .catch((err) => console.error("MongoDB connection error:", err));