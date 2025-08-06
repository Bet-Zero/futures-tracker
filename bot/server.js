/* global process, Buffer */
// server.js — Discord image upload + screenshot server

import express from "express";
import fs from "fs";
import {
  Client,
  GatewayIntentBits,
  AttachmentBuilder,
  Events,
} from "discord.js";
import dotenv from "dotenv";
import cors from "cors";
import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = express();
const port = process.env.PORT || 3002; // ⚠️ Changed from 3001 to avoid conflict with main API

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ✅ Discord Client Setup
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

// ✅ Login bot
if (process.env.DISCORD_TOKEN) {
  client
    .login(process.env.DISCORD_TOKEN)
    .catch((err) => console.error("❌ Discord login failed:", err));
} else {
  console.log("⚠️ DISCORD_TOKEN not set; Discord features disabled.");
}

// ✅ Slash command: /futures
// ✅ Slash command: /futures
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "futures") {
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
  }
});

// ✅ Enhanced Puppeteer Screenshot
async function takeScreenshot(url, sport, type, category) {
  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: { width: 1000, height: 1400 },
  });

  const page = await browser.newPage();

  // Navigate directly to the desired page
  await page.goto(url, { waitUntil: "networkidle0" });

  // Step 3: Wait for text-based confirmation of dynamic content
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

  // Step 4: Screenshot
  const filePath = `screenshot_${Date.now()}.png`;
  await page.screenshot({ path: filePath });

  await browser.close();
  return filePath;
}

// ✅ Upload Image API (from frontend -> Discord)
app.post("/upload-image", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res
        .status(400)
        .json({ success: false, error: "No image provided" });
    }

    console.log("📨 Received image upload");
    const base64 = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64, "base64");
    const attachment = new AttachmentBuilder(buffer, {
      name: `upload_${Date.now()}.png`,
    });

    const channelId = process.env.CHANNEL_ID;
    if (client.isReady() && channelId) {
      const channel = await client.channels.fetch(channelId);
      await channel.send({ files: [attachment] });
    } else {
      console.log("⚠️ Discord not ready or CHANNEL_ID missing");
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Image upload failed:", err);
    res.status(500).json({ success: false });
  }
});

// ✅ Server Listener
app.listen(port, () => {
  console.log(`🚀 Upload server listening on http://localhost:${port}`);
});
