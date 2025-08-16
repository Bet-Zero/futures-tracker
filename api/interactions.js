/* ============================================================================
   FULL DROP-IN: api/interactions.js  (Defer → PATCH @original with file)
   - Verifies raw-body signature (tweetnacl)
   - Defers (type 5) within 3s
   - Calls /api/snap to get a PNG
   - Replaces spinner by PATCHing @original with the image as an attachment
   - Uses waitUntil (Vercel) for post-response work
   ============================================================================ */
import nacl from "tweetnacl";
import { FormData, fetch } from "undici";
import { waitUntil } from "@vercel/functions";

export const config = {
  runtime: "nodejs",
  maxDuration: 30,
};

// ---------- helpers ----------
async function readRaw(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks);
}
function getStrOpt(i, name, def = "") {
  const opts = i?.data?.options || [];
  const o = opts.find(
    (x) => (x?.name || "").toLowerCase() === name.toLowerCase()
  );
  return o && typeof o.value !== "undefined" ? String(o.value) : def;
}
async function fetchWithTimeout(url, ms = 25000, init = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

// ---------- handler ----------
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).json({ ok: true });

  // 1) Verify Discord signature on RAW body
  const raw = await readRaw(req);
  const sig = req.headers["x-signature-ed25519"];
  const ts = req.headers["x-signature-timestamp"];
  const pub = process.env.DISCORD_PUBLIC_KEY;
  if (!sig || !ts || !pub)
    return res.status(401).send("Missing signature env/headers");

  const ok = nacl.sign.detached.verify(
    Buffer.concat([Buffer.from(ts), raw]),
    Buffer.from(sig, "hex"),
    Buffer.from(pub, "hex")
  );
  if (!ok) return res.status(401).send("Bad signature");

  // 2) Parse interaction
  let i;
  try {
    i = JSON.parse(raw.toString("utf8"));
  } catch {
    return res.status(400).send("Invalid JSON");
  }

  // 3) PING
  if (i.type === 1) return res.status(200).json({ type: 1 });

  // 4) Application commands
  if (i.type === 2) {
    const cmd = (i?.data?.name || "").toLowerCase();

    if (cmd === "ping") {
      return res.status(200).json({ type: 4, data: { content: "🏓 Pong" } });
    }

    if (cmd === "futures") {
      // A) Defer immediately (Discord’s 3s SLA)
      res.status(200).json({ type: 5 });

      // B) Do the work after responding (Vercel-safe)
      waitUntil(
        (async () => {
          const base = (process.env.PUBLIC_BASE_URL || "").replace(/\/$/, "");
          const editUrl = `https://discord.com/api/v10/webhooks/${i.application_id}/${i.token}/messages/@original`;

          try {
            if (!base) throw new Error("PUBLIC_BASE_URL not set");

            // Command options (support both 'type' and 'market')
            const sport = getStrOpt(i, "sport", "NFL");
            const category = getStrOpt(i, "category", "All");
            const type = getStrOpt(i, "type", "All");
            const market = getStrOpt(i, "market", "");

            // Build your target page
            const qs = new URLSearchParams();
            if (sport) qs.set("sport", sport);
            if (category) qs.set("category", category);
            if (type) qs.set("type", type);
            if (market) qs.set("market", market);
            const target = `${base}/futures?${qs.toString()}`;

            // Optional: focus a specific element/state
            const sel =
              `#futures-modal` +
              (category ? `[data-active-category="${category}"]` : "");

            // Call /api/snap → returns PNG bytes
            const snapUrl = `${base}/api/snap?url=${encodeURIComponent(
              target
            )}&w=1080&h=1350&wait=600&sel=${encodeURIComponent(
              sel
            )}&t=${Date.now()}`;

            const snapRes = await fetchWithTimeout(snapUrl, 30000);
            if (!snapRes.ok) {
              const txt = await snapRes.text().catch(() => "");
              throw new Error(`snap failed: ${snapRes.status} ${txt}`);
            }
            const pngBuf = Buffer.from(await snapRes.arrayBuffer());

            // PATCH the original message with the file (no follow-up, no delete)
            const form = new FormData();
            // Send just the image as a direct attachment without embed
            const payload = {
              content: "", // keep clean; no text
              // Remove embeds entirely to send as direct attachment
              attachments: [{ id: 0, filename: "futures.png" }],
              allowed_mentions: { parse: [] },
            };
            form.append("payload_json", JSON.stringify(payload));
            const blob = new Blob([pngBuf], { type: "image/png" });
            form.append("files[0]", blob, "futures.png");

            const r = await fetch(editUrl, { method: "PATCH", body: form });
            if (!r.ok) {
              const txt = await r.text().catch(() => "");
              throw new Error(`edit @original failed: ${r.status} ${txt}`);
            }
          } catch (err) {
            // Replace spinner with a visible error instead of disappearing
            await fetch(editUrl, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                content: `❌ Failed to generate screenshot. ${String(
                  err?.message || err
                )}`,
                allowed_mentions: { parse: [] },
              }),
            }).catch(() => {});
          }
        })()
      );

      return; // already responded with defer
    }

    // Unknown command
    return res
      .status(200)
      .json({ type: 4, data: { content: `🤔 Unknown command: \`${cmd}\`` } });
  }

  // Fallback
  return res.status(200).json({ type: 4, data: { content: "Unhandled." } });
}
