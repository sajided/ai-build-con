import Link from "next/link";
import { Lock } from "lucide-react";

const COPY = {
  disabled: "The documentation is switched off right now.",
  not_started: "The documentation isn't public yet.",
  ended: "The public viewing window for this documentation has ended.",
} as const;

export default function DocsUnavailable({ reason, opensAt }: { reason: keyof typeof COPY; opensAt: string | null }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-backdrop px-4">
      <div className="card w-full max-w-md p-8 text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-canvas">
          <Lock className="h-7 w-7 text-ink-soft" aria-hidden />
        </span>
        <p className="text-sm font-bold uppercase tracking-wide text-ink-muted">403 · Not available</p>
        <h1 className="mt-2 text-2xl font-extrabold text-ink">{COPY[reason]}</h1>
        {opensAt && <p className="mt-2 text-base text-ink-soft">It opens on {opensAt} (Dhaka time).</p>}
        <div className="mt-6 flex flex-col gap-2">
          <Link href="/" className="btn-primary">
            Open the Jotno app
          </Link>
          <Link href="/docs/admin" className="btn-secondary">
            Admin sign-in
          </Link>
        </div>
      </div>
    </main>
  );
}
