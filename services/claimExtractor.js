const { callAI } = require('./aiClient');
const { claimExtractionPrompt } = require('../prompts/prompts');

async function extractClaim(claimText) {
  const result = await callAI({
    prompt: `${claimExtractionPrompt}\nClaim text:\n${claimText}`
  });
  return normalize(result);
}

function normalize(value) {
  return {
    object: value?.object ?? null,
    damage: value?.damage ?? null,
    part: value?.part ?? null,
    severity: value?.severity ?? 'unknown',
    confidence: clampNumber(value?.confidence, 0, 1, 0.5)
  };
}

function clampNumber(value, min, max, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, num));
}

module.exports = { extractClaim };
