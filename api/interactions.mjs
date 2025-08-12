// api/interactions.mjs — Discord Interactions handler (reads sport/type/category)
import nacl from "tweetnacl";

function getStrOpt(interaction, name, def = "") {
  const opts = interaction?.data?.options || [];
  const found = opts.find(
    (o) => (o?.name || "").toLowerCase() === name.toLowerCase()
  );
  return found && typeof found.value !== "undefined"
    ? String(found.value)
    : def;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  // raw body for signature verify
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks);

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
  if (i.type === 1) return res.status(200).json({ type: 1 }); // PING

  if (i.type === 2) {
    const name = (i?.data?.name || "").toLowerCase();

    switch (name) {
      case "ping":
        return res.status(200).json({
          type: 4,
          data: { content: "🏓 Pong from Vercel" },
        });

      case "futures": {
        // Your slash-command options (from your register script)
        const sport = getStrOpt(i, "sport", "NFL"); // NFL/NBA/MLB
        const type = getStrOpt(i, "type", "Futures"); // All/Futures/Awards/Props/Leaders
        const category = getStrOpt(i, "category", ""); // optional

        const base = process.env.PUBLIC_BASE_URL; // e.g., https://futures-tracker.vercel.app
        if (!base) {
          return res.status(200).json({
            type: 4,
            data: {
              content: "Config missing: set PUBLIC_BASE_URL in Vercel env",
            },
          });
        }

        // Build the page URL your site understands. Use your param names.
        // If your frontend expects different keys, change these (e.g., league/tab).
        const params = new URLSearchParams();
        if (sport) params.set("sport", sport);
        if (type) params.set("type", type);
        if (category) params.set("category", category);

        const siteBase = base.replace(/\/$/, "");
        const target = `${siteBase}/futures?${params.toString()}`;

        // Ask /api/snap to capture that specific page state
        const snap = `${siteBase}/api/snap?url=${encodeURIComponent(
          target
        )}&w=1080&h=1350&wait=1000&t=${Date.now()}`;

        return res.status(200).json({
          type: 4,
          data: {
            content: `📈 Futures Snapshot (${sport} • ${type}${
              category ? " • " + category : ""
            })\n${snap}`,
          },
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
