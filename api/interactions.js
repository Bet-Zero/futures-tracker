// api/interactions.js — TEMP: defer, then POST a follow-up text (no edit)
// Goal: kill the spinner and prove follow-up works.

import { fetch } from "undici";
export const config = { runtime: "nodejs" };

async function readRaw(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  // Browser check (should return this JSON if route is live)
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true, note: "temp-followup test live" });
  }

  const raw = await readRaw(req);
  let i;
  try {
    i = JSON.parse(raw.toString("utf8"));
  } catch {
    i = {};
  }

  // Respond to PING
  if (i.type === 1) {
    return res.status(200).json({ type: 1 });
  }

  if (i.type === 2) {
    // 1) Defer immediately so we don't time out
    res.status(200).json({ type: 5 }); // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE

    // 2) Post a FOLLOW-UP (this creates a brand new message and clears the spinner)
    const followUrl = `https://discord.com/api/v10/webhooks/${i.application_id}/${i.token}`;
    const r = await fetch(followUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "✅ follow-up posted (wiring confirmed).",
      }),
    });

    // (Optional) if the POST succeeded, delete the original spinner
    if (r.ok) {
      const delUrl = `https://discord.com/api/v10/webhooks/${i.application_id}/${i.token}/messages/@original`;
      await fetch(delUrl, { method: "DELETE" }).catch(() => {});
    }
    return;
  }

  return res.status(200).json({ type: 4, data: { content: "Unhandled." } });
}
