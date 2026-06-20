const fs = require('fs');
const path = require('path');
const { callAI } = require('./aiClient');
const { imageAnalysisPrompt } = require('../prompts/prompts');

function isSupportedImage(filePath) {
  return ['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(filePath).toLowerCase());
}

async function analyzeImage(imagePath) {
  if (!fs.existsSync(imagePath)) {
    return {
      image: path.basename(imagePath),
      object: null,
      damage: null,
      part: null,
      severity: 'unknown',
      confidence: 0,
      quality: 'poor',
      unsupported: false,
      blurry: true,
      error: 'missing_image'
    };
  }
  if (!isSupportedImage(imagePath)) {
    return {
      image: path.basename(imagePath),
      object: null,
      damage: null,
      part: null,
      severity: 'unknown',
      confidence: 0,
      quality: 'poor',
      unsupported: true,
      blurry: false,
      error: 'unsupported_format'
    };
  }

  if (String(process.env.AI_PROVIDER || 'groq').trim().toLowerCase() === 'groq') {
    return {
      image: path.basename(imagePath),
      object: null,
      damage: null,
      part: null,
      severity: 'unknown',
      confidence: 0,
      quality: 'poor',
      unsupported: true,
      blurry: true,
      error: 'groq_text_only'
    };
  }

  const result = await callAI({
    prompt: imageAnalysisPrompt,
    imagePath
  });
  return {
    image: path.basename(imagePath),
    object: result?.object ?? null,
    damage: result?.damage ?? null,
    part: result?.part ?? null,
    severity: result?.severity ?? 'unknown',
    confidence: clampNumber(result?.confidence, 0, 1, 0.5),
    quality: result?.quality ?? 'fair',
    unsupported: Boolean(result?.unsupported),
    blurry: Boolean(result?.blurry)
  };
}

function clampNumber(value, min, max, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, num));
}

module.exports = { analyzeImage };
