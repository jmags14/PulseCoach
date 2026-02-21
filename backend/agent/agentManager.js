const { evaluateTriggers } = require("./triggerEngine");
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
      cooldownMs: 5000, // 5 seconds
      llmBusy: false,   // prevents overlapping LLM calls
    };
  }

  startSession(mode) {
    console.log("Session started:", mode);

    this.session.active = true;
    this.session.mode = mode;
    this.session.metrics = [];
    this.session.startTime = Date.now();

    this.coachingState.lastIssue = null;
    this.coachingState.lastFeedbackTime = 0;
  }

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

    if (!issueChanged && !cooldownPassed) return;
    if (this.coachingState.llmBusy) return;

    /*try{
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
    }*/
  
    //before llm
    this.socket.emit("ai_response", result.payload);
    this.coachingState.lastIssue = result.issue;
    this.coachingState.lastFeedbackTime = now;
    
  }

  handleVoiceCommand(text) {
    console.log("Voice command received:", text);

    /*try {
      const response = await answerQuestion(text);
      this.socket.emit("ai_response", response);
    } catch (err) {
      console.error("LLM voice error:", err);

      this.socket.emit("ai_response", {
        type: "voiceReply",
        text: "I'm having trouble answering that right now. Keep compressions going.",
      });
    }*/
    
    // For now, fake LLM response — can replace with real LLM later    
    const aiResponse = `I received your question: "${text}"`;
    const response = {
        type: "voiceReply",
        text: aiResponse,
    };
    this.socket.emit("ai_response", response);
  }
  
  endSession() {
    if (!this.session.active) return;
    /*try {
      // Step 1: Deterministic summary
      const rawSummary = computeSummary(this.session);

      // Step 2: LLM converts into instructor-style feedback
      const formatted = await generateSummary(rawSummary);

      this.socket.emit("ai_response", formatted);

    } catch (err) {
      console.error("LLM summary error:", err);

      // Fallback to raw deterministic summary
      this.socket.emit("ai_response", {
        type: "summary",
        text: "Session complete. Review your compression consistency and technique.",
      });
    }

    this.resetSession();*/
    const summary = computeSummary(this.session);
    this.socket.emit("ai_response", summary);
    this.resetSession();
  }
}

module.exports = { AgentManager };