import { getAllBets, saveBets } from '../src/utils/kvStore.js';

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const data = await getAllBets();
      return res.status(200).json(data);
    } catch (err) {
      console.error("Error loading bets:", err);
      return res.status(500).json({ error: "Failed to load bets" });
    }
  } else if (req.method === "POST") {
    try {
      const currentBets = await getAllBets();
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
        return res.status(400).json({ error: "Missing required fields" });
      }

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

      if (!currentBets[s]) currentBets[s] = {};
      if (!currentBets[s][cat]) currentBets[s][cat] = [];
      currentBets[s][cat].unshift(newBet);

      // Optional: Limit array size to prevent KV store from growing too large
      if (currentBets[s][cat].length > 100) {
        currentBets[s][cat] = currentBets[s][cat].slice(0, 100);
      }

      await saveBets(currentBets);
      return res.status(201).json(newBet);
    } catch (err) {
      console.error("Error saving bet:", err);
      return res.status(500).json({ error: "Failed to save bet" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
