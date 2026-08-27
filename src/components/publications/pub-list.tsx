import {
  type Publication,
  doiUrl,
} from "@/data/publications";
import { cn } from "@/lib/utils";

export function PublicationCard({
  pub,
  compact,
}: {
  pub: Publication;
  compact?: boolean;
}) {
  return (
    <article
      className={cn(
        "group grid gap-1 border-b border-rule py-6 last:border-b-0 sm:grid-cols-[4.5rem_1fr] sm:gap-6",
        compact && "py-5",
      )}
    >
      <div className="idx pt-1 text-ink-4">
        {pub.year}
        {pub.forthcoming ? "*" : ""}
      </div>
      <div>
        <h3
          className={cn(
            "font-serif leading-snug text-ink",
            compact ? "text-[1.05rem]" : "text-lg sm:text-xl",
          )}
        >
          {pub.doi ? (
            <a
              href={doiUrl(pub.doi)}
              target="_blank"
              rel="noreferrer"
              className="no-underline transition-colors hover:text-sea"
            >
              {pub.title}
            </a>
          ) : (
            pub.title
          )}
        </h3>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-3">
          {pub.authors}
        </p>
        <p className="mt-1 text-[13px] italic text-ink-4">{pub.venue}</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.08em] text-ink-4">
          {pub.firstAuthor && <span className="text-mark">First author</span>}
          {pub.sharedFirst && <span>Shared first</span>}
          {pub.if && (
            <span>
              IF {pub.if}
              {pub.quartile ? ` · ${pub.quartile}` : ""}
            </span>
          )}
          {typeof pub.citations === "number" && (
            <span>{pub.citations} citations</span>
          )}
        </div>
      </div>
    </article>
  );
}

export function PublicationList({
  items,
  compact,
}: {
  items: Publication[];
  compact?: boolean;
}) {
  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-ink-4">
        No publications match this filter.
      </p>
    );
  }
  return (
    <div>
      {items.map((pub) => (
        <PublicationCard key={pub.id} pub={pub} compact={compact} />
      ))}
    </div>
  );
}
