'use client';

import React from 'react';
import { AlertOctagon, PhoneCall, HeartPulse } from 'lucide-react';
import { STANDARDIZED_CLINICAL_REFUSAL } from '@/lib/safety/guardrails';

interface ClinicalSafetyAlertProps {
  reason?: string | null;
  customRefusal?: string | null;
  onDismiss?: () => void;
}

export function ClinicalSafetyAlert({
  reason,
  customRefusal,
  onDismiss,
}: ClinicalSafetyAlertProps) {
  const refusalText = customRefusal || STANDARDIZED_CLINICAL_REFUSAL;

  return (
    <div
      role="alert"
      data-testid="clinical-safety-alert"
      lang="bn"
      className="tile space-y-4 bg-pastel-coral p-5 text-pastel-coral-ink"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="icon-badge bg-white/85 text-pastel-coral-ink">
          <AlertOctagon className="h-6 w-6" />
        </div>
        <h2 className="flex-1 text-xl font-bold">এ বিষয়ে ডাক্তারকে জিজ্ঞেস করুন</h2>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="h-12 rounded-full px-4 text-base font-bold active:bg-black/5"
          >
            বন্ধ করুন
          </button>
        )}
      </div>

      {/* Standardized Clinical Disclaimer (TC-P7-01 Requirement) */}
      <div className="space-y-3 rounded-2xl bg-white/85 p-4">
        <p className="text-lg font-semibold leading-relaxed text-ink">
          যত্ন ইনসুলিনের মাত্রা হিসাব করে না, ওষুধও বদলায় না। ওষুধ নিয়ে যেকোনো প্রশ্ন আপনার ডাক্তারকে করুন। খুব
          খারাপ লাগলে এখনই জরুরি নম্বরে ফোন করুন।
        </p>
        {/* Standardized refusal / guardrail reason stay verbatim (English) for audit; shown on demand */}
        <details className="text-base text-ink-soft">
          <summary className="flex h-12 cursor-pointer items-center font-bold">ইংরেজিতে বিস্তারিত</summary>
          <p
            lang="en"
            data-testid="standardized-clinical-refusal-text"
            className="text-base leading-relaxed text-ink"
          >
            {refusalText}
          </p>
          {reason && (
            <p lang="en" className="mt-2 text-base">
              <strong className="font-bold">Why:</strong> {reason}
            </p>
          )}
        </details>
      </div>

      {/* Emergency / Doctor Quick Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <a
          href="tel:999"
          data-testid="emergency-call-button"
          className="inline-flex h-14 items-center gap-2 rounded-full bg-ink px-5 text-lg font-bold text-white active:bg-black"
        >
          <PhoneCall className="h-5 w-5" />
          <span>জরুরি ফোন (৯৯৯)</span>
        </a>

        <span className="chip h-12 px-4 text-base">
          <HeartPulse className="h-5 w-5 text-pastel-coral-strong" />
          শুধু খাবারের পরামর্শ
        </span>
      </div>
    </div>
  );
}
