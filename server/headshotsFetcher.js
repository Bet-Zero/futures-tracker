import fs from "fs-extra";
import path from "path";
import fetch from "node-fetch";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const DATA_FILE = path.join(ROOT, "src", "data", "playerHeadshots.json");

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDdrkWUVX_8LnqsstTZcN_h4YHB2hpyBME",
  authDomain: "futures-tracker-1.firebaseapp.com",
  databaseURL: "https://futures-tracker-1-default-rtdb.firebaseio.com",
  projectId: "futures-tracker-1",
  storageBucket: "futures-tracker-1.firebasestorage.app",
  messagingSenderId: "858706406427",
  appId: "1:858706406427:web:a88b268ea24d97d7e6dcbe",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

function makeSlug(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function fetchHeadshotIfMissing(playerName) {
  if (!playerName) return { url: null, cached: false };

  const slug = makeSlug(playerName);

  // Read existing mapping to check if we already have this player
  let mapping = {};
  try {
    mapping = await fs.readJson(DATA_FILE);
  } catch {
    mapping = {};
  }

  // If we already have a URL for this player, return it
  if (mapping[playerName]) {
    return { url: mapping[playerName], cached: true };
  }

  let browser;
  try {
    // Configure Puppeteer for serverless environment
    const options = {
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    };

    // Fallback for local development
    if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_VERSION) {
      options.executablePath =
        process.platform === "win32"
          ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
          : process.platform === "linux"
          ? "/usr/bin/google-chrome"
          : "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    }

    browser = await puppeteer.launch(options);
    const page = await browser.newPage();

    // Set a user agent to avoid detection
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    let response = await page.goto(`https://www.nfl.com/players/${slug}/`, {
      waitUntil: "domcontentloaded",
      timeout: 10000,
    });

    if (response.status() === 404) {
      // Try searching for the player
      await page.goto("https://www.nfl.com/players/", {
        waitUntil: "domcontentloaded",
        timeout: 10000,
      });

      const found = await page.evaluate((name) => {
        const links = Array.from(document.querySelectorAll("a"));
        const match = links.find(
          (a) => a.textContent.trim().toLowerCase() === name.toLowerCase()
        );
        return match ? match.getAttribute("href") : null;
      }, playerName);

      if (found) {
        response = await page.goto(`https://www.nfl.com${found}`, {
          waitUntil: "domcontentloaded",
          timeout: 10000,
        });
      }
    }

    // Extract the image URL
    const imgUrl = await page.evaluate(() => {
      // Try multiple selectors for headshot images
      const selectors = [
        'meta[property="og:image"]',
        ".nfl-c-player-header__headshot img",
        ".player-headshot img",
        'img[alt*="headshot"]',
        'img[src*="headshot"]',
      ];

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          const url = element.content || element.src;
          if (url && url.includes("http")) {
            return url;
          }
        }
      }

      // Fallback: look for any NFL player image
      const imgs = Array.from(document.querySelectorAll("img"));
      for (const img of imgs) {
        if (
          img.src &&
          (img.src.includes("headshot") || img.src.includes("player"))
        ) {
          return img.src;
        }
      }

      return null;
    });

    await browser.close();

    if (!imgUrl) {
      console.log(`No headshot found for ${playerName}`);
      return { url: null, cached: false };
    }

    // Download the image and upload to Firebase Storage
    try {
      const imgRes = await fetch(imgUrl, { timeout: 10000 });
      if (!imgRes.ok) {
        console.log(
          `Failed to fetch image for ${playerName}: ${imgRes.status}`
        );
        return { url: null, cached: false };
      }

      const imageBuffer = await imgRes.buffer();

      // Upload to Firebase Storage
      const fileName = `${slug}.png`;
      const storageRef = ref(storage, `nfl-headshots/${fileName}`);

      console.log(`Uploading ${playerName} headshot to Firebase Storage...`);
      const snapshot = await uploadBytes(storageRef, imageBuffer, {
        contentType: "image/png",
      });

      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log(
        `Successfully uploaded ${playerName} headshot: ${downloadURL}`
      );

      // Save the Firebase URL to the mapping
      mapping[playerName] = downloadURL;
      await fs.writeJson(DATA_FILE, mapping, { spaces: 2 });

      return { url: downloadURL, cached: false };
    } catch (uploadError) {
      console.error(
        `Error uploading image for ${playerName} to Firebase:`,
        uploadError.message
      );
      return { url: null, cached: false };
    }
  } catch (error) {
    console.error(`Error fetching headshot for ${playerName}:`, error.message);
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error("Error closing browser:", closeError.message);
      }
    }
    return { url: null, cached: false };
  }
}

export default fetchHeadshotIfMissing;
