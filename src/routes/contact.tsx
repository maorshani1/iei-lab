import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { lab, pi } from "@/data/lab";
import { sendInquiry } from "@/lib/send-inquiry";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => ({
    meta: [{ title: "Contact · IEI Lab" }],
  }),
});

function ContactPage() {
  const [submitted, setSubmitted] = useState<"sent" | "activate" | null>(null);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    topic: "general",
    message: "",
    website: "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Please complete all required fields.");
      return;
    }
    setSending(true);
    try {
      const result = await sendInquiry({
        data: {
          name: form.name,
          email: form.email,
          topic: form.topic,
          message: form.message,
          source: "contact",
          website: form.website,
        },
      });
      setSubmitted(result.pendingActivation ? "activate" : "sent");
      toast.success(
        result.pendingActivation
          ? "One confirmation step is required."
          : "Message sent.",
      );
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not send. Please email us directly.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Write to us"
        description="Media, collaboration, student inquiries, and general questions."
      />

      <section>
        <div className="shell grid gap-14 py-12 sm:py-16 lg:grid-cols-12">
          <div className="space-y-10 lg:col-span-5">
            <div>
              <p className="type-meta">Director</p>
              <p className="mt-3 font-serif text-2xl tracking-tight">
                {pi.name}
              </p>
              <p className="mt-2 text-sm text-ink-3">
                {pi.title} · {lab.department}
                <br />
                {lab.university}
              </p>
            </div>
            <div>
              <p className="type-meta">Email</p>
              <div className="mt-3 space-y-1">
                {lab.emails.map((em) => (
                  <a
                    key={em}
                    href={`mailto:${em}`}
                    className="block link-ink text-sm"
                  >
                    {em}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <p className="type-meta">Phone</p>
              <p className="mt-3 text-sm text-ink-2">
                Israel {lab.phones.israel}
                <br />
                Germany {lab.phones.germany}
              </p>
            </div>
            <div>
              <p className="type-meta">Elsewhere</p>
              <div className="mt-3 flex flex-col gap-2 text-sm">
                <a
                  href={lab.scholar}
                  target="_blank"
                  rel="noreferrer"
                  className="link-quiet text-ink-3"
                >
                  Google Scholar ↗
                </a>
                <a
                  href={lab.researchGate}
                  target="_blank"
                  rel="noreferrer"
                  className="link-quiet text-ink-3"
                >
                  ResearchGate ↗
                </a>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            {submitted ? (
              <div className="border border-rule px-6 py-14 text-center">
                <p className="font-serif text-2xl">
                  {submitted === "activate" ? "Check your inbox" : "Thank you"}
                </p>
                <p className="mx-auto mt-3 max-w-sm text-sm text-ink-3">
                  {submitted === "activate" ? (
                    <>
                      The first message activates the form. Open the email sent
                      to{" "}
                      <a href={`mailto:${lab.email}`} className="link-ink">
                        {lab.email}
                      </a>{" "}
                      (check spam), click the confirmation link, then visitors’
                      messages will arrive there.
                    </>
                  ) : (
                    <>
                      Your message was sent to the lab. For an immediate reply
                      you can also email{" "}
                      <a href={`mailto:${lab.email}`} className="link-ink">
                        {lab.email}
                      </a>
                      .
                    </>
                  )}
                </p>
                <Button
                  className="mt-6"
                  variant="outline"
                  onClick={() => setSubmitted(null)}
                >
                  Send another
                </Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-8">
                <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                  <label htmlFor="c-website">Website</label>
                  <input
                    id="c-website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.website}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, website: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-8 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="c-name">Name</Label>
                    <Input
                      id="c-name"
                      required
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="c-email">Email</Label>
                    <Input
                      id="c-email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, email: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-topic">Topic</Label>
                  <select
                    id="c-topic"
                    value={form.topic}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, topic: e.target.value }))
                    }
                    className="flex h-11 w-full border-0 border-b border-rule bg-transparent text-sm focus:border-ink focus:outline-none"
                  >
                    <option value="general">General inquiry</option>
                    <option value="media">Media / press</option>
                    <option value="student">Student / supervision</option>
                    <option value="collab">Research collaboration</option>
                    <option value="participate">Study participation</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-message">Message</Label>
                  <Textarea
                    id="c-message"
                    required
                    value={form.message}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, message: e.target.value }))
                    }
                    placeholder="How can we help?"
                  />
                </div>
                <Button type="submit" disabled={sending}>
                  {sending ? "Sending…" : "Send message"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
