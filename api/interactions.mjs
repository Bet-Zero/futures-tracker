// api/interactions.mjs — NO-VERIFY TEMP TEST
// Purpose: prove your endpoint & Discord wiring are correct.
// Behavior: immediately defers, then edits the message with plain text.

export const config = { runtime: "nodejs" };

async function readRaw(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  // Let you hit it in a browser to confirm the route is reachable
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true, note: "temp test live" });
  }

  // (NO SIGNATURE VERIFY IN THIS TEMP TEST)
  const raw = await readRaw(req);
  let i;
  try {
    i = JSON.parse(raw.toString("utf8"));
  } catch {
    // If Discord sent something unexpected, still ack so we don't time out
    res.status(200).json({ type: 5 });
    return;
  }

  // PING from Discord
  if (i.type === 1) {
    return res.status(200).json({ type: 1 });
  }

  // Slash command — always defer immediately, then edit with text
  if (i.type === 2) {
    // 1) Ack in ≤3s
    res.status(200).json({ type: 5 });

    // 2) Edit the deferred message
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

  // Fallback
  return res.status(200).json({ type: 4, data: { content: "Unhandled." } });
}
