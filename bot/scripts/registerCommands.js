// scripts/registerCommands.js
import { REST, Routes, SlashCommandBuilder } from "discord.js";
import dotenv from "dotenv";
dotenv.config({ override: true });

dotenv.config();

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
          { name: "All Types", value: "All" }, // Explicit "All" option
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

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
  body: commands,
});

console.log("✅ Slash command registered");
