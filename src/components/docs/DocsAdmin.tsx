"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Bold,
  Eye,
  EyeOff,
  GripVertical,
  Heading3,
  History,
  Italic,
  Link2,
  List,
  LogOut,
  Plus,
  Table,
  Trash2,
} from "lucide-react";
import type { DocSection, DocsContent, TeamMember } from "@/lib/docs/content";
import type { DocsAdminSession } from "@/lib/docs/admin-auth";
import type { DocsVersion } from "@/lib/docs/store";
import { DEFAULT_VISIBILITY, evaluateAvailability, formatInZone, type DocsVisibility } from "@/lib/docs/access";
import { renderMarkdown } from "@/lib/docs/markdown";

type Tab = "visibility" | "content" | "team" | "versions";
type Storage = "supabase" | "readonly" | "needs-migration";

// Asia/Dhaka is UTC+6 all year, so datetime-local ↔ ISO is a fixed offset
const DHAKA_OFFSET_MS = 6 * 3_600_000;
const toLocalInput = (iso: string | null) => (iso ? new Date(Date.parse(iso) + DHAKA_OFFSET_MS).toISOString().slice(0, 16) : "");
const fromLocalInput = (v: string) => (v ? `${v}:00+06:00` : null);

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers }, cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

export default function DocsAdmin() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<DocsAdminSession | null>(null);
  const [configured, setConfigured] = useState(true);
  const [storage, setStorage] = useState<Storage>("readonly");

  const refresh = useCallback(async () => {
    const s = await api<{ session: DocsAdminSession | null; configured: boolean; storage: Storage }>("/api/docs/admin/session");
    setSession(s.session);
    setConfigured(s.configured);
    setStorage(s.storage);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh().catch(() => setLoading(false));
  }, [refresh]);

  if (loading) return <Shell><p className="text-ink-muted">Loading…</p></Shell>;
  if (!session) return <Login configured={configured} onDone={refresh} />;
  return <Editor session={session} storage={storage} onSignOut={refresh} />;
}

function Shell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <main className="min-h-dvh bg-canvas px-4 py-8 text-ink">
      <div className={`mx-auto ${wide ? "max-w-7xl" : "max-w-md"}`}>{children}</div>
    </main>
  );
}

function Login({ configured, onDone }: { configured: boolean; onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/api/docs/admin/session", { method: "POST", body: JSON.stringify({ password }) });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell>
      <form onSubmit={submit} className="card mt-16 p-8">
        <h1 className="text-2xl font-extrabold">Docs admin</h1>
        <p className="mt-1 text-ink-soft">Control who can see /docs and edit what it says.</p>
        {!configured ? (
          <p className="mt-6 rounded-2xl bg-risk-caution p-4 text-sm font-semibold text-risk-cautionInk">
            Admin sign-in is off. Set <code>DOCS_ADMIN_PASSWORD</code> (and optionally <code>DOCS_SUPER_ADMIN_PASSWORD</code>) on the server, then reload.
          </p>
        ) : (
          <>
            <label htmlFor="pw" className="mt-6 block text-sm font-bold">
              Password
            </label>
            <input id="pw" type="password" autoComplete="current-password" className="input mt-1" value={password} onChange={(e) => setPassword(e.target.value)} />
            {error && <p role="alert" className="mt-2 text-sm font-semibold text-risk-dangerInk">{error}</p>}
            <button type="submit" className="btn-primary mt-5" disabled={busy || !password}>
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </>
        )}
        <Link href="/docs" className="mt-4 block text-center text-sm font-bold text-ink-soft hover:underline">
          Back to /docs
        </Link>
      </form>
    </Shell>
  );
}

