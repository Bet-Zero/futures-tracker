import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export default async function handler(req, res) {
  const { url, w, h, wait = "0", sel = "" } = req.query || {};
  if (!url) return res.status(400).json({ error: "Missing url" });

  const width = parseInt(w || "1080", 10);
  const height = parseInt(h || "1350", 10);
  const waitMs = parseInt(wait, 10);

  let browser;
  try {
    const isServerless =
      process.env.AWS_LAMBDA_FUNCTION_VERSION || process.env.VERCEL;
    const launchOpts = isServerless
      ? {
          args: chromium.args,
          defaultViewport: { width, height, deviceScaleFactor: 1 },
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
        }
      : {
          headless: true,
          defaultViewport: { width, height, deviceScaleFactor: 1 },
        };

    browser = await puppeteer.launch(launchOpts);
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });
    if (waitMs) await page.waitForTimeout(waitMs);
    if (sel) {
      await page.waitForSelector(sel, { visible: true, timeout: 10000 });
    }
    const buf = await page.screenshot({ type: "png", fullPage: false });
    res.setHeader("Content-Type", "image/png");
    res.status(200).end(buf, "binary");
  } catch (err) {
    console.error("snap error", err);
    res.status(500).json({ error: String(err.message || err) });
  } finally {
    if (browser) await browser.close();
  }
}
