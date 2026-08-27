import { cn } from "@/lib/utils";

/** Two facing arcs — the interval between groups. */
export function EncounterMark({
  className,
  title = "IEI Lab mark",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-sea", className)}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title && <title>{title}</title>}
      <path
        d="M19 5C9.5 13.2 9.5 34.8 19 43"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M29 5C38.5 13.2 38.5 34.8 29 43"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="24" cy="24" r="1.35" fill="currentColor" />
    </svg>
  );
}
