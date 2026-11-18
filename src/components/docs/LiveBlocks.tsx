"use client";

import { useState } from "react";
import { CheckCircle2, CircleDashed, CircleDot, Mail, TriangleAlert } from "lucide-react";
import type { LiveSnapshot, LiveFeatureState } from "@/lib/docs/live";
import type { TeamMember } from "@/lib/docs/content";
import { formatInZone } from "@/lib/docs/access";
import { API_ENDPOINTS, EXTERNAL_APIS } from "@/lib/docs/registry";

const STATE_STYLE: Record<LiveFeatureState, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  live: { label: "Live", cls: "bg-risk-safe text-risk-safeInk", Icon: CheckCircle2 },
  beta: { label: "Beta", cls: "bg-pastel-blue text-pastel-blue-ink", Icon: CircleDot },
  fallback: { label: "Fallback", cls: "bg-risk-caution text-risk-cautionInk", Icon: TriangleAlert },
  planned: { label: "Planned", cls: "bg-canvas text-ink-soft", Icon: CircleDashed },
};

export function StatePill({ state }: { state: LiveFeatureState }) {
  const { label, cls, Icon } = STATE_STYLE[state];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
    </span>
  );
}

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-1 text-xl font-extrabold text-ink">{value}</p>
      {hint && <p className="mt-0.5 text-xs font-semibold text-ink-muted">{hint}</p>}
    </div>
  );
}

const dot = (ok: boolean) => (
  <span className={`mr-1.5 inline-block h-2.5 w-2.5 rounded-full ${ok ? "bg-glycemic-green" : "bg-glycemic-yellow"}`} aria-hidden />
);

export function StatusBlock({ live }: { live: LiveSnapshot }) {
  const counts = live.features.reduce<Record<string, number>>((a, f) => ((a[f.state] = (a[f.state] ?? 0) + 1), a), {});
  const t = live.build.tests;
  return (
    <div className="not-prose mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat label="Features live" value={counts.live ?? 0} hint={`${counts.beta ?? 0} beta · ${counts.fallback ?? 0} fallback · ${counts.planned ?? 0} planned`} />
      <Stat
        label="Automated tests"
        value={t ? `${t.passed} passing` : "—"}
        hint={t ? `${t.failed} failing · ${t.files} files · run ${t.ranAt.slice(0, 10)}` : "Run npm run docs:meta"}
      />
      <Stat
        label="AI services"
        value={
          <span className="flex flex-col text-base">
            <span>{dot(live.services.gemini)}Gemini {live.services.gemini ? "connected" : "not set"}</span>
            <span>{dot(live.services.supabase)}Supabase {live.services.supabase ? "connected" : "not set"}</span>
          </span>
        }
      />
      <Stat
        label="Build"
        value={<code className="text-lg">{live.build.commitSha ?? "—"}</code>}
        hint={`${live.build.environment}${live.build.commitCount ? ` · ${live.build.commitCount} commits` : ""}`}
      />
    </div>
  );
}

