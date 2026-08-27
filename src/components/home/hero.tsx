import { Link } from "@tanstack/react-router";
import { lab, pi } from "@/data/lab";
import { EncounterMark } from "@/components/brand/mark";

export function Hero() {
  return (
    <section className="border-b border-rule">
      <div className="shell grid items-stretch gap-0 lg:grid-cols-12">
        <div className="flex flex-col justify-between py-12 sm:py-16 lg:col-span-7 lg:py-20 lg:pr-12">
          <div>
            <p className="type-meta text-sea">
              {lab.university} · Department of Psychology
            </p>
            <h1 className="type-display mt-5 max-w-[13ch] text-[2.35rem] sm:text-[2.85rem] lg:text-[3.35rem] lg:leading-[1.06]">
              Intergroup Experiences and Identity
            </h1>
            <p className="mt-5 font-serif text-lg text-ink-3 sm:text-xl">
              A lab for the space between groups.
            </p>
          </div>

          <div className="mt-10 max-w-lg">
            <p className="type-body text-ink-3">
              Directed by {pi.name}, {pi.title} from {pi.startDate}. We study
              conflict and coexistence, contemporary antisemitism, and
              well-being in chronic conditions—through networks, experiments,
              and mixed methods.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13.5px]">
              <Link to="/research" className="link-ink font-medium">
                Research agenda
              </Link>
              <Link to="/publications" className="link-quiet text-ink-3">
                Writing
              </Link>
              <Link to="/participate" className="link-quiet text-ink-3">
                Participate
              </Link>
            </div>
          </div>
        </div>

        <div className="relative lg:col-span-5">
          <div className="relative aspect-[4/5] overflow-hidden bg-paper-2 sm:aspect-[5/6] lg:absolute lg:inset-y-0 lg:end-0 lg:aspect-auto lg:w-full">
            <img
              src="/brand/interval.jpg"
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-ink/55 to-transparent p-5 text-paper">
              <div className="flex items-center gap-2">
                <EncounterMark className="h-7 w-7 text-paper" />
                <span className="text-[12px] tracking-wide">The interval</span>
              </div>
              <span className="text-[11px] text-paper/75" lang="he" dir="rtl">
                המרחב שביניהם
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-rule bg-sea-mist/50">
        <dl className="shell grid grid-cols-2 gap-6 py-6 sm:grid-cols-4 sm:py-7">
          {(
            [
              ["Citations", String(lab.metrics.citations)],
              ["h-index", String(lab.metrics.hIndex)],
              ["i10", String(lab.metrics.i10)],
              ["Opens", "October 2026"],
            ] as const
          ).map(([k, v]) => (
            <div key={k}>
              <dt className="type-meta">{k}</dt>
              <dd className="mt-1 font-serif text-2xl tracking-tight tabular-nums text-sea-deep">
                {v}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
