// api/interactions.js — defer, render PNG, hand off to helper (bot posts image), delete spinner
import nacl from "tweetnacl";
import { fetch } from "undici";

export const config = { runtime: "nodejs" };

function getStrOpt(i, name, def = "") {
  const opts = i?.data?.options || [];
  const o = opts.find(
    (x) => (x?.name || "").toLowerCase() === name.toLowerCase()
  );
  return o && typeof o.value !== "undefined" ? String(o.value) : def;
}
async function readRaw(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks);
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

  // --- verify Discord signature on RAW body ---
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
      // 1) Defer immediately
      res.status(200).json({ type: 5 });

      try {
        const sport = getStrOpt(i, "sport", "NFL");
        const category = getStrOpt(i, "category", "All");
        const market = getStrOpt(i, "market", "");
        const base = (process.env.PUBLIC_BASE_URL || "").replace(/\/$/, "");
        if (!base) throw new Error("PUBLIC_BASE_URL not set");

        // 2) Build target URL & selector
        const qs = new URLSearchParams();
        if (sport) qs.set("sport", sport);
        if (category) qs.set("category", category);
        if (market) qs.set("market", market);
        const target = `${base}/futures?${qs.toString()}`;
        const selector = `#futures-modal[data-active-category="${
          category || "All"
        }"]`;

        // 3) Render PNG via your /api/snap
        const snapUrl = `${base}/api/snap?url=${encodeURIComponent(
          target
        )}&w=1080&h=1350&wait=500&sel=${encodeURIComponent(
          selector
        )}&t=${Date.now()}`;
        const snapRes = await fetchWithTimeout(snapUrl, 20000);
        if (!snapRes.ok) throw new Error(`snap failed: ${snapRes.status}`);
        const buf = Buffer.from(await snapRes.arrayBuffer());
        const pngBase64 = buf.toString("base64");

        // 4) Hand off to helper (separate serverless invocation) to post image via Bot token
        const helperRes = await fetch(`${base}/api/discord-followup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channel_id: i.channel_id,
            application_id: i.application_id,
            token: i.token,
            pngBase64,
          }),
        });

        // 5) If helper failed, turn spinner into visible error
        if (!helperRes.ok) {
          const editUrl = `https://discord.com/api/v10/webhooks/${i.application_id}/${i.token}/messages/@original`;
          await fetch(editUrl, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: "❌ Failed to send image." }),
          }).catch(() => {});
        }
      } catch (err) {
        const editUrl = `https://discord.com/api/v10/webhooks/${i.application_id}/${i.token}/messages/@original`;
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
