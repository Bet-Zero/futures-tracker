/* global process, Buffer */
// server.js — Discord image upload + screenshot server

import express from "express";
import fs from "fs";
import {
  Client,
  GatewayIntentBits,
  AttachmentBuilder,
  EmbedBuilder,
  Events,
} from "discord.js";
import dotenv from "dotenv";
import cors from "cors";
import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";
import chromium from "@sparticuz/chromium";

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
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "futures") {
    const sport = interaction.options.getString("sport");
    const category = interaction.options.getString("category");
    const market = interaction.options.getString("market");

    // Use environment variable for base URL or fallback to localhost for development
    const baseUrl = process.env.APP_URL || "http://localhost:5173";
    const url = `${baseUrl}/futures?sport=${sport}&category=${encodeURIComponent(
      category || "All"
    )}${market ? `&market=${encodeURIComponent(market)}` : ""}`;

    try {
      await interaction.deferReply({ ephemeral: false });
      console.log(`📸 Taking screenshot of: ${url}`);
      const filePath = await takeScreenshot(url);
      console.log(`✅ Screenshot saved to: ${filePath}`);
      const fileName = path.basename(filePath);
      const file = new AttachmentBuilder(filePath, { name: fileName });

      // First send the file to get a stable CDN URL
      await interaction.editReply({ files: [file] });
      const tempMessage = await interaction.fetchReply();
      const imageUrl = tempMessage.attachments.first()?.url;

      if (imageUrl) {
        // Create an embed with the image and replace the attachment
        const embed = new EmbedBuilder()
          .setTitle(`📊 Futures Odds - ${sport}`)
          .setDescription(
            `Category: ${category || "All"}${
              market ? ` | Market: ${market}` : ""
            }`
          )
          .setImage(imageUrl)
          .setColor(0x0099ff)
          .setTimestamp();

        // Replace with embed only (no attachment link)
        await interaction.editReply({
          embeds: [embed],
          attachments: [], // Remove the attachment to hide the link
        });
      } else {
        // Fallback if CDN URL fails
        const embed = new EmbedBuilder()
          .setTitle(`📊 Futures Odds - ${sport}`)
          .setDescription(
            `Category: ${category || "All"}${
              market ? ` | Market: ${market}` : ""
            }`
          )
          .setColor(0x0099ff)
          .setTimestamp();

        await interaction.editReply({
          embeds: [embed],
          files: [file],
        });
      }

      // Clean up the temporary file
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error("❌ Slash command failed:", err);
      await interaction.editReply(
        "Something went wrong taking the screenshot!"
      );
    }
  }
});

