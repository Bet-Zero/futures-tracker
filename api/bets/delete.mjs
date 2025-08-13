import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BETS_FILE = path.join(__dirname, "..", "..", "bets.json");

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { league, tabLabel, date, player, team, odds, site } = req.body;

    if (!league || !tabLabel || !date) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Ensure bets.json exists and is readable
    if (!fs.existsSync(BETS_FILE)) {
      return res.status(404).json({ error: "Bets database not found" });
    }

    let currentBets;
    try {
      const betsData = fs.readFileSync(BETS_FILE, "utf8");
      currentBets = JSON.parse(betsData);
    } catch (err) {
      console.error("Error reading bets file:", err);
      return res.status(500).json({ error: "Failed to read bets database" });
    }

    if (!currentBets[league] || !currentBets[league][tabLabel]) {
      return res.status(404).json({ error: "League or tab not found" });
    }

    const normalize = (v) => (v === undefined || v === null ? "" : String(v));

    const before = currentBets[league][tabLabel].length;
    currentBets[league][tabLabel] = currentBets[league][tabLabel].filter(
      (b) =>
        !(
          String(b.date) === String(date) &&
          normalize(b.player) === normalize(player) &&
          normalize(b.team) === normalize(team) &&
          normalize(b.odds) === normalize(odds) &&
          normalize(b.site) === normalize(site)
        )
    );
    const after = currentBets[league][tabLabel].length;
    const removed = before - after;

    if (removed === 0) {
      return res.status(404).json({ error: "No matching bet found" });
    }

    try {
      fs.writeFileSync(BETS_FILE, JSON.stringify(currentBets, null, 2));
    } catch (err) {
      console.error("Error saving bets file:", err);
      return res.status(500).json({ error: "Failed to save changes" });
    }

    return res.status(200).json({ ok: true, removed });
  } catch (err) {
    console.error("Error in delete handler:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
