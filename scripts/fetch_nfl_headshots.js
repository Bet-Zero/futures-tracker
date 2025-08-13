import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { fetchHeadshotIfMissing } from "../server/headshotsFetcher.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");

const BETS_FILE = path.join(ROOT, "bets.json");
const SEED_DIR = path.join(ROOT, "seed");

// Import our comprehensive NFL player list
import { NFL_PLAYERS_BY_TEAM, ALL_PLAYERS } from "./seed-firebase-headshots.js";

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

  // Add all players from our comprehensive team list
  ALL_PLAYERS.forEach((p) => players.add(p));

  // Also add any players from bets file
  const bets = await fs.readJson(BETS_FILE).catch(() => ({}));
  const nfl = bets?.NFL || {};
  Object.values(nfl).forEach((arr) => {
    arr.forEach((b) => {
      if (b.player) players.add(b.player);
    });
  });

  // And seed files
  const starters = await readLines(
    path.join(SEED_DIR, "nfl_skill_starters.txt")
  );
  starters.forEach((p) => players.add(p));
  const awards = await readLines(
    path.join(SEED_DIR, "nfl_award_candidates.txt")
  );
  awards.forEach((p) => players.add(p));

  return Array.from(players);
}

async function main() {
  const players = await getPlayerList();
  console.log(`🏈 Fetching headshots for ${players.length} NFL players...`);

  let successful = 0;
  let cached = 0;
  let failed = 0;

  for (let i = 0; i < players.length; i++) {
    const name = players[i];
    console.log(`[${i + 1}/${players.length}] Processing: ${name}`);

    try {
      const { url, cached: wasCached } = await fetchHeadshotIfMissing(name);
      if (url) {
        if (wasCached) {
          console.log(`✅ Already cached: ${name}`);
          cached++;
        } else {
          console.log(`🎉 Successfully saved: ${name}`);
          successful++;
        }
      } else {
        console.log(`❌ Not found: ${name}`);
        failed++;
      }
    } catch (error) {
      console.log(`💥 Error with ${name}: ${error.message}`);
      failed++;
    }
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 300));
  }

  console.log(`\n🏁 Complete!`);
  console.log(`🎉 Successfully saved: ${successful}`);
  console.log(`✅ Already cached: ${cached}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${successful + cached + failed}/${players.length}`);
}

main();
