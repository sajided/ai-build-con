"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, ScanLine, ChefHat, LineChart, Salad } from "lucide-react";

const TABS = [
  { href: "/dashboard", label: "হোম", icon: LayoutGrid, match: ["/dashboard"] },
  { href: "/scanner", label: "স্ক্যান", icon: ScanLine, match: ["/scanner", "/menusafe", "/live"] },
  { href: "/recipes", label: "রান্না", icon: ChefHat, match: ["/recipes"] },
  { href: "/telemetry", label: "সুগার", icon: LineChart, match: ["/telemetry"] },
  { href: "/deficits", label: "পুষ্টি", icon: Salad, match: ["/deficits"] },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="প্রধান মেনু"
      lang="bn"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
    >
      <ul className="grid grid-cols-5 rounded-full bg-white shadow-float">
        {TABS.map(({ href, label, icon: Icon, match }) => {
          const active = match.some((m) => pathname.startsWith(m));
          return (
            <li key={href}>
              <Link
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={`relative flex h-[68px] flex-col items-center justify-center gap-0.5 transition-colors ${
                  active ? "text-ink" : "text-ink-muted active:text-ink-soft"
                }`}
              >
                <Icon className="h-6 w-6" strokeWidth={active ? 2.4 : 1.9} />
                <span className={`whitespace-nowrap text-sm leading-tight ${active ? "font-bold" : "font-semibold"}`}>{label}</span>
                {active && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-ink" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
