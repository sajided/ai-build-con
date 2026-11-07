/**
 * Doctor-visit report and caregiver snapshot.
 * The snapshot travels in the URL fragment (#…), which browsers never send to a server,
 * so a family member can open it without the patient having an account.
 */

import type { GlucoseLog, MeasurementContext } from "@/lib/validations/telemetry";
import { classifyGlucose, GLUCOSE_LOW, GLUCOSE_VERY_HIGH } from "@/lib/assistant/bangla";
import { medicineAdherence, type DoseRecord, type Reminder } from "@/lib/care/reminders";

export interface ReportMedicine {
  name: string;
  times: string[];
}

export interface CareSnapshot {
  name: string;
  generatedAt: string;
  days: number;
  readings: { at: string; value: number; context: MeasurementContext }[];
  medicines: ReportMedicine[];
  adherence: { scheduled: number; taken: number; percent: number | null };
}

export interface ReportStats {
  count: number;
  average: number | null;
  min: number | null;
  max: number | null;
  inRangePercent: number | null;
  lowCount: number;
  veryHighCount: number;
  byContext: Partial<Record<MeasurementContext, { count: number; average: number }>>;
  /** Average of fasting readings, the number doctors most often ask for */
  fastingAverage: number | null;
}

export const REPORT_PERIODS = [7, 14, 30] as const;

/** Target band used for "in range": 70–180 mg/dL, the standard time-in-range band. */
export const RANGE_LOW = 70;
export const RANGE_HIGH = 180;

export function readingsInPeriod(logs: GlucoseLog[], days: number, now = new Date()) {
  const from = now.getTime() - days * 24 * 60 * 60 * 1000;
  return logs
    .filter((l) => {
      const t = new Date(l.measured_at).getTime();
      return t >= from && t <= now.getTime();
    })
    .sort((a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime());
}

export function computeStats(readings: { value: number; context: MeasurementContext }[]): ReportStats {
  const values = readings.map((r) => r.value);
  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);

  const byContext: ReportStats["byContext"] = {};
  for (const r of readings) {
    const entry = byContext[r.context] ?? { count: 0, average: 0 };
    entry.average = (entry.average * entry.count + r.value) / (entry.count + 1);
    entry.count++;
    byContext[r.context] = entry;
  }
  for (const e of Object.values(byContext)) if (e) e.average = Math.round(e.average);

  return {
    count: values.length,
    average: avg(values),
    min: values.length ? Math.min(...values) : null,
    max: values.length ? Math.max(...values) : null,
    inRangePercent: values.length
      ? Math.round((values.filter((v) => v >= RANGE_LOW && v <= RANGE_HIGH).length / values.length) * 100)
      : null,
    lowCount: values.filter((v) => v < GLUCOSE_LOW).length,
    veryHighCount: values.filter((v) => v >= GLUCOSE_VERY_HIGH).length,
    byContext,
    fastingAverage: byContext.fasting?.average ?? null,
  };
}

export function buildSnapshot(
  name: string,
  logs: GlucoseLog[],
  reminders: Reminder[],
  doses: DoseRecord[],
  days: number,
  now = new Date()
): CareSnapshot {
  const adherence = medicineAdherence(now, reminders, doses, days);
  return {
    name,
    generatedAt: now.toISOString(),
    days,
    readings: readingsInPeriod(logs, days, now).map((l) => ({ at: l.measured_at, value: l.glucose_value, context: l.context })),
    medicines: reminders.filter((r) => r.kind === "medicine" && r.enabled).map((r) => ({ name: r.label, times: r.times })),
    adherence: { scheduled: adherence.scheduled, taken: adherence.taken, percent: adherence.percent },
  };
}

// ---------- Snapshot encoding ----------

const CONTEXTS: MeasurementContext[] = ["fasting", "post_meal", "bedtime", "random"];
/** Keeps the link short enough for SMS/WhatsApp (~150 readings ≈ 2.5 KB). */
const MAX_SNAPSHOT_READINGS = 150;

/** Compact wire format: readings as [minutesSinceEpoch, value, contextIndex]. */
interface Wire {
  v: 1;
  n: string;
  g: number;
  d: number;
  r: [number, number, number][];
  m: [string, string[]][];
  a: [number, number];
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): string {
  const bin = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function encodeSnapshot(s: CareSnapshot): string {
  const wire: Wire = {
    v: 1,
    n: s.name,
    g: Math.round(new Date(s.generatedAt).getTime() / 60000),
    d: s.days,
    r: s.readings
      .slice(0, MAX_SNAPSHOT_READINGS)
      .map((r) => [Math.round(new Date(r.at).getTime() / 60000), Math.round(r.value), Math.max(0, CONTEXTS.indexOf(r.context))]),
    m: s.medicines.map((m) => [m.name, m.times]),
    a: [s.adherence.scheduled, s.adherence.taken],
  };
  return toBase64Url(JSON.stringify(wire));
}

/** Returns null for anything malformed rather than throwing on a bad link. */
export function decodeSnapshot(encoded: string): CareSnapshot | null {
  try {
    const w = JSON.parse(fromBase64Url(encoded)) as Wire;
    if (w.v !== 1 || !Array.isArray(w.r)) return null;
    const [scheduled, taken] = w.a ?? [0, 0];
    return {
      name: String(w.n ?? "").slice(0, 60),
      generatedAt: new Date(w.g * 60000).toISOString(),
      days: Number(w.d) || 14,
      readings: w.r
        .filter((r) => Array.isArray(r) && Number.isFinite(r[0]) && Number.isFinite(r[1]))
        .map(([t, value, c]) => ({ at: new Date(t * 60000).toISOString(), value, context: CONTEXTS[c] ?? "random" })),
      medicines: (w.m ?? []).map(([name, times]) => ({ name: String(name).slice(0, 60), times: (times ?? []).map(String) })),
      adherence: { scheduled, taken, percent: scheduled ? Math.round((taken / scheduled) * 100) : null },
    };
  } catch {
    return null;
  }
}

export function snapshotUrl(origin: string, s: CareSnapshot) {
  return `${origin}/care#${encodeSnapshot(s)}`;
}

// ---------- Caregiver messages ----------

/** Strips everything except digits and a leading +, for tel:/sms:/wa.me links. */
export function cleanPhone(phone: string) {
  return phone.replace(/(?!^\+)[^\d]/g, "");
}

/** Bangladesh numbers: 01XXXXXXXXX → 8801XXXXXXXXX for WhatsApp. */
export function whatsappNumber(phone: string) {
  const p = cleanPhone(phone).replace(/^\+/, "");
  if (/^01\d{9}$/.test(p)) return "88" + p;
  return p;
}

export function smsHref(phone: string, body: string) {
  // "?&body=" works on both iOS and Android
  return `sms:${cleanPhone(phone)}?&body=${encodeURIComponent(body)}`;
}

export function whatsappHref(phone: string, text: string) {
  return `https://wa.me/${whatsappNumber(phone)}?text=${encodeURIComponent(text)}`;
}

export function alertMessageBn(name: string, value: number, valueBn: string) {
  const level = classifyGlucose(value);
  const what = level === "low" ? "কম" : "অনেক বেশি";
  return `যত্ন অ্যাপ: ${name.trim() || "আপনার পরিবারের সদস্য"}-এর সুগার এখন ${valueBn} (${what})। দয়া করে এখনই খোঁজ নিন।`;
}
