/**
 * Medicine and daily-care reminders for elderly users.
 * Pure scheduling logic plus localStorage persistence (browser only for the storage helpers).
 */

export type ReminderKind = "medicine" | "water" | "walk" | "foot";

export interface Reminder {
  id: string;
  kind: ReminderKind;
  /** Medicine name, e.g. "মেটফরমিন". Empty for daily-care reminders. */
  label: string;
  /** Local times, "HH:MM" 24h */
  times: string[];
  enabled: boolean;
}

export interface DoseRecord {
  reminderId: string;
  /** Local date "YYYY-MM-DD" the slot belongs to */
  date: string;
  /** Slot time "HH:MM" */
  time: string;
  status: "taken" | "skipped";
  at: string;
}

export interface DueReminder {
  reminder: Reminder;
  date: string;
  time: string;
}

/** Morning / noon / night presets elders pick from instead of a clock picker. */
export const TIME_PRESETS = [
  { time: "08:00", label: "সকাল ৮টা" },
  { time: "14:00", label: "দুপুর ২টা" },
  { time: "21:00", label: "রাত ৯টা" },
] as const;

export const DAILY_CARE_DEFAULTS: Reminder[] = [
  { id: "care-water", kind: "water", label: "", times: ["10:00", "13:00", "16:00", "19:00"], enabled: false },
  { id: "care-walk", kind: "walk", label: "", times: ["17:00"], enabled: false },
  { id: "care-foot", kind: "foot", label: "", times: ["21:30"], enabled: false },
];

/** How long a reminder stays on screen after its time before it counts as missed. */
export const DUE_WINDOW_MIN = 120;
/** "পরে" hides a reminder for this long. */
export const SNOOZE_MIN = 15;

export function localDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function minutesOf(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Reminders whose time has come within the last DUE_WINDOW_MIN minutes today
 * and that have not been answered or snoozed. Medicines come first.
 */
export function dueReminders(
  now: Date,
  reminders: Reminder[],
  doses: DoseRecord[],
  snoozedUntil: Record<string, number> = {}
): DueReminder[] {
  const date = localDate(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const due: DueReminder[] = [];

  for (const reminder of reminders) {
    if (!reminder.enabled) continue;
    for (const time of reminder.times) {
      const diff = nowMin - minutesOf(time);
      if (diff < 0 || diff > DUE_WINDOW_MIN) continue;
      const answered = doses.some((d) => d.reminderId === reminder.id && d.date === date && d.time === time);
      const key = slotKey(reminder.id, date, time);
      if (answered || (snoozedUntil[key] ?? 0) > now.getTime()) continue;
      due.push({ reminder, date, time });
    }
  }
  return due.sort((a, b) => Number(b.reminder.kind === "medicine") - Number(a.reminder.kind === "medicine"));
}

export function slotKey(reminderId: string, date: string, time: string) {
  return `${reminderId}|${date}|${time}`;
}

/**
 * Medicine adherence over the last `days` days (ending today, only slots already past).
 * Unanswered past slots count as missed.
 */
export function medicineAdherence(now: Date, reminders: Reminder[], doses: DoseRecord[], days: number) {
  const meds = reminders.filter((r) => r.kind === "medicine" && r.enabled);
  let scheduled = 0;
  let taken = 0;
  const nowMin = now.getHours() * 60 + now.getMinutes();

  for (let i = 0; i < days; i++) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    const date = localDate(day);
    for (const med of meds) {
      for (const time of med.times) {
        if (i === 0 && minutesOf(time) + DUE_WINDOW_MIN > nowMin) continue; // still open today
        scheduled++;
        if (doses.some((d) => d.reminderId === med.id && d.date === date && d.time === time && d.status === "taken")) taken++;
      }
    }
  }
  return { scheduled, taken, missed: scheduled - taken, percent: scheduled ? Math.round((taken / scheduled) * 100) : null };
}

// ---------- Bangla text ----------

export const KIND_LABELS_BN: Record<ReminderKind, string> = {
  medicine: "ওষুধ",
  water: "পানি খান",
  walk: "একটু হাঁটুন",
  foot: "পা দেখুন",
};

export function reminderTitleBn(r: Reminder): string {
  return r.kind === "medicine" ? `ওষুধের সময়: ${r.label}` : KIND_LABELS_BN[r.kind];
}

/** Spoken prompt. Never names a dose amount — the user follows their doctor's prescription. */
export function reminderSpeechBn(r: Reminder): string {
  switch (r.kind) {
    case "medicine":
      return `${r.label} খাওয়ার সময় হয়েছে। ডাক্তার যেভাবে বলেছেন সেভাবে খান। খেলে "খেয়েছি" চাপুন।`;
    case "water":
      return "এক গ্লাস পানি খাওয়ার সময় হয়েছে।";
    case "walk":
      return "দশ-পনেরো মিনিট আস্তে আস্তে হাঁটার সময় হয়েছে। মাথা ঘুরলে বসে পড়ুন।";
    case "foot":
      return "আজ পা দুটো ভালো করে দেখুন। কোনো কাটা, ফোসকা, লাল বা ফোলা থাকলে পরিবারকে বা ডাক্তারকে জানান।";
  }
}

// ---------- Storage ----------

const REMINDERS_KEY = "jotno_reminders";
const DOSES_KEY = "jotno_doses";
const SNOOZE_KEY = "jotno_snoozes";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked; reminders still work for this session
  }
}

export function loadReminders(): Reminder[] {
  const saved = read<Reminder[]>(REMINDERS_KEY, []);
  // Always include the three daily-care reminders so they can be toggled on
  const care = DAILY_CARE_DEFAULTS.map((d) => saved.find((s) => s.id === d.id) ?? d);
  return [...saved.filter((s) => s.kind === "medicine"), ...care];
}

export function saveReminders(reminders: Reminder[]) {
  write(REMINDERS_KEY, reminders);
}

export function loadDoses(): DoseRecord[] {
  return read<DoseRecord[]>(DOSES_KEY, []);
}

/** Keeps 60 days of history so reports can cover a month. */
export function recordDose(record: DoseRecord) {
  const cutoff = Date.now() - 60 * 24 * 60 * 60 * 1000;
  const doses = loadDoses().filter(
    (d) => new Date(d.at).getTime() > cutoff && !(d.reminderId === record.reminderId && d.date === record.date && d.time === record.time)
  );
  write(DOSES_KEY, [...doses, record]);
}

export function loadSnoozes(): Record<string, number> {
  const now = Date.now();
  return Object.fromEntries(Object.entries(read<Record<string, number>>(SNOOZE_KEY, {})).filter(([, until]) => until > now));
}

export function snooze(key: string, minutes = SNOOZE_MIN) {
  write(SNOOZE_KEY, { ...loadSnoozes(), [key]: Date.now() + minutes * 60000 });
}
