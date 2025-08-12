// api/interactions.mjs — Discord Interactions handler (ESM)
import nacl from "tweetnacl";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  // Buffer raw body for signature verification
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks);

  const sig = req.headers["x-signature-ed25519"];
  const ts = req.headers["x-signature-timestamp"];
  const key = process.env.DISCORD_PUBLIC_KEY;

  if (!sig || !ts || !key) return res.status(401).send("Missing headers/env");

  const valid = nacl.sign.detached.verify(
    Buffer.concat([Buffer.from(ts), raw]),
    Buffer.from(sig, "hex"),
    Buffer.from(key, "hex")
  );
  if (!valid) return res.status(401).send("Bad signature");

  const i = JSON.parse(raw.toString("utf8"));

  // 1) Discord PING
  if (i.type === 1) return res.status(200).json({ type: 1 });

  // 2) Application command
  if (i.type === 2) {
    const name = (i?.data?.name || "").toLowerCase();
    console.log("INT", { name, user: i?.member?.user?.id || i?.user?.id });

    switch (name) {
      case "ping":
        return res.status(200).json({
          type: 4,
          data: { content: "🏓 Pong from Vercel" },
        });

      case "futures": {
        const base = process.env.PUBLIC_BASE_URL; // e.g. https://futures-tracker.vercel.app
        const target = process.env.FUTURES_SNAPSHOT_URL; // page to capture
        if (!base || !target) {
          return res.status(200).json({
            type: 4,
            data: {
              content:
                "Config missing: set PUBLIC_BASE_URL and FUTURES_SNAPSHOT_URL",
            },
          });
        }
        const snap = `${base}/api/snap?url=${encodeURIComponent(
          target
        )}&w=1080&h=1350&wait=1000&t=${Date.now()}`;
        return res.status(200).json({
          type: 4,
          data: { content: `📈 Futures Snapshot\n${snap}` },
        });
      }

      default:
        return res.status(200).json({
          type: 4,
          data: { content: `🤔 Unknown command: \`${name}\`` },
        });
    }
  }

  return res.status(200).json({ type: 4, data: { content: "Unhandled." } });
}
