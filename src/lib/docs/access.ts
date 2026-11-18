/**
 * Visibility rules for the public /docs page.
 * Pure functions so the judging window can be unit-tested without a clock or database.
 */

export interface DocsVisibility {
  /** Master switch. Off means hidden, whatever the schedule says. */
  enabled: boolean;
  /** ISO timestamps. Null means "no limit" on that side. */
  startAt: string | null;
  endAt: string | null;
  /** IANA time zone the admin thinks in. Only used for display. */
  timeZone: string;
  updatedAt?: string | null;
  updatedBy?: string | null;
}

export const DOCS_TIME_ZONE = "Asia/Dhaka";

/** Default judging window: 18 Nov 00:00 → 18 Dec 23:59 Dhaka time (UTC+6, no daylight saving). */
export const DEFAULT_VISIBILITY: DocsVisibility = {
  enabled: true,
  startAt: "2026-11-18T00:00:00+06:00",
  endAt: "2026-12-18T23:59:59+06:00",
  timeZone: DOCS_TIME_ZONE,
};

export type DocsAvailability =
  | { open: true; closesAt: string | null }
  | { open: false; reason: "disabled" | "not_started" | "ended"; opensAt?: string | null };

export function evaluateAvailability(v: DocsVisibility, now: Date = new Date()): DocsAvailability {
  if (!v.enabled) return { open: false, reason: "disabled" };
  const t = now.getTime();
  if (v.startAt && t < Date.parse(v.startAt)) return { open: false, reason: "not_started", opensAt: v.startAt };
  if (v.endAt && t > Date.parse(v.endAt)) return { open: false, reason: "ended" };
  return { open: true, closesAt: v.endAt };
}

/** Turns "publish for N hours from now" into a concrete window. */
export function windowFromDuration(hours: number, now: Date = new Date()): Pick<DocsVisibility, "startAt" | "endAt"> {
  const start = new Date(now);
  const end = new Date(now.getTime() + hours * 3_600_000);
  return { startAt: start.toISOString(), endAt: end.toISOString() };
}

/** Rejects windows an admin could not have meant (end before start, unparseable dates). */
export function validateVisibility(input: Partial<DocsVisibility>): { ok: true; value: DocsVisibility } | { ok: false; error: string } {
  const startAt = input.startAt || null;
  const endAt = input.endAt || null;
  if (startAt && Number.isNaN(Date.parse(startAt))) return { ok: false, error: "Start date is not a valid date." };
  if (endAt && Number.isNaN(Date.parse(endAt))) return { ok: false, error: "End date is not a valid date." };
  if (startAt && endAt && Date.parse(endAt) <= Date.parse(startAt)) {
    return { ok: false, error: "End must be after start." };
  }
  return {
    ok: true,
    value: {
      enabled: Boolean(input.enabled),
      startAt,
      endAt,
      timeZone: input.timeZone || DOCS_TIME_ZONE,
    },
  };
}

/** Env vars can pin the schedule on hosts without a database (DOCS_ENABLED, DOCS_START_AT, DOCS_END_AT). */
export function visibilityFromEnv(env: Record<string, string | undefined> = process.env): DocsVisibility {
  const v = { ...DEFAULT_VISIBILITY };
  if (env.DOCS_ENABLED !== undefined) v.enabled = !["false", "0", "off", "no"].includes(env.DOCS_ENABLED.toLowerCase());
  if (env.DOCS_START_AT !== undefined) v.startAt = env.DOCS_START_AT || null;
  if (env.DOCS_END_AT !== undefined) v.endAt = env.DOCS_END_AT || null;
  return v;
}

export function formatInZone(iso: string | null, timeZone = DOCS_TIME_ZONE): string {
  if (!iso) return "no limit";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}
