// llmCoach.js - DIRECT GEMINI API with AXIOS (100% working)
const axios = require('axios');

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

// Base CPR Instructor personality
const SYSTEM_PROMPT = `
You are a certified CPR instructor.
You provide clear, concise, real-time CPR coaching.

Rules:
- Be direct, but kind since you are a teacher.
- Keep responses/guidance under 1-2 sentences for live feedback.
- For summaries, provide structured feedback.
- Do NOT explain CPR theory unless asked.
- Focus on compressions quality (rate, depth, elbows, fatigue).
`;

// Helper function to call Gemini API
async function callGemini(prompt) {
  const response = await axios.post(GEMINI_URL, {
    contents: [{
      parts: [{ text: prompt }]
    }]
  });
  
  return response.data.candidates[0].content.parts[0].text;
}

// This generates live feedback generation
async function generateLiveFeedback(context) {
  const { issue, metrics, mode } = context;

  const userPrompt = `
${SYSTEM_PROMPT}

Mode: ${mode}
Issue detected: ${issue}
Current metrics:
- BPM: ${metrics.bpm}
- Depth: ${metrics.relativeDepth}
- Elbows locked: ${metrics.elbowsLocked}

Provide short corrective coaching.
`;

  const text = await callGemini(userPrompt);
  return text;
}

// This is the summary generation
async function generateSummary(summaryData) {
  const userPrompt = `
${SYSTEM_PROMPT}

You are reviewing a CPR training session.

Session Stats:
- Duration: ${summaryData.duration || 0} seconds
- Total compressions: ${summaryData.compressionCount || 0}
- Average rate (BPM): ${summaryData.avgBPM || 0}
- Average depth: ${summaryData.avgDepth || 0}
- Elbows locked percentage: ${summaryData.elbowLockedPercent || 0}%
- Fatigue detected: ${summaryData.fatigueDetected || 'No'}

Provide:
1. Overall performance assessment
2. Two strengths
3. Two areas to improve

Keep it concise, structured, and professional.
`;

  const text = await callGemini(userPrompt);
  return {
    type: "summary",
    text,
  };
}

async function answerQuestion(question) {
  const userPrompt = `
${SYSTEM_PROMPT}

Learner question:
"${question}"

Answer briefly, in 1–3 sentences, focused on CPR compressions and technique.
`;

  const text = await callGemini(userPrompt);
  return {
    type: "voiceReply",
    text,
  };
}

module.exports = {
  generateLiveFeedback,
  generateSummary,
  answerQuestion,
};
