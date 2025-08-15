/* =========================
   scripts/syncSlashCommands.mjs
   One-command purge + register (guild or global)
   Usage:
     node scripts/syncSlashCommands.mjs --guild
     node scripts/syncSlashCommands.mjs --global
   Env:
     DISCORD_TOKEN, CLIENT_ID, (GUILD_ID for --guild)
   ========================= */

import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import { REST, Routes } from "discord.js";
import { commands } from "./registerCommands.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env at project root is loaded even if not auto-picked up
process.env.DOTENV_LOADED ||
  (await import("dotenv")).config({
    path: path.resolve(__dirname, "../.env"),
    override: true,
  });

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error("❌ Missing DISCORD_TOKEN or CLIENT_ID in .env");
  process.exit(1);
}

const isGuild = process.argv.includes("--guild");
const isGlobal = process.argv.includes("--global");
const MODE = isGlobal ? "global" : "guild";

if (MODE === "guild" && !GUILD_ID) {
  console.error("❌ --guild mode requires GUILD_ID in .env");
  process.exit(1);
}

if (!Array.isArray(commands) || commands.length === 0) {
  console.error("❌ No commands exported from scripts/registerCommands.js");
  process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(TOKEN);

const routes = {
  list: () =>
    MODE === "guild"
      ? Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID)
      : Routes.applicationCommands(CLIENT_ID),
  del: (id) =>
    MODE === "guild"
      ? Routes.applicationGuildCommand(CLIENT_ID, GUILD_ID, id)
      : Routes.applicationCommand(CLIENT_ID, id),
  put: () =>
    MODE === "guild"
      ? Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID)
      : Routes.applicationCommands(CLIENT_ID),
};

function mapByName(arr) {
  const m = new Map();
  for (const c of arr) m.set(c.name, c);
  return m;
}

(async () => {
  try {
    console.log(`🚀 Slash sync started in ${MODE.toUpperCase()} mode`);

    // 1) Fetch existing from Discord
    const existing = await rest.get(routes.list());
    console.log(
      `ℹ️ Found ${existing.length} existing ${MODE} command(s) on Discord.`
    );

    // 2) Delete any command that doesn't exist locally (stale)
    const desiredByName = mapByName(commands);
    const stale = existing.filter((cmd) => !desiredByName.has(cmd.name));

    for (const s of stale) {
      console.log(`🗑️ Deleting stale command: ${s.name} (${s.id})`);
      await rest.delete(routes.del(s.id));
    }

    // 3) Bulk overwrite with the exact set you want
    console.log(`🧩 Registering ${commands.length} ${MODE} command(s)…`);
    const result = await rest.put(routes.put(), { body: commands });

    console.log(
      `✅ Sync complete. ${
        Array.isArray(result) ? result.length : 0
      } ${MODE} command(s) now active.`
    );
    if (MODE === "global") {
      console.log(
        "⏳ Global changes can take up to ~1 hour to appear in Discord."
      );
    } else {
      console.log(
        "⚡ Guild changes are near-instant. Test them now in your server."
      );
    }
  } catch (err) {
    console.error("❌ Slash sync failed.");
    if (err?.rawError) {
      console.error(
        "Discord API Error:",
        JSON.stringify(err.rawError, null, 2)
      );
    } else {
      console.error(err);
    }
    process.exit(1);
  }
})();
