// api/snap.mjs — Vercel-friendly screenshot route
export const config = { runtime: "nodejs", memory: 1024, maxDuration: 30 };

import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

function get(req, key, dflt = "") {
  const u = new URL(req.url, "http://localhost");
  return u.searchParams.get(key) ?? dflt;
}

export default async function handler(req, res) {
  const target = get(req, "url", "");
  const width = Number(get(req, "w", "1080"));
  const height = Number(get(req, "h", "1350"));
  const waitMs = Number(get(req, "wait", "1200"));

  if (!target) return res.status(400).json({ error: "missing_url" });

  console.log(`📸 Taking screenshot of: ${target}`);

  let browser;
  try {
    console.log("🚀 Launching browser...");
    browser = await puppeteer.launch({
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
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      defaultViewport: { width, height, deviceScaleFactor: 2 },
    });

    try {
      console.log("📄 Creating new page...");
      const page = await browser.newPage();

      // Set a more generous timeout and wait strategy
      console.log(`🌐 Navigating to: ${target}`);
      await page.goto(target, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      console.log(`⏳ Waiting ${waitMs}ms for page to settle...`);
      if (waitMs > 0) {
        // Use the correct delay method for newer Puppeteer versions
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }

      // Wait for #futures-modal to be visible
      try {
        await page.waitForSelector("#futures-modal", {
          visible: true,
          timeout: 10000,
        });
        console.log("✅ Modal element found");

        // Get handle to the modal element
        const modalHandle = await page.$("#futures-modal");

        if (modalHandle) {
          console.log("📸 Taking screenshot of modal only...");
          const png = await modalHandle.screenshot({
            type: "png",
            omitBackground: false,
          });

          console.log(`✅ Modal screenshot successful: ${png.length} bytes`);
          res.setHeader("Content-Type", "image/png");
          res.setHeader("Cache-Control", "public, max-age=60");
          return res.status(200).send(png);
        } else {
          console.log(
            "⚠️ Modal element found but couldn't get handle, falling back to full screenshot"
          );
        }
      } catch (err) {
        console.log(
          "⚠️ Modal selector not found, falling back to full screenshot:",
          err.message
        );
      }

      // Fallback to taking full viewport screenshot if modal not found
      console.log("📸 Taking full viewport screenshot...");
      const png = await page.screenshot({
        type: "png",
        fullPage: false,
      });

      console.log(`✅ Screenshot successful: ${png.length} bytes`);
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=60");
      return res.status(200).send(png);
    } catch (e) {
      console.error("❌ SNAP ERR during goto/screenshot:", e.message);
      console.error("Stack:", e.stack);
      return res.status(500).json({
        error: "goto_or_screenshot_failed",
        details: e.message,
        target: target,
      });
    } finally {
      console.log("🔒 Closing browser...");
      await browser.close().catch(() => {});
    }
  } catch (e) {
    console.error("❌ SNAP ERR during launch:", e.message);
    console.error("Stack:", e.stack);
    return res.status(500).json({
      error: "launch_failed",
      details: e.message,
    });
  }
}
