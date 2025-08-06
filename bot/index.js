// bot/index.js
import dotenv from "dotenv";
import process from "node:process";
import { Client, GatewayIntentBits, Events } from "discord.js";

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once(Events.ClientReady, () => {
  console.log(`🤖 Bot is online as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  switch (interaction.commandName) {
    case "ping":
      await interaction.reply("🏓 Pong!");
      break;
    case "bzero":
      await interaction.reply("Futures bot reporting for duty 📊");
      break;
    case "futures":
      await interaction.reply("📈 Futures page screenshot coming soon!");
      break;
    default:
      await interaction.reply("❓ Unknown command");
  }
});

client.login(process.env.DISCORD_TOKEN);
