/* =========================
   scripts/registerCommands.js
   Exports: commands (array)
   Optional CLI: node scripts/registerCommands.js  -> registers GLOBAL commands
   ========================= */

/* global process */
import { REST, Routes } from "discord.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Resolve .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env"), override: true });

const { DISCORD_TOKEN, CLIENT_ID } = process.env;
if (!DISCORD_TOKEN || !CLIENT_ID) {
  throw new Error("❌ Missing DISCORD_TOKEN or CLIENT_ID in .env");
}

// ===== Slash command definitions (exported) =====
export const commands = [
  {
    name: "futures",
    description: "Get a screenshot of futures odds",
    options: [
      {
        name: "sport",
        type: 3, // STRING
        description: "Choose a sport",
        required: true,
        choices: [
          { name: "NFL", value: "NFL" },
          { name: "NBA", value: "NBA" },
          { name: "MLB", value: "MLB" },
          { name: "PGA", value: "PGA" },
          { name: "CFL", value: "CFL" },
        ],
      },
      {
        name: "category",
        type: 3, // STRING
        description: "Optional: Choose category",
        required: false,
        choices: [
          { name: "All", value: "All" },
          { name: "Awards", value: "Awards" },
          { name: "Futures", value: "Team Futures" },
          { name: "Leaders", value: "Stat Leaders" },
          { name: "Props", value: "Props" },
        ],
      },
      {
        name: "market",
        type: 3, // STRING
        description: "Optional: Market filter",
        required: false,
      },
    ],
  },
];

// ===== Optional: run this file directly to register GLOBAL commands =====
if (import.meta.url === `file://${__filename}`) {
  const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

  (async () => {
    try {
      console.log("🌐 Registering GLOBAL slash commands…");
      const result = await rest.put(Routes.applicationCommands(CLIENT_ID), {
        body: commands,
      });
      console.log(
        `✅ Registered ${
          Array.isArray(result) ? result.length : 0
        } global command(s).`
      );
      console.log("⏳ Note: global commands can take up to ~1 hour to appear.");
    } catch (err) {
      console.error("❌ Failed to register global slash commands:", err);
      process.exit(1);
    }
  })();
}
