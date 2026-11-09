"use client";

/**
 * Dashboard insights: sugar trend, how often sugar stayed in the target band, sugar by time of day,
 * and medicine taken / missed. Plain Bangla labels, big text, and every colour paired with a word.
 */

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea } from "recharts";
import { ArrowDown, ArrowUp, Check, Minus, Sparkles, X } from "lucide-react";
import type { GlucoseLog, MeasurementContext } from "@/lib/validations/telemetry";
import { CONTEXT_LABELS_BN, classifyGlucose, toBanglaDigits } from "@/lib/assistant/bangla";
import { computeStats, readingsInPeriod, toMgDl, toMmol } from "@/lib/care/report";
import { loadDoses, loadReminders, localDate, type DoseRecord, type Reminder } from "@/lib/care/reminders";
import { loadLogs } from "@/lib/assistant/client";
import { calculateEstimatedHbA1c } from "@/utils/telemetry";
import { METFORMIN, demoHistory } from "@/components/demo/script";

// ---------- Bands and colours ----------

/** Four bands the patient understands. "Very high" is folded into "high" and called out in text. */
type Band = "low" | "good" | "slightly_high" | "high";

const BAND_ORDER: Band[] = ["low", "good", "slightly_high", "high"];

/** Status palette (dataviz reference): critical / good / warning / serious. Always shown with a label + arrow. */
const BAND: Record<Band, { label: string; color: string; ink: string; icon: React.ElementType | null }> = {
  low: { label: "কম", color: "#d03b3b", ink: "#ffffff", icon: ArrowDown },
  good: { label: "ঠিক আছে", color: "#0ca30c", ink: "#ffffff", icon: null },
  slightly_high: { label: "একটু বেশি", color: "#fab219", ink: "#1F2328", icon: ArrowUp },
  high: { label: "বেশি", color: "#ec835a", ink: "#1F2328", icon: ArrowUp },
};

function bandOf(mgdl: number): Band {
  const level = classifyGlucose(mgdl);
  return level === "very_high" ? "high" : level;
}

/** Patient target band in mmol/L, same as the home screen's "ভালো" */
const TARGET = { min: 3.9, max: 7.8 };
const PERIODS = [7, 14, 30] as const;
const DAY_MS = 24 * 60 * 60 * 1000;

const SURFACE = "#ffffff";
/** Light connector: the coloured dots carry the meaning, the line only shows order */
const LINE = "#C4C7CC";
const GRID = "#EEECE4";

const fmtDay = (t: number) => new Date(t).toLocaleDateString("bn-BD", { day: "numeric", month: "short" });
const fmtTime = (t: number) => new Date(t).toLocaleTimeString("bn-BD", { hour: "numeric", minute: "2-digit" });
const bn1 = (n: number) => toBanglaDigits(n.toFixed(1));

// ---------- Small pieces ----------

