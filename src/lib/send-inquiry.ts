import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { lab } from "@/data/lab";

const inquirySchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(200),
  topic: z.string().trim().min(1).max(160),
  message: z.string().trim().min(1).max(8000),
  source: z.enum(["contact", "participate"]),
  website: z.string().max(200).optional(),
});

export type InquiryResult = {
  ok: true;
  pendingActivation: boolean;
};

export const sendInquiry = createServerFn({ method: "POST" })
  .validator(inquirySchema)
  .handler(async ({ data }): Promise<InquiryResult> => {
    if (data.website?.trim()) {
      return { ok: true, pendingActivation: false };
    }

    const subject =
      data.source === "participate"
        ? `IEI Lab study interest — ${data.topic}`
        : `IEI Lab contact — ${data.topic}`;

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM ?? "IEI Lab <onboarding@resend.dev>",
          to: [lab.email],
          reply_to: data.email,
          subject,
          text: formatBody(data),
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Email service rejected the message.");
      }
      return { ok: true, pendingActivation: false };
    }

    const res = await fetch(
      `https://formsubmit.co/ajax/${encodeURIComponent(lab.email)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          _replyto: data.email,
          _subject: subject,
          topic: data.topic,
          source: data.source,
          message: data.message,
          _template: "table",
          _captcha: "false",
        }),
      },
    );

    const json = (await res.json().catch(() => ({}))) as {
      success?: string | boolean;
      message?: string;
    };
    const msg = String(json.message ?? "");
    const pending = /activat|confirm/i.test(msg);
    const success = json.success === true || json.success === "true";

    if (!success && !pending) {
      throw new Error(msg || "Could not send the message. Please email us directly.");
    }

    return { ok: true, pendingActivation: pending || !success };
  });

function formatBody(data: z.infer<typeof inquirySchema>) {
  return [
    `Source: ${data.source}`,
    `Topic: ${data.topic}`,
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    "",
    data.message,
  ].join("\n");
}
