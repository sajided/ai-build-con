import { CONTEXT_LABELS_BN, LEVEL_LABELS_BN, classifyGlucose, toBanglaDigits } from "@/lib/assistant/bangla";
import { computeStats, toMmol, type CareSnapshot } from "@/lib/care/report";
import type { MeasurementContext } from "@/lib/validations/telemetry";

const CONTEXT_EN: Record<MeasurementContext, string> = {
  fasting: "Fasting",
  post_meal: "After meal",
  bedtime: "Bedtime",
  random: "Random",
};

const LEVEL_STYLES = {
  low: "bg-risk-danger text-risk-dangerInk",
  good: "bg-risk-safe text-risk-safeInk",
  slightly_high: "bg-risk-caution text-risk-cautionInk",
  high: "bg-risk-danger text-risk-dangerInk",
  very_high: "bg-risk-danger text-risk-dangerInk",
};

/** Bangla label for the patient with the English term underneath for the doctor. */
function Label({ bn, en }: { bn: string; en: string }) {
  return (
    <span className="block">
      <span className="block text-base font-semibold text-ink-soft">{bn}</span>
      <span className="block text-sm font-semibold uppercase tracking-wide text-ink-muted">{en}</span>
    </span>
  );
}

function Stat({ bn, en, value, unit = "mmol/L" }: { bn: string; en: string; value: number | null; unit?: string }) {
  return (
    <div className="rounded-2xl bg-canvas p-4 print:border print:border-line print:bg-white">
      <Label bn={bn} en={en} />
      <p className="mt-2 text-3xl font-bold text-ink">
        {value === null ? "—" : value}
        {value !== null && unit && <span className="ml-1 text-sm font-semibold text-ink-muted">{unit}</span>}
      </p>
    </div>
  );
}

