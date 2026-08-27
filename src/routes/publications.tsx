import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { PublicationList } from "@/components/publications/pub-list";
import { Input } from "@/components/ui/input";
import {
  publications,
  underReview,
  publicationYears,
} from "@/data/publications";
import { lab } from "@/data/lab";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/publications")({
  component: PublicationsPage,
  head: () => ({
    meta: [{ title: "Writing · IEI Lab" }],
  }),
});

type Filter = "all" | "first" | "article" | "chapter" | "highlight";

function PublicationsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [year, setYear] = useState<number | "all">("all");
  const years = publicationYears();

  const filtered = useMemo(() => {
    let list = [...publications];
    if (filter === "first")
      list = list.filter((p) => p.firstAuthor || p.sharedFirst);
    if (filter === "article") list = list.filter((p) => p.type === "article");
    if (filter === "chapter") list = list.filter((p) => p.type === "chapter");
    if (filter === "highlight") list = list.filter((p) => p.highlight);
    if (year !== "all") list = list.filter((p) => p.year === year);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.authors.toLowerCase().includes(q) ||
          p.venue.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return list.sort(
      (a, b) => b.year - a.year || a.title.localeCompare(b.title),
    );
  }, [filter, query, year]);

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "highlight", label: "Featured" },
    { id: "first", label: "First author" },
    { id: "article", label: "Articles" },
    { id: "chapter", label: "Chapters" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Writing"
        title="Publications"
        description={`Peer-reviewed work and reports. Scholar metrics: h-index ${lab.metrics.hIndex}, ${lab.metrics.citations} citations (April 2026).`}
      />

      <section>
        <div className="shell py-10 sm:py-12">
          <div className="flex flex-col gap-6 border-b border-rule pb-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-wrap gap-x-1 gap-y-2">
              {filters.map((f, i) => (
                <span key={f.id} className="flex items-center">
                  {i > 0 && (
                    <span className="mx-2 text-rule-strong" aria-hidden>
                      /
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setFilter(f.id)}
                    className={cn(
                      "text-[13px] transition-colors",
                      filter === f.id
                        ? "font-medium text-ink"
                        : "text-ink-3 hover:text-ink",
                    )}
                  >
                    {f.label}
                  </button>
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
              <select
                value={year === "all" ? "all" : String(year)}
                onChange={(e) =>
                  setYear(
                    e.target.value === "all" ? "all" : Number(e.target.value),
                  )
                }
                className="h-10 border-0 border-b border-rule bg-transparent text-sm text-ink focus:border-ink focus:outline-none"
                aria-label="Filter by year"
              >
                <option value="all">All years</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="sm:w-52"
                aria-label="Search publications"
              />
            </div>
          </div>

          <p className="mt-6 idx">
            {filtered.length} of {publications.length}
          </p>

          <div className="mt-2">
            <PublicationList items={filtered} />
          </div>

          <div className="mt-16 border-t border-rule pt-12">
            <p className="type-meta">Pipeline</p>
            <h2 className="type-display mt-3 text-2xl sm:text-3xl">
              Under review
            </h2>
            <ul className="mt-8 divide-y divide-rule border-t border-rule">
              {underReview.map((m) => (
                <li key={m.title} className="py-6">
                  <p className="idx text-mark">{m.venue}</p>
                  <p className="mt-2 font-serif text-lg tracking-tight">
                    {m.title}
                  </p>
                  <p className="mt-1 text-sm text-ink-3">{m.authors}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-12 flex flex-wrap gap-6 text-sm">
            <a
              href={lab.scholar}
              target="_blank"
              rel="noreferrer"
              className="link-ink"
            >
              Google Scholar
            </a>
            <a
              href={lab.researchGate}
              target="_blank"
              rel="noreferrer"
              className="link-quiet text-ink-3"
            >
              ResearchGate
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
