"use client";

import React from "react";
import type { TelemetrySummary } from "@/lib/validations/telemetry";
import ProgressRing from "@/components/app/ProgressRing";
import { toBanglaDigits } from "@/lib/assistant/bangla";

interface TelemetryStatsCardsProps {
  summary: TelemetrySummary;
}

/** Display-only: stored values may be mg/dL (> 35) or mmol/L (<= 35) */
function mmol(value: number): string {
  return toBanglaDigits(value <= 35 ? value : Number((value / 18).toFixed(1)));
}

export default function TelemetryStatsCards({ summary }: TelemetryStatsCardsProps) {
  const isTirOptimal = summary.time_in_range_percent >= 70;
  const isHba1cOptimal = summary.estimated_hba1c > 0 && summary.estimated_hba1c <= 7.0;

  return (
    <div lang="bn" className="grid grid-cols-2 gap-3">
      {/* 1. Estimated HbA1c */}
      <div className="tile bg-pastel-blue text-pastel-blue-ink">
        <p className="text-base font-bold">৩ মাসের গড় সুগার (HbA1c)</p>
        <p className="mt-2 text-4xl font-bold leading-none">
          {summary.estimated_hba1c > 0 ? toBanglaDigits(summary.estimated_hba1c) : "--"}
          <span className="ml-0.5 text-lg font-bold">%</span>
        </p>
        <p className="mt-2 text-base font-semibold opacity-80">
          {isHba1cOptimal ? "লক্ষ্যের মধ্যে আছে" : "লক্ষ্য ৭% এর বেশি"}
        </p>
      </div>

      {/* 2. Time in range */}
      <div className="tile bg-pastel-lime text-pastel-lime-ink">
        <p className="text-base font-bold">ভালো সীমায় ছিল</p>
        <div className="mt-2 flex items-center gap-3">
          <ProgressRing
            value={summary.total_readings > 0 ? summary.time_in_range_percent : 0}
            color={isTirOptimal ? "#9DB98C" : "#E9A440"}
            size={60}
            stroke={7}
            label={summary.total_readings > 0 ? `${toBanglaDigits(Math.round(summary.time_in_range_percent))}%` : "--"}
          />
          <p className="text-base font-semibold leading-snug opacity-80">
            {toBanglaDigits(summary.total_readings)} বারের মধ্যে {toBanglaDigits(summary.readings_in_range)} বার
          </p>
        </div>
      </div>

      {/* 3. Mean glucose */}
      <div className="tile bg-pastel-peach text-pastel-peach-ink">
        <p className="text-base font-bold">গড় সুগার</p>
        <p className="mt-2 text-4xl font-bold leading-none">
          {summary.mean_glucose > 0 ? mmol(summary.mean_glucose) : "--"}
          <span className="ml-1 text-base font-bold">mmol/L</span>
        </p>
        <p className="mt-2 text-base font-semibold opacity-80">লক্ষ্য: ৩.৯–৭.৮ mmol/L</p>
      </div>

      {/* 4. Fasting target */}
      <div className="tile bg-pastel-lilac text-pastel-lilac-ink">
        <p className="text-base font-bold">খালি পেটে লক্ষ্য</p>
        <p className="mt-2 text-4xl font-bold leading-none">
          {summary.target_fbs > 0 ? mmol(summary.target_fbs) : "--"}
          <span className="ml-1 text-base font-bold">mmol/L</span>
        </p>
        <p className="mt-2 text-base font-semibold opacity-80">
          {mmol(summary.baseline_fbs)} থেকে {toBanglaDigits(summary.horizon_days)} দিনে
        </p>
      </div>
    </div>
  );
}
