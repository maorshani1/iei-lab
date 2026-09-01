import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { lab } from "@/data/lab";

export const Route = createFileRoute("/participate")({
  component: ParticipatePage,
  validateSearch: (raw: Record<string, unknown>): { sent?: boolean } =>
    raw.sent === "1" || raw.sent === true ? { sent: true } : {},
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
  const { sent } = Route.useSearch();

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
            {sent ? (
              <div className="border border-rule px-6 py-12 text-center">
                <p className="font-serif text-2xl">Thank you</p>
                <p className="mt-3 text-sm text-ink-3">
                  Your interest was submitted. If nothing arrives, email{" "}
                  <a href={`mailto:${lab.email}`} className="link-ink">
                    {lab.email}
                  </a>
                  .
                </p>
                <Button asChild className="mt-6" variant="outline">
                  <Link to="/participate">Submit another</Link>
                </Button>
              </div>
            ) : (
              <form
                action={`https://formsubmit.co/${lab.email}`}
                method="POST"
                className="space-y-8"
              >
                <input
                  type="hidden"
                  name="_next"
                  value="https://www.maorshani.com/participate?sent=1"
                />
                <input type="hidden" name="_captcha" value="false" />
                <input type="hidden" name="_template" value="table" />
                <input
                  type="hidden"
                  name="_subject"
                  value="IEI Lab study interest"
                />
                <input type="hidden" name="_cc" value={lab.emails[1]} />
                <input
                  type="text"
                  name="_honey"
                  className="absolute -left-[9999px] h-0 w-0"
                  tabIndex={-1}
                  autoComplete="off"
                />
                <div className="grid gap-8 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input id="name" name="name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="study">Study interest</Label>
                  <select
                    id="study"
                    name="study"
                    className="flex h-11 w-full border-0 border-b border-rule bg-transparent text-sm focus:border-ink focus:outline-none"
                  >
                    {studies.map((s) => (
                      <option key={s.id} value={s.title}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Optional note</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Eligibility, language, availability…"
                  />
                </div>
                <Button type="submit">Submit interest</Button>
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