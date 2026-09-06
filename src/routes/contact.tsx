import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { lab, pi } from "@/data/lab";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  validateSearch: (raw: Record<string, unknown>): { sent?: boolean } =>
    raw.sent === "1" || raw.sent === true ? { sent: true } : {},
  head: () => ({
    meta: [{ title: "Contact · IEI Lab" }],
  }),
});

function ContactPage() {
  const { sent } = Route.useSearch();

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
            {sent ? (
              <div className="border border-rule px-6 py-14 text-center">
                <p className="font-serif text-2xl">Thank you</p>
                <p className="mx-auto mt-3 max-w-sm text-sm text-ink-3">
                  Your message was handed to the mail service. If nothing
                  arrives, write us directly at{" "}
                  <a href={`mailto:${lab.email}`} className="link-ink">
                    {lab.email}
                  </a>
                  .
                </p>
                <Button asChild className="mt-6" variant="outline">
                  <Link to="/contact">Send another</Link>
                </Button>
              </div>
            ) : (
              <form
                action="https://api.web3forms.com/submit"
                method="POST"
                className="space-y-8"
              >
                <input
                  type="hidden"
                  name="access_key"
                  value="73d63d5e-259e-4126-a364-625d029ebee1"
                />
                <input
                  type="hidden"
                  name="subject"
                  value="IEI Lab website contact"
                />
                <input
                  type="hidden"
                  name="from_name"
                  value="IEI Lab website"
                />
                <input
                  type="hidden"
                  name="redirect"
                  value="https://www.maorshani.com/contact?sent=1"
                />
                <input
                  type="checkbox"
                  name="botcheck"
                  className="hidden"
                  style={{ display: "none" }}
                  tabIndex={-1}
                  autoComplete="off"
                />
                <div className="grid gap-8 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="c-name">Name</Label>
                    <Input id="c-name" name="name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="c-email">Email</Label>
                    <Input id="c-email" name="email" type="email" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-topic">Topic</Label>
                  <select
                    id="c-topic"
                    name="topic"
                    defaultValue="general"
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
                    name="message"
                    required
                    placeholder="How can we help?"
                  />
                </div>
                <Button type="submit">Send message</Button>
                <p className="text-sm text-ink-4">
                  Prefer not to use the form?{" "}
                  <a href={`mailto:${lab.email}`} className="link-ink">
                    Email {lab.email}
                  </a>
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
