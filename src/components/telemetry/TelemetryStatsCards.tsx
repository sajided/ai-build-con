"use client";

import React from "react";
import { Activity, ShieldCheck, Target, TrendingDown } from "lucide-react";
import type { TelemetrySummary } from "@/lib/validations/telemetry";

interface TelemetryStatsCardsProps {
  summary: TelemetrySummary;
}

export default function TelemetryStatsCards({ summary }: TelemetryStatsCardsProps) {
  const isTirOptimal = summary.time_in_range_percent >= 70;
  const isHba1cOptimal = summary.estimated_hba1c > 0 && summary.estimated_hba1c <= 7.0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      {/* 1. Estimated HbA1c Card */}
      <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Estimated HbA1c
          </span>
          <div className="w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Activity className="w-3 h-3" />
          </div>
        </div>
        <div>
          <div className="text-xl font-black text-slate-100 flex items-baseline space-x-1">
            <span>{summary.estimated_hba1c > 0 ? summary.estimated_hba1c : "--"}</span>
            <span className="text-xs font-semibold text-slate-400">%</span>
          </div>
          <div className="text-[10px] text-emerald-400 font-medium flex items-center space-x-1 mt-0.5">
            <TrendingDown className="w-2.5 h-2.5" />
            <span>eAG Clinical Formula</span>
          </div>
        </div>
        <div className="pt-1 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
          <span>Target: &lt; 7.0%</span>
          <span className={`font-semibold ${isHba1cOptimal ? "text-emerald-400" : "text-amber-400"}`}>
            {isHba1cOptimal ? "On Target" : "Elevated"}
          </span>
        </div>
      </div>

      {/* 2. Time In Range (TIR) Card */}
      <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Time In Range
          </span>
          <div className="w-5 h-5 rounded-md bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <ShieldCheck className="w-3 h-3" />
          </div>
        </div>
        <div>
          <div className="text-xl font-black text-teal-300 flex items-baseline space-x-1">
            <span>{summary.total_readings > 0 ? summary.time_in_range_percent : "--"}</span>
            <span className="text-xs font-semibold text-slate-400">%</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {summary.readings_in_range} of {summary.total_readings} in safe range
          </div>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isTirOptimal ? "bg-emerald-400" : "bg-amber-400"
            }`}
            style={{ width: `${Math.min(100, summary.time_in_range_percent)}%` }}
          />
        </div>
      </div>

      {/* 3. Mean Glucose Card */}
      <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Mean Glucose (Ḡ)
          </span>
          <div className="w-5 h-5 rounded-md bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Activity className="w-3 h-3" />
          </div>
        </div>
        <div>
          <div className="text-xl font-black text-slate-100 flex items-baseline space-x-1">
            <span>{summary.mean_glucose > 0 ? summary.mean_glucose : "--"}</span>
            <span className="text-[10px] font-semibold text-slate-400">mg/dL</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Safe Target: 70–140 mg/dL
          </div>
        </div>
        <div className="pt-1 border-t border-slate-800/80 text-[10px] text-slate-400">
          Total Logs: <span className="text-slate-200 font-semibold">{summary.total_readings}</span>
        </div>
      </div>

      {/* 4. Target Trajectory Card */}
      <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Target Trajectory
          </span>
          <div className="w-5 h-5 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Target className="w-3 h-3" />
          </div>
        </div>
        <div>
          <div className="text-xl font-black text-purple-300 flex items-baseline space-x-1">
            <span>{summary.target_fbs}</span>
            <span className="text-[10px] font-semibold text-slate-400">mg/dL</span>
          </div>
          <div className="text-[10px] text-purple-400 mt-0.5">
            {summary.horizon_days}-Day Clinical Horizon
          </div>
        </div>
        <div className="pt-1 border-t border-slate-800/80 text-[10px] text-slate-400">
          Baseline: <span className="text-slate-300 font-semibold">{summary.baseline_fbs} mg/dL</span>
        </div>
      </div>
    </div>
  );
}
