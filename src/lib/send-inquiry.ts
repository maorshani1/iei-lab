import { lab } from "@/data/lab";

export type InquiryInput = {
  name: string;
  email: string;
  topic: string;
  message: string;
  source: "contact" | "participate";
  website?: string;
};

export type InquiryResult = {
  ok: true;
  pendingActivation: boolean;
};

/** Prefill a mail draft if the web form cannot deliver. */
export function inquiryMailto(data: InquiryInput) {
  const subject =
    data.source === "participate"
      ? `IEI Lab study interest — ${data.topic}`
      : `IEI Lab contact — ${data.topic}`;
  const body = [
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Topic: ${data.topic}`,
    "",
    data.message,
  ].join("\n");
  return `mailto:${lab.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export async function sendInquiry(input: {
  data: InquiryInput;
}): Promise<InquiryResult> {
  const data = input.data;
  if (data.website?.trim()) {
    return { ok: true, pendingActivation: false };
  }

  const subject =
    data.source === "participate"
      ? `IEI Lab study interest — ${data.topic}`
      : `IEI Lab contact — ${data.topic}`;

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
        _template: "table",
        _captcha: "false",
        _url: "https://www.maorshani.com/contact",
        topic: data.topic,
        source: data.source,
        message: data.message,
      }),
    },
  );

  const json = (await res.json().catch(() => ({}))) as {
    success?: string | boolean;
    message?: string;
  };
  const msg = String(json.message ?? "");
  const pending = /activat|confirm|check your email|sent you/i.test(msg);
  const success = json.success === true || json.success === "true";

  if (success) return { ok: true, pendingActivation: false };
  if (pending) return { ok: true, pendingActivation: true };

  throw new Error(
    msg && !/rate limit/i.test(msg)
      ? msg
      : "Could not send from the website. Use the email button below.",
  );
}
