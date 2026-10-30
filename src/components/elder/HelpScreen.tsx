"use client";

import { AlertTriangle, Phone, Volume2 } from "lucide-react";

export type HelpKind = "low" | "very_high" | "symptoms";

interface HelpScreenProps {
  kind: HelpKind;
  message: string;
  contactName?: string;
  contactPhone?: string;
  onReplay: () => void;
  onClose: () => void;
}

const TITLES: Record<HelpKind, string> = {
  low: "সুগার কম",
  very_high: "সুগার অনেক বেশি",
  symptoms: "এখনই সাহায্য নিন",
};

/** Bangladesh national emergency number */
const EMERGENCY_NUMBER = "999";

export default function HelpScreen({ kind, message, contactName, contactPhone, onReplay, onClose }: HelpScreenProps) {
  const urgent = kind !== "very_high";

  return (
    <div
      lang="bn"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="help-title"
      className={`fixed inset-0 z-50 overflow-y-auto ${urgent ? "bg-pastel-coral text-pastel-coral-ink" : "bg-pastel-peach text-pastel-peach-ink"}`}
    >
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pt-[calc(env(safe-area-inset-top)+2rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
        <div className="icon-badge h-20 w-20 bg-white/70">
          <AlertTriangle className="h-10 w-10" />
        </div>
        <h1 id="help-title" className="mt-5 text-4xl font-bold">
          {TITLES[kind]}
        </h1>
        <p className="mt-4 text-2xl font-semibold leading-relaxed">{message}</p>
        <button type="button" onClick={onReplay} className="mt-4 inline-flex h-12 items-center gap-2 self-start rounded-full bg-white/70 px-5 text-lg font-semibold">
          <Volume2 className="h-5 w-5" />
          আবার শুনুন
        </button>

        <div className="mt-auto space-y-3 pt-8">
          {contactPhone ? (
            <a href={`tel:${contactPhone}`} className="btn-primary h-20 text-2xl">
              <Phone className="h-7 w-7" />
              {contactName ? `${contactName}-কে ফোন করুন` : "পরিবারকে ফোন করুন"}
            </a>
          ) : (
            <p className="rounded-2xl bg-white/70 p-4 text-lg font-semibold">
              পরিবারের কারো নম্বর যোগ করলে এখানে এক চাপে ফোন করতে পারবেন।
            </p>
          )}
          {urgent && (
            <a href={`tel:${EMERGENCY_NUMBER}`} className="btn-secondary h-16 text-xl">
              <Phone className="h-6 w-6" />
              জরুরি ফোন ৯৯৯
            </a>
          )}
          <button type="button" onClick={onClose} className="h-14 w-full text-lg font-bold underline underline-offset-4">
            আমি এখন ঠিক আছি
          </button>
        </div>
      </div>
    </div>
  );
}
