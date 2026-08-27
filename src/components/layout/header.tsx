import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { EncounterMark } from "@/components/brand/mark";

const nav = [
  { to: "/research", label: "Research" },
  { to: "/people", label: "People" },
  { to: "/publications", label: "Writing" },
  { to: "/blog", label: "Notes" },
  { to: "/participate", label: "Participate" },
  { to: "/join", label: "Join" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isActive = (to: string) =>
    pathname === to || pathname.startsWith(`${to}/`);

  return (
    <header className="sticky top-[var(--grok-banner-h,0px)] z-40 border-b border-rule bg-paper/92 backdrop-blur-md">
      <div className="shell flex h-[3.85rem] items-center justify-between gap-4 lg:h-16">
        <Link
          to="/"
          className="flex items-center gap-2.5 no-underline"
          onClick={() => setOpen(false)}
        >
          <EncounterMark className="h-8 w-8 shrink-0" />
          <span className="flex flex-col leading-none">
            <span className="font-serif text-[1.05rem] tracking-tight text-ink">
              IEI Lab
            </span>
            <span
              className="mt-0.5 hidden text-[10px] text-ink-4 sm:block"
              lang="he"
              dir="rtl"
            >
              מעבדה לחוויות בין-קבוצתיות
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 lg:flex" aria-label="Primary">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "relative text-[13px] no-underline transition-colors",
                isActive(item.to)
                  ? "text-sea"
                  : "text-ink-3 hover:text-ink",
              )}
            >
              {item.label}
              {isActive(item.to) && (
                <span className="absolute inset-x-0 -bottom-[1.15rem] h-px bg-sea" />
              )}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="text-[13px] text-ink lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open && (
        <div className="border-t border-rule bg-paper lg:hidden">
          <nav className="shell flex flex-col py-3" aria-label="Mobile">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "border-b border-rule/80 py-3.5 text-[15px] no-underline last:border-0",
                  isActive(item.to) ? "text-sea" : "text-ink-2",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
