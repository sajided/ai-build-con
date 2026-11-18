"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, Download, FileText, Link2, Menu, Pencil, PlayCircle, Printer, Search, X } from "lucide-react";
import type { DocsGroup, LiveBlock, TeamMember } from "@/lib/docs/content";
import type { LiveSnapshot } from "@/lib/docs/live";
import type { DocsRole } from "@/lib/docs/admin-auth";
import { formatInZone } from "@/lib/docs/access";
import { useMermaid } from "./Mermaid";
import { AnalyticsBlock, ApiTable, Changelog, FeatureMatrix, StatusBlock, TeamGrid } from "./LiveBlocks";

export interface RenderedSection {
  id: string;
  group: DocsGroup;
  title: string;
  live?: LiveBlock;
  html: string;
  text: string;
}

interface Props {
  tagline: string;
  teamName: string;
  team: TeamMember[];
  sections: RenderedSection[];
  initialLive: LiveSnapshot;
  admin: { role: DocsRole; previewDraft: boolean } | null;
  windowNote: string;
}

const GROUP_LABEL: Record<DocsGroup, { title: string; hint: string }> = {
  pitch: { title: "Pitch", hint: "2-minute read" },
  technical: { title: "Technical", hint: "10-minute deep dive" },
};

function snippet(text: string, q: string): string {
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text.slice(0, 90);
  const start = Math.max(0, i - 40);
  return (start > 0 ? "…" : "") + text.slice(start, i + q.length + 60) + "…";
}

