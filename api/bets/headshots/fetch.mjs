import { fetchHeadshotIfMissing } from "../../../server/headshotsFetcher.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name } = req.body || {};
  if (!name) {
    return res.status(400).json({ ok: false, error: "Missing name" });
  }

  try {
    const { url, cached } = await fetchHeadshotIfMissing(name);
    if (!url) {
      return res.status(404).json({ ok: false, url: null });
    }
    return res.json({ ok: true, url, cached });
  } catch (err) {
    console.error("Error fetching headshot:", err);
    return res.status(500).json({ ok: false, error: "Failed" });
  }
}
