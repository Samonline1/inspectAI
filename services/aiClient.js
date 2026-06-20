const fs = require('fs');

function getProvider() {
  return String(process.env.AI_PROVIDER || 'groq').trim().toLowerCase();
}

function extractJson(text) {
  if (!text) return null;
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function toDataUrl(imagePath) {
  const mimeType = imagePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
  const data = fs.readFileSync(imagePath).toString('base64');
  return `data:${mimeType};base64,${data}`;
}

async function callAI({ prompt, imagePath }) {
  const provider = getProvider();

  if (provider === 'groq') {
    return callGroq({ prompt, imagePath });
  }
  throw new Error(`Unsupported AI_PROVIDER "${provider}". Set AI_PROVIDER=groq.`);
}

async function callGroq({ prompt, imagePath }) {
  const apiKey = process.env.GROQ_API_KEY || '';
  if (!apiKey) throw new Error('Missing GROQ_API_KEY in .env');

  if (imagePath) {
    throw new Error('Groq mode currently supports text-only requests.');
  }

  let Groq;
  try {
    ({ Groq } = require('groq-sdk'));
  } catch {
    throw new Error('Missing dependency "groq-sdk". Run: npm install groq-sdk');
  }

  const model = process.env.GROQ_MODEL || 'meta-llama/llama-4-scout';
  const client = new Groq({ apiKey });
  const response = await client.chat.completions.create({
    model,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }]
  });
  const text = response?.choices?.[0]?.message?.content || '';
  const json = extractJson(text);
  if (!json) {
    throw new Error(`Groq returned non-JSON output from model ${model}: ${text.slice(0, 200)}`);
  }
  return json;
}

module.exports = { callAI };
