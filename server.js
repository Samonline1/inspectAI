const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const processClaim = require('./code/processClaim');

function loadEnv(filePath = '.env') {
  const resolved = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(resolved)) return;
  const lines = fs.readFileSync(resolved, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const index = trimmed.indexOf('=');
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const app = express();

app.use(express.json());

const upload = multer({ dest: 'uploads/' });

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    const result = await processClaim({
      decision: req.body.decision,
      conversation: req.body.conversation,
      imagePath: req.file ? req.file.path : ''
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log('Running on port 3000');
});
