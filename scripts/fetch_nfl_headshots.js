import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { fetchHeadshotIfMissing } from "../server/headshotsFetcher.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");

const BETS_FILE = path.join(ROOT, "bets.json");
const SEED_DIR = path.join(ROOT, "seed");

async function readLines(file) {
  try {
    const data = await fs.readFile(file, "utf8");
    return data
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function getPlayerList() {
  const players = new Set();

  // Bets file
  const bets = await fs.readJson(BETS_FILE).catch(() => ({}));
  const nfl = bets?.NFL || {};
  Object.values(nfl).forEach((arr) => {
    arr.forEach((b) => {
      if (b.player) players.add(b.player);
    });
  });

  // Seed files
  const starters = await readLines(path.join(SEED_DIR, "nfl_skill_starters.txt"));
  starters.forEach((p) => players.add(p));
  const awards = await readLines(path.join(SEED_DIR, "nfl_award_candidates.txt"));
  awards.forEach((p) => players.add(p));

  return Array.from(players);
}

async function main() {
  const players = await getPlayerList();
  for (const name of players) {
    try {
      const { url, cached } = await fetchHeadshotIfMissing(name);
      if (url) {
        console.log(cached ? `✖ skipped ${name}` : `✔ saved ${name}`);
      } else {
        console.log(`✖ not found ${name}`);
      }
    } catch {
      console.log(`✖ not found ${name}`);
    }
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 300));
  }
}

main();
