/* global process */
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { fetchHeadshotIfMissing } from "./headshotsFetcher.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");

const app = express();
const PORT = process.env.PORT || 3001;

const DATA_FILE = path.join(ROOT, "bets.json");

app.use(cors());
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
  const { sport, category } = bet;
  if (!sport || !category) return;
  if (!bets[sport]) bets[sport] = {};
  if (!bets[sport][category]) bets[sport][category] = [];
  bets[sport][category].unshift(bet);
  if (bets[sport][category].length > 100) {
    bets[sport][category] = bets[sport][category].slice(0, 100);
  }
}

app.get("/api/bets", (req, res) => {
  const bets = loadBets();
  res.json(bets);
});

app.post("/api/bets", (req, res) => {
  const {
    sport,
    category,
    market,
    selection,
    odds_american,
    line,
    book,
    notes,
  } = req.body;
  const s = sport ?? req.body.league;
  const cat = category ?? req.body.tabLabel ?? req.body.type;
  const odds = odds_american ?? req.body.odds;
  if (!s || !cat || !selection || !odds || !book) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const bets = loadBets();
  const newBet = {
    sport: s,
    category: cat,
    market: market ?? req.body.subtype ?? "",
    selection,
    odds_american: odds,
    line: line ?? null,
    book,
    notes: notes ?? "",
    createdAt: Date.now(),
  };

  addBet(bets, newBet);
  saveBets(bets);
  res.status(201).json(newBet);
});

app.post("/api/headshots/fetch", async (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ ok: false, error: "Missing name" });
  try {
    const { url, cached } = await fetchHeadshotIfMissing(name);
    if (!url) return res.status(404).json({ ok: false, url: null });
    res.json({ ok: true, url, cached });
  } catch {
    res.status(500).json({ ok: false, error: "Failed" });
  }
});

app.post("/api/bets/delete", (req, res) => {
  const {
    sport,
    category,
    createdAt,
    player,
    team,
    odds_american,
    book,
  } = req.body;
  console.log("Delete request:", req.body);
  const bets = loadBets();
  const s = sport ?? req.body.league;
  const cat = category ?? req.body.tabLabel;
  const ts = createdAt ?? req.body.date;
  if (!s || !cat || !ts) {
    return res.status(400).json({ error: "Missing fields" });
  }
  if (!bets[s] || !bets[s][cat]) {
    return res.status(404).json({ error: "Bet not found" });
  }
  const normalize = (v) => (v === undefined || v === null ? "" : String(v));
  const before = bets[s][cat].length;
  bets[s][cat] = bets[s][cat].filter(
    (b) =>
      !(
        String(b.createdAt ?? b.date) === String(ts) &&
        normalize(b.selection ?? b.player) === normalize(player) &&
        normalize(b.team) === normalize(team) &&
        normalize(b.odds_american ?? b.odds) === normalize(odds_american) &&
        normalize(b.book ?? b.site) === normalize(book)
      )
  );
  const after = bets[s][cat].length;
  console.log(`Removed ${before - after} bets.`);
  saveBets(bets);
  res.json({ ok: true, removed: before - after });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
