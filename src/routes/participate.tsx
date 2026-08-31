import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { lab } from "@/data/lab";
import { sendInquiry, inquiryMailto } from "@/lib/send-inquiry";

export const Route = createFileRoute("/participate")({
  component: ParticipatePage,
  head: () => ({
    meta: [{ title: "Participate · IEI Lab" }],
  }),
});

const studies = [
  {
    id: "panel-interest",
    title: "General research panel (Israel)",
    status: "Open interest form",
    audience: "Adults 18+ in Israel",
    duration: "Varies by study (10–25 min)",
    compensation: "Varies; details per study",
    summary:
      "Interest list for surveys and experiments on identity, intergroup attitudes, resilience, and related topics. Contact only when a study matches your eligibility.",
  },
  {
    id: "diaspora",
    title: "Jewish diaspora well-being & antisemitism",
    status: "Rolling recruitment",
    audience: "Jewish adults outside Israel",
    duration: "15–20 minutes",
    compensation: "Optional prize draws when available",
    summary:
      "Experiences of antisemitism, coping, community trust, and psychosocial health—with careful confidentiality and trauma-informed framing.",
  },
  {
    id: "students",
    title: "Student participant pool",
    status: "Opening with the academic year",
    audience: "Ariel University students",
    duration: "Course-credit or paid options",
    compensation: "As approved by protocols",
    summary:
      "Department-linked opportunities for psychology and social-science students under ethical approval.",
  },
];

function ParticipatePage() {
  const [submitted, setSubmitted] = useState<"sent" | "activate" | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    study: studies[0].id,
    message: "",
    website: "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Please provide your name and email.");
      return;
    }
    setSending(true);
    setSendError(null);
    try {
      const studyTitle =
        studies.find((s) => s.id === form.study)?.title ?? form.study;
      const result = await sendInquiry({
        data: {
          name: form.name,
          email: form.email,
          topic: studyTitle,
          message: form.message.trim() || "(no additional note)",
          source: "participate",
          website: form.website,
        },
      });
      setSubmitted(result.pendingActivation ? "activate" : "sent");
      toast.success(
        result.pendingActivation
          ? "One confirmation step is required."
          : "Interest sent. Thank you.",
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Could not send. Please email us directly.";
      setSendError(message);
      toast.error(message);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Participate"
        title="Take part"
        description="Help advance evidence on intergroup experiences, identity, and well-being. Studies follow institutional ethics; participation is voluntary and confidential."
      />

      <section className="border-b border-rule">
        <div className="shell py-12 sm:py-14">
          <div className="grid gap-10 border-b border-rule pb-12 sm:grid-cols-3">
            {[
              {
                t: "Clear information",
                d: "Each invitation explains purpose, duration, risks and benefits, and your right to withdraw.",
              },
              {
                t: "Ethics & privacy",
                d: "Protocols follow university ethics review. Data are stored securely and reported in aggregate.",
              },
              {
                t: "No pressure",
                d: "You choose which studies to join. Declining never affects academic standing.",
              },
            ].map((item) => (
              <div key={item.t}>
                <h2 className="font-serif text-xl tracking-tight">{item.t}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-3">
                  {item.d}
                </p>
              </div>
            ))}
          </div>

          <p className="type-meta mt-12">Opportunities</p>
          <ul className="mt-6 divide-y divide-rule border-t border-rule">
            {studies.map((s) => (
              <li key={s.id} className="py-8">
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-mark">
                  {s.status}
                </p>
                <h3 className="mt-2 font-serif text-2xl tracking-tight">
                  {s.title}
                </h3>
                <p className="mt-1 text-[13px] text-ink-4">{s.audience}</p>
                <p className="mt-3 max-w-2xl type-body text-ink-3">
                  {s.summary}
                </p>
                <p className="mt-3 text-[12px] text-ink-4">
                  {s.duration} · {s.compensation}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <div className="shell grid gap-12 py-14 sm:py-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="type-meta">Interest form</p>
            <h2 className="type-display mt-3 text-2xl sm:text-3xl">
              Express interest
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-3">
              Leave your details for matching studies. Prefer email?{" "}
              <a href={`mailto:${lab.email}`} className="link-ink">
                {lab.email}
              </a>
            </p>
          </div>
          <div className="lg:col-span-7">
            {submitted ? (
              <div className="border border-rule px-6 py-12 text-center">
                <p className="font-serif text-2xl">
                  {submitted === "activate" ? "Check your inbox" : "Thank you"}
                </p>
                <p className="mt-3 text-sm text-ink-3">
                  {submitted === "activate" ? (
                    <>
                      Activate the form by clicking the link emailed to{" "}
                      <a href={`mailto:${lab.email}`} className="link-ink">
                        {lab.email}
                      </a>
                      , then later submissions will reach the lab.
                    </>
                  ) : (
                    "We received your interest and will be in touch if a study matches."
                  )}
                </p>
                <Button
                  className="mt-6"
                  variant="outline"
                  onClick={() => setSubmitted(null)}
                >
                  Submit another
                </Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-8">
                <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                  <label htmlFor="p-website">Website</label>
                  <input
                    id="p-website"
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
                    <Label htmlFor="name">Full name</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, email: e.target.value }))
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="study">Study interest</Label>
                  <select
                    id="study"
                    value={form.study}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, study: e.target.value }))
                    }
                    className="flex h-11 w-full border-0 border-b border-rule bg-transparent text-sm focus:border-ink focus:outline-none"
                  >
                    {studies.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Optional note</Label>
                  <Textarea
                    id="message"
                    value={form.message}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, message: e.target.value }))
                    }
                    placeholder="Eligibility, language, availability…"
                  />
                </div>
                <Button type="submit" disabled={sending}>
                  {sending ? "Sending…" : "Submit interest"}
                </Button>
                {sendError && (
                  <div className="space-y-3 text-sm text-ink-3">
                    <p>{sendError}</p>
                    <a
                      className="link-ink font-medium"
                      href={inquiryMailto({
                        name: form.name,
                        email: form.email,
                        topic:
                          studies.find((s) => s.id === form.study)?.title ??
                          form.study,
                        message: form.message || "(no additional note)",
                        source: "participate",
                      })}
                    >
                      Open email app with this message
                    </a>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
        <div className="shell pb-14 text-center text-sm text-ink-4">
          Collaboration or secondary-data partnerships:{" "}
          <Link to="/join" className="link-ink">
            Join
          </Link>{" "}
          or{" "}
          <Link to="/contact" className="link-ink">
            Contact
          </Link>
          .
        </div>
      </section>
    </>
  );
}
