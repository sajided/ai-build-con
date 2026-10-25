'use client';

import React from 'react';
import { AlertOctagon, PhoneCall, ShieldAlert, HeartPulse } from 'lucide-react';
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
      className="relative overflow-hidden rounded-2xl border-2 border-rose-500/80 bg-gradient-to-br from-rose-950/90 via-slate-900/95 to-slate-950 p-5 shadow-2xl shadow-rose-950/50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200"
    >
      {/* Background Warning Watermark */}
      <div className="absolute -right-6 -bottom-6 pointer-events-none opacity-5">
        <ShieldAlert className="h-44 w-44 text-rose-500" />
      </div>

      <div className="relative z-10 flex items-start gap-4">
        {/* Pulsing Emergency Icon */}
        <div className="rounded-2xl bg-rose-500/20 p-3 text-rose-400 border border-rose-500/40 shadow-lg shadow-rose-950/40 shrink-0">
          <AlertOctagon className="h-7 w-7 animate-pulse text-rose-400" />
        </div>

        <div className="flex-1 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-rose-300 border border-rose-500/30">
                Clinical Safety Guardrail Active
              </span>
              <span className="text-[11px] font-mono text-rose-400/80">
                TC-P7-01
              </span>
            </div>
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="text-xs text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded-lg hover:bg-slate-800"
              >
                Dismiss
              </button>
            )}
          </div>

          {/* Standardized Clinical Disclaimer (TC-P7-01 Requirement) */}
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3.5">
            <p
              data-testid="standardized-clinical-refusal-text"
              className="text-sm font-semibold leading-relaxed text-rose-100"
            >
              {refusalText}
            </p>
          </div>

          {reason && (
            <p className="text-xs text-rose-300/80">
              <strong className="text-rose-200">Interception Reason:</strong> {reason}
            </p>
          )}

          {/* Emergency / Doctor Quick Actions */}
          <div className="pt-1 flex flex-wrap gap-2.5">
            <a
              href="tel:911"
              data-testid="emergency-call-button"
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-rose-950/50 transition-all hover:bg-rose-500 active:scale-95"
            >
              <PhoneCall className="h-3.5 w-3.5" />
              <span>Call Emergency (911)</span>
            </a>

            <div className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-850 px-3 py-2 text-xs font-medium text-slate-300">
              <HeartPulse className="h-3.5 w-3.5 text-rose-400" />
              <span>Lifestyle Guidance Only</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