// ✅ Enhanced Puppeteer Screenshot
async function takeScreenshot(url) {
  const options = {
    headless: true,
    defaultViewport: {
      width: 1000,
      height: 1400,
      deviceScaleFactor: 4, // 🔥 Ultra-high quality (increased from 3)
    },
  };

  // Configure for serverless or local environment
  const isServerless =
    process.env.AWS_LAMBDA_FUNCTION_VERSION || process.env.VERCEL;

  if (isServerless) {
    // Use serverless Chrome
    options.args = [
      ...chromium.args,
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ];
    options.executablePath = await chromium.executablePath();
    options.headless = chromium.headless;
  } else {
    // Local development - try to find Chrome
    options.args = ["--no-sandbox", "--disable-setuid-sandbox"];

    // Try different Chrome locations
    const chromePaths = [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", // macOS
      "/usr/bin/google-chrome", // Linux
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", // Windows
      "/usr/bin/chromium-browser", // Ubuntu/Debian
    ];

    for (const chromePath of chromePaths) {
      try {
        if (fs.existsSync(chromePath)) {
          options.executablePath = chromePath;
          console.log(`✅ Found Chrome at: ${chromePath}`);
          break;
        }
      } catch {
        // Continue trying other paths
      }
    }

    if (!options.executablePath) {
      throw new Error(
        "Chrome not found. Please install Google Chrome or set CHROME_PATH environment variable"
      );
    }
  }

  let browser;
  try {
    console.log("🚀 Launching browser...");
    browser = await puppeteer.launch(options);

    console.log("📄 Creating new page...");
    const page = await browser.newPage();

    console.log(`🌐 Navigating to: ${url}`);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Wait for React to fully render filtered state
    console.log("⏳ Waiting for home screen to disappear...");
    await page.waitForSelector("#home-screen", {
      hidden: true,
      timeout: 15000,
    });

    console.log("⏳ Waiting for futures modal to appear...");
    await page.waitForSelector("#futures-modal", {
      visible: true,
      timeout: 10000,
    });

    // Let React settle with 2 animation frames
    console.log("⏳ Allowing React animations to settle...");
    await page.evaluate(
      () =>
        new Promise((r) =>
          requestAnimationFrame(() => requestAnimationFrame(r))
        )
    );

    console.log("🔍 Locating futures modal element...");
    const handle = await page.$("#futures-modal");
    if (!handle) {
      throw new Error("Could not find futures modal element");
    }

    // Create a unique filename with timestamp in a temporary directory
    const tmpDir = process.env.TMPDIR || "/tmp";
    const filePath = path.join(tmpDir, `screenshot_${Date.now()}.png`);
    console.log(`📸 Taking screenshot and saving to: ${filePath}`);

    await handle.screenshot({
      path: filePath,
      type: "png",
      omitBackground: false,
      quality: 100, // Maximum image quality
    });

    console.log(
      `✅ Screenshot saved successfully (${fs.statSync(filePath).size} bytes)`
    );
    return filePath;
  } catch (error) {
    console.error("❌ Screenshot error:", error);
    throw error;
  } finally {
    if (browser) {
      console.log("🔒 Closing browser...");
      await browser
        .close()
        .catch((e) => console.error("Error closing browser:", e));
    }
  }
}

// ✅ Upload Image API (from frontend -> Discord)
app.post("/upload-image", async (req, res) => {
  try {
    const { image, betType = "General" } = req.body;
    if (!image) {
      return res
        .status(400)
        .json({ success: false, error: "No image provided" });
    }

    console.log(`📨 Received image upload (${betType})`);
    const base64 = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64, "base64");

    const tmpDir = process.env.TMPDIR || "/tmp";
    const timestamp = Date.now();
    const fileName = `${betType.replace(/\s+/g, "_")}_${timestamp}.png`;
    const tempFilePath = path.join(tmpDir, fileName);
    fs.writeFileSync(tempFilePath, buffer);
    console.log(
      `✅ Temporary file saved to: ${tempFilePath} (${buffer.length} bytes)`
    );

    const channelIds = (process.env.CHANNEL_ID || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (client.isReady() && channelIds.length > 0) {
      for (const channelId of channelIds) {
        try {
          console.log(`📤 Sending image to channel: ${channelId}`);
          const channel = await client.channels.fetch(channelId);
          // Create a fresh attachment for each channel
          const attachment = new AttachmentBuilder(tempFilePath, {
            name: fileName,
          });
          // Send the file first to get CDN URL
          const sentMessage = await channel.send({ files: [attachment] });
          const imageUrl = sentMessage.attachments.first()?.url;

          if (imageUrl) {
            const embed = new EmbedBuilder().setImage(imageUrl);
            // Replace attachment with embed to avoid showing link
            await sentMessage.edit({ embeds: [embed], attachments: [] });
          }
          console.log(`✅ Successfully sent image to channel: ${channelId}`);
        } catch (err) {
          console.error(`⚠️ Failed to send to channel ${channelId}:`, err);
        }
      }

      // Clean up the temporary file
      fs.unlinkSync(tempFilePath);
      console.log(`🧹 Cleaned up temporary file: ${tempFilePath}`);

      res.json({
        success: true,
        message: `Image sent to ${channelIds.length} channel(s)`,
      });
    } else {
      console.log("⚠️ Discord not ready or CHANNEL_ID missing");
      res.status(500).json({
        success: false,
        error: "Discord not ready or CHANNEL_ID missing",
      });
    }
  } catch (err) {
    console.error("❌ Image upload failed:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// ✅ Server Listener
app.listen(port, () => {
  console.log(`🚀 Upload server listening on http://localhost:${port}`);
});
