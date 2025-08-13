// api/snap.mjs — Vercel-friendly screenshot route
export const config = { runtime: "nodejs20.x", memory: 1024, maxDuration: 30 };

import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

function get(req, key, dflt = "") {
  const u = new URL(req.url, "http://localhost");
  return u.searchParams.get(key) ?? dflt;
}

export default async function handler(req, res) {
  const target = get(req, "url", "");
  const width  = Number(get(req, "w", "1080"));
  const height = Number(get(req, "h", "1350"));
  const waitMs = Number(get(req, "wait", "1200"));
  if (!target) return res.status(400).json({ error: "missing_url" });

  let browser;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      defaultViewport: { width, height, deviceScaleFactor: 2 },
    });

    try {
      const page = await browser.newPage();
      await page.goto(target, { waitUntil: "networkidle2", timeout: 45000 });
      if (waitMs > 0) await page.waitForTimeout(waitMs);
      const png = await page.screenshot({ type: "png" });
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=60");
      return res.status(200).send(png);
    } catch (e) {
      console.error("SNAP ERR during goto/screenshot:", e);
      return res.status(500).json({ error: "goto_or_screenshot_failed" });
    } finally {
      await browser.close().catch(() => {});
    }
  } catch (e) {
    console.error("SNAP ERR during launch:", e);
    return res.status(500).json({ error: "launch_failed" });
  }
}
