// api/interactions.mjs — Discord slash -> image-only reply
// - Immediate defer (type 5) so we never time out
// - Generate PNG via your /api/snap
// - Edit original message with a real file attachment (attachment://futures.png)

import nacl from "tweetnacl";
import { FormData, File, fetch } from "undici"; // ensures multipart + fetch work on Vercel Node

// Force Node runtime (not Edge)
export const config = { runtime: "nodejs" };

// ---- helpers ----
function getStrOpt(interaction, name, def = "") {
  const opts = interaction?.data?.options || [];
  const opt = opts.find(
    (o) => (o?.name || "").toLowerCase() === name.toLowerCase()
  );
  return opt && typeof opt.value !== "undefined" ? String(opt.value) : def;
}

async function readRaw(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks);
}

// Simple 20s timeout guard around fetch (prevents endless "thinking")
async function fetchWithTimeout(url, ms = 20000, init = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

// ---- handler ----
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  // 1) Verify Discord signature against the *raw* body
  const raw = await readRaw(req);
  const sig = req.headers["x-signature-ed25519"];
  const ts = req.headers["x-signature-timestamp"];
  const pub = process.env.DISCORD_PUBLIC_KEY;

  if (!sig || !ts || !pub) {
    res.status(401).send("Missing signature headers or DISCORD_PUBLIC_KEY");
    return;
  }

  const valid = nacl.sign.detached.verify(
    Buffer.concat([Buffer.from(ts), raw]),
    Buffer.from(sig, "hex"),
    Buffer.from(pub, "hex")
  );
  if (!valid) {
    res.status(401).send("Bad signature");
    return;
  }

  const i = JSON.parse(raw.toString("utf8"));

  // 2) PING
  if (i.type === 1) {
    res.status(200).json({ type: 1 });
    return;
  }

  // 3) Slash command
  if (i.type === 2) {
    const cmd = (i?.data?.name || "").toLowerCase();

    // /ping -> quick sanity check
    if (cmd === "ping") {
      res.status(200).json({ type: 4, data: { content: "🏓 Pong" } });
      return;
    }

    // /futures -> image-only reply
    if (cmd === "futures") {
      const sport = getStrOpt(i, "sport", "NFL");
      const category = getStrOpt(i, "category", "All");
      const market = getStrOpt(i, "market", "");

      const baseRaw = process.env.PUBLIC_BASE_URL || "";
      const base = baseRaw.replace(/\/$/, ""); // trim trailing slash if any
      if (!base) {
        res.status(200).json({
          type: 4,
          data: {
            content:
              "Config error: set PUBLIC_BASE_URL to your deployed site URL.",
            allowed_mentions: { parse: [] },
          },
        });
        return;
      }

      // 3a) ACKNOWLEDGE FAST (≤3s): DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
      // Important: we *do not* return yet; we keep running and then edit the reply.
      res.status(200).json({ type: 5 });

      try {
        // Build target page URL
        const qs = new URLSearchParams();
        if (sport) qs.set("sport", sport);
        if (category) qs.set("category", category);
        if (market) qs.set("market", market);

        const target = `${base}/futures?${qs.toString()}`;

        // Your UI exposes a modal with this selector and a data-active-category flag
        const selector = `#futures-modal[data-active-category="${
          category || "All"
        }"]`;

        // Build snap endpoint
        const snapUrl = `${base}/api/snap?url=${encodeURIComponent(
          target
        )}&w=1080&h=1350&wait=500&sel=${encodeURIComponent(
          selector
        )}&t=${Date.now()}`;

        // 3b) Render PNG server-to-server (20s guard)
        const snapRes = await fetchWithTimeout(snapUrl, 20000);
        if (!snapRes.ok) throw new Error(`snap failed: ${snapRes.status}`);
        const arrayBuf = await snapRes.arrayBuffer();
        const buf = Buffer.from(arrayBuf);

        // 3c) Build a multipart form that *attaches the PNG* and references it via attachment://
        const form = new FormData();
        form.append(
          "payload_json",
          JSON.stringify({
            // No text content; image-only via embed -> attachment://
            attachments: [{ id: 0, filename: "futures.png" }],
            embeds: [{ image: { url: "attachment://futures.png" } }],
            allowed_mentions: { parse: [] },
          })
        );
        form.append(
          "files[0]",
          new File([buf], "futures.png", { type: "image/png" })
        );

        // 3d) Edit the original deferred message
        const editUrl = `https://discord.com/api/v10/webhooks/${i.application_id}/${i.token}/messages/@original`;
        const editResp = await fetch(editUrl, { method: "PATCH", body: form });

        if (!editResp.ok) {
          const txt = await editResp.text();
          console.error("edit @original failed:", editResp.status, txt);
        }
      } catch (err) {
        // If anything fails, convert the deferred message to a visible error
        console.error("futures follow-up error:", err);
        const failUrl = `https://discord.com/api/v10/webhooks/${i.application_id}/${i.token}/messages/@original`;
        await fetch(failUrl, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: "❌ Failed to generate screenshot.",
            allowed_mentions: { parse: [] },
          }),
        });
      }

      // After follow-up work, just end the function (we already answered with type 5)
      return;
    }

    // Unknown command fallback
    res.status(200).json({
      type: 4,
      data: { content: `🤔 Unknown command: \`${cmd}\`` },
    });
    return;
  }

  // 4) Fallback
  res.status(200).json({ type: 4, data: { content: "Unhandled." } });
}
