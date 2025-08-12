// api/snap.mjs — serverless screenshot for Discord unfurl
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

// GET /api/snap?url=<page>&w=1080&h=1350&wait=1000
export default async function handler(req, res) {
  try {
    const url = req.query?.url || process.env.FUTURES_SNAPSHOT_URL;
    const width = Number(req.query?.w || 1080);
    const height = Number(req.query?.h || 1350);
    const waitMs = Number(req.query?.wait || 1200);

    if (!url) {
      return res
        .status(400)
        .json({ error: "Missing url; set FUTURES_SNAPSHOT_URL or pass ?url=" });
    }

    const executablePath = await chromium.executablePath();
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width, height, deviceScaleFactor: 2 },
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    if (waitMs > 0) await page.waitForTimeout(waitMs);

    const png = await page.screenshot({ type: "png" });
    await browser.close();

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=60");
    return res.status(200).send(png);
  } catch (err) {
    console.error("SNAP ERR", err);
    return res.status(500).json({ error: "screenshot_failed" });
  }
}
