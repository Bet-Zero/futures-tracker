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
  let page;

  try {
    console.log(`Starting headshot fetch for: ${playerName}`);

    // Configure Puppeteer for serverless environment
    const isServerless =
      process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION;

    let options;
    if (isServerless) {
      console.log("Using serverless configuration");
      options = {
        args: [
          ...chromium.args,
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--single-process",
          "--disable-gpu",
        ],
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      };
    } else {
      console.log("Using local development configuration");
      options = {
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--disable-gpu",
        ],
        headless: true,
        executablePath:
          process.platform === "win32"
            ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
            : process.platform === "linux"
            ? "/usr/bin/google-chrome"
            : "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      };
    }

    console.log("Launching browser...");
    browser = await puppeteer.launch(options);

    console.log("Creating new page...");
    page = await browser.newPage();

    // Set viewport and user agent
    await page.setViewport({ width: 1280, height: 720 });
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    console.log(`Navigating to NFL.com for: ${playerName}`);
    let response = await page.goto(`https://www.nfl.com/players/${slug}/`, {
      waitUntil: "networkidle2",
      timeout: 15000,
    });

    console.log(`Response status: ${response.status()}`);

    if (response.status() === 404) {
      console.log("Player page not found, trying search...");
      // Try searching for the player
      await page.goto("https://www.nfl.com/players/", {
        waitUntil: "networkidle2",
        timeout: 15000,
      });

      const found = await page.evaluate((name) => {
        const links = Array.from(document.querySelectorAll("a"));
        const match = links.find(
          (a) => a.textContent.trim().toLowerCase() === name.toLowerCase()
        );
        return match ? match.getAttribute("href") : null;
      }, playerName);

      if (found) {
        console.log(`Found player link: ${found}`);
        response = await page.goto(`https://www.nfl.com${found}`, {
          waitUntil: "networkidle2",
          timeout: 15000,
        });
      }
    }

    console.log("Extracting image URL...");
    // Extract the image URL
    const imgUrl = await page.evaluate(() => {
      // Try multiple selectors for headshot images
      const selectors = [
        'meta[property="og:image"]',
        ".nfl-c-player-header__headshot img",
        ".player-headshot img",
        'img[alt*="headshot"]',
        'img[src*="headshot"]',
        ".nfl-o-player-image img",
      ];

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          const url = element.content || element.src;
          if (url && url.includes("http")) {
            console.log(`Found image with selector ${selector}: ${url}`);
            return url;
          }
        }
      }

      // Fallback: look for any NFL player image
      const imgs = Array.from(document.querySelectorAll("img"));
      for (const img of imgs) {
        if (
          img.src &&
          (img.src.includes("headshot") ||
            img.src.includes("player") ||
            img.src.includes("nfl"))
        ) {
          console.log(`Found fallback image: ${img.src}`);
          return img.src;
        }
      }

      return null;
    });

    console.log("Closing browser...");
    await page.close();
    await browser.close();
    browser = null;
    page = null;

    if (!imgUrl) {
      console.log(`No headshot found for ${playerName}`);
      return { url: null, cached: false };
    }

    console.log(`Found image URL: ${imgUrl}`);

    // Download the image and upload to Firebase Storage
    try {
      console.log(`Downloading image for ${playerName}...`);
      const imgRes = await fetch(imgUrl, {
        timeout: 15000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (!imgRes.ok) {
        console.log(
          `Failed to fetch image for ${playerName}: ${imgRes.status}`
        );
        return { url: null, cached: false };
      }

      const imageBuffer = await imgRes.buffer();
      console.log(`Downloaded ${imageBuffer.length} bytes for ${playerName}`);

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
    console.error(error.stack);

    // Ensure browser is properly closed
    try {
      if (page) await page.close();
      if (browser) await browser.close();
    } catch (closeError) {
      console.error("Error closing browser:", closeError.message);
    }

    return { url: null, cached: false };
  }
}

export default fetchHeadshotIfMissing;