function BandKey({ band }: { band: Band }) {
  const { label, color, icon: Icon } = BAND[band];
  return (
    <span className="inline-flex items-center gap-1.5 text-base font-semibold text-ink-soft">
      <span className="h-3 w-3 rounded-full" style={{ background: color }} />
      {Icon && <Icon className="h-4 w-4" />}
      {label}
    </span>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="card p-4">
      <h3 className="text-xl font-bold text-ink">{title}</h3>
      {subtitle && <p className="mt-0.5 text-base text-ink-muted">{subtitle}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function StatTile({ label, value, unit, note }: { label: string; value: string; unit?: string; note?: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-canvas p-3">
      <p className="text-base font-semibold text-ink-soft">{label}</p>
      <p className="mt-1 text-3xl font-bold leading-none text-ink">
        {value}
        {unit && <span className="ml-1 text-sm font-semibold text-ink-muted">{unit}</span>}
      </p>
      {note && <p className="mt-1 text-sm font-semibold text-ink-muted">{note}</p>}
    </div>
  );
}

// ---------- Trend chart ----------

interface Point {
  t: number;
  mmol: number;
  band: Band;
  context: MeasurementContext;
}

function TrendTooltip({ active, payload }: { active?: boolean; payload?: { payload: Point }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div lang="bn" className="rounded-2xl bg-white p-3 text-base shadow-soft">
      <p className="font-bold text-ink">
        {fmtDay(p.t)}, {fmtTime(p.t)}
      </p>
      <p className="mt-1 text-2xl font-bold text-ink">
        {bn1(p.mmol)} <span className="text-sm font-semibold text-ink-muted">mmol/L</span>
      </p>
      <p className="mt-1 flex flex-wrap items-center gap-2 text-ink-soft">
        <BandKey band={p.band} /> · {CONTEXT_LABELS_BN[p.context]}
      </p>
    </div>
  );
}

function TrendChart({ points, from, to }: { points: Point[]; from: number; to: number }) {
  const maxY = Math.max(12, Math.ceil(Math.max(...points.map((p) => p.mmol)) + 1));
  const last = points[points.length - 1];

  // Dots carry the band colour with a 2px surface ring; the latest reading is labelled directly
  const renderDot = (props: { cx?: number; cy?: number; payload?: Point; index?: number }) => {
    const { cx, cy, payload, index } = props;
    if (cx == null || cy == null || !payload) return <g key={index} />;
    const isLast = payload === last;
    return (
      <g key={index}>
        <circle cx={cx} cy={cy} r={isLast ? 7 : 5} fill={BAND[payload.band].color} stroke={SURFACE} strokeWidth={2} />
        {isLast && (
          <text x={cx} y={cy - 14} textAnchor="end" fontSize={15} fontWeight={700} fill="#1F2328">
            {bn1(payload.mmol)}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="h-[260px] w-full" role="img" aria-label={`সুগারের গ্রাফ, ${toBanglaDigits(points.length)}টি মাপ`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={points} margin={{ top: 24, right: 16, bottom: 4, left: -16 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          {/* Green wash = target band */}
          <ReferenceArea y1={TARGET.min} y2={TARGET.max} fill={BAND.good.color} fillOpacity={0.1} stroke="none" ifOverflow="hidden" />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={[from, to]}
            tickFormatter={fmtDay}
            tickCount={4}
            tick={{ fontSize: 13, fill: "#8A8E95" }}
            axisLine={{ stroke: GRID }}
            tickLine={false}
          />
          <YAxis
            domain={[2, maxY]}
            ticks={[TARGET.min, TARGET.max, 10, ...(maxY > 14 ? [15] : [])]}
            tickFormatter={(v: number) => toBanglaDigits(v)}
            tick={{ fontSize: 13, fill: "#8A8E95" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<TrendTooltip />} cursor={{ stroke: "#8A8E95", strokeWidth: 1 }} />
          <Line
            type="monotone"
            dataKey="mmol"
            stroke={LINE}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            dot={renderDot}
            activeDot={{ r: 8, stroke: SURFACE, strokeWidth: 2, fill: "#4A4F57" }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------- Range bar ----------

function RangeBar({ counts, total }: { counts: Record<Band, number>; total: number }) {
  const parts = BAND_ORDER.filter((b) => counts[b] > 0);
  const name = parts.map((b) => `${BAND[b].label} ${toBanglaDigits(Math.round((counts[b] / total) * 100))}%`).join(", ");
  return (
    <div>
      <div className="flex h-7 w-full gap-[2px]" role="img" aria-label={name}>
        {parts.map((b) => {
          const pct = Math.round((counts[b] / total) * 100);
          return (
            <div
              key={b}
              title={`${BAND[b].label}: ${toBanglaDigits(counts[b])} বার (${toBanglaDigits(pct)}%)`}
              className="flex items-center rounded px-2 text-sm font-bold"
              style={{ width: `${(counts[b] / total) * 100}%`, background: BAND[b].color, color: BAND[b].ink }}
            >
              {pct >= 12 ? `${toBanglaDigits(pct)}%` : ""}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {BAND_ORDER.map((b) => (
          <span key={b} className="inline-flex items-center gap-1">
            <BandKey band={b} />
            <span className="text-base font-bold text-ink">{toBanglaDigits(counts[b])}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------- Time of day ----------

const CONTEXT_ORDER: MeasurementContext[] = ["fasting", "post_meal", "bedtime", "random"];

function TimeOfDayBars({ rows }: { rows: { context: MeasurementContext; mmol: number; count: number }[] }) {
  // Leave room at the right for the value label
  const max = Math.max(14, ...rows.map((r) => r.mmol * 1.6));
  const pos = (v: number) => `${(v / max) * 100}%`;
  return (
    <div className="space-y-3">
      {rows.map((r) => {
        const band = bandOf(r.mmol * 18);
        return (
          <div key={r.context}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-base font-semibold text-ink">{CONTEXT_LABELS_BN[r.context]}</span>
              <span className="text-sm font-semibold text-ink-muted">{toBanglaDigits(r.count)} বার মাপা</span>
            </div>
            <div className="relative mt-1 h-6">
              {/* Target band behind the bar */}
              <div className="absolute inset-y-0 rounded" style={{ left: pos(TARGET.min), width: pos(TARGET.max - TARGET.min), background: "rgba(12,163,12,0.1)" }} />
              <div className="absolute inset-y-1 left-0 rounded-r" style={{ width: pos(r.mmol), background: BAND[band].color }} />
              <span className="absolute inset-y-0 flex items-center gap-1 whitespace-nowrap pl-2 text-base font-bold text-ink" style={{ left: pos(r.mmol) }}>
                {bn1(r.mmol)}
                {band !== "good" && <span className="text-sm font-semibold text-ink-muted">({BAND[band].label})</span>}
              </span>
            </div>
          </div>
        );
      })}
      <p className="text-sm text-ink-muted">হালকা সবুজ অংশ = লক্ষ্য ({bn1(TARGET.min)}–{bn1(TARGET.max)} mmol/L)</p>
    </div>
  );
}

// ---------- Medicine grid ----------

type SlotState = "taken" | "missed" | "open";

function MedicineGrid({ now, reminders, doses }: { now: Date; reminders: Reminder[]; doses: DoseRecord[] }) {
  const meds = reminders.filter((r) => r.kind === "medicine" && r.enabled);
  if (!meds.length) {
    return (
      <p className="text-base text-ink-soft">
        এখনো কোনো ওষুধ যোগ করা হয়নি।{" "}
        <Link href="/reminders" className="font-bold text-ink underline underline-offset-4">
          ওষুধ যোগ করুন
        </Link>
      </p>
    );
  }

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (6 - i));
    return d;
  });
  const slots = meds.flatMap((m) => m.times.map((time) => ({ med: m, time })));
  let taken = 0;
  let due = 0;

  const state = (med: Reminder, time: string, day: Date): SlotState => {
    const [h, m] = time.split(":").map(Number);
    const at = new Date(day);
    at.setHours(h, m, 0, 0);
    const date = localDate(day);
    const ok = doses.some((d) => d.reminderId === med.id && d.date === date && d.time === time && d.status === "taken");
    if (ok) return "taken";
    // Still within its 2-hour window (or in the future)
    return at.getTime() + 2 * 60 * 60 * 1000 > now.getTime() ? "open" : "missed";
  };

  const grid = slots.map(({ med, time }) =>
    days.map((day) => {
      const s = state(med, time, day);
      if (s !== "open") due++;
      if (s === "taken") taken++;
      return s;
    })
  );
  const pct = due ? Math.round((taken / due) * 100) : null;
  const hour = (time: string) => {
    const h = Number(time.split(":")[0]);
    return h < 12 ? "সকাল" : h < 17 ? "দুপুর" : "রাত";
  };

  return (
    <div>
      {pct !== null && (
        <p className="mb-3 text-lg font-semibold text-ink">
          ৭ দিনে {toBanglaDigits(due)} বারের মধ্যে <span className="text-2xl font-bold">{toBanglaDigits(taken)}</span> বার ওষুধ খেয়েছেন ({toBanglaDigits(pct)}%)
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-1 text-center">
          <thead>
            <tr>
              <th className="sr-only">ওষুধ</th>
              {days.map((d) => (
                <th key={d.toISOString()} scope="col" className="text-sm font-semibold text-ink-muted">
                  {d.toLocaleDateString("bn-BD", { weekday: "short" })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map(({ med, time }, row) => (
              <tr key={`${med.id}-${time}`}>
                <th scope="row" className="whitespace-nowrap pr-1 text-left text-sm font-semibold text-ink-soft">
                  {med.label}
                  <span className="block text-ink-muted">{hour(time)}</span>
                </th>
                {grid[row].map((s, i) => (
                  <td key={i}>
                    <span
                      className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full ${
                        s === "taken" ? "bg-[#0ca30c] text-white" : s === "missed" ? "border-2 border-[#d03b3b] text-[#d03b3b]" : "bg-canvas text-ink-muted"
                      }`}
                      aria-label={s === "taken" ? "খেয়েছেন" : s === "missed" ? "খাননি" : "এখনো সময় হয়নি"}
                    >
                      {s === "taken" ? <Check className="h-4 w-4" strokeWidth={3} /> : s === "missed" ? <X className="h-4 w-4" strokeWidth={3} /> : <Minus className="h-4 w-4" />}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-base font-semibold text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <Check className="h-4 w-4" /> খেয়েছেন
        </span>
        <span className="inline-flex items-center gap-1.5">
          <X className="h-4 w-4" /> খাননি
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Minus className="h-4 w-4" /> সময় হয়নি
        </span>
      </div>
    </div>
  );
}

// ---------- Main ----------

const MIN_READINGS = 3;

export default function SugarInsights() {
  const [data, setData] = useState<{ logs: GlucoseLog[]; reminders: Reminder[]; doses: DoseRecord[] } | null>(null);
  const [days, setDays] = useState<number>(14);
  const [sample, setSample] = useState(false);
  const [now] = useState(() => new Date());

  useEffect(() => {
    setData({ logs: loadLogs(), reminders: loadReminders(), doses: loadDoses() });
  }, []);

  const source = useMemo(() => {
    if (!data) return null;
    if (!sample) return data;
    const demo = demoHistory(now);
    return { logs: demo.logs, reminders: [METFORMIN], doses: demo.doses };
  }, [data, sample, now]);

  const view = useMemo(() => {
    if (!source) return null;
    const current = readingsInPeriod(source.logs, days, now);
    const previous = readingsInPeriod(source.logs, days, new Date(now.getTime() - days * DAY_MS));
    const stats = computeStats(current.map((l) => ({ value: l.glucose_value, context: l.context })));
    const prevStats = computeStats(previous.map((l) => ({ value: l.glucose_value, context: l.context })));
    const points: Point[] = [...current]
      .reverse()
      .map((l) => ({ t: new Date(l.measured_at).getTime(), mmol: toMmol(l.glucose_value), band: bandOf(toMgDl(l.glucose_value)), context: l.context }));
    const counts = Object.fromEntries(BAND_ORDER.map((b) => [b, points.filter((p) => p.band === b).length])) as Record<Band, number>;
    const byContext = CONTEXT_ORDER.flatMap((c) => {
      const e = stats.byContext[c];
      return e ? [{ context: c, mmol: toMmol(e.average), count: e.count }] : [];
    });
    return { stats, prevStats, points, counts, byContext };
  }, [source, days, now]);

  if (!data || !source || !view) return null;

  const { stats, prevStats, points, counts, byContext } = view;
  const enough = stats.count >= MIN_READINGS;
  const hasOwnData = data.logs.length >= MIN_READINGS;

  if (!enough && !sample) {
    return (
      <section lang="bn" className="card mb-4 p-5">
        <h2 className="text-2xl font-bold text-ink">আমার সুগারের হিসাব</h2>
        <p className="mt-2 text-lg text-ink-soft">
          অন্তত {toBanglaDigits(MIN_READINGS)} বার সুগার রাখলে এখানে গ্রাফ দেখাবে। এখন পর্যন্ত রাখা হয়েছে {toBanglaDigits(data.logs.length)} বার।
        </p>
        <button type="button" onClick={() => setSample(true)} className="btn-secondary mt-4 h-14 text-lg">
          <Sparkles className="h-5 w-5" />
          নমুনা তথ্য দিয়ে দেখুন
        </button>
      </section>
    );
  }

  const avg = stats.average !== null ? toMmol(stats.average) : null;
  const prevAvg = prevStats.average !== null ? toMmol(prevStats.average) : null;
  const delta = avg !== null && prevAvg !== null && prevStats.count >= MIN_READINGS ? Number((avg - prevAvg).toFixed(1)) : null;
  const avgBand = avg !== null ? bandOf(avg * 18) : null;
  const goodPct = stats.count ? Math.round((counts.good / stats.count) * 100) : 0;
  const a1c = stats.average !== null && stats.count >= 10 ? calculateEstimatedHbA1c(stats.average) : null;

  return (
    <section lang="bn" className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-bold text-ink">আমার সুগারের হিসাব</h2>
        {sample && (
          <span className="chip bg-pastel-peach text-pastel-peach-ink">
            <Sparkles className="h-4 w-4" />
            নমুনা তথ্য
          </span>
        )}
      </div>

      {/* One filter row scopes every chart below */}
      <div role="radiogroup" aria-label="কত দিনের হিসাব" className="grid grid-cols-3 gap-2">
        {PERIODS.map((d) => (
          <button key={d} type="button" role="radio" aria-checked={days === d} onClick={() => setDays(d)} className="chip-toggle justify-center text-lg">
            {toBanglaDigits(d)} দিন
          </button>
        ))}
      </div>

      {/* Headline */}
      <section className="card p-4">
        <p className="text-base font-semibold text-ink-soft">গড় সুগার · গত {toBanglaDigits(days)} দিন</p>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-5xl font-bold leading-none text-ink">{avg !== null ? bn1(avg) : "—"}</span>
          <span className="text-lg font-bold text-ink-muted">mmol/L</span>
          {avgBand && <BandKey band={avgBand} />}
        </div>
        {delta !== null && (
          <p className="mt-2 flex items-center gap-1.5 text-base font-semibold text-ink-soft">
            {delta === 0 ? (
              <>আগের {toBanglaDigits(days)} দিনের মতোই</>
            ) : (
              <>
                {delta < 0 ? <ArrowDown className="h-5 w-5" /> : <ArrowUp className="h-5 w-5" />}
                আগের {toBanglaDigits(days)} দিনের চেয়ে {bn1(Math.abs(delta))} {delta < 0 ? "কম — ভালো হচ্ছে" : "বেশি"}
              </>
            )}
          </p>
        )}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <StatTile label="খালি পেটে গড়" value={stats.fastingAverage !== null ? bn1(toMmol(stats.fastingAverage)) : "—"} />
          <StatTile label="ঠিক ছিল" value={`${toBanglaDigits(goodPct)}%`} note={`${toBanglaDigits(stats.count)} বারের মধ্যে`} />
          <StatTile label="আনুমানিক HbA1c" value={a1c !== null ? bn1(a1c) : "—"} unit={a1c !== null ? "%" : undefined} note={a1c === null ? "১০ বার মাপলে" : undefined} />
        </div>
      </section>

      <Section title="সুগার কেমন যাচ্ছে" subtitle="প্রতিটি বিন্দু একবার মাপা। সবুজ অংশ = লক্ষ্য।">
        <TrendChart points={points} from={now.getTime() - days * DAY_MS} to={now.getTime()} />
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {BAND_ORDER.map((b) => (
            <BandKey key={b} band={b} />
          ))}
        </div>
        <details className="mt-3">
          <summary className="cursor-pointer text-base font-semibold text-ink-soft">সংখ্যায় দেখুন</summary>
          <table className="mt-2 w-full text-left text-base">
            <thead className="text-sm text-ink-muted">
              <tr>
                <th className="py-1 font-semibold">কখন</th>
                <th className="py-1 font-semibold">সুগার</th>
                <th className="py-1 font-semibold">অবস্থা</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {[...points].reverse().map((p) => (
                <tr key={p.t} className="border-t border-line">
                  <td className="py-1.5 text-ink-soft">
                    {fmtDay(p.t)}, {fmtTime(p.t)}
                  </td>
                  <td className="py-1.5 font-bold text-ink">{bn1(p.mmol)}</td>
                  <td className="py-1.5">
                    <BandKey band={p.band} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </Section>

      <Section title="কতবার সুগার ঠিক ছিল" subtitle={`${toBanglaDigits(stats.count)} বারের মধ্যে ${toBanglaDigits(counts.good)} বার লক্ষ্যের মধ্যে`}>
        <RangeBar counts={counts} total={stats.count} />
        {stats.lowCount > 0 && (
          <p className="mt-3 rounded-2xl bg-risk-danger p-3 text-base font-semibold text-risk-dangerInk">
            {toBanglaDigits(stats.lowCount)} বার সুগার কমে গিয়েছিল। ডাক্তারকে জানান।
          </p>
        )}
        {stats.veryHighCount > 0 && (
          <p className="mt-3 rounded-2xl bg-risk-danger p-3 text-base font-semibold text-risk-dangerInk">
            {toBanglaDigits(stats.veryHighCount)} বার সুগার অনেক বেশি ছিল। ডাক্তারকে জানান।
          </p>
        )}
      </Section>

      {byContext.length > 0 && (
        <Section title="কখন সুগার বেশি থাকে" subtitle="দিনের কোন সময়ে গড় সুগার কত">
          <TimeOfDayBars rows={byContext} />
        </Section>
      )}

      <Section title="ওষুধ খাওয়া · গত ৭ দিন">
        <MedicineGrid now={now} reminders={source.reminders} doses={source.doses} />
      </Section>

      {sample && (
        <button type="button" onClick={() => setSample(false)} className="btn-secondary h-12 text-base">
          {hasOwnData ? "আমার নিজের তথ্য দেখুন" : "নমুনা তথ্য বন্ধ করুন"}
        </button>
      )}
    </section>
  );
}
