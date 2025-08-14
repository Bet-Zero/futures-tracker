import { getAllBets, saveBets } from "../../src/utils/kvStore.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      sport,
      category,
      createdAt,
      player,
      team,
      odds_american,
      book,
    } = req.body;

    const s = sport ?? req.body.league;
    const cat = category ?? req.body.tabLabel;
    const ts = createdAt ?? req.body.date;

    if (!s || !cat || !ts) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get current bets from KV store
    let currentBets;
    try {
      currentBets = await getAllBets();
    } catch (err) {
      console.error("Error reading from KV store:", err);
      return res.status(500).json({ error: "Failed to read bets database" });
    }

    if (!currentBets[s] || !currentBets[s][cat]) {
      return res.status(404).json({ error: "Sport or category not found" });
    }

    const normalize = (v) => (v === undefined || v === null ? "" : String(v));

    const before = currentBets[s][cat].length;
    currentBets[s][cat] = currentBets[s][cat].filter(
      (b) =>
        !(
          String(b.createdAt ?? b.date) === String(ts) &&
          normalize(b.selection ?? b.player) === normalize(player) &&
          normalize(b.team) === normalize(team) &&
          normalize(b.odds_american ?? b.odds) === normalize(odds_american) &&
          normalize(b.book ?? b.site) === normalize(book)
        )
    );
    const after = currentBets[s][cat].length;
    const removed = before - after;

    if (removed === 0) {
      return res.status(404).json({ error: "No matching bet found" });
    }

    try {
      // Save updated bets back to KV store
      await saveBets(currentBets);
    } catch (err) {
      console.error("Error saving to KV store:", err);
      return res.status(500).json({ error: "Failed to save changes" });
    }

    return res.status(200).json({ ok: true, removed });
  } catch (err) {
    console.error("Error in delete handler:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
