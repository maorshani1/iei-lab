import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { lab } from "@/data/lab";
import { methodsHighlights, projects } from "@/data/research";

export const Route = createFileRoute("/research")({
  component: ResearchPage,
  head: () => ({
    meta: [{ title: "Research · IEI Lab" }],
  }),
});

const statusLabel = {
  active: "Active",
  completed: "Completed",
  pipeline: "In preparation",
} as const;

function ResearchPage() {
  return (
    <>
      <PageHeader
        eyebrow="Research"
        title="Research agenda"
        description="Conflict and reconciliation; antisemitism, racism, and discrimination; health psychology in chronic conditions—linked by shared methods and translational aims."
      />

      <section className="border-b border-rule">
        <div className="shell py-12 sm:py-14">
          <p className="type-meta text-sea">Threads</p>
          <div className="mt-6">
            {lab.foci.map((f, i) => (
              <div
                key={f.id}
                className="grid gap-2 border-t border-rule py-7 sm:grid-cols-12 sm:gap-6 sm:py-8"
              >
                <span className="font-mono text-[12px] text-mark sm:col-span-1">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="font-serif text-xl tracking-tight sm:col-span-4 sm:text-[1.45rem]">
                  {f.title}
                </h2>
                <div className="sm:col-span-7">
                  <p className="text-[15px] leading-relaxed text-ink-2">
                    {f.summary}
                  </p>
                  <p className="mt-2.5 text-[12.5px] text-ink-4">
                    {f.topics.join("  ·  ")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-rule">
        <div className="shell py-12 sm:py-14">
          <p className="type-meta">Programs</p>
          <h2 className="type-display mt-2 text-2xl sm:text-3xl">Projects</h2>
          <ul className="mt-8">
            {projects.map((p) => (
              <li
                key={p.id}
                id={p.id}
                className="scroll-mt-24 border-t border-rule py-8 sm:py-9"
              >
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-mark">
                    {statusLabel[p.status]}
                  </span>
                  <span className="idx">{p.period}</span>
                </div>
                <h3 className="mt-2.5 max-w-3xl font-serif text-xl tracking-tight sm:text-[1.55rem]">
                  {p.title}
                </h3>
                <p className="mt-1.5 text-sm text-ink-3">{p.role}</p>
                {p.funding && (
                  <p className="mt-1 text-sm text-mark">{p.funding}</p>
                )}
                <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-ink-2">
                  {p.summary}
                </p>
                {p.outputs && p.outputs.length > 0 && (
                  <ul className="mt-4 space-y-1 border-l border-rule pl-4">
                    {p.outputs.map((o) => (
                      <li key={o} className="text-[13px] text-ink-3">
                        {o}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-paper-2/50">
        <div className="shell py-12 sm:py-14">
          <p className="type-meta">Methods</p>
          <h2 className="type-display mt-2 text-2xl sm:text-3xl">
            Design & analysis
          </h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-3">
            Measurement development, SEM, multilevel and latent profile models,
            social network analysis, field experiments, and mixed methods.
          </p>
          <div className="mt-8 grid gap-8 border-t border-rule pt-8 sm:grid-cols-2 lg:grid-cols-4">
            {methodsHighlights.map((m) => (
              <div key={m.title}>
                <h3 className="font-serif text-lg tracking-tight">{m.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-3">
                  {m.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
