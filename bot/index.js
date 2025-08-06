/* eslint-env node */
import dotenv from "dotenv";
import { Client, GatewayIntentBits } from "discord.js";
import process from "node:process";

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", () => {
  console.log(`🤖 Bot is online as ${client.user.tag}`);
});

client.on("messageCreate", (message) => {
  if (message.content === "!ping") {
    message.reply("🏓 Pong!");
  } else if (message.content === "/bzero") {
    message.reply("Futures bot reporting for duty 📊");
  }
});

client.login(process.env.DISCORD_TOKEN);
