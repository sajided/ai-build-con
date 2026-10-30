import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** When set, shows a back chevron linking here and left-aligns the title */
  backHref?: string;
  /** Right-aligned slot for icon buttons */
  actions?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, backHref, actions }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-canvas/90 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
      <div className="relative flex h-16 items-center gap-1 px-4">
        {backHref ? (
          <>
            <Link
              href={backHref}
              aria-label="Back"
              className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-ink active:bg-black/5"
            >
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-bold text-ink">{title}</h1>
              {subtitle && <p className="truncate text-xs font-medium text-ink-muted">{subtitle}</p>}
            </div>
          </>
        ) : (
          <div className="min-w-0 flex-1 text-center">
            <h1 className="truncate text-lg font-bold text-ink">{title}</h1>
            {subtitle && <p className="truncate text-xs font-medium text-ink-muted">{subtitle}</p>}
          </div>
        )}
        {actions && <div className="absolute right-3 flex items-center gap-1">{actions}</div>}
      </div>
    </header>
  );
}