export default function DocsView({ tagline, teamName, team, sections, initialLive, admin, windowNote }: Props) {
  const [live, setLive] = useState(initialLive);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(sections[0]?.id ?? "");
  const [navOpen, setNavOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useMermaid("#docs-content", [sections]);

  // Live data: refresh every minute while the tab is visible
  useEffect(() => {
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/docs/live", { cache: "no-store" });
        if (res.ok) setLive(await res.json());
      } catch {
        /* keep the last snapshot */
      }
    };
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  // Scroll spy
  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  // "/" focuses search, Esc clears it
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest("input, textarea, [contenteditable]");
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === "Escape" && document.activeElement === searchRef.current) {
        setQuery("");
        searchRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const teamText = team.map((m) => `${m.name} ${m.role}`).join(" ");
    return sections
      .map((s) => {
        const hay = `${s.title} ${s.text} ${s.live === "team" ? teamText : ""}`.toLowerCase();
        const score = (s.title.toLowerCase().includes(q) ? 10 : 0) + (hay.includes(q) ? 1 : 0);
        return { s, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [query, sections, team]);

  const jump = useCallback((id: string) => {
    setNavOpen(false);
    setQuery("");
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", `#${id}`);
      el.focus({ preventScroll: true });
    }
  }, []);

  const copyLink = async (id?: string) => {
    const url = `${location.origin}/docs${id ? `#${id}` : ""}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(id ?? "page");
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* clipboard blocked: the URL bar still has it */
    }
  };

  const renderLive = (kind?: LiveBlock) => {
    switch (kind) {
      case "status":
        return <StatusBlock live={live} />;
      case "features":
        return <FeatureMatrix live={live} />;
      case "api":
        return <ApiTable />;
      case "team":
        return <TeamGrid team={team} teamName={teamName} />;
      case "analytics":
        return <AnalyticsBlock live={live} />;
      case "changelog":
        return <Changelog live={live} />;
      default:
        return null;
    }
  };

  const nav = (
    <nav aria-label="Documentation sections" className="space-y-6">
      {(["pitch", "technical"] as const).map((g) => (
        <div key={g}>
          <p className="mb-1.5 px-3 text-xs font-extrabold uppercase tracking-wider text-ink-muted">
            {GROUP_LABEL[g].title} <span className="font-semibold normal-case tracking-normal">· {GROUP_LABEL[g].hint}</span>
          </p>
          <ul className="space-y-0.5">
            {sections
              .filter((s) => s.group === g)
              .map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      jump(s.id);
                    }}
                    aria-current={active === s.id ? "location" : undefined}
                    className="block rounded-xl px-3 py-1.5 text-[15px] font-semibold text-ink-soft transition-colors hover:bg-white hover:text-ink aria-[current=location]:bg-white aria-[current=location]:text-ink aria-[current=location]:shadow-soft"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  const searchBox = (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden />
      <input
        ref={searchRef}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search docs"
        aria-label="Search the documentation"
        className="h-11 w-full rounded-2xl border border-line bg-white pl-9 pr-10 text-[15px] font-semibold text-ink placeholder:text-ink-muted focus:border-pastel-blue-strong focus:outline-none focus:ring-2 focus:ring-pastel-blue"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-line px-1.5 text-xs font-bold text-ink-muted sm:block">/</kbd>
      {query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-line bg-white p-1 shadow-float">
          {results.length ? (
            results.map(({ s }) => (
              <button key={s.id} type="button" onClick={() => jump(s.id)} className="block w-full rounded-xl px-3 py-2 text-left hover:bg-canvas">
                <span className="block text-sm font-bold text-ink">{s.title}</span>
                <span className="block truncate text-xs text-ink-muted">{snippet(s.text, query.trim())}</span>
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-sm text-ink-muted">No matches for “{query}”.</p>
          )}
        </div>
      )}
    </div>
  );

  let lastGroup: DocsGroup | null = null;

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      {admin && (
        <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-2 bg-ink px-4 py-2 text-sm font-semibold text-white print:hidden">
          <span>
            Signed in as {admin.role === "super_admin" ? "super admin" : "admin"} · {windowNote}
            {admin.previewDraft && <span className="ml-2 rounded-full bg-pastel-peach px-2 py-0.5 text-xs font-bold text-pastel-peach-ink">Draft preview</span>}
          </span>
          <span className="flex gap-3">
            <Link href={admin.previewDraft ? "/docs" : "/docs?preview=draft"} className="underline-offset-2 hover:underline">
              {admin.previewDraft ? "View published" : "Preview draft"}
            </Link>
            <Link href="/docs/admin" className="inline-flex items-center gap-1 underline-offset-2 hover:underline">
              <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit
            </Link>
          </span>
        </div>
      )}

      {/* Mobile top bar */}
      <header className={`sticky ${admin ? "top-9" : "top-0"} z-40 flex items-center gap-3 border-b border-line bg-canvas/95 px-4 py-3 backdrop-blur lg:hidden print:hidden`}>
        <button type="button" onClick={() => setNavOpen(true)} aria-label="Open section menu" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-soft">
          <Menu className="h-5 w-5" />
        </button>
        <span className="truncate text-base font-extrabold">যত্ন · Jotno docs</span>
      </header>

      {navOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Sections">
          <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Close menu" onClick={() => setNavOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-xs overflow-y-auto bg-canvas p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-extrabold">Sections</span>
              <button type="button" onClick={() => setNavOpen(false)} aria-label="Close menu" className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-5">{searchBox}</div>
            {nav}
          </div>
        </div>
      )}

      <div className="mx-auto flex max-w-7xl gap-10 px-4 lg:px-8">
        <aside className={`sticky ${admin ? "top-9 h-[calc(100dvh-2.25rem)]" : "top-0 h-dvh"} hidden w-64 shrink-0 overflow-y-auto py-8 lg:block print:hidden`}>
          <Link href="/" className="mb-6 flex items-center gap-2 px-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon.svg" alt="" className="h-8 w-8" />
            <span className="text-lg font-extrabold">যত্ন · Jotno</span>
          </Link>
          <div className="mb-6">{searchBox}</div>
          {nav}
        </aside>

        <main id="docs-content" className="min-w-0 flex-1 pb-24 pt-6 lg:pt-10">
          {/* Hero: the 2-minute version */}
          <section className="rounded-[32px] bg-white p-6 shadow-soft sm:p-10">
            <p className="text-sm font-extrabold uppercase tracking-wider text-pastel-lime-ink">Pitch · Whitepaper · Live system</p>
            <h1 className="mt-2 text-3xl font-extrabold leading-tight sm:text-5xl">
              যত্ন <span className="text-ink-muted">·</span> Jotno
            </h1>
            <p className="mt-3 max-w-2xl text-lg font-semibold text-ink-soft sm:text-xl">{tagline}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { k: "Who", v: "Elderly Bangla speakers with type 2 diabetes, and their families" },
                { k: "How", v: "Push-to-talk and photos in, natural Bangla voice out" },
                { k: "Safety", v: "AI suggests, rules decide. Never a medicine dose" },
              ].map((x) => (
                <div key={x.k} className="rounded-2xl bg-canvas p-4">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-ink-muted">{x.k}</p>
                  <p className="mt-1 font-bold text-ink">{x.v}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-2 print:hidden">
              <Link href="/demo" className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 font-bold text-white">
                <PlayCircle className="h-5 w-5" aria-hidden /> Watch the 3½-min demo
              </Link>
              <Link href="/" className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-white px-5 font-bold">
                Open the app
              </Link>
              <a href="/api/docs/export" className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-white px-4 font-bold">
                <Download className="h-4 w-4" aria-hidden /> Markdown
              </a>
              <button type="button" onClick={() => window.print()} className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-white px-4 font-bold">
                <Printer className="h-4 w-4" aria-hidden /> PDF
              </button>
              <button type="button" onClick={() => copyLink()} className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-white px-4 font-bold">
                {copied === "page" ? <Check className="h-4 w-4" aria-hidden /> : <Link2 className="h-4 w-4" aria-hidden />}
                {copied === "page" ? "Link copied" : "Share link"}
              </button>
            </div>
          </section>

          {sections.map((s) => {
            const header =
              s.group !== lastGroup ? (
                <div key={`h-${s.group}`} className="mb-2 mt-14 flex items-center gap-3 first:mt-10">
                  <FileText className="h-5 w-5 text-ink-muted" aria-hidden />
                  <h2 className="text-sm font-extrabold uppercase tracking-wider text-ink-muted">
                    {s.group === "pitch" ? "Part 1 · Pitch" : "Part 2 · Technical documentation"}
                  </h2>
                  <span className="h-px flex-1 bg-line" />
                </div>
              ) : null;
            lastGroup = s.group;
            return (
              <div key={s.id}>
                {header}
                <section id={s.id} tabIndex={-1} aria-labelledby={`${s.id}-title`} className="docs-section scroll-mt-24 border-b border-line py-10 outline-none last:border-0">
                  <div className="group flex items-start gap-2">
                    <h2 id={`${s.id}-title`} className="text-2xl font-extrabold sm:text-3xl">
                      {s.title}
                    </h2>
                    <button
                      type="button"
                      onClick={() => copyLink(s.id)}
                      aria-label={`Copy link to ${s.title}`}
                      className="mt-1 rounded-lg p-1.5 text-ink-muted opacity-60 transition-opacity hover:bg-white hover:opacity-100 focus:opacity-100 group-hover:opacity-100 print:hidden"
                    >
                      {copied === s.id ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="docs-prose mt-4" dangerouslySetInnerHTML={{ __html: s.html }} />
                  {renderLive(s.live)}
                </section>
              </div>
            );
          })}

          <footer className="mt-10 text-sm font-semibold text-ink-muted">
            Live data checked {formatInZone(live.checkedAt)} (Dhaka) · build <code>{live.build.commitSha ?? "—"}</code>
          </footer>
        </main>
      </div>
    </div>
  );
}
