import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { blogPosts } from "@/data/blog";

export const Route = createFileRoute("/blog/")({
  component: BlogIndexPage,
  head: () => ({
    meta: [{ title: "Notes · IEI Lab" }],
  }),
});

function BlogIndexPage() {
  return (
    <>
      <PageHeader
        eyebrow="Notes"
        title="From the lab"
        description="Research notes, study announcements, and public scholarship."
      />
      <section>
        <div className="shell py-10 sm:py-12">
          <ul className="divide-y divide-rule border-y border-rule">
            {blogPosts.map((post) => (
              <li key={post.slug}>
                <Link
                  to="/blog/$slug"
                  params={{ slug: post.slug }}
                  className="grid gap-3 py-8 no-underline sm:grid-cols-12 sm:gap-6 sm:py-10"
                >
                  <time className="idx sm:col-span-2">
                    {formatDate(post.date)}
                  </time>
                  <div className="sm:col-span-8">
                    <h2 className="font-serif text-2xl tracking-tight sm:text-[1.75rem]">
                      {post.title}
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-3">
                      {post.excerpt}
                    </p>
                    <p className="mt-3 text-[12px] text-ink-4">
                      {post.tags.join(" · ")}
                    </p>
                  </div>
                  <div className="hidden items-start justify-end text-sm text-ink-4 sm:col-span-2 sm:flex">
                    Read →
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
