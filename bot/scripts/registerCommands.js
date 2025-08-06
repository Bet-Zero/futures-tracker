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
        ],
      },
      {
        name: "type",
        type: 3, // STRING
        description: "Choose the bet type",
        required: true,
        choices: [
          { name: "All Types", value: "All" },
          { name: "Futures", value: "Futures" },
          { name: "Awards", value: "Awards" },
          { name: "Props", value: "Props" },
          { name: "Leaders", value: "Leaders" },
        ],
      },
      {
        name: "category",
        type: 3, // STRING
        description: "Optional: Filter by category",
        required: false,
        choices: [
          { name: "MVP", value: "MVP" },
          { name: "DPOY", value: "DPOY" },
          { name: "ROY", value: "ROY" },
          { name: "COY", value: "COY" },
          { name: "Passing Yards Leader", value: "Passing Yards Leader" },
          { name: "Most Wins", value: "Most Wins" },
          { name: "Rushing TD Leader", value: "Rushing TD Leader" },
          { name: "Comeback Player", value: "Comeback Player" },
        ],
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