function Editor({ session, storage, onSignOut }: { session: DocsAdminSession; storage: Storage; onSignOut: () => void }) {
  const [tab, setTab] = useState<Tab>("visibility");
  const [toast, setToast] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const readonly = storage !== "supabase";

  const notify = (kind: "ok" | "err", text: string) => {
    setToast({ kind, text });
    setTimeout(() => setToast(null), 3500);
  };

  const signOut = async () => {
    await fetch("/api/docs/admin/session", { method: "DELETE" });
    onSignOut();
  };

  return (
    <Shell wide>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Docs admin</h1>
          <p className="text-sm font-semibold text-ink-muted">Signed in as {session.role === "super_admin" ? "super admin" : "admin"}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/docs?preview=draft" className="inline-flex h-10 items-center rounded-full border border-line bg-white px-4 text-sm font-bold">
            Preview draft
          </Link>
          <Link href="/docs" className="inline-flex h-10 items-center rounded-full border border-line bg-white px-4 text-sm font-bold">
            View /docs
          </Link>
          <button type="button" onClick={signOut} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-bold text-white">
            <LogOut className="h-4 w-4" aria-hidden /> Sign out
          </button>
        </div>
      </header>

      {storage === "needs-migration" && (
        <p className="mt-4 rounded-2xl bg-risk-caution p-4 text-sm font-semibold text-risk-cautionInk">
          Supabase is connected, but the docs tables don&apos;t exist yet, so changes can&apos;t be saved. Run
          supabase/migrations/20261118000000_docs_module.sql in the Supabase SQL editor, then reload. Until then /docs uses the defaults in code.
        </p>
      )}

      {storage === "readonly" && (
        <p className="mt-4 rounded-2xl bg-risk-caution p-4 text-sm font-semibold text-risk-cautionInk">
          Read-only: this deployment has no Supabase service key, so changes can&apos;t be saved. /docs is using the defaults in code and the
          DOCS_ENABLED / DOCS_START_AT / DOCS_END_AT env vars. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY and run
          supabase/migrations/20261118000000_docs_module.sql to enable editing.
        </p>
      )}

      <nav className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Admin sections">
        {(["visibility", "content", "team", "versions"] as const).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className="chip-toggle h-10 capitalize">
            {t}
          </button>
        ))}
      </nav>

      <div className="mt-6">
        {tab === "visibility" && <VisibilityPanel readonly={readonly} notify={notify} />}
        {(tab === "content" || tab === "team") && <ContentPanel mode={tab} readonly={readonly} notify={notify} />}
        {tab === "versions" && <VersionsPanel canRestore={session.role === "super_admin"} readonly={readonly} notify={notify} />}
      </div>

      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full px-5 py-3 text-sm font-bold shadow-float ${
            toast.kind === "ok" ? "bg-ink text-white" : "bg-risk-danger text-risk-dangerInk"
          }`}
        >
          {toast.text}
        </div>
      )}
    </Shell>
  );
}

type Notify = (kind: "ok" | "err", text: string) => void;

// ───────── Visibility & schedule ─────────

function VisibilityPanel({ readonly, notify }: { readonly: boolean; notify: Notify }) {
  const [v, setV] = useState<DocsVisibility | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ visibility: DocsVisibility }>("/api/docs/admin/settings")
      .then((d) => setV(d.visibility))
      .catch((e) => notify("err", e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!v) return <p className="text-ink-muted">Loading…</p>;
  const availability = evaluateAvailability(v);

  const save = async (body: object) => {
    setBusy(true);
    try {
      const d = await api<{ visibility: DocsVisibility }>("/api/docs/admin/settings", { method: "PUT", body: JSON.stringify(body) });
      setV(d.visibility);
      notify("ok", "Visibility saved");
    } catch (e) {
      notify("err", e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const statusText = availability.open
    ? `Public now${availability.closesAt ? `, until ${formatInZone(availability.closesAt)}` : ""}`
    : availability.reason === "disabled"
      ? "Hidden: switched off"
      : availability.reason === "not_started"
        ? `Hidden: opens ${formatInZone(availability.opensAt ?? null)}`
        : "Hidden: window ended";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold">Public access</h2>
            <p className={`mt-1 text-sm font-bold ${availability.open ? "text-risk-safeInk" : "text-risk-cautionInk"}`}>{statusText}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={v.enabled}
            aria-label="Docs public visibility"
            disabled={busy || readonly}
            onClick={() => save({ ...v, enabled: !v.enabled })}
            className={`relative h-9 w-16 shrink-0 rounded-full transition-colors disabled:opacity-50 ${v.enabled ? "bg-glycemic-green" : "bg-line"}`}
          >
            <span className={`absolute top-1 h-7 w-7 rounded-full bg-white shadow transition-all ${v.enabled ? "left-8" : "left-1"}`} />
          </button>
        </div>
        <p className="mt-3 text-sm text-ink-soft">The switch takes effect immediately. When it&apos;s off, visitors see a “Not available” page and admins can still preview.</p>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-extrabold">Schedule (Dhaka time)</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-bold">
            Start
            <input
              type="datetime-local"
              className="input mt-1"
              value={toLocalInput(v.startAt)}
              onChange={(e) => setV({ ...v, startAt: fromLocalInput(e.target.value) })}
            />
          </label>
          <label className="text-sm font-bold">
            End
            <input type="datetime-local" className="input mt-1" value={toLocalInput(v.endAt)} onChange={(e) => setV({ ...v, endAt: fromLocalInput(e.target.value) })} />
          </label>
        </div>
        <p className="mt-2 text-xs font-semibold text-ink-muted">Leave a field empty for no limit on that side.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn-primary w-auto" disabled={busy || readonly} onClick={() => save(v)}>
            Save window
          </button>
          <button type="button" className="btn-secondary w-auto" disabled={busy || readonly} onClick={() => save({ ...DEFAULT_VISIBILITY, enabled: v.enabled })}>
            Reset to default
          </button>
        </div>
        <p className="mt-5 text-sm font-bold">Or publish for a duration, starting now</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            ["24 hours", 24],
            ["3 days", 72],
            ["7 days", 168],
            ["30 days", 720],
          ].map(([label, h]) => (
            <button key={label} type="button" disabled={busy || readonly} onClick={() => save({ enabled: true, durationHours: h, timeZone: v.timeZone })} className="chip-toggle h-10">
              {label}
            </button>
          ))}
        </div>
        {v.updatedAt && (
          <p className="mt-4 text-xs font-semibold text-ink-muted">
            Last changed {formatInZone(v.updatedAt)} by {v.updatedBy ?? "unknown"}
          </p>
        )}
      </section>
    </div>
  );
}

// ───────── Content & team ─────────

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "section";

function ContentPanel({ mode, readonly, notify }: { mode: "content" | "team"; readonly: boolean; notify: Notify }) {
  const [draft, setDraft] = useState<DocsContent | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    api<{ draft: DocsContent }>("/api/docs/admin/content")
      .then((d) => {
        setDraft(d.draft);
        setSelected(d.draft.sections[0]?.id ?? null);
      })
      .catch((e) => notify("err", e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Warn before leaving with unsaved edits
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const current = draft?.sections.find((s) => s.id === selected) ?? null;
  const previewHtml = useMemo(() => (current ? renderMarkdown(current.body) : ""), [current]);

  if (!draft) return <p className="text-ink-muted">Loading…</p>;

  const update = (next: DocsContent) => {
    setDraft(next);
    setDirty(true);
  };
  const updateSection = (id: string, patch: Partial<DocSection>) =>
    update({ ...draft, sections: draft.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)) });

  const move = (from: number, to: number) => {
    if (to < 0 || to >= draft.sections.length) return;
    const sections = [...draft.sections];
    const [item] = sections.splice(from, 1);
    sections.splice(to, 0, item);
    update({ ...draft, sections });
  };

  const addSection = () => {
    const title = "New section";
    let id = slug(title);
    for (let n = 2; draft.sections.some((s) => s.id === id); n++) id = `${slug(title)}-${n}`;
    const group = current?.group ?? "technical";
    update({ ...draft, sections: [...draft.sections, { id, group, title, body: "Write here." }] });
    setSelected(id);
  };

  const removeSection = (id: string) => {
    const s = draft.sections.find((x) => x.id === id);
    if (s?.live) return notify("err", "Built-in live sections can be hidden, not deleted.");
    update({ ...draft, sections: draft.sections.filter((x) => x.id !== id) });
    setSelected(draft.sections.find((x) => x.id !== id)?.id ?? null);
  };

  /** Wraps the textarea selection with markdown syntax */
  const wrap = (before: string, after = "", placeholder = "text") => {
    const ta = editorRef.current;
    if (!ta || !current) return;
    const { selectionStart: a, selectionEnd: b, value } = ta;
    const sel = value.slice(a, b) || placeholder;
    const body = value.slice(0, a) + before + sel + after + value.slice(b);
    updateSection(current.id, { body });
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(a + before.length, a + before.length + sel.length);
    });
  };
  const insertLine = (text: string) => {
    const ta = editorRef.current;
    if (!ta || !current) return;
    const a = ta.selectionStart;
    const value = ta.value;
    const prefix = a > 0 && value[a - 1] !== "\n" ? "\n" : "";
    updateSection(current.id, { body: value.slice(0, a) + prefix + text + value.slice(a) });
  };

  const persist = async (action: "save" | "publish") => {
    setBusy(true);
    try {
      await api("/api/docs/admin/content", { method: "PUT", body: JSON.stringify({ action, content: draft, note }) });
      setDirty(false);
      if (action === "publish") setNote("");
      notify("ok", action === "publish" ? "Published, and a new version was saved" : "Draft saved");
    } catch (e) {
      notify("err", e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Version note (optional)" className="input h-10 w-56" aria-label="Version note" />
      <button type="button" className="btn-secondary h-10 w-auto" disabled={busy || readonly || !dirty} onClick={() => persist("save")}>
        Save draft
      </button>
      <button type="button" className="btn-primary h-10 w-auto" disabled={busy || readonly} onClick={() => persist("publish")}>
        Publish
      </button>
      {dirty && <span className="text-sm font-bold text-risk-cautionInk">Unsaved changes</span>}
    </div>
  );

  if (mode === "team") {
    const setTeam = (team: TeamMember[]) => update({ ...draft, team });
    return (
      <div className="space-y-6">
        {actions}
        <section className="card grid gap-4 p-6 sm:grid-cols-2">
          <label className="text-sm font-bold">
            Team name
            <input className="input mt-1" value={draft.teamName} onChange={(e) => update({ ...draft, teamName: e.target.value })} />
          </label>
          <label className="text-sm font-bold sm:col-span-2">
            Tagline (hero)
            <textarea className="input mt-1 h-20 py-2" value={draft.tagline} onChange={(e) => update({ ...draft, tagline: e.target.value })} />
          </label>
        </section>
        <section className="space-y-3">
          {draft.team.map((m, i) => (
            <div key={i} className="card grid gap-3 p-5 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]">
              {(["name", "role", "email", "photo"] as const).map((k) => (
                <label key={k} className="text-xs font-bold capitalize text-ink-soft">
                  {k === "photo" ? "Photo (/team/x.jpg or https URL)" : k}
                  <input
                    className="input mt-1 h-10 text-sm"
                    value={m[k] ?? ""}
                    type={k === "email" ? "email" : "text"}
                    onChange={(e) => setTeam(draft.team.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)))}
                  />
                </label>
              ))}
              <div className="flex items-end gap-1">
                <IconBtn label="Move up" onClick={() => i > 0 && setTeam(swap(draft.team, i, i - 1))}>
                  <ArrowUp className="h-4 w-4" />
                </IconBtn>
                <IconBtn label="Move down" onClick={() => i < draft.team.length - 1 && setTeam(swap(draft.team, i, i + 1))}>
                  <ArrowDown className="h-4 w-4" />
                </IconBtn>
                <IconBtn label="Remove member" onClick={() => setTeam(draft.team.filter((_, j) => j !== i))}>
                  <Trash2 className="h-4 w-4" />
                </IconBtn>
              </div>
            </div>
          ))}
          <button type="button" className="btn-secondary w-auto" onClick={() => setTeam([...draft.team, { name: "New member", role: "" }])}>
            <Plus className="h-4 w-4" /> Add member
          </button>
          <p className="text-xs font-semibold text-ink-muted">
            Emails are shown publicly on /docs. Photos are cropped to the same square frame. Put images in public/team/ or use an https URL.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {actions}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="card h-fit p-3">
          <p className="px-2 pb-2 text-xs font-bold uppercase tracking-wide text-ink-muted">Drag to reorder</p>
          <ul className="space-y-1">
            {draft.sections.map((s, i) => (
              <li
                key={s.id}
                draggable
                onDragStart={() => setDragId(s.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragId) move(draft.sections.findIndex((x) => x.id === dragId), i);
                  setDragId(null);
                }}
                className={`flex items-center gap-1 rounded-xl px-1 py-1 ${selected === s.id ? "bg-canvas" : ""} ${dragId === s.id ? "opacity-50" : ""}`}
              >
                <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-ink-muted" aria-hidden />
                <button type="button" onClick={() => setSelected(s.id)} className={`min-w-0 flex-1 truncate text-left text-sm font-bold ${s.hidden ? "text-ink-muted line-through" : ""}`}>
                  <span className="mr-1 text-[10px] uppercase text-ink-muted">{s.group === "pitch" ? "P" : "T"}</span>
                  {s.title}
                </button>
                <IconBtn label="Move up" onClick={() => move(i, i - 1)}>
                  <ArrowUp className="h-3.5 w-3.5" />
                </IconBtn>
                <IconBtn label="Move down" onClick={() => move(i, i + 1)}>
                  <ArrowDown className="h-3.5 w-3.5" />
                </IconBtn>
                <IconBtn label={s.hidden ? "Show section" : "Hide section"} onClick={() => updateSection(s.id, { hidden: !s.hidden })}>
                  {s.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </IconBtn>
              </li>
            ))}
          </ul>
          <button type="button" onClick={addSection} className="mt-2 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-line py-2 text-sm font-bold text-ink-soft">
            <Plus className="h-4 w-4" /> Add section
          </button>
        </aside>

        {current && (
          <section className="card min-w-0 p-5">
            <div className="grid gap-3 sm:grid-cols-[1fr_160px_auto]">
              <label className="text-xs font-bold text-ink-soft">
                Title
                <input className="input mt-1 h-10" value={current.title} onChange={(e) => updateSection(current.id, { title: e.target.value })} />
              </label>
              <label className="text-xs font-bold text-ink-soft">
                Part
                <select className="input mt-1 h-10" value={current.group} onChange={(e) => updateSection(current.id, { group: e.target.value as DocSection["group"] })}>
                  <option value="pitch">Pitch</option>
                  <option value="technical">Technical</option>
                </select>
              </label>
              <div className="flex items-end">
                <IconBtn label="Delete section" onClick={() => removeSection(current.id)}>
                  <Trash2 className="h-4 w-4" />
                </IconBtn>
              </div>
            </div>
            {current.live && (
              <p className="mt-3 rounded-xl bg-pastel-blue px-3 py-2 text-xs font-bold text-pastel-blue-ink">
                This section also shows live data ({current.live}) under your text. That part updates itself.
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-1 border-b border-line pb-2" role="toolbar" aria-label="Formatting">
              <IconBtn label="Bold" onClick={() => wrap("**", "**")}>
                <Bold className="h-4 w-4" />
              </IconBtn>
              <IconBtn label="Italic" onClick={() => wrap("*", "*")}>
                <Italic className="h-4 w-4" />
              </IconBtn>
              <IconBtn label="Heading" onClick={() => insertLine("### Heading\n")}>
                <Heading3 className="h-4 w-4" />
              </IconBtn>
              <IconBtn label="Bullet list" onClick={() => insertLine("- item\n- item\n")}>
                <List className="h-4 w-4" />
              </IconBtn>
              <IconBtn label="Link" onClick={() => wrap("[", "](https://)", "link text")}>
                <Link2 className="h-4 w-4" />
              </IconBtn>
              <IconBtn label="Table" onClick={() => insertLine("| Column | Column |\n|---|---|\n| value | value |\n")}>
                <Table className="h-4 w-4" />
              </IconBtn>
              <button type="button" onClick={() => insertLine("```mermaid\nflowchart LR\n  A[Input] --> B[Output]\n```\n")} className="rounded-lg px-2 py-1 text-xs font-bold text-ink-soft hover:bg-canvas">
                + Diagram
              </button>
              <label className="ml-auto flex items-center gap-2 text-xs font-bold text-ink-soft">
                <input type="checkbox" checked={showPreview} onChange={(e) => setShowPreview(e.target.checked)} /> Live preview
              </label>
            </div>

            <div className={`mt-3 grid gap-4 ${showPreview ? "xl:grid-cols-2" : ""}`}>
              <textarea
                ref={editorRef}
                aria-label={`${current.title} content (Markdown)`}
                value={current.body}
                onChange={(e) => updateSection(current.id, { body: e.target.value })}
                className="min-h-[460px] w-full resize-y rounded-2xl border border-line bg-canvas p-4 font-mono text-sm leading-relaxed focus:border-pastel-blue-strong focus:outline-none focus:ring-2 focus:ring-pastel-blue"
              />
              {showPreview && <div className="docs-prose min-h-[200px] overflow-x-auto rounded-2xl border border-line p-4" dangerouslySetInnerHTML={{ __html: previewHtml }} />}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function swap<T>(arr: T[], a: number, b: number): T[] {
  const next = [...arr];
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-soft hover:bg-canvas">
      {children}
    </button>
  );
}

// ───────── Versions ─────────

function VersionsPanel({ canRestore, readonly, notify }: { canRestore: boolean; readonly: boolean; notify: Notify }) {
  const [versions, setVersions] = useState<DocsVersion[] | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(() => {
    api<{ versions: DocsVersion[] }>("/api/docs/admin/versions")
      .then((d) => setVersions(d.versions))
      .catch((e) => notify("err", e.message));
  }, [notify]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const restore = async (id: number) => {
    setBusy(id);
    try {
      await api("/api/docs/admin/versions", { method: "POST", body: JSON.stringify({ id }) });
      notify("ok", `Version #${id} restored and published`);
      load();
    } catch (e) {
      notify("err", e instanceof Error ? e.message : "Restore failed");
    } finally {
      setBusy(null);
    }
  };

  if (!versions) return <p className="text-ink-muted">Loading…</p>;
  return (
    <section className="card p-6">
      <h2 className="flex items-center gap-2 text-lg font-extrabold">
        <History className="h-5 w-5" aria-hidden /> Published versions
      </h2>
      {!canRestore && <p className="mt-1 text-sm text-ink-muted">Only a super admin can restore an older version.</p>}
      {versions.length === 0 ? (
        <p className="mt-4 text-sm text-ink-soft">No versions yet. Each Publish saves one.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {versions.map((v) => (
            <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <p className="font-bold">
                  #{v.id} {v.note && <span className="font-semibold text-ink-soft">· {v.note}</span>}
                </p>
                <p className="text-xs font-semibold text-ink-muted">
                  {formatInZone(v.createdAt)} · {v.createdBy ?? "unknown"}
                </p>
              </div>
              {canRestore && (
                <button type="button" disabled={readonly || busy !== null} onClick={() => restore(v.id)} className="btn-secondary h-9 w-auto text-sm">
                  {busy === v.id ? "Restoring…" : "Restore"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
