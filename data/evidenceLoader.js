const path = require('path');
const { loadCsvRows } = require('./csv');

function loadEvidenceRequirements(filePath) {
  return loadCsvRows([
    path.resolve(process.cwd(), filePath),
    path.resolve(process.cwd(), 'dataset', filePath),
    path.resolve(process.cwd(), 'dataset', 'evidence_requirements.csv')
  ]);
}

module.exports = { loadEvidenceRequirements };
