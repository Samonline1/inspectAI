const path = require('path');
const { loadCsvRows } = require('./csv');

function loadHistory(filePath) {
  const rows = loadCsvRows([
    path.resolve(process.cwd(), filePath),
    path.resolve(process.cwd(), 'dataset', filePath),
    path.resolve(process.cwd(), 'dataset', 'user_history.csv')
  ]);
  return rows;
}

module.exports = { loadHistory };
