import { Link } from "@tanstack/react-router";
import { lab, pi } from "@/data/lab";
import { EncounterMark } from "@/components/brand/mark";

const footerNav = [
  { to: "/research", label: "Research" },
  { to: "/people", label: "People" },
  { to: "/publications", label: "Writing" },
  { to: "/blog", label: "Notes" },
  { to: "/participate", label: "Participate" },
  { to: "/join", label: "Join" },
  { to: "/contact", label: "Contact" },
] as const;

export function Footer() {
  return (
    <footer className="mt-auto bg-sea-deep text-invert-fg">
      <div className="shell py-14 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3">
              <EncounterMark className="h-9 w-9 text-invert-fg" />
              <p className="font-serif text-xl tracking-tight">IEI Lab</p>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-invert-muted">
              Intergroup Experiences and Identity Lab
              <br />
              {lab.department} · {lab.university}
              <br />
              {pi.name}
            </p>
            <p className="mt-4 text-sm text-invert-muted" lang="he" dir="rtl">
              מעבדה לחוויות בין-קבוצתיות וזהות
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7">
            <div>
              <p className="type-meta text-invert-muted">Navigate</p>
              <ul className="mt-4 space-y-2">
                {footerNav.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="text-sm text-invert-fg/85 no-underline hover:text-invert-fg"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="type-meta text-invert-muted">Write</p>
              <ul className="mt-4 space-y-2 text-sm text-invert-fg/85">
                <li>
                  <a
                    href={`mailto:${lab.email}`}
                    className="no-underline hover:text-invert-fg"
                  >
                    {lab.email}
                  </a>
                </li>
                <li className="text-invert-muted">{lab.phones.israel}</li>
              </ul>
            </div>
            <div>
              <p className="type-meta text-invert-muted">Elsewhere</p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <a
                    href={lab.scholar}
                    target="_blank"
                    rel="noreferrer"
                    className="text-invert-fg/85 no-underline hover:text-invert-fg"
                  >
                    Google Scholar
                  </a>
                </li>
                <li>
                  <a
                    href={lab.researchGate}
                    target="_blank"
                    rel="noreferrer"
                    className="text-invert-fg/85 no-underline hover:text-invert-fg"
                  >
                    ResearchGate
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-[12px] text-invert-muted sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} IEI Lab</p>
          <p>{lab.foundedNote}</p>
        </div>
      </div>
    </footer>
  );
}
