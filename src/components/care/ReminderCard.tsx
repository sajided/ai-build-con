"use client";

import { Pill, GlassWater, Footprints, Eye, Volume2 } from "lucide-react";
import { toBanglaDigits } from "@/lib/assistant/bangla";
import { reminderSpeechBn, reminderTitleBn, type DueReminder, type ReminderKind } from "@/lib/care/reminders";

const KIND_STYLE: Record<ReminderKind, { icon: React.ElementType; className: string }> = {
  medicine: { icon: Pill, className: "bg-pastel-lilac text-pastel-lilac-ink" },
  water: { icon: GlassWater, className: "bg-pastel-blue text-pastel-blue-ink" },
  walk: { icon: Footprints, className: "bg-pastel-lime text-pastel-lime-ink" },
  foot: { icon: Eye, className: "bg-pastel-peach text-pastel-peach-ink" },
};

const DONE_LABEL: Record<ReminderKind, string> = {
  medicine: "খেয়েছি",
  water: "খেয়েছি",
  walk: "হেঁটেছি",
  foot: "দেখেছি",
};

interface ReminderCardProps {
  due: DueReminder;
  onDone: () => void;
  onLater: () => void;
  onSpeak: (text: string) => void;
}

/** The current reminder, shown at the top of the elder home with two big answers. */
export default function ReminderCard({ due, onDone, onLater, onSpeak }: ReminderCardProps) {
  const { icon: Icon, className } = KIND_STYLE[due.reminder.kind];
  const [h, m] = due.time.split(":");
  const hour12 = ((Number(h) + 11) % 12) + 1;

  return (
    <section lang="bn" role="status" className={`tile mt-5 p-5 ${className}`}>
      <div className="flex items-start gap-3">
        <span className="icon-badge h-14 w-14 bg-white/70">
          <Icon className="h-7 w-7" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold opacity-80">
            {toBanglaDigits(hour12)}:{toBanglaDigits(m)}
          </p>
          <h2 className="text-2xl font-bold leading-snug">{reminderTitleBn(due.reminder)}</h2>
        </div>
        <button
          type="button"
          onClick={() => onSpeak(reminderSpeechBn(due.reminder))}
          aria-label="শুনুন"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/70 active:bg-white"
        >
          <Volume2 className="h-6 w-6" />
        </button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button type="button" onClick={onLater} className="h-16 rounded-full bg-white/70 text-xl font-bold active:bg-white">
          পরে
        </button>
        <button type="button" onClick={onDone} className="h-16 rounded-full bg-ink text-xl font-bold text-white active:bg-black">
          {DONE_LABEL[due.reminder.kind]}
        </button>
      </div>
    </section>
  );
}
