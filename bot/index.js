/* eslint-env node */
import { Client, GatewayIntentBits, Events } from "discord.js";
import dotenv from "dotenv";
import process from "node:process";

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once(Events.ClientReady, () => {
  console.log(`🤖 Bot is online as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "ping") {
    await interaction.reply("🏓 Pong!");
  } else if (interaction.commandName === "bzero") {
    await interaction.reply("Futures bot reporting for duty 📊");
  }
});

client.login(process.env.DISCORD_TOKEN);