export function FeatureMatrix({ live }: { live: LiveSnapshot }) {
  const [filter, setFilter] = useState<LiveFeatureState | "all">("all");
  const rows = live.features.filter((f) => filter === "all" || f.state === filter);
  return (
    <div className="not-prose mt-4">
      <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Filter features by status">
        {(["all", "live", "beta", "fallback", "planned"] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={filter === k}
            onClick={() => setFilter(k)}
            className="rounded-full border border-line bg-white px-3 py-1.5 text-sm font-bold capitalize text-ink-soft aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-white"
          >
            {k}
          </button>
        ))}
      </div>
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
        {rows.map((f) => (
          <li key={f.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-start sm:gap-4">
            <div className="min-w-0 flex-1">
              <p className="font-bold text-ink">
                {f.name}
                {f.bangla && <span className="ml-2 font-semibold text-ink-muted">{f.bangla}</span>}
              </p>
              <p className="text-sm text-ink-soft">{f.summary}</p>
              {f.state === "fallback" && f.fallback && <p className="mt-1 text-sm font-semibold text-risk-cautionInk">Fallback now: {f.fallback}</p>}
              {f.route && (
                <a href={f.route} className="mt-1 inline-block text-sm font-bold text-pastel-blue-ink underline-offset-2 hover:underline">
                  Try it: {f.route}
                </a>
              )}
            </div>
            <StatePill state={f.state} />
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs font-semibold text-ink-muted">Checked {formatInZone(live.checkedAt)} (Dhaka) · refreshes every minute</p>
    </div>
  );
}

const AUTH_LABEL = { public: "Public", "session-optional": "Session optional", "docs-admin": "Docs admin" } as const;

export function ApiTable() {
  return (
    <div className="not-prose mt-4 space-y-5">
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-canvas text-xs uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="p-3">Endpoint</th>
              <th className="p-3">Methods</th>
              <th className="p-3">Auth</th>
              <th className="p-3">Purpose</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {API_ENDPOINTS.map((a) => (
              <tr key={a.path}>
                <td className="p-3 align-top">
                  <code className="whitespace-nowrap font-bold text-ink">{a.path}</code>
                  {a.ai && <span className="ml-2 rounded-full bg-pastel-lilac px-2 py-0.5 text-[11px] font-bold text-pastel-lilac-ink">AI</span>}
                </td>
                <td className="p-3 align-top font-semibold">{a.methods.join(" · ")}</td>
                <td className="whitespace-nowrap p-3 align-top">{AUTH_LABEL[a.auth]}</td>
                <td className="p-3 align-top text-ink-soft">{a.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <p className="mb-2 font-bold text-ink">External APIs used</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {EXTERNAL_APIS.map((e) => (
            <li key={e.name} className="rounded-2xl border border-line bg-white p-3 text-sm">
              <span className="font-bold text-ink">{e.name}</span>
              <span className="block text-ink-soft">{e.use}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const AVATAR_TINTS = ["bg-pastel-blue text-pastel-blue-ink", "bg-pastel-lime text-pastel-lime-ink", "bg-pastel-peach text-pastel-peach-ink", "bg-pastel-lilac text-pastel-lilac-ink", "bg-pastel-coral text-pastel-coral-ink"];

function Avatar({ m, i }: { m: TeamMember; i: number }) {
  const [broken, setBroken] = useState(false);
  const initials = m.name
    .split(/\s+/)
    .filter((w) => /^[A-Za-zঀ-৿]/.test(w) && !/^(md\.?|mr\.?|ms\.?)$/i.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  if (m.photo && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={m.photo}
        alt={`Photo of ${m.name}`}
        width={112}
        height={112}
        loading="lazy"
        onError={() => setBroken(true)}
        className="h-28 w-28 rounded-3xl object-cover ring-4 ring-white shadow-soft"
      />
    );
  }
  return (
    <span aria-hidden className={`flex h-28 w-28 items-center justify-center rounded-3xl text-3xl font-extrabold ring-4 ring-white shadow-soft ${AVATAR_TINTS[i % AVATAR_TINTS.length]}`}>
      {initials || "?"}
    </span>
  );
}

export function TeamGrid({ team, teamName }: { team: TeamMember[]; teamName: string }) {
  return (
    <div className="not-prose mt-4">
      {teamName && <p className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-muted">{teamName}</p>}
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {team.map((m, i) => (
          <li key={`${m.name}-${i}`} className="flex flex-col items-center rounded-3xl border border-line bg-white p-6 text-center">
            <Avatar m={m} i={i} />
            <p className="mt-4 text-lg font-extrabold text-ink">{m.name}</p>
            <p className="text-sm font-semibold text-ink-soft">{m.role}</p>
            {m.email && (
              <a href={`mailto:${m.email}`} className="mt-2 inline-flex items-center gap-1.5 break-all text-sm font-bold text-pastel-blue-ink hover:underline">
                <Mail className="h-4 w-4 shrink-0" aria-hidden />
                {m.email}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AnalyticsBlock({ live }: { live: LiveSnapshot }) {
  const u = live.usage;
  const fmt = (n: number | null | undefined) => (typeof n === "number" ? n.toLocaleString("en-US") : "—");
  return (
    <div className="not-prose mt-4">
      {u.connected ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Profiles" value={fmt(u.profiles)} />
          <Stat label="Readings synced" value={fmt(u.glucoseLogs)} />
          <Stat label="Food scans" value={fmt(u.foodScans)} />
          <Stat label="Recipes" value={fmt(u.recipes)} />
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-line bg-white p-4 text-sm font-semibold text-ink-soft">
          Live usage counts appear here when this deployment is connected to Supabase. We show nothing rather than made-up numbers.
          Most data stays on the phone by design, so cloud counts only include signed-in users.
        </p>
      )}
    </div>
  );
}

export function Changelog({ live }: { live: LiveSnapshot }) {
  const commits = live.build.commits ?? [];
  if (!commits.length) return <p className="not-prose mt-4 text-sm text-ink-muted">No commit history in this build.</p>;
  return (
    <ol className="not-prose mt-4 space-y-2 border-l-2 border-line pl-4">
      {commits.slice(0, 25).map((c) => (
        <li key={c.hash} className="relative">
          <span className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full bg-pastel-blue-strong" aria-hidden />
          <p className="text-sm font-semibold text-ink">{c.subject}</p>
          <p className="text-xs font-semibold text-ink-muted">
            <code>{c.hash}</code> · {c.date.slice(0, 10)}
          </p>
        </li>
      ))}
    </ol>
  );
}
