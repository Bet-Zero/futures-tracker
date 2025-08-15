// api/interactions.mjs — FULL FILE REPLACEMENT (image-only reply for /futures)
import nacl from "tweetnacl";
import { FormData, File, fetch } from "undici";

// helper: pull a string option off the interaction
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

  // --- verify Discord signature (needs raw body) ---
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

  // PING
  if (i.type === 1) return res.status(200).json({ type: 1 });

  // APPLICATION_COMMAND
  if (i.type === 2) {
    const name = (i?.data?.name || "").toLowerCase();

    if (name === "ping") {
      return res
        .status(200)
        .json({ type: 4, data: { content: "🏓 Pong from Vercel" } });
    }

    if (name === "futures") {
      const sport = getStrOpt(i, "sport", "NFL");
      const category = getStrOpt(i, "category", "All");
      const market = getStrOpt(i, "market", "");

      const siteBase = (process.env.PUBLIC_BASE_URL || "").replace(/\/$/, "");
      if (!siteBase) {
        return res.status(200).json({
          type: 4,
          data: {
            content: "Config missing: set PUBLIC_BASE_URL in Vercel env",
            allowed_mentions: { parse: [] },
          },
        });
      }

      // Acknowledge quickly (defer) so we can do work after.
      res.status(200).json({ type: 5 }); // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE

      // Continue work after acknowledging:
      try {
        // Build target page and snap selector (same as your existing logic)
        const params = new URLSearchParams();
        if (sport) params.set("sport", sport);
        if (category) params.set("category", category);
        if (market) params.set("market", market);

        const target = `${siteBase}/futures?${params.toString()}`;
        const sel = `#futures-modal[data-active-category="${
          category || "All"
        }"]`;
        const snapUrl = `${siteBase}/api/snap?url=${encodeURIComponent(
          target
        )}&w=1080&h=1350&wait=500&sel=${encodeURIComponent(
          sel
        )}&t=${Date.now()}`;

        // Render PNG server-to-server
        const snapRes = await fetch(snapUrl);
        if (!snapRes.ok) throw new Error(`snap failed: ${snapRes.status}`);
        const arrayBuf = await snapRes.arrayBuffer();
        const buf = Buffer.from(arrayBuf);

        // Prepare a file-backed edit (image only; no link text)
        const form = new FormData();
        form.append(
          "payload_json",
          JSON.stringify({
            // no content; embed references the attachment only
            attachments: [{ id: 0, filename: "futures.png" }],
            embeds: [{ image: { url: "attachment://futures.png" } }],
            allowed_mentions: { parse: [] },
          })
        );
        form.append(
          "files[0]",
          new Blob([buf], { type: "image/png" }),
          "futures.png"
        );

        // Edit the original deferred message
        const editUrl = `https://discord.com/api/v10/webhooks/${i.application_id}/${i.token}/messages/@original`;
        const resp = await fetch(editUrl, { method: "PATCH", body: form });
        if (!resp.ok) {
          const t = await resp.text();
          console.error("edit original failed", resp.status, t);
        }
      } catch (err) {
        console.error("follow-up error", err);
        // Fall back to a visible error if something breaks
        const editUrl = `https://discord.com/api/v10/webhooks/${i.application_id}/${i.token}/messages/@original`;
        await fetch(editUrl, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: "❌ Failed to generate screenshot.",
          }),
        });
      }
      return; // we've already responded with the deferral above
    }

    // Unknown command
    return res.status(200).json({
      type: 4,
      data: { content: `🤔 Unknown command: \`${name}\`` },
    });
  }

  // Fallback
  return res.status(200).json({ type: 4, data: { content: "Unhandled." } });
}
