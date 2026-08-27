import { createFileRoute, Link } from "@tanstack/react-router";
import { Hero } from "@/components/home/hero";
import { PublicationList } from "@/components/publications/pub-list";
import { EncounterMark } from "@/components/brand/mark";
import { lab, pi } from "@/data/lab";
import { publications } from "@/data/publications";
import { projects } from "@/data/research";
import { blogPosts } from "@/data/blog";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [{ title: "IEI Lab · Intergroup Experiences and Identity Lab" }],
  }),
});

function HomePage() {
  const highlights = publications.filter((p) => p.highlight).slice(0, 5);
  const active = projects.filter((p) => p.status === "active").slice(0, 4);

  return (
    <>
      <Hero />

      <section className="border-b border-rule">
        <div className="shell grid gap-10 py-16 sm:py-20 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <p className="type-meta text-sea">Why this lab</p>
            <h2 className="type-display mt-3 text-[1.75rem] sm:text-3xl">
              What happens in the space between
            </h2>
            <div className="mt-8 hidden overflow-hidden lg:block">
              <img
                src="/brand/circles.jpg"
                alt=""
                className="aspect-square w-full max-w-[280px] object-cover"
              />
            </div>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <p className="type-body">{lab.synopsis}</p>
            <p className="type-body mt-5 text-ink-3">
              Work developed at Osnabrück, the Hebrew University, and European
              collaborations now continues at Ariel under {pi.name}.
            </p>
            <p className="mt-7">
              <Link to="/people" className="link-ink text-sm font-medium">
                Director & team
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-rule">
        <div className="shell py-16 sm:py-20">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="type-meta text-sea">Foci</p>
              <h2 className="type-display mt-2 text-3xl">Three threads</h2>
            </div>
            <Link
              to="/research"
              className="text-[13px] text-ink-3 no-underline hover:text-sea"
            >
              Full agenda →
            </Link>
          </div>
          <div className="mt-10 grid gap-px bg-rule sm:grid-cols-3">
            {lab.foci.map((f, i) => (
              <article key={f.id} className="bg-paper px-0 py-8 sm:px-6 sm:py-10 lg:px-8">
                <EncounterMark className="h-7 w-7" />
                <p className="mt-5 type-meta">Thread {i + 1}</p>
                <h3 className="mt-2 font-serif text-[1.35rem] leading-snug tracking-tight">
                  {f.title}
                </h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-ink-3">
                  {f.summary}
                </p>
                <p className="mt-5 text-[12px] leading-relaxed text-ink-4">
                  {f.topics.join(" · ")}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-rule">
        <div className="shell py-16 sm:py-20">
          <p className="type-meta text-sea">Now</p>
          <h2 className="type-display mt-2 text-3xl">Active programs</h2>
          <ul className="mt-8">
            {active.map((p) => (
              <li
                key={p.id}
                className="grid gap-2 border-t border-rule py-7 sm:grid-cols-12 sm:gap-6"
              >
                <span className="idx text-sea sm:col-span-2">{p.period}</span>
                <div className="sm:col-span-10">
                  <h3 className="font-serif text-xl tracking-tight sm:text-[1.4rem]">
                    <Link to="/research" className="no-underline hover:text-sea">
                      {p.title}
                    </Link>
                  </h3>
                  {p.funding && (
                    <p className="mt-1 text-[12px] text-sea">{p.funding}</p>
                  )}
                  <p className="mt-2.5 max-w-3xl text-[14.5px] leading-relaxed text-ink-3">
                    {p.summary}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-rule">
        <div className="shell py-16 sm:py-20">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="type-meta text-sea">Writing</p>
              <h2 className="type-display mt-2 text-3xl">
                Selected publications
              </h2>
            </div>
            <Link
              to="/publications"
              className="text-[13px] text-ink-3 no-underline hover:text-sea"
            >
              All writing →
            </Link>
          </div>
          <div className="mt-6 border-t border-rule">
            <PublicationList items={highlights} compact />
          </div>
        </div>
      </section>

      <section className="border-b border-rule bg-paper-2/70">
        <div className="shell py-16 sm:py-20">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="type-meta text-sea">Notes</p>
              <h2 className="type-display mt-2 text-3xl">From the lab</h2>
            </div>
            <Link
              to="/blog"
              className="text-[13px] text-ink-3 no-underline hover:text-sea"
            >
              All notes →
            </Link>
          </div>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {blogPosts.map((post) => (
              <Link
                key={post.slug}
                to="/blog/$slug"
                params={{ slug: post.slug }}
                className="no-underline"
              >
                <time className="idx">{formatShort(post.date)}</time>
                <h3 className="mt-2 font-serif text-xl leading-snug tracking-tight hover:text-sea">
                  {post.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-3">
                  {post.excerpt}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="shell grid gap-10 py-16 sm:grid-cols-2 sm:py-20">
          <div>
            <p className="type-meta text-sea">Participate</p>
            <h2 className="type-display mt-2 text-2xl sm:text-3xl">
              Take part in a study
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-3">
              Surveys and experiments on identity, discrimination, conflict, and
              health. Voluntary, confidential, ethics-approved.
            </p>
            <p className="mt-5">
              <Link to="/participate" className="link-ink text-sm font-medium">
                Current opportunities
              </Link>
            </p>
          </div>
          <div>
            <p className="type-meta text-sea">Collaborate</p>
            <h2 className="type-display mt-2 text-2xl sm:text-3xl">
              Join the lab
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-3">
              Thesis supervision, research assistance, and co-authorship for
              students and scholars.
            </p>
            <p className="mt-5">
              <Link to="/join" className="link-ink text-sm font-medium">
                Openings & how to apply
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function formatShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}
