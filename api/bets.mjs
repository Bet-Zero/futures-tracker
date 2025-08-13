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

      // Optional: Limit array size to prevent KV store from growing too large
      if (currentBets[league][tabLabel].length > 100) {
        currentBets[league][tabLabel] = currentBets[league][tabLabel].slice(0, 100);
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
