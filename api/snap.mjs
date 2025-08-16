// api/snap.mjs — robust screenshot endpoint (no waitForTimeout)
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export const config = { runtime: "nodejs" };

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export default async function handler(req, res) {
  try {
    // Parse query params
    const urlObj = new URL(req.url, "http://localhost");
    const sp = urlObj.searchParams;

    const target = sp.get("url");
    if (!target) {
      res.status(400).json({ error: "Missing url" });
      return;
    }

    const width = parseInt(sp.get("w") || "1080", 10);
    const height = parseInt(sp.get("h") || "1350", 10);
    const waitMs = parseInt(sp.get("wait") || "0", 10);
    const sel = (sp.get("sel") || "").trim();
    const full = sp.get("full") === "1";

    const executablePath = await chromium.executablePath();

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width, height, deviceScaleFactor: 2 },
      executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    await page.goto(target, {
      waitUntil: ["load", "domcontentloaded", "networkidle0"],
      timeout: 45_000,
    });

    if (sel) {
      await page.waitForSelector(sel, { timeout: 20_000 });
    }

    if (waitMs > 0) {
      await delay(waitMs);
    }

    let png;

    // If a selector is provided, screenshot just that element
    if (sel) {
      const element = await page.$(sel);
      if (element) {
        png = await element.screenshot({
          type: "png",
        });
      } else {
        throw new Error(`Element with selector "${sel}" not found`);
      }
    } else {
      // Otherwise, take a full page or viewport screenshot
      png = await page.screenshot({
        type: "png",
        fullPage: !!full,
      });
    }

    await browser.close();

    res.setHeader("Content-Type", "image/png");
    res.status(200).send(png);
  } catch (err) {
    console.error("snap error", err);
    try {
      res.status(500).json({ error: String(err?.message || err) });
    } catch {
      /* noop */
    }
  }
}
