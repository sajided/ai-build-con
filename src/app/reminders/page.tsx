"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Pill, Plus, Trash2, GlassWater, Footprints, Eye, Bell } from "lucide-react";
import { toBanglaDigits } from "@/lib/assistant/bangla";
import {
  KIND_LABELS_BN,
  TIME_PRESETS,
  loadReminders,
  saveReminders,
  type Reminder,
  type ReminderKind,
} from "@/lib/care/reminders";

const CARE_INFO: Record<Exclude<ReminderKind, "medicine">, { icon: React.ElementType; detail: string; className: string }> = {
  water: { icon: GlassWater, detail: "দিনে ৪ বার", className: "bg-pastel-blue text-pastel-blue-ink" },
  walk: { icon: Footprints, detail: "বিকেল ৫টা", className: "bg-pastel-lime text-pastel-lime-ink" },
  foot: { icon: Eye, detail: "রাত সাড়ে ৯টা", className: "bg-pastel-peach text-pastel-peach-ink" },
};

function timeLabelBn(time: string) {
  const preset = TIME_PRESETS.find((p) => p.time === time);
  if (preset) return preset.label;
  const [h, m] = time.split(":").map(Number);
  const part = h < 12 ? "সকাল" : h < 17 ? "দুপুর" : h < 20 ? "সন্ধ্যা" : "রাত";
  return `${part} ${toBanglaDigits(((h + 11) % 12) + 1)}:${toBanglaDigits(String(m).padStart(2, "0"))}`;
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [times, setTimes] = useState<string[]>([]);
  const [customTime, setCustomTime] = useState("");
  const [notifyState, setNotifyState] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    setReminders(loadReminders());
    setNotifyState(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
  }, []);

  const update = (next: Reminder[]) => {
    setReminders(next);
    saveReminders(next);
  };

  const toggleTime = (t: string) => setTimes((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t].sort()));

  const addMedicine = () => {
    if (!reminders || !name.trim() || times.length === 0) return;
    update([
      { id: "med-" + Date.now(), kind: "medicine", label: name.trim().slice(0, 40), times, enabled: true },
      ...reminders,
    ]);
    setName("");
    setTimes([]);
    setAdding(false);
  };

  const askNotify = async () => {
    if (typeof Notification === "undefined") return;
    setNotifyState(await Notification.requestPermission());
  };

  if (!reminders) return <main className="min-h-dvh" />;

  const medicines = reminders.filter((r) => r.kind === "medicine");
  const care = reminders.filter((r) => r.kind !== "medicine");

  return (
    <main lang="bn" className="min-h-dvh px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-[calc(env(safe-area-inset-bottom)+2rem)]">
      <header className="flex items-center gap-2">
        <Link href="/" aria-label="ফিরে যান" className="-ml-2 flex h-14 w-14 items-center justify-center rounded-full active:bg-black/5">
          <ChevronLeft className="h-8 w-8" />
        </Link>
        <h1 className="text-3xl font-bold text-ink">মনে করানো</h1>
      </header>

      {/* Medicines */}
      <section className="mt-5">
        <h2 className="text-2xl font-bold text-ink">ওষুধ</h2>
        <p className="mt-1 text-lg text-ink-soft">কোন ওষুধ কখন খান, লিখে রাখুন। সময় হলে মনে করিয়ে দেব।</p>

        <ul className="mt-4 space-y-3">
          {medicines.map((m) => (
            <li key={m.id} className="card flex items-center gap-3 p-4">
              <span className="icon-badge h-12 w-12 bg-pastel-lilac text-pastel-lilac-ink">
                <Pill className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xl font-bold text-ink">{m.label}</p>
                <p className="text-lg text-ink-soft">{m.times.map(timeLabelBn).join(", ")}</p>
              </div>
              <button
                type="button"
                onClick={() => update(reminders.filter((r) => r.id !== m.id))}
                aria-label={`${m.label} মুছুন`}
                className="flex h-12 w-12 items-center justify-center rounded-full text-risk-dangerInk active:bg-risk-danger"
              >
                <Trash2 className="h-6 w-6" />
              </button>
            </li>
          ))}
        </ul>

        {adding ? (
          <div className="card mt-4 p-5">
            <label htmlFor="med-name" className="block text-xl font-bold text-ink">
              ওষুধের নাম
            </label>
            <input
              id="med-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="যেমন: মেটফরমিন"
              className="input mt-2 h-16 text-2xl"
            />
            <p className="mt-5 text-xl font-bold text-ink">কখন খান?</p>
            <div className="mt-3 grid grid-cols-1 gap-2">
              {TIME_PRESETS.map((p) => (
                <button
                  key={p.time}
                  type="button"
                  aria-pressed={times.includes(p.time)}
                  onClick={() => toggleTime(p.time)}
                  className="chip-toggle h-14 justify-center text-xl"
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <label htmlFor="custom-time" className="sr-only">
                অন্য সময়
              </label>
              <input
                id="custom-time"
                type="time"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                className="input h-14 flex-1 text-xl"
              />
              <button
                type="button"
                disabled={!customTime || times.includes(customTime)}
                onClick={() => {
                  toggleTime(customTime);
                  setCustomTime("");
                }}
                className="btn-secondary h-14 w-auto px-5 text-lg"
              >
                অন্য সময় যোগ
              </button>
            </div>
            {times.some((t) => !TIME_PRESETS.some((p) => p.time === t)) && (
              <p className="mt-2 text-lg text-ink-soft">
                অন্য সময়: {times.filter((t) => !TIME_PRESETS.some((p) => p.time === t)).map(timeLabelBn).join(", ")}
              </p>
            )}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setAdding(false)} className="btn-secondary h-16 text-xl">
                বাতিল
              </button>
              <button type="button" disabled={!name.trim() || times.length === 0} onClick={addMedicine} className="btn-primary h-16 text-xl">
                রাখুন
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setAdding(true)} className="btn-primary mt-4 h-16 text-xl">
            <Plus className="h-6 w-6" />
            ওষুধ যোগ করুন
          </button>
        )}
        <p className="mt-3 text-base text-ink-muted">ওষুধ কতটুকু খাবেন তা ডাক্তার ঠিক করবেন। এই অ্যাপ শুধু সময় মনে করায়।</p>
      </section>

      {/* Daily care */}
      <section className="mt-8">
        <h2 className="text-2xl font-bold text-ink">প্রতিদিনের যত্ন</h2>
        <ul className="mt-4 space-y-3">
          {care.map((r) => {
            const info = CARE_INFO[r.kind as Exclude<ReminderKind, "medicine">];
            const Icon = info.icon;
            return (
              <li key={r.id}>
                <button
                  type="button"
                  role="switch"
                  aria-checked={r.enabled}
                  onClick={() => update(reminders.map((x) => (x.id === r.id ? { ...x, enabled: !x.enabled } : x)))}
                  className="card flex w-full items-center gap-3 p-4 text-left active:bg-canvas"
                >
                  <span className={`icon-badge h-12 w-12 ${info.className}`}>
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xl font-bold text-ink">{KIND_LABELS_BN[r.kind]}</span>
                    <span className="block text-lg text-ink-soft">{info.detail}</span>
                  </span>
                  <span
                    className={`flex h-10 w-[72px] shrink-0 items-center rounded-full p-1 transition-colors ${
                      r.enabled ? "justify-end bg-pastel-lime-strong" : "justify-start bg-line"
                    }`}
                  >
                    <span className="h-8 w-8 rounded-full bg-white shadow" />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Phone notifications */}
      {notifyState !== "unsupported" && notifyState !== "granted" && (
        <section className="card mt-8 p-5">
          <div className="flex items-center gap-3">
            <Bell className="h-7 w-7 text-ink" />
            <h2 className="text-xl font-bold text-ink">ফোনে নোটিফিকেশন</h2>
          </div>
          <p className="mt-2 text-lg text-ink-soft">
            {notifyState === "denied"
              ? "নোটিফিকেশন বন্ধ আছে। ফোনের সেটিংস থেকে চালু করুন।"
              : "অ্যাপ খোলা থাকলে সময় হলে ফোনে শব্দ করে জানাবে।"}
          </p>
          {notifyState === "default" && (
            <button type="button" onClick={askNotify} className="btn-primary mt-4 h-14 text-lg">
              চালু করুন
            </button>
          )}
        </section>
      )}
    </main>
  );
}
