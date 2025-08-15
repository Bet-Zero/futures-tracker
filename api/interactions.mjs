// api/interactions.js — TEMP NO-VERIFY sanity check
// Always defers within 3s and then edits with simple text.

export const config = { runtime: "nodejs" };

async function readRaw(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  // Browser check so you can verify the route
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true, note: "temp test live" });
  }

  const raw = await readRaw(req);
  let i;
  try {
    i = JSON.parse(raw.toString("utf8"));
  } catch {
    i = {};
  }

  // Respond to Discord PINGs
  if (i.type === 1) return res.status(200).json({ type: 1 });

  // Any slash command: defer fast, then edit with text
  if (i.type === 2) {
    res.status(200).json({ type: 5 }); // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE

    const url = `https://discord.com/api/v10/webhooks/${i.application_id}/${i.token}/messages/@original`;
    await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "✅ interactions endpoint is wired up.",
      }),
    });
    return;
  }

  return res.status(200).json({ type: 4, data: { content: "Unhandled." } });
}
