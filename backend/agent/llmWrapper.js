// llmCoach.js
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
`;    //disregarding depth 

async function generateLiveFeedback(context) {
  const { issue, metrics, mode } = context;

  const userPrompt = `
Mode: ${mode}
Issue detected: ${issue}
Current metrics:
- BPM: ${metrics.bpm}
- Depth: ${metrics.relativeDepth}
- Elbows locked: ${metrics.elbowsLocked}

Provide short corrective coaching.
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.6,
  });

  return completion.choices[0].message.content;
}

async function generateSummary(summaryData) {
  /*
    Expected summaryData example:
    {
      durationSec,
      avgBpm,
      avgDepth,
      elbowsLockedPercent,
      fatigueDetected,
      totalCompressions
    }
  */

  const userPrompt = `
You are reviewing a CPR training session.

Session Stats:
- Duration: ${summaryData.durationSec} seconds
- Total compressions: ${summaryData.totalCompressions}
- Average rate (BPM): ${summaryData.avgBpm}
- Average depth: ${summaryData.avgDepth}
- Elbows locked percentage: ${summaryData.elbowsLockedPercent}%
- Fatigue detected: ${summaryData.fatigueDetected}

Provide:
1. Overall performance assessment
2. Two strengths
3. Two areas to improve

Keep it concise, structured, and professional.
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
  });

  return {
    type: "summary",
    text: completion.choices[0].message.content,
  };
}


async function answerQuestion(question) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: question },
    ],
    temperature: 0.7,
  });

  return {
    type: "voiceReply",
    text: completion.choices[0].message.content,
  };
}

module.exports = {
  generateLiveFeedback,
  generateSummary,
  answerQuestion,
};
