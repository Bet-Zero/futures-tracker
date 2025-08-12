// api/interactions.mjs
import nacl from "tweetnacl";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  // Read raw body (required for signature verification)
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks);

  // Verify Discord signature
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

  // PING
  if (i.type === 1) return res.status(200).json({ type: 1 });

  // Slash command
  if (i.type === 2) {
    // Handle subcommands (e.g. /futures show) by extracting the first subcommand name
    let name = i?.data?.name || "";
    const opt0 = i?.data?.options?.[0];
    if (opt0 && opt0.type === 1 && opt0.name) {
      // subcommand present: combine for logging/branching if you want
      name = `${name} ${opt0.name}`; // e.g. "futures show"
    }
    name = name.toLowerCase();

    // TEMP: log what we actually received
    console.log("INT", {
      name,
      user: i?.member?.user?.id || i?.user?.id,
    });

    switch (name) {
      case "ping":
        return res
          .status(200)
          .json({ type: 4, data: { content: "🏓 Pong from Vercel" } });

      case "futures":
        // TODO: plug in your real logic here
        return res
          .status(200)
          .json({ type: 4, data: { content: "📈 Futures stub response" } });

      // Example if you use a subcommand like /futures show
      case "futures show":
        return res
          .status(200)
          .json({ type: 4, data: { content: "📊 Futures show (stub)" } });

      default:
        // Echo back the name so you see exactly what to route
        return res.status(200).json({
          type: 4,
          data: {
            content: `🤔 Unknown command: \`${name}\`. Check router or registration.`,
          },
        });
    }
  }

  return res.status(200).json({ type: 4, data: { content: "Unhandled." } });
}
