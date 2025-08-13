import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BETS_FILE = path.join(__dirname, "..", "bets.json");

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const data = JSON.parse(fs.readFileSync(BETS_FILE, "utf8"));
      return res.status(200).json(data);
    } catch (err) {
      console.error("Error loading bets:", err);
      return res.status(500).json({ error: "Failed to load bets" });
    }
  } else if (req.method === "POST") {
    try {
      const currentBets = JSON.parse(fs.readFileSync(BETS_FILE, "utf8"));
      const {
        type,
        tabLabel,
        player,
        team,
        image,
        details,
        odds,
        site,
        league,
      } = req.body;

      if (!type || !tabLabel || !team || !odds || !site || !league) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const newBet = {
        type,
        tabLabel,
        player: player ?? null,
        team,
        image: image || "",
        details: details || {},
        odds,
        site,
        league,
        date: new Date().toISOString(),
      };

      if (!currentBets[league]) currentBets[league] = {};
      if (!currentBets[league][tabLabel]) currentBets[league][tabLabel] = [];
      currentBets[league][tabLabel].unshift(newBet);

      fs.writeFileSync(BETS_FILE, JSON.stringify(currentBets, null, 2));
      return res.status(201).json(newBet);
    } catch (err) {
      console.error("Error saving bet:", err);
      return res.status(500).json({ error: "Failed to save bet" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
