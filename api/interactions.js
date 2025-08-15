// api/interactions.js — MINIMAL INSTANT REPLY
// Responds immediately with a normal message (type 4). No signature verify.
// If this times out, Discord isn't reaching your function.

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  // Browser sanity check: should show this JSON
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true, note: "instant test live" });
  }

  // Always answer immediately (≤3s) so Discord won't time out
  return res.status(200).json({
    type: 4,
    data: { content: "✅ instant reply (endpoint reachable and responding)." },
  });
}
