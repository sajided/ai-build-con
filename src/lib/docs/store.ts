import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env, isPlaceholder } from "@/lib/env";
import { DEFAULT_CONTENT, type DocSection, type DocsContent } from "./content";
import { visibilityFromEnv, type DocsVisibility } from "./access";

/**
 * Persistence for /docs. Uses Supabase (service role, server-only) when configured;
 * otherwise falls back to the defaults in code + DOCS_* env vars, read-only.
 * Tables: supabase/migrations/20261118000000_docs_module.sql
 */

export type StorageMode = "supabase" | "readonly";

export interface DocsVersion {
  id: number;
  note: string | null;
  createdAt: string;
  createdBy: string | null;
}

let cachedClient: SupabaseClient | null = null;

function adminClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;
  const key = env.supabaseServiceRoleKey;
  if (!env.supabaseUrl || isPlaceholder(env.supabaseUrl) || !key || isPlaceholder(key)) return null;
  cachedClient = createClient(env.supabaseUrl, key, { auth: { persistSession: false } });
  return cachedClient;
}

export function storageMode(): StorageMode {
  return adminClient() ? "supabase" : "readonly";
}

export type StorageStatus = StorageMode | "needs-migration";

/** Like storageMode, but also checks the docs tables exist so the admin UI can say what to do. */
export async function storageStatus(): Promise<StorageStatus> {
  const db = adminClient();
  if (!db) return "readonly";
  const { error } = await db.from("docs_settings").select("id", { head: true, count: "exact" });
  return error && isMissingTable(error) ? "needs-migration" : "supabase";
}

function isMissingTable(error: { code?: string; message?: string }): boolean {
  return error.code === "42P01" || error.code === "PGRST205" || /could not find the table|does not exist/i.test(error.message ?? "");
}

/** Throws a clear, actionable error for a failed write. */
function fail(error: { code?: string; message?: string }): never {
  if (isMissingTable(error)) throw new MigrationMissingError();
  throw new Error(error.message || "Database error");
}

// A short cache keeps the public page fast without hiding an admin's change for long.
const TTL_MS = 15_000;
const cache = new Map<string, { at: number; value: unknown }>();
async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value as T;
  const value = await load();
  cache.set(key, { at: Date.now(), value });
  return value;
}
const invalidate = () => cache.clear();

/** Stored content wins per section; sections added to the code later still appear. */
export function mergeContent(stored: Partial<DocsContent> | null | undefined, defaults: DocsContent = DEFAULT_CONTENT): DocsContent {
  if (!stored || !Array.isArray(stored.sections)) return structuredClone(defaults);
  const known = new Set(stored.sections.map((s) => s.id));
  const sections: DocSection[] = [
    ...stored.sections
      .filter((s): s is DocSection => Boolean(s && s.id && s.title !== undefined))
      .map((s) => ({ ...defaults.sections.find((d) => d.id === s.id), ...s })),
    ...defaults.sections.filter((d) => !known.has(d.id)),
  ];
  return {
    teamName: stored.teamName ?? defaults.teamName,
    tagline: stored.tagline ?? defaults.tagline,
    team: Array.isArray(stored.team) ? stored.team : defaults.team,
    sections,
  };
}

// ───────── Visibility ─────────

export async function getVisibility(): Promise<DocsVisibility> {
  const db = adminClient();
  const fallback = visibilityFromEnv();
  if (!db) return fallback;
  return cached("visibility", async () => {
    const { data, error } = await db.from("docs_settings").select("*").eq("id", 1).maybeSingle();
    if (error || !data) return fallback;
    return {
      enabled: data.enabled,
      startAt: data.start_at,
      endAt: data.end_at,
      timeZone: data.time_zone || fallback.timeZone,
      updatedAt: data.updated_at,
      updatedBy: data.updated_by,
    };
  });
}

