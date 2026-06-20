const fs = require('fs');
const path = require('path');
const { loadClaims } = require('./data/claimsLoader');
const { loadHistory } = require('./data/historyLoader');
const { loadEvidenceRequirements } = require('./data/evidenceLoader');
const { extractClaim } = require('./services/claimExtractor');
const { analyzeImage } = require('./services/imageAnalyzer');
const { decide } = require('./services/decisionEngine');

function loadEnv(filePath = '.env') {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const index = trimmed.indexOf('=');
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function csvEscape(value) {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

async function main() {
  loadEnv();
  const claimsFile = process.env.CLAIMS_FILE || 'claims.csv';
  const historyFile = process.env.HISTORY_FILE || 'user_history.csv';
  const evidenceFile = process.env.EVIDENCE_FILE || 'evidence_requirements.csv';
  const outputFile = process.env.OUTPUT_FILE || path.join('output', 'output.csv');

  const claims = loadClaims(claimsFile);
  console.log(claims.length);
  console.log('Current directory:', process.cwd());
  console.log('Claims path:', path.resolve(process.cwd(), claimsFile));
  console.log('Images path:', path.resolve(process.cwd(), 'dataset', 'images'));
  const historyRows = loadHistory(historyFile);
  const requirements = loadEvidenceRequirements(evidenceFile);
  console.log(historyRows.length);
  console.log(requirements.length);

  const rows = [];
  const logLines = [];
  for (const claimRow of claims) {
    const claimText = claimRow.claim_text || claimRow.claim || claimRow.description || '';
    const imageFields = Object.keys(claimRow).filter((k) => /^image/i.test(k) && claimRow[k]);
    const imagePaths = imageFields.length
      ? imageFields.map((k) => path.resolve(process.cwd(), 'dataset', 'images', claimRow[k]))
      : [];

    logLines.push(`CLAIM ${claimRow.claim_id || claimRow.id || ''}: ${claimText}`);
    const claimData = await extractClaim(claimText);
    logLines.push(`EXTRACTED ${JSON.stringify(claimData)}`);
    const imageResults = [];
    for (const imagePath of imagePaths) {
      const analyzed = await analyzeImage(imagePath);
      imageResults.push(analyzed);
      logLines.push(`IMAGE ${path.basename(imagePath)} ${JSON.stringify(analyzed)}`);
    }

    const result = decide(claimData, imageResults, historyRows[0] || {});
    logLines.push(`DECISION ${JSON.stringify(result)}`);
    rows.push({
      claim_id: claimRow.claim_id || claimRow.id || '',
      decision: result.decision,
      damage_type: result.damage_type,
      part: result.part,
      severity: result.severity,
      supporting_images: result.supporting_images.join('|'),
      risk_flags: result.risk_flags.join('|'),
      justification: result.justification
    });
  }

  ensureDir(outputFile);
  const header = ['claim_id', 'decision', 'damage_type', 'part', 'severity', 'supporting_images', 'risk_flags', 'justification'];
  const csv = [header.join(',')].concat(
    rows.map((row) => header.map((key) => csvEscape(row[key])).join(','))
  ).join('\n');
  fs.writeFileSync(outputFile, csv, 'utf8');
  fs.writeFileSync('log.txt', logLines.join('\n') + '\n', 'utf8');
  console.log(`Wrote ${rows.length} rows to ${outputFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
