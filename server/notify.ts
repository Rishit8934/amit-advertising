import { env } from "process";
import fs from "fs";
import path from "path";

export async function sendWhatsAppNotification(toNumber: string, message: string) {
  const accountSid = env.TWILIO_ACCOUNT_SID;
  const authToken = env.TWILIO_AUTH_TOKEN;
  const from = env.TWILIO_WHATSAPP_FROM; // e.g. whatsapp:+1415....
  const target = env.WHATSAPP_TARGET || toNumber;

  if (!accountSid || !authToken || !from) {
    const fallbackPath = path.join(process.cwd(), 'attached_assets', 'notifications.log');
    try {
      fs.appendFileSync(fallbackPath, `[${new Date().toISOString()}] To:${target} Msg:${message}\n`);
    } catch (err) {
      console.log("WhatsApp notify skipped (no Twilio config). Message to", target, message);
    }
    return;
  }

  try {
    const body = new URLSearchParams();
    body.append("To", `whatsapp:${target}`);
    body.append("From", from.startsWith("whatsapp:") ? from : `whatsapp:${from}`);
    body.append("Body", message);

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("Failed to send WhatsApp message:", res.status, txt);
    } else {
      console.log("WhatsApp message sent to", target);
    }
  } catch (err) {
    console.error("WhatsApp notify error:", err);
  }
}
