/* ============================================================================
   FULL DROP-IN: api/interactions.js (Vercel Serverless, uses waitUntil)
   - Verifies Discord signatures on the RAW body (tweetnacl)
   - Defers within 3s (type 5)
   - Calls your /api/snap to render a PNG
   - Posts a FILE-ONLY follow-up (no visible URL)
   - Deletes the spinner (@original) or patches an error on failure
   - Uses waitUntil to ensure post-response work finishes on Vercel
   ============================================================================ */

import nacl from "tweetnacl";
import { FormData, fetch } from "undici";
import { waitUntil } from "@vercel/functions";

export const config = {
  runtime: "nodejs",
  // Bump if your screenshots take longer (applies to the WHOLE function)
  maxDuration: 30,
};

// ---------- helpers ----------
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

// ---------- handler ----------
export default async function handler(req, res) {
  // Discord sends POSTs only; if pinging the route manually, keep it harmless
  if (req.method !== "POST") return res.status(200).json({ ok: true });

  // 1) Verify Discord signature on the RAW request body
  const raw = await readRaw(req);
  const sig = req.headers["x-signature-ed25519"];
  const ts = req.headers["x-signature-timestamp"];
  const pub = process.env.DISCORD_PUBLIC_KEY;

  if (!sig || !ts || !pub) {
    return res.status(401).send("Missing signature headers/env");
  }

  const verified = nacl.sign.detached.verify(
    Buffer.concat([Buffer.from(ts), raw]),
    Buffer.from(sig, "hex"),
    Buffer.from(pub, "hex")
  );
  if (!verified) return res.status(401).send("Bad signature");

  // 2) Parse the interaction safely
  let i;
  try {
    i = JSON.parse(raw.toString("utf8"));
  } catch {
    return res.status(400).send("Invalid JSON");
  }

  // 3) PING → respond with PONG
  if (i.type === 1) {
    return res.status(200).json({ type: 1 }); // PONG
  }

  // 4) Application Command
  if (i.type === 2) {
    const cmd = (i?.data?.name || "").toLowerCase();

    if (cmd === "ping") {
      return res.status(200).json({ type: 4, data: { content: "🏓 Pong" } });
    }

    if (cmd === "futures") {
      // Immediately defer to satisfy the 3s Discord SLA
      res.status(200).json({ type: 5 });

      // Continue the heavy work after responding (Vercel-safe)
      waitUntil(
        (async () => {
          const base = (process.env.PUBLIC_BASE_URL || "").replace(/\/$/, "");
          const editUrl = `https://discord.com/api/v10/webhooks/${i.application_id}/${i.token}/messages/@original`;
          const followUrl = `https://discord.com/api/v10/webhooks/${i.application_id}/${i.token}`;

          try {
            if (!base) throw new Error("PUBLIC_BASE_URL not set");

            // Read options (support both "type" and "market" to be flexible)
            const sport = getStrOpt(i, "sport", "NFL");
            const category = getStrOpt(i, "category", "All");
            const type = getStrOpt(i, "type", "All");
            const market = getStrOpt(i, "market", "");

            // Build your site target URL
            const qs = new URLSearchParams();
            if (sport) qs.set("sport", sport);
            if (category) qs.set("category", category);
            // Include both if present; your /futures page can ignore unknowns
            if (type) qs.set("type", type);
            if (market) qs.set("market", market);

            const target = `${base}/futures?${qs.toString()}`;

            // Optional: aim the crop at a specific element/state
            const sel =
              `#futures-modal` +
              (category ? `[data-active-category="${category}"]` : "");

            // Call your /api/snap to produce a PNG
            const snapUrl = `${base}/api/snap?url=${encodeURIComponent(
              target
            )}&w=1080&h=1350&wait=600&sel=${encodeURIComponent(sel)}&t=${
              Date.now() // bust cache
            }`;

            const snapRes = await fetchWithTimeout(snapUrl, 25000);
            if (!snapRes.ok) {
              const txt = await snapRes.text().catch(() => "");
              throw new Error(`snap failed: ${snapRes.status} ${txt}`);
            }
            const pngBuf = Buffer.from(await snapRes.arrayBuffer());

            // POST a FOLLOW-UP with just the file (no embed, no text)
            const form = new FormData();
            form.append(
              "payload_json",
              JSON.stringify({
                // attachment id MUST be a string and match files[0]
                attachments: [{ id: "0", filename: "futures.png" }],
                allowed_mentions: { parse: [] },
              })
            );
            const blob = new Blob([pngBuf], { type: "image/png" });
            form.append("files[0]", blob, "futures.png");

            const upload = await fetch(followUrl, {
              method: "POST",
              body: form,
            });
            if (!upload.ok) {
              const txt = await upload.text().catch(() => "");
              // Replace spinner with an explicit error
              await fetch(editUrl, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  content: `❌ Image upload failed (${upload.status}). ${txt}`,
                  allowed_mentions: { parse: [] },
                }),
              }).catch(() => {});
              return;
            }

            // Success: delete the spinner (@original)
            await fetch(editUrl, { method: "DELETE" }).catch(() => {});
          } catch (err) {
            // Show a user-friendly error instead of leaving a spinner
            await fetch(editUrl, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                content: `❌ Failed to generate screenshot. ${String(
                  err?.message || err
                )}`,
                allowed_mentions: { parse: [] },
              }),
            }).catch(() => {});
          }
        })()
      );

      return; // already responded with defer
    }

    // Unknown command
    return res
      .status(200)
      .json({ type: 4, data: { content: `🤔 Unknown command: \`${cmd}\`` } });
  }

  // Fallback
  return res.status(200).json({ type: 4, data: { content: "Unhandled." } });
}
