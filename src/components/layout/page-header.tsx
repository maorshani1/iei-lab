import { cn } from "@/lib/utils";
import { EncounterMark } from "@/components/brand/mark";

export function PageHeader({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("border-b border-rule bg-sea-mist/35", className)}>
      <div className="shell py-10 sm:py-12">
        <EncounterMark className="mb-5 h-8 w-8" />
        <div className="grid gap-5 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-5">
            {eyebrow && <p className="type-meta mb-2 text-sea">{eyebrow}</p>}
            <h1 className="type-display text-[2.15rem] sm:text-[2.6rem]">
              {title}
            </h1>
          </div>
          {description && (
            <p className="max-w-xl text-[15px] leading-relaxed text-ink-3 lg:col-span-6 lg:col-start-7">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
