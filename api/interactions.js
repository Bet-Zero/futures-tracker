/* global process, Buffer */
// api/interactions.js — defer -> POST file-only follow-up -> delete spinner
import nacl from "tweetnacl";
import { FormData, fetch } from "undici";

export const config = { runtime: "nodejs" };

// helpers
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

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).json({ ok: true });

  // verify signature on RAW body
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

  if (i.type === 2) {
    const cmd = (i?.data?.name || "").toLowerCase();
    if (cmd === "ping") {
      return res.status(200).json({ type: 4, data: { content: "🏓 Pong" } });
    }
    if (cmd === "futures") {
      // 1) defer so we meet Discord's 3s window
      res.status(200).json({ type: 5 });

      const sport = getStrOpt(i, "sport", "NFL");
      const category = getStrOpt(i, "category", "All");
      const market = getStrOpt(i, "market", "");
      const proto = req.headers["x-forwarded-proto"] || "https";
      const hostHeader =
        process.env.PUBLIC_BASE_URL ||
        (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
        `${proto}://${req.headers.host}`;
      const base = hostHeader.replace(/\/$/, "");
      const editUrl = `https://discord.com/api/v10/webhooks/${i.application_id}/${i.token}/messages/@original`;
      const followUrl = `https://discord.com/api/v10/webhooks/${i.application_id}/${i.token}`;

      try {
        // 2) get the PNG from /api/snap
        const qs = new URLSearchParams();
        if (sport) qs.set("sport", sport);
        if (category) qs.set("category", category);
        if (market) qs.set("market", market);
        const target = `${base}/futures?${qs.toString()}`;
        const selector = `#futures-modal[data-active-category="${
          category || "All"
        }"]`;
        const snapUrl = `${base}/api/snap?url=${encodeURIComponent(
          target
        )}&w=1080&h=1350&wait=500&sel=${encodeURIComponent(
          selector
        )}&t=${Date.now()}`;

        const snapRes = await fetchWithTimeout(snapUrl, 20000);
        if (!snapRes.ok) throw new Error(`snap failed: ${snapRes.status}`);
        const pngBuf = Buffer.from(await snapRes.arrayBuffer());

        // 3) POST a FOLLOW-UP with just the file (no embed, no text)
        const form = new FormData();
        form.append(
          "payload_json",
          JSON.stringify({
            // attachment id MUST be a string and match files[0]
            attachments: [{ id: "0", filename: "futures.png" }],
            allowed_mentions: { parse: [] },
          })
        );
        // Blob is fine on Node 18; you can also append Buffer directly
        const blob = new Blob([pngBuf], { type: "image/png" });
        form.append("files[0]", blob, "futures.png");

        const r = await fetch(followUrl, { method: "POST", body: form });

        if (r.ok) {
          // 4) delete spinner
          await fetch(editUrl, { method: "DELETE" }).catch(() => {});
        } else {
          const txt = await r.text().catch(() => "");
          // show explicit error instead of endless spinner
          await fetch(editUrl, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: `❌ Image upload failed (${r.status}). ${txt}`,
            }),
          }).catch(() => {});
        }
      } catch (err) {
        console.error("interaction error", err);
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

    return res
      .status(200)
      .json({ type: 4, data: { content: `🤔 Unknown command: \`${cmd}\`` } });
  }

  return res.status(200).json({ type: 4, data: { content: "Unhandled." } });
}
