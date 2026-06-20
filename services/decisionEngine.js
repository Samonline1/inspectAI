function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function matches(a, b) {
  if (!a || !b) return false;
  return normalizeText(a) === normalizeText(b);
}

function scoreImage(claim, image) {
  const objectMatch = matches(claim.object, image.object) ? 40 : 0;
  const damageMatch = matches(claim.damage, image.damage) ? 30 : 0;
  const partMatch = matches(claim.part, image.part) ? 20 : 0;
  const imageQuality = image.blurry || image.quality === 'poor' ? 0 : 10;
  return objectMatch + damageMatch + partMatch + imageQuality;
}

function buildRiskFlags(history) {
  const flags = [];
  if (!history || Array.isArray(history)) return flags;
  const previousClaims = Number(history?.previous_claims || history?.total_claims || 0);
  const rejectedClaims = Number(history?.rejected_claims || history?.total_rejected || 0);
  if (previousClaims >= 20 && rejectedClaims / Math.max(previousClaims, 1) >= 0.5) {
    flags.push('high_history_risk');
  } else if (previousClaims >= 10 && rejectedClaims / Math.max(previousClaims, 1) >= 0.3) {
    flags.push('elevated_history_risk');
  }
  return flags;
}

function decide(claim, imageResults, history = {}) {
  const validImages = imageResults.filter((img) => !img.error);
  const bestImage = validImages.reduce((best, img) => {
    const score = scoreImage(claim, img);
    if (!best || score > best.score) return { image: img, score };
    return best;
  }, null);

  const score = bestImage ? bestImage.score : 0;
  let decision = 'contradicted';
  if (score >= 80) decision = 'supported';
  else if (score >= 50) decision = 'insufficient';

  const riskFlags = buildRiskFlags(history);
  const supportingImages = bestImage && score >= 50 ? [bestImage.image.image] : [];
  const contradiction = validImages.length > 0 && validImages.every((img) => scoreImage(claim, img) < 50);

  if (decision === 'supported' && riskFlags.length && contradiction) {
    decision = 'insufficient';
  }

  return {
    decision,
    score,
    damage_type: claim.damage || '',
    part: claim.part || '',
    severity: bestImage?.image?.severity || claim.severity || 'unknown',
    supporting_images: supportingImages,
    risk_flags: riskFlags,
    justification: buildJustification(claim, bestImage?.image, score)
  };
}

function buildJustification(claim, image, score) {
  if (!image) return 'No usable image evidence was available.';
  if (score >= 80) {
      return `Visible ${image.damage || 'damage'} on ${image.object || 'the object'} ${image.part ? `at the ${image.part}` : ''} matches the claim.`;
  }
  if (score >= 50) {
    return `Some evidence aligns with the claim, but the match is incomplete or lower confidence.`;
  }
  return `The available image evidence does not match the claim.`;
}

module.exports = { decide };
