// Stores the client's socket so it can send messages bacj to the frontend :D!!
//const axios = require("axios"); 
const { textToSpeech } = require('./ttsElevenLabs');
const { evaluateTriggers } = require("./triggerEngine");
//const { Session } = require("../models/Session"); // Ensure the Session model is imported
const { computeSummary } = require("./summaryEngine");
const {
  generateLiveFeedback,
  generateSummary,
  answerQuestion,
} = require("./llmWrapper");

class AgentManager {
  constructor(socket) {
    this.socket = socket;
    this.resetSession();
  }

  resetSession() {
    this.session = {
      active: false,
      mode: null,
      metrics: [],
      startTime: null,
    };

    this.coachingState = {
      lastIssue: null,
      lastFeedbackTime: 0,
      cooldownMs: 8000, // 8 seconds
      llmBusy: false,   // prevents overlapping LLM calls
      voiceCooldownUntil: 0
    };
  }

  // The code for starting a session goes under here
  // Basicallt marks session as either active or inavtive, stores mode, and resets metrics
  startSession(mode) {
    console.log("Session started:", mode);

    this.session.active = true;
    this.session.mode = mode;
    this.session.metrics = [];
    this.session.startTime = Date.now();

    this.coachingState.lastIssue = null;
    this.coachingState.lastFeedbackTime = 0;
  }

  // This handles the metrics at every frame
  async handleMetrics(data) {
    if (!this.session.active) return;

    const { metrics, ready } = data;
    if (!metrics) return;

    this.session.metrics.push(metrics);

    if (!ready) return;

    const result = evaluateTriggers(
      metrics,
      this.session.mode,
      this.session.metrics
    );

    if (!result) return;

    const now = Date.now();

    const issueChanged =
      result.issue !== this.coachingState.lastIssue;

    const cooldownPassed =
      now - this.coachingState.lastFeedbackTime >
      this.coachingState.cooldownMs;

    if (!issueChanged || !cooldownPassed) return;
    if (this.coachingState.llmBusy) return;

    try{ //if doesnt work then comment this out again
      this.coachingState.llmBusy = true;
      const dynamicText = await generateLiveFeedback({
        issue: result.issue,
        metrics,
        mode: this.session.mode,
      });

      this.socket.emit("ai_response", {
        type: "feedback",
        text: dynamicText,
        highlightColor: result.payload.highlightColor,
        duckMusic: true,
      });

      this.coachingState.lastIssue = result.issue;
      this.coachingState.lastFeedbackTime = now;
    } catch (err) {
      console.error("LLM feedback error:", err);

      // Fallback to deterministic message if LLM fails
      this.socket.emit("ai_response", result.payload);
    } finally {
      this.coachingState.llmBusy = false;
    } // it would end here if we were to comment it again
  
    //before llm (disabled for now)
    // this.socket.emit("ai_response", result.payload);
    // this.coachingState.lastIssue = result.issue;
    // this.coachingState.lastFeedbackTime = now;
    
  }

  async handleVoiceCommand(text) {
    console.log("Voice command received:", text);
    console.log("GEMINI KEY LOADED?", !!process.env.GEMINI_API_KEY);

    let response;
    try {
      response = await answerQuestion(text);
      console.log("GEMINI RESPONSE:", response.text);
      this.socket.emit("ai_response", response);
    } catch (err) {
      console.error("LLM error:", err.message);
      this.socket.emit("ai_response", {
        type: "voiceReply",
        text: "I'm having trouble answering that right now. Keep compressions going.",
      });
      return;
    }

    try {
      const audioBase64 = await textToSpeech(response.text);
      this.socket.emit("voiceResponse", { audio: audioBase64 });
    } catch (err) {
      console.error("TTS error:", err.message);
    }
  }
  
  async endSession() {
    if (!this.session.active) return;
    try { // Uncommented after applying gemini
      const summary = await computeSummary(this.session);  // DB save happens in here
      this.socket.emit("summary", summary);
      
      // LLM converts into instructor-style feedback
      //const formatted = await generateSummary(rawSummary);
      //this.socket.emit("ai_response", formatted);

    } catch (err) {
      console.error("LLM summary error:", err);
    } finally{
      this.resetSession();
    }
  }
}

module.exports = { AgentManager };