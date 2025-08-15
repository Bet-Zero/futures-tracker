// api/interactions.mjs — TEMP TEST (defers, then edits text)
import nacl from "tweetnacl";
import { fetch } from "undici";
export const config = { runtime: "nodejs" };

async function readRaw(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  // Allow quick ping from a browser to see it's alive
  if (req.method !== "POST") return res.status(200).json({ ok: true });

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

  // Slash cmd
  if (i.type === 2) {
    // 1) Acknowledge immediately (prevents timeout)
    res.status(200).json({ type: 5 }); // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE

    // 2) Edit the deferred message with simple text
    const editUrl = `https://discord.com/api/v10/webhooks/${i.application_id}/${i.token}/messages/@original`;
    await fetch(editUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "✅ interactions endpoint is working." }),
    });
    return;
  }

  return res.status(200).json({ type: 4, data: { content: "Unhandled." } });
}
