/* global process */
// scripts/registerCommands.js

import { REST, Routes } from "discord.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env"), override: true });

const { DISCORD_TOKEN, CLIENT_ID } = process.env;
if (!DISCORD_TOKEN || !CLIENT_ID) {
  throw new Error("❌ Missing DISCORD_TOKEN or CLIENT_ID in .env");
}

// Slash command structure
const commands = [
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
          { name: "Team Futures", value: "Team Futures" },
          { name: "Stat Leaders", value: "Stat Leaders" },
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

// Register command with Discord
const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

try {
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
  console.log("✅ Slash command registered successfully");
} catch (err) {
  console.error("❌ Failed to register slash command:", err);
}
