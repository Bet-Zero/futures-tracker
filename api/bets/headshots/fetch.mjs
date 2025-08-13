import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..", "..");
const DATA_FILE = path.join(ROOT, "src", "data", "playerHeadshots.json");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name } = req.body || {};
  if (!name) {
    return res.status(400).json({ ok: false, error: "Missing name parameter" });
  }

  console.log(`Looking up headshot for: ${name}`);

  try {
    // Read the existing mapping file
    let mapping = {};
    try {
      mapping = await fs.readJson(DATA_FILE);
    } catch {
      console.log("Could not read playerHeadshots.json mapping file");
      return res.status(500).json({
        ok: false,
        error: "Headshot mapping file not found",
      });
    }

    // Check if we have this player
    const url = mapping[name];

    if (url) {
      console.log(`✅ Found cached headshot for ${name}: ${url}`);
      return res.json({ ok: true, url, cached: true });
    } else {
      console.log(`❌ No headshot found for: ${name}`);
      return res.status(404).json({
        ok: false,
        url: null,
        error: `No headshot found for ${name}. Available players: ${Object.keys(
          mapping
        ).length}`,
      });
    }
  } catch (err) {
    console.error("Error looking up headshot:", err);
    return res.status(500).json({
      ok: false,
      error: "Internal server error",
      details: err.message,
    });
  }
}
