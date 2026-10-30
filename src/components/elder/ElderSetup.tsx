"use client";

import { useState } from "react";
import { UserRound, Phone } from "lucide-react";
import type { ElderSettings } from "@/lib/assistant/client";
import { fromBanglaDigits } from "@/lib/assistant/bangla";

interface ElderSetupProps {
  initial?: ElderSettings | null;
  onDone: (settings: ElderSettings) => void;
  onCancel?: () => void;
}

/** Two-step first-run: the user's name, then one emergency contact (skippable). */
export default function ElderSetup({ initial, onDone, onCancel }: ElderSetupProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState(initial?.name ?? "");
  const [contactName, setContactName] = useState(initial?.contactName ?? "");
  const [contactPhone, setContactPhone] = useState(initial?.contactPhone ?? "");

  const phoneDigits = fromBanglaDigits(contactPhone).replace(/[^\d+]/g, "");
  const canFinish = contactName.trim() && phoneDigits.length >= 6;

  const finish = (withContact: boolean) =>
    onDone({
      name: name.trim(),
      ...(withContact ? { contactName: contactName.trim(), contactPhone: phoneDigits } : {}),
    });

  return (
    <main lang="bn" className="flex min-h-dvh flex-col px-5 pt-[calc(env(safe-area-inset-top)+2rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
      <p className="text-lg font-semibold text-ink-muted">ধাপ {step === 1 ? "১" : "২"} / ২</p>

      {step === 1 ? (
        <>
          <div className="icon-badge mt-6 h-16 w-16 bg-pastel-blue text-pastel-blue-ink">
            <UserRound className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-3xl font-bold leading-snug text-ink">আপনার নাম কী?</h1>
          <label htmlFor="elder-name" className="sr-only">
            আপনার নাম
          </label>
          <input
            id="elder-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="given-name"
            placeholder="যেমন: রহিম"
            className="input mt-6 h-16 text-2xl"
          />
          <div className="mt-auto space-y-3 pt-8">
            <button type="button" disabled={!name.trim()} onClick={() => setStep(2)} className="btn-primary h-16 text-xl">
              পরের ধাপ
            </button>
            {onCancel && (
              <button type="button" onClick={onCancel} className="btn-secondary h-14 text-lg">
                বাতিল
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="icon-badge mt-6 h-16 w-16 bg-pastel-coral text-pastel-coral-ink">
            <Phone className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-3xl font-bold leading-snug text-ink">বিপদে কাকে ফোন করব?</h1>
          <p className="mt-2 text-lg text-ink-soft">সুগার খুব কমে গেলে এই মানুষটিকে ফোন করতে বলব।</p>

          <label htmlFor="contact-name" className="mt-6 block text-lg font-semibold text-ink">
            নাম
          </label>
          <input
            id="contact-name"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="যেমন: মেয়ে, ছেলে, প্রতিবেশী"
            className="input mt-2 h-16 text-xl"
          />
          <label htmlFor="contact-phone" className="mt-4 block text-lg font-semibold text-ink">
            ফোন নম্বর
          </label>
          <input
            id="contact-phone"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="০১৭XXXXXXXX"
            className="input mt-2 h-16 text-2xl tracking-wide"
          />

          <div className="mt-auto space-y-3 pt-8">
            <button type="button" disabled={!canFinish} onClick={() => finish(true)} className="btn-primary h-16 text-xl">
              শেষ
            </button>
            <button type="button" onClick={() => finish(false)} className="btn-secondary h-14 text-lg">
              পরে করব
            </button>
          </div>
        </>
      )}
    </main>
  );
}
