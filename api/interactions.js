// api/interactions.js — DEFERS then POSTS a 1x1 PNG attachment (no screenshot)
// Goal: prove webhook upload works. If this still hangs, it's either undici missing or Vercel halting after defer.

import { FormData, fetch } from "undici"; // keep it simple: Blob + filename (avoid File on Node 18)
export const config = { runtime: "nodejs" };

async function readRaw(req) {
  const bufs = [];
  for await (const c of req) bufs.push(c);
  return Buffer.concat(bufs);
}

// 1×1 transparent PNG bytes (tiny)
const TINY_PNG = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6360000002000154a0b5c10000000049454e44ae426082",
  "hex"
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true, note: "tiny-png test live" });
  }

  // Parse the interaction (no signature verify on this tiny test)
  const raw = await readRaw(req);
  let i = {};
  try {
    i = JSON.parse(raw.toString("utf8"));
  } catch {}

  // PING
  if (i.type === 1) return res.status(200).json({ type: 1 });

  // Slash command
  if (i.type === 2) {
    // Defer immediately
    res.status(200).json({ type: 5 });

    // Build multipart with a real image attachment using Blob
    const blob = new Blob([TINY_PNG], { type: "image/png" });
    const form = new FormData();
    form.append(
      "payload_json",
      JSON.stringify({
        attachments: [{ id: 0, filename: "tiny.png" }],
        embeds: [{ image: { url: "attachment://tiny.png" } }],
        allowed_mentions: { parse: [] },
      })
    );
    form.append("files[0]", blob, "tiny.png");

    // Post as a follow-up (not edit) to guarantee a visible message
    const followUrl = `https://discord.com/api/v10/webhooks/${i.application_id}/${i.token}`;
    const r = await fetch(followUrl, { method: "POST", body: form });

    // If follow-up succeeded, delete the spinner
    if (r.ok) {
      const delUrl = `https://discord.com/api/v10/webhooks/${i.application_id}/${i.token}/messages/@original`;
      await fetch(delUrl, { method: "DELETE" }).catch(() => {});
    } else {
      // Last-resort: convert the spinner into a text error
      const editUrl = `https://discord.com/api/v10/webhooks/${i.application_id}/${i.token}/messages/@original`;
      await fetch(editUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "❌ follow-up upload failed." }),
      }).catch(() => {});
    }
    return;
  }

  return res.status(200).json({ type: 4, data: { content: "Unhandled." } });
}
