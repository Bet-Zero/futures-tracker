import fs from "fs-extra";
import path from "path";
import fetch from "node-fetch";
import puppeteer from "puppeteer-core";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const HEADSHOTS_DIR = path.join(ROOT, "public", "nfl-headshots");
const DATA_FILE = path.join(ROOT, "src", "data", "playerHeadshots.json");

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
  const fileName = `${slug}.png`;
  const relUrl = `/nfl-headshots/${fileName}`;
  await fs.ensureDir(HEADSHOTS_DIR);

  let mapping = {};
  try {
    mapping = await fs.readJson(DATA_FILE);
  } catch {
    mapping = {};
  }

  const filePath = path.join(HEADSHOTS_DIR, fileName);
  const exists = await fs.pathExists(filePath);
  if (exists) {
    if (mapping[playerName] !== relUrl) {
      mapping[playerName] = relUrl;
      await fs.writeJson(DATA_FILE, mapping, { spaces: 2 });
    }
    return { url: relUrl, cached: true };
  }

  let browser;
  try {
    const options = {
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: "new",
    };

    // Add special configuration for Vercel
    if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
      options.executablePath = await import("@puppeteer/browsers").then(
        (pkg) =>
          pkg.getInstalledBrowsers().find((b) => b.browser === "chrome")
            ?.executablePath
      );
    } else {
      options.executablePath =
        process.platform === "win32"
          ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
          : process.platform === "linux"
          ? "/usr/bin/google-chrome"
          : "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    }

    browser = await puppeteer.launch(options);
    const page = await browser.newPage();
    let response = await page.goto(`https://www.nfl.com/players/${slug}/`, {
      waitUntil: "domcontentloaded",
    });

    if (response.status() === 404) {
      await page.goto("https://www.nfl.com/players/");
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
        });
      }
    }

    const imgUrl = await page.evaluate(() => {
      const meta = document.querySelector('meta[property="og:image"]');
      if (meta && meta.content) return meta.content;
      const img = document.querySelector("img");
      return img ? img.src : null;
    });

    await browser.close();

    if (!imgUrl) {
      return { url: null, cached: false };
    }

    const imgRes = await fetch(imgUrl);
    if (!imgRes.ok) return { url: null, cached: false };
    const buffer = await imgRes.buffer();
    await fs.writeFile(filePath, buffer);
    mapping[playerName] = relUrl;
    await fs.writeJson(DATA_FILE, mapping, { spaces: 2 });
    return { url: relUrl, cached: false };
  } catch {
    if (browser) await browser.close();
    return { url: null, cached: false };
  }
}

export default fetchHeadshotIfMissing;
