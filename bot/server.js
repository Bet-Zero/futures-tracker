// server.js in futures-bot

import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import {
  Client,
  GatewayIntentBits,
  AttachmentBuilder,
  Events,
} from "discord.js";
import dotenv from "dotenv";
import cors from "cors";
import puppeteer from "puppeteer";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

// ✅ FIXED: Add full intents so bot can read messages
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, () => {
  console.log(`🤖 Bot is ready as ${client.user.tag}`);
});

client.login(process.env.BOT_TOKEN);

// Command handler
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "futures") {
    const sport = interaction.options.getString("sport");
    const type = interaction.options.getString("type");
    const category = interaction.options.getString("category");

    const url = `http://localhost:5173/futures?sport=${sport}&type=${type}&category=${encodeURIComponent(
      category
    )}&group=All`;

    try {
      await interaction.deferReply();
      const filePath = await takeScreenshot(url);
      const file = new AttachmentBuilder(filePath);
      await interaction.editReply({ files: [file] });
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error("❌ Slash command failed:", err);
      await interaction.editReply("Something went wrong!");
    }
  }
});

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function takeScreenshot(url) {
  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: { width: 1000, height: 1400 },
  });

  const page = await browser.newPage();

  // 1. Clear any local/session storage before page logic
  await page.goto("http://localhost:5173", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // 2. Force navigation to actual target URL
  await page.goto(url, { waitUntil: "networkidle0" });

  // 3. Optional debug shot: before content wait
  await page.screenshot({ path: `debug_before_wait.png` });

  // 4. Wait for the actual category content to render
  await page.waitForSelector("div.overflow-y-auto", { timeout: 10000 });

  // 5. Final screenshot
  const filePath = `screenshot_${Date.now()}.png`;
  await page.screenshot({ path: filePath, fullPage: false });

  await browser.close();
  return filePath;
}

app.listen(port, () => {
  console.log(`🚀 Upload server listening on http://localhost:${port}`);
});
