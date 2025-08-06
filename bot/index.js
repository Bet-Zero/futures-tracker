// bot/index.js
import dotenv from "dotenv";
import process from "node:process";
import {
  Client,
  GatewayIntentBits,
  Events,
  AttachmentBuilder,
} from "discord.js";
import fs from "fs";
import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env") });

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
    case "futures": {
      const sport = interaction.options.getString("sport");
      const type = interaction.options.getString("type");
      const category = interaction.options.getString("category");

      const url = `http://localhost:5173/futures?sport=${sport}&type=${type}&category=${encodeURIComponent(
        category || ""
      )}&group=All`;

      try {
        await interaction.deferReply();
        const filePath = await takeScreenshot(url, sport, type, category);
        const file = new AttachmentBuilder(filePath);
        await interaction.editReply({ files: [file] });
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error("❌ Slash command failed:", err);
        await interaction.editReply("Something went wrong!");
      }
      break;
    }
    default:
      await interaction.reply("❓ Unknown command");
  }
});

client.login(process.env.DISCORD_TOKEN);

async function takeScreenshot(url, sport, type, category) {
  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: { width: 1000, height: 1400 },
  });
  const page = await browser.newPage();

  // Navigate directly to the filtered page

  await page.goto(url, { waitUntil: "networkidle0" });

  try {
    await page.waitForFunction(
      (sport, type, category) => {
        const text = document.body.innerText.toLowerCase();
        return (
          text.includes(sport.toLowerCase()) &&
          text.includes(type.toLowerCase()) &&
          (category ? text.includes(category.toLowerCase()) : true)
        );
      },
      { timeout: 10000 },
      sport,
      type,
      category
    );
  } catch {
    console.warn("⚠️ Betting content may not have fully loaded.");
  }

  const filePath = `screenshot_${Date.now()}.png`;
  await page.screenshot({ path: filePath });
  await browser.close();
  return filePath;
}
