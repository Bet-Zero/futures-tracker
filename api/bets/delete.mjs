import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BETS_FILE = path.join(__dirname, "..", "..", "bets.json");

const normalize = (v) => (v === undefined || v === null ? "" : String(v));

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { league, tabLabel, date, player, team, odds, site } = req.body;

    if (!league || !tabLabel || !date) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const currentBets = JSON.parse(fs.readFileSync(BETS_FILE, "utf8"));

    if (!currentBets[league] || !currentBets[league][tabLabel]) {
      return res.status(404).json({ error: "Bet not found" });
    }

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

    fs.writeFileSync(BETS_FILE, JSON.stringify(currentBets, null, 2));
    return res.status(200).json({ ok: true, removed: before - after });
  } catch (err) {
    console.error("Error deleting bet:", err);
    return res.status(500).json({ error: "Failed to delete bet" });
  }
}
