import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { blogPosts, getPost } from "@/data/blog";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post = getPost(params.slug);
    if (!post) throw notFound();
    return post;
  },
  component: BlogPostPage,
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData ? `${loaderData.title} · IEI Lab` : "Notes · IEI Lab",
      },
    ],
  }),
});

function BlogPostPage() {
  const post = Route.useLoaderData();

  return (
    <article>
      <div className="border-b border-rule bg-sea-mist/35">
        <div className="shell py-12 sm:py-16">
          <Link
            to="/blog"
            className="text-[13px] text-ink-4 no-underline hover:text-sea"
          >
            ← Notes
          </Link>
          <p className="type-meta mt-8 text-sea">{post.tags.join(" · ")}</p>
          <h1 className="type-display mt-4 max-w-[18ch] text-3xl sm:text-5xl">
            {post.title}
          </h1>
          <p className="mt-6 text-sm text-ink-3">
            {post.author}
            <span className="mx-2 text-rule-strong">·</span>
            <time dateTime={post.date}>{formatDate(post.date)}</time>
          </p>
        </div>
      </div>
      <div className="shell-narrow py-12 sm:py-16">
        {post.body.map((para) => (
          <p
            key={para.slice(0, 48)}
            className="type-body text-ink-2 [&:not(:first-child)]:mt-6 sm:text-lg sm:leading-[1.8]"
          >
            {para}
          </p>
        ))}
        <div className="mt-14 border-t border-rule pt-8">
          <p className="type-meta text-sea">More notes</p>
          <ul className="mt-4 space-y-3">
            {blogPosts
              .filter((p) => p.slug !== post.slug)
              .map((p) => (
                <li key={p.slug}>
                  <Link
                    to="/blog/$slug"
                    params={{ slug: p.slug }}
                    className="font-serif text-lg tracking-tight no-underline hover:text-sea"
                  >
                    {p.title}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
