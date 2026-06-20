const path = require('path');
const { loadCsvRows } = require('./csv');

function loadClaims(filePath) {
  return loadCsvRows([
    path.resolve(process.cwd(), filePath),
    path.resolve(process.cwd(), 'dataset', filePath),
    path.resolve(process.cwd(), 'dataset', 'claims.csv')
  ]);
}

module.exports = { loadClaims };
