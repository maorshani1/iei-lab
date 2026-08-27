import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { lab, pi } from "@/data/lab";
import { alumniHighlights, collaborators, people } from "@/data/people";

export const Route = createFileRoute("/people")({
  component: PeoplePage,
  head: () => ({
    meta: [{ title: "People · IEI Lab" }],
  }),
});

function PeoplePage() {
  const team = people.filter((p) => p.status === "active");

  return (
    <>
      <PageHeader
        eyebrow="People"
        title="The lab"
        description="Students and collaborators working across social, political, and health psychology—linked by careful methods and real-world relevance."
      />

      {/* Director */}
      <section className="border-b border-rule">
        <div className="shell py-14 sm:py-16">
          <p className="type-meta">Director</p>
          <div className="mt-8 grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <div
                className="relative h-40 w-40 overflow-hidden bg-sea-mist"
                aria-hidden
              >
                <img
                  src="/brand/circles.jpg"
                  alt=""
                  className="h-full w-full object-cover opacity-90"
                />
                <span className="absolute bottom-3 left-3 font-serif text-2xl tracking-tight text-paper">
                  MS
                </span>
              </div>
              <h2 className="mt-6 font-serif text-3xl tracking-tight">
                {pi.name}
              </h2>
              <p className="mt-2 text-sm text-ink-3">
                {pi.role}
                <br />
                {pi.department}
              </p>
              <div className="mt-5 flex flex-col gap-2 text-sm">
                <a href={`mailto:${lab.email}`} className="link-ink">
                  {lab.email}
                </a>
                <a
                  href={lab.scholar}
                  target="_blank"
                  rel="noreferrer"
                  className="link-quiet text-ink-3"
                >
                  Google Scholar ↗
                </a>
              </div>
            </div>
            <div className="lg:col-span-8">
              {pi.bio.split("\n\n").map((para) => (
                <p
                  key={para.slice(0, 40)}
                  className="type-body text-ink-2 [&:not(:first-child)]:mt-5"
                >
                  {para}
                </p>
              ))}
              <div className="mt-10 grid gap-8 border-t border-rule pt-8 sm:grid-cols-2">
                <div>
                  <p className="type-meta">Affiliations</p>
                  <ul className="mt-4 space-y-4">
                    {pi.affiliations.map((a) => (
                      <li key={a.org} className="text-sm">
                        <span className="font-medium text-ink">{a.role}</span>
                        <br />
                        <span className="text-ink-3">
                          {a.org} ({a.period})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="type-meta">Education</p>
                  <ul className="mt-4 space-y-4">
                    {pi.education.map((e) => (
                      <li key={e.degree} className="text-sm">
                        <span className="font-medium text-ink">{e.degree}</span>
                        <br />
                        <span className="text-ink-3">
                          {e.place} · {e.years}
                        </span>
                        <br />
                        <span className="text-ink-4">{e.detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="border-b border-rule bg-paper-2/40">
        <div className="shell py-14 sm:py-16">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <p className="type-meta">Current</p>
              <h2 className="type-display mt-3 text-3xl">Students</h2>
            </div>
            <Link
              to="/join"
              className="text-xs font-medium text-ink-3 no-underline hover:text-mark"
            >
              Join →
            </Link>
          </div>
          <ul className="mt-10 divide-y divide-rule border-t border-rule">
            {team.map((person) => (
              <li
                key={person.id}
                className="grid gap-2 py-7 sm:grid-cols-12 sm:gap-6"
              >
                <div className="sm:col-span-4">
                  <h3 className="font-serif text-xl tracking-tight">
                    {person.name}
                  </h3>
                  <p className="mt-1 text-[13px] text-ink-4">{person.role}</p>
                  {person.program && (
                    <p className="text-[12px] text-ink-4">{person.program}</p>
                  )}
                </div>
                <div className="sm:col-span-8">
                  {person.focus && (
                    <p className="text-sm text-ink-2">{person.focus}</p>
                  )}
                  {person.thesis && (
                    <p className="mt-2 text-sm leading-relaxed text-ink-3">
                      <span className="text-ink-4">Thesis — </span>
                      {person.thesis}
                    </p>
                  )}
                  {person.note && (
                    <p className="mt-2 text-xs italic text-ink-4">{person.note}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Alumni */}
      <section className="border-b border-rule">
        <div className="shell py-14 sm:py-16">
          <p className="type-meta">Alumni</p>
          <h2 className="type-display mt-3 text-3xl">Selected theses</h2>
          <p className="mt-4 max-w-2xl text-sm text-ink-3">
            At Osnabrück (2020–2025): 23 Master and Bachelor theses supervised;
            five published; two awarded by national associations in Germany.
          </p>
          <ul className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {alumniHighlights.map((a) => (
              <li key={a.name} className="border-t border-rule pt-5">
                <p className="font-serif text-lg tracking-tight">{a.name}</p>
                <p className="mt-1 text-[12px] text-ink-4">
                  {a.year} · {a.degree}
                </p>
                <p className="mt-3 text-sm text-ink-3">{a.note}</p>
                <p className="mt-2 text-sm text-mark">{a.outcome}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Network */}
      <section>
        <div className="shell py-14 sm:py-16">
          <p className="type-meta">Network</p>
          <h2 className="type-display mt-3 text-3xl">Collaborators</h2>
          <ul className="mt-10 divide-y divide-rule border-t border-rule">
            {collaborators.map((c) => (
              <li
                key={c.name}
                className="grid gap-1 py-5 sm:grid-cols-12 sm:items-baseline sm:gap-6"
              >
                <p className="font-medium text-ink sm:col-span-4">{c.name}</p>
                <p className="text-sm text-ink-3 sm:col-span-3">{c.org}</p>
                <p className="text-sm text-ink-4 sm:col-span-5">{c.area}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
