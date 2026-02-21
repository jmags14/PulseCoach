const agentManager = require("./agent/agentManager");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("Client connected");

    socket.on("metrics", (data) => {
      agentManager.handleMetrics(socket, data);
    });

    socket.on("startSession", (mode) => {
      agentManager.startSession(socket, mode);
    });

    socket.on("stopSession", () => {
      agentManager.stopSession(socket);
    });
  });
};