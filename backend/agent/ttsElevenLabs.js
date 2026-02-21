// ElevenLabs TTS for CPR coach
const axios = require('axios');

const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = "CwhRBWXzGAHq8TQ4Fs17"; // Roger 
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID || "eleven_flash_v2_5";

function getTtsRuntimeConfig() {
  return {
    provider: "elevenlabs",
    modelId: MODEL_ID,
    voiceId: VOICE_ID,
    hasApiKey: Boolean(API_KEY),
  };
}


async function textToSpeech(text) {
  if (!API_KEY) {
    throw new Error("ELEVENLABS_API_KEY is missing");
  }

  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        text: text,
        model_id: MODEL_ID,
        voice_settings: {
          stability: 0.7,
          similarity_boost: 0.8,
          style: 0.2
        }
      },
      {
        headers: {
          'xi-api-key': API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        responseType: 'arraybuffer',
        timeout: 15000
      }
    );

    return Buffer.from(response.data).toString('base64');
  } catch (err) {
    if (err.response) {
      const body = Buffer.isBuffer(err.response.data)
        ? err.response.data.toString('utf8')
        : JSON.stringify(err.response.data);
      throw new Error(`ElevenLabs ${err.response.status}: ${body}`);
    }

    throw err;
  }
}

module.exports = { textToSpeech, getTtsRuntimeConfig };
