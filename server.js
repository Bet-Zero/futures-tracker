/* global process */
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const DATA_FILE = path.join(__dirname, "bets.json");

app.use(express.json());

function loadBets() {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    return data && typeof data === "object" && !Array.isArray(data) ? data : {};
  } catch {
    return {};
  }
}

function saveBets(bets) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(bets, null, 2));
}

function addBet(bets, bet) {
  const { league, type } = bet;
  if (!league || !type) return;
  if (!bets[league]) bets[league] = {};
  if (!bets[league][type]) bets[league][type] = [];
  bets[league][type].unshift(bet);
  if (bets[league][type].length > 100) {
    bets[league][type] = bets[league][type].slice(0, 100);
  }
}

app.get("/api/bets", (req, res) => {
  const bets = loadBets();
  res.json(bets);
});

app.post("/api/bets", (req, res) => {
  const { site, league, team, player, type, category, group, ou, line, odds } =
    req.body;
  if (!site || !league || !player || !type || !ou || !odds) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const bets = loadBets();
  const newBet = {
    site,
    league,
    team: team || "",
    player,
    type,
    category: category || "",
    group: group || "",
    ou,
    line: line || "",
    odds,
    date: new Date().toISOString(),
  };

  addBet(bets, newBet);
  saveBets(bets);
  res.status(201).json(newBet);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
