//require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");

const { Server } = require("socket.io");
const { AgentManager } = require("./agent/agentManager");

const app = express();
app.use(cors());
app.use(express.json());

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

server.listen(8080, () => {
  console.log("Server running on port 8080");
});