export async function saveVisibility(v: DocsVisibility, by: string): Promise<void> {
  const db = requireDb();
  const { error } = await db.from("docs_settings").upsert({
    id: 1,
    enabled: v.enabled,
    start_at: v.startAt,
    end_at: v.endAt,
    time_zone: v.timeZone,
    updated_at: new Date().toISOString(),
    updated_by: by,
  });
  if (error) fail(error);
  invalidate();
}

// ───────── Content (draft / published) ─────────

export async function getContent(kind: "published" | "draft"): Promise<DocsContent & { updatedAt?: string | null }> {
  const db = adminClient();
  if (!db) return mergeContent(null);
  return cached(`content:${kind}`, async () => {
    const { data } = await db.from("docs_content").select("content, updated_at").eq("id", kind).maybeSingle();
    if (!data && kind === "draft") return getContent("published");
    return { ...mergeContent(data?.content), updatedAt: data?.updated_at ?? null };
  });
}

export async function saveDraft(content: DocsContent, by: string): Promise<void> {
  const db = requireDb();
  const { error } = await db
    .from("docs_content")
    .upsert({ id: "draft", content, updated_at: new Date().toISOString(), updated_by: by });
  if (error) fail(error);
  invalidate();
}

export async function publish(content: DocsContent, by: string, note: string | null): Promise<void> {
  const db = requireDb();
  const now = new Date().toISOString();
  const { error } = await db.from("docs_content").upsert([
    { id: "draft", content, updated_at: now, updated_by: by },
    { id: "published", content, updated_at: now, updated_by: by },
  ]);
  if (error) fail(error);
  const { error: vErr } = await db.from("docs_versions").insert({ content, note, created_by: by });
  if (vErr) fail(vErr);
  invalidate();
}

export async function listVersions(limit = 30): Promise<DocsVersion[]> {
  const db = adminClient();
  if (!db) return [];
  const { data } = await db
    .from("docs_versions")
    .select("id, note, created_at, created_by")
    .order("id", { ascending: false })
    .limit(limit);
  return (data ?? []).map((r) => ({ id: r.id, note: r.note, createdAt: r.created_at, createdBy: r.created_by }));
}

export async function restoreVersion(id: number, by: string): Promise<void> {
  const db = requireDb();
  const { data, error } = await db.from("docs_versions").select("content").eq("id", id).maybeSingle();
  if (error || !data) throw new Error("Version not found.");
  await publish(mergeContent(data.content), by, `Restored version #${id}`);
}

// ───────── Live usage counts ─────────

export interface UsageCounts {
  connected: boolean;
  profiles?: number | null;
  glucoseLogs?: number | null;
  foodScans?: number | null;
  recipes?: number | null;
}

export async function getUsageCounts(): Promise<UsageCounts> {
  const db = adminClient();
  if (!db) return { connected: false };
  return cached("usage", async () => {
    const count = async (table: string) => {
      const { count, error } = await db.from(table).select("*", { count: "exact", head: true });
      return error ? null : count;
    };
    const [profiles, glucoseLogs, foodScans, recipes] = await Promise.all([
      count("profiles"),
      count("glucose_logs"),
      count("food_scans"),
      count("generated_recipes"),
    ]);
    // Null everywhere means the tables aren't reachable: say "not connected" rather than show blanks
    const any = [profiles, glucoseLogs, foodScans, recipes].some((n) => typeof n === "number");
    return { connected: any, profiles, glucoseLogs, foodScans, recipes };
  });
}

function requireDb(): SupabaseClient {
  const db = adminClient();
  if (!db) throw new StorageUnavailableError();
  return db;
}

export class StorageUnavailableError extends Error {
  constructor() {
    super("Saving needs Supabase: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, then run the docs migration.");
  }
}

export class MigrationMissingError extends Error {
  constructor() {
    super("The docs tables don't exist yet: run supabase/migrations/20261118000000_docs_module.sql in the Supabase SQL editor.");
  }
}
