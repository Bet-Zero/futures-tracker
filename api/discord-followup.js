/* global process, Buffer */
// api/discord-followup.js — posts image to the channel using Bot token, then deletes spinner
import { FormData, fetch } from "undici";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const { channel_id, application_id, token, pngBase64 } = await req.json();
    const botToken = process.env.DISCORD_TOKEN;
    if (!botToken)
      return res.status(500).json({ ok: false, err: "DISCORD_TOKEN missing" });

    // build attachment form
    const buf = Buffer.from(pngBase64, "base64");
    const blob = new Blob([buf], { type: "image/png" });
    const form = new FormData();
    form.append(
      "payload_json",
      JSON.stringify({
        attachments: [{ id: 0, filename: "futures.png" }],
        embeds: [{ image: { url: "attachment://futures.png" } }],
        allowed_mentions: { parse: [] },
      })
    );
    form.append("files[0]", blob, "futures.png");

    // 1) Post image as a normal message via Bot token
    const msgResp = await fetch(
      `https://discord.com/api/v10/channels/${channel_id}/messages`,
      {
        method: "POST",
        headers: { Authorization: `Bot ${botToken}` },
        body: form,
      }
    );

    // 2) Delete the original deferred "spinner" message
    const delUrl = `https://discord.com/api/v10/webhooks/${application_id}/${token}/messages/@original`;
    await fetch(delUrl, { method: "DELETE" }).catch(() => {});

    if (!msgResp.ok) {
      const t = await msgResp.text().catch(() => "");
      return res.status(500).json({ ok: false, err: t });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, err: e?.message || String(e) });
  }
}
