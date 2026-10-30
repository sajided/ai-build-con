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
      className="tile space-y-4 bg-pastel-coral p-5 text-pastel-coral-ink"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="icon-badge bg-white/85 text-pastel-coral-ink">
          <AlertOctagon className="h-5 w-5" />
        </div>
        <h2 className="flex-1 text-base font-extrabold">Please ask your doctor about this</h2>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="h-10 rounded-full px-3 text-sm font-bold active:bg-black/5"
          >
            Dismiss
          </button>
        )}
      </div>

      {/* Standardized Clinical Disclaimer (TC-P7-01 Requirement) */}
      <div className="rounded-2xl bg-white/85 p-4">
        <p
          data-testid="standardized-clinical-refusal-text"
          className="text-sm font-semibold leading-relaxed text-ink"
        >
          {refusalText}
        </p>
      </div>

      {reason && (
        <p className="text-sm font-medium">
          <strong className="font-extrabold">Why:</strong> {reason}
        </p>
      )}

      {/* Emergency / Doctor Quick Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <a
          href="tel:911"
          data-testid="emergency-call-button"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-white active:bg-black"
        >
          <PhoneCall className="h-4 w-4" />
          <span>Call Emergency (911)</span>
        </a>

        <span className="chip h-11 px-4">
          <HeartPulse className="h-4 w-4 text-pastel-coral-strong" />
          Food guidance only
        </span>
      </div>
    </div>
  );
}
