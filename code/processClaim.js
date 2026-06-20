const path = require('path');
const { extractClaim } = require('../services/claimExtractor');
const { analyzeImage } = require('../services/imageAnalyzer');
const { decide } = require('../services/decisionEngine');

async function processClaim(data = {}) {
  if (data.decision === 'test') {
    return { decision: 'test' };
  }

  const conversation = String(data.conversation || data.claim || data.text || '').trim();
  const imagePath = data.imagePath ? path.resolve(data.imagePath) : '';
  const history = data.history || {};

  const claimData = conversation ? await extractClaim(conversation) : {
    object: null,
    damage: null,
    part: null,
    severity: 'unknown',
    confidence: 0
  };

  const imageResults = [];
  if (imagePath) {
    imageResults.push(await analyzeImage(imagePath));
  }

  return decide(claimData, imageResults, history);
}

module.exports = processClaim;
