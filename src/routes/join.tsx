import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { lab, pi } from "@/data/lab";

export const Route = createFileRoute("/join")({
  component: JoinPage,
  head: () => ({
    meta: [{ title: "Join · IEI Lab" }],
  }),
});

const openings = [
  {
    title: "MA thesis supervision",
    type: "Students",
    timing: "Ongoing · Ariel University",
    summary:
      "Topics aligned with lab foci: intergroup attitudes, antisemitism and trauma, workplace discrimination, resilience, quantitative and mixed methods.",
  },
  {
    title: "Research assistants",
    type: "Students",
    timing: "Rolling",
    summary:
      "Literature reviews, survey programming, data cleaning, participant coordination. Hebrew/English required; German an asset.",
  },
  {
    title: "Visiting scholars & co-authors",
    type: "Collaborators",
    timing: "By arrangement",
    summary:
      "Short visits and remote co-authorship in political psychology, discrimination, youth norms, and health psychology.",
  },
  {
    title: "Postdoctoral collaboration",
    type: "Researchers",
    timing: "Expressions of interest",
    summary:
      "No dedicated line listed yet; candidates with external funding or joint-application plans are welcome to write.",
  },
];

function JoinPage() {
  return (
    <>
      <PageHeader
        eyebrow="Join"
        title="Work with us"
        description="Thesis supervision, research assistance, and collaboration at the edge of social and health psychology."
      />

      <section className="border-b border-rule">
        <div className="shell py-12 sm:py-14">
          <div className="grid gap-10 border-b border-rule pb-12 sm:grid-cols-3">
            {[
              {
                t: "Students",
                d: "Thesis supervision, RA roles, and training in advanced methods.",
              },
              {
                t: "Researchers",
                d: "Co-authorship, multi-site collection, and grant partnerships.",
              },
              {
                t: "Organizations",
                d: "Evidence partnerships on discrimination, resilience, and education.",
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

          <p className="type-meta mt-12">Openings</p>
          <ul className="mt-6 divide-y divide-rule border-t border-rule">
            {openings.map((o) => (
              <li key={o.title} className="py-8">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-[11px] uppercase tracking-[0.12em] text-ink-4">
                    {o.type}
                  </span>
                  <span className="idx">{o.timing}</span>
                </div>
                <h3 className="mt-2 font-serif text-2xl tracking-tight">
                  {o.title}
                </h3>
                <p className="mt-3 max-w-2xl type-body text-ink-3">
                  {o.summary}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <div className="shell grid gap-12 py-14 sm:py-16 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="type-meta">Process</p>
            <h2 className="type-display mt-3 text-2xl sm:text-3xl">
              How to apply
            </h2>
            <ol className="mt-8 space-y-5">
              {[
                "Skim Research and Writing to confirm fit.",
                "Email a brief note (½–1 page) on interests, skills, and timeline.",
                "Attach a CV; students may include a short writing sample.",
                "We aim to reply within two weeks during term.",
              ].map((step, i) => (
                <li key={step} className="flex gap-4">
                  <span className="idx pt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="type-body text-ink-2">{step}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="border border-rule p-6 sm:p-8 lg:col-span-5">
            <p className="type-meta">Contact</p>
            <p className="mt-4 font-serif text-2xl tracking-tight">{pi.name}</p>
            <p className="mt-2 text-sm text-ink-3">
              {pi.role}
              <br />
              {lab.department}
            </p>
            <a
              href={`mailto:${lab.email}?subject=IEI%20Lab%20application`}
              className="mt-5 block link-ink text-sm"
            >
              {lab.email}
            </a>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <a href={`mailto:${lab.email}?subject=IEI%20Lab%20application`}>
                  Email the lab
                </a>
              </Button>
              <Button asChild variant="outline">
                <Link to="/contact">Contact page</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