function mmolOrNull(value: number | null) {
  return value === null ? null : toMmol(value);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}, ${d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

/** Shared by the doctor report (/report) and the caregiver view (/care). Printable. */
export default function CareReport({ snapshot }: { snapshot: CareSnapshot }) {
  const stats = computeStats(snapshot.readings);
  const from = new Date(new Date(snapshot.generatedAt).getTime() - snapshot.days * 86400000).toISOString();
  const contexts = (Object.keys(CONTEXT_EN) as MeasurementContext[]).filter((c) => stats.byContext[c]);

  return (
    <article lang="bn" className="space-y-5">
      <header className="card p-5 print:shadow-none">
        <p className="text-sm font-bold uppercase tracking-wide text-ink-muted">Jotno · Glucose report</p>
        <h2 className="mt-1 text-3xl font-bold text-ink">{snapshot.name || "Patient"}</h2>
        <p className="mt-1 text-base font-semibold text-ink-soft">
          {fmtDate(from)} – {fmtDate(snapshot.generatedAt)} ({snapshot.days} days)
        </p>
      </header>

      <section className="card p-5 print:shadow-none">
        <h3 className="text-xl font-bold text-ink">সুগারের হিসাব · Summary</h3>
        {stats.count === 0 ? (
          <p className="mt-3 text-lg text-ink-soft">এই সময়ে কোনো সুগার রাখা হয়নি। No readings in this period.</p>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Stat bn="গড় সুগার" en="Average" value={mmolOrNull(stats.average)} />
              <Stat bn="খালি পেটে গড়" en="Fasting average" value={mmolOrNull(stats.fastingAverage)} />
              <Stat bn="সবচেয়ে কম" en="Lowest" value={mmolOrNull(stats.min)} />
              <Stat bn="সবচেয়ে বেশি" en="Highest" value={mmolOrNull(stats.max)} />
              <Stat bn="৩.৯–১০.০ mmol/L এর মধ্যে" en="Time in range (3.9–10.0)" value={stats.inRangePercent} unit="%" />
              <Stat bn="মোট মাপা" en="Readings" value={stats.count} unit="" />
            </div>
            {(stats.lowCount > 0 || stats.veryHighCount > 0) && (
              <p className="mt-4 rounded-2xl bg-risk-danger p-4 text-lg font-semibold text-risk-dangerInk">
                {stats.lowCount > 0 && `কম সুগার (<৩.৯): ${toBanglaDigits(stats.lowCount)} বার · Lows: ${stats.lowCount}. `}
                {stats.veryHighCount > 0 &&
                  `অনেক বেশি (≥১৬.৭): ${toBanglaDigits(stats.veryHighCount)} বার · Very high: ${stats.veryHighCount}.`}
              </p>
            )}
          </>
        )}
      </section>

      {contexts.length > 0 && (
        <section className="card p-5 print:shadow-none">
          <h3 className="text-xl font-bold text-ink">কখন মাপা · By time of day</h3>
          <table className="mt-3 w-full text-left text-lg">
            <thead>
              <tr className="text-sm text-ink-muted">
                <th className="py-2 font-semibold">When</th>
                <th className="py-2 text-right font-semibold">Count</th>
                <th className="py-2 text-right font-semibold">Avg mmol/L</th>
              </tr>
            </thead>
            <tbody>
              {contexts.map((c) => (
                <tr key={c} className="border-t border-line">
                  <td className="py-2 font-semibold text-ink">
                    {CONTEXT_LABELS_BN[c]} <span className="text-sm text-ink-muted">· {CONTEXT_EN[c]}</span>
                  </td>
                  <td className="py-2 text-right text-ink">{stats.byContext[c]!.count}</td>
                  <td className="py-2 text-right font-bold text-ink">{toMmol(stats.byContext[c]!.average)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="card p-5 print:shadow-none">
        <h3 className="text-xl font-bold text-ink">ওষুধ · Medicines</h3>
        {snapshot.medicines.length === 0 ? (
          <p className="mt-3 text-lg text-ink-soft">কোনো ওষুধ যোগ করা হয়নি। No medicine reminders set.</p>
        ) : (
          <>
            <ul className="mt-3 space-y-2">
              {snapshot.medicines.map((m) => (
                <li key={m.name + m.times.join()} className="flex justify-between gap-3 border-t border-line pt-2 text-lg first:border-0 first:pt-0">
                  <span className="font-semibold text-ink">{m.name}</span>
                  <span className="text-ink-soft">{m.times.join(", ")}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-lg font-semibold text-ink">
              {snapshot.adherence.percent === null
                ? "ওষুধ খাওয়ার হিসাব এখনো নেই। No adherence data yet."
                : `সময়মতো খেয়েছেন: ${snapshot.adherence.taken}/${snapshot.adherence.scheduled} (${snapshot.adherence.percent}%) · Doses taken`}
            </p>
            <p className="mt-1 text-sm text-ink-muted">Based on reminders the patient confirmed in the app.</p>
          </>
        )}
      </section>

      {snapshot.readings.length > 0 && (
        <section className="card p-5 print:shadow-none print:break-before-page">
          <h3 className="text-xl font-bold text-ink">সব সুগার · All readings</h3>
          <table className="mt-3 w-full text-left text-base">
            <thead>
              <tr className="text-sm text-ink-muted">
                <th className="py-2 font-semibold">Date</th>
                <th className="py-2 font-semibold">When</th>
                <th className="py-2 text-right font-semibold">mmol/L</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.readings.map((r) => {
                const level = classifyGlucose(r.value);
                return (
                  <tr key={r.at + r.value} className="border-t border-line">
                    <td className="py-2 text-ink">{fmtDateTime(r.at)}</td>
                    <td className="py-2 text-ink-soft">{CONTEXT_EN[r.context]}</td>
                    <td className="py-2 text-right">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 font-bold ${LEVEL_STYLES[level]}`}>
                        {toMmol(r.value)}
                        <span className="sr-only"> ({LEVEL_LABELS_BN[level]})</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      <p className="px-1 text-sm text-ink-muted">
        Patient-recorded readings from a home glucometer. For discussion with a clinician; not a diagnosis.
      </p>
    </article>
  );
}
