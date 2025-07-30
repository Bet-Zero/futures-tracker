/* global process */
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const DATA_FILE = path.join(__dirname, 'bets.json');

app.use(express.json());

function loadBets() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveBets(bets) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(bets, null, 2));
}

app.get('/api/bets', (req, res) => {
  const bets = loadBets();
  res.json(bets);
});

app.post('/api/bets', (req, res) => {
  const { league, subject, info, odds } = req.body;
  if (!league || !subject || !info || !odds) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const bets = loadBets();
  const newBet = { league, subject, info, odds, date: new Date().toISOString() };
  bets.push(newBet);
  saveBets(bets);
  res.status(201).json(newBet);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
