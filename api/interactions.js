// api/interactions.js
import nacl from "tweetnacl";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  // Read raw body (needed for signature verification)
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks);

  // Verify signature from Discord
  const sig = req.headers["x-signature-ed25519"];
  const ts = req.headers["x-signature-timestamp"];
  const key = process.env.DISCORD_PUBLIC_KEY;
  if (!sig || !ts || !key) return res.status(401).send("Missing headers/env");

  const ok = nacl.sign.detached.verify(
    Buffer.concat([Buffer.from(ts), raw]),
    Buffer.from(sig, "hex"),
    Buffer.from(key, "hex")
  );
  if (!ok) return res.status(401).send("Bad signature");

  const i = JSON.parse(raw.toString("utf8"));

  // 1) PING (Discord checks your URL)
  if (i.type === 1) return res.status(200).json({ type: 1 });

  // 2) Slash commands
  if (i.type === 2) {
    const name = i?.data?.name;
    if (name === "ping") {
      return res
        .status(200)
        .json({ type: 4, data: { content: "🏓 Pong from Vercel" } });
    }
    return res
      .status(200)
      .json({ type: 4, data: { content: "Unknown command." } });
  }

  return res.status(200).json({ type: 4, data: { content: "Unhandled." } });
}
