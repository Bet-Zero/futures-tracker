// api/interactions.js — FINAL: defer -> POST follow-up with image -> delete spinner
// Message result = image only (no link text)

import nacl from "tweetnacl";
import { FormData, fetch } from "undici";

export const config = { runtime: "nodejs" };

// --- helpers ---
async function readRaw(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks);
}
function getStrOpt(i, name, def = "") {
  const opts = i?.data?.options || [];
  const o = opts.find(
    (x) => (x?.name || "").toLowerCase() === name.toLowerCase()
  );
  return o && typeof o.value !== "undefined" ? String(o.value) : def;
}
async function fetchWithTimeout(url, ms = 20000, init = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}
function buildImageFormFromBuffer(buf, filename = "futures.png") {
  // Use Blob (works on Node 18+) and let undici set the multipart boundary
  const blob = new Blob([buf], { type: "image/png" });
  const form = new FormData();
  form.append(
    "payload_json",
    JSON.stringify({
      // no text; embed points at the attachment so the message is image-only
      attachments: [{ id: 0, filename }],
      embeds: [{ image: { url: `attachment://${filename}` } }],
      allowed_mentions: { parse: [] },
    })
  );
  form.append("files[0]", blob, filename);
  return form;
}

// --- handler ---
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).json({ ok: true });

  // verify signature using RAW body
  const raw = await readRaw(req);
  const sig = req.headers["x-signature-ed25519"];
  const ts = req.headers["x-signature-timestamp"];
  const pub = process.env.DISCORD_PUBLIC_KEY;
  if (!sig || !ts || !pub)
    return res.status(401).send("Missing signature headers/env");

  const ok = nacl.sign.detached.verify(
    Buffer.concat([Buffer.from(ts), raw]),
    Buffer.from(sig, "hex"),
    Buffer.from(pub, "hex")
  );
  if (!ok) return res.status(401).send("Bad signature");

  const i = JSON.parse(raw.toString("utf8"));

  // PING
  if (i.type === 1) return res.status(200).json({ type: 1 });

  // Slash commands
  if (i.type === 2) {
    const cmd = (i?.data?.name || "").toLowerCase();

    if (cmd === "ping") {
      return res.status(200).json({ type: 4, data: { content: "🏓 Pong" } });
    }

    if (cmd === "futures") {
      // 1) defer immediately so Discord doesn't time out
      res.status(200).json({ type: 5 }); // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE

      const sport = getStrOpt(i, "sport", "NFL");
      const category = getStrOpt(i, "category", "All");
      const market = getStrOpt(i, "market", "");
      const base = (process.env.PUBLIC_BASE_URL || "").replace(/\/$/, "");

      const editUrl = `https://discord.com/api/v10/webhooks/${i.application_id}/${i.token}/messages/@original`;
      const followUrl = `https://discord.com/api/v10/webhooks/${i.application_id}/${i.token}`;

      try {
        if (!base) throw new Error("PUBLIC_BASE_URL not set");

        // Build the page to screenshot
        const qs = new URLSearchParams();
        if (sport) qs.set("sport", sport);
        if (category) qs.set("category", category);
        if (market) qs.set("market", market);
        const target = `${base}/futures?${qs.toString()}`;
        const selector = `#futures-modal[data-active-category="${
          category || "All"
        }"]`;

        // 2) render PNG via /api/snap (you just fixed this; logs show 200)
        const snapUrl = `${base}/api/snap?url=${encodeURIComponent(
          target
        )}&w=1080&h=1350&wait=500&sel=${encodeURIComponent(
          selector
        )}&t=${Date.now()}`;
        const snapRes = await fetchWithTimeout(snapUrl, 20000);
        if (!snapRes.ok) throw new Error(`snap failed: ${snapRes.status}`);
        const pngBuf = Buffer.from(await snapRes.arrayBuffer());

        // 3) POST a FOLLOW-UP with the image (simpler & more reliable than PATCH edit)
        const form = buildImageFormFromBuffer(pngBuf, "futures.png");
        const r = await fetch(followUrl, { method: "POST", body: form });

        if (r.ok) {
          // 4) delete the original deferred message (removes spinner)
          await fetch(editUrl, { method: "DELETE" }).catch(() => {});
        } else {
          // turn the spinner into a visible error
          const txt = await r.text().catch(() => "");
          await fetch(editUrl, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: `❌ Failed to attach image (${r.status}). ${txt}`,
            }),
          }).catch(() => {});
        }
      } catch (err) {
        await fetch(editUrl, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: "❌ Failed to generate screenshot.",
          }),
        }).catch(() => {});
      }
      return;
    }

    // Unknown command
    return res
      .status(200)
      .json({ type: 4, data: { content: `🤔 Unknown command: \`${cmd}\`` } });
  }

  // Fallback
  return res.status(200).json({ type: 4, data: { content: "Unhandled." } });
}
