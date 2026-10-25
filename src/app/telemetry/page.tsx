"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  LineChart as ChartIcon,
  ArrowLeft,
  ArrowRight,
  Plus,
  RefreshCw,
  Utensils,
  FileCheck2,
} from "lucide-react";
import GlucoseChart from "@/components/telemetry/GlucoseChart";
import TelemetryStatsCards from "@/components/telemetry/TelemetryStatsCards";
import QuickLogModal from "@/components/telemetry/QuickLogModal";
import type { GlucoseLog, TelemetrySummary, TrajectoryPoint } from "@/lib/validations/telemetry";
import {
  MOCK_TC_P5_01_LOGS,
  generateTelemetrySummary,
  generateTrajectoryDataset,
} from "@/utils/telemetry";

export default function TelemetryPage() {
  const [logs, setLogs] = useState<GlucoseLog[]>(MOCK_TC_P5_01_LOGS);
  const [horizonDays, setHorizonDays] = useState<number>(84);
  const [baselineFBS] = useState<number>(160);
  const [targetFBS, setTargetFBS] = useState<number>(100);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [summary, setSummary] = useState<TelemetrySummary>(() =>
    generateTelemetrySummary(MOCK_TC_P5_01_LOGS, 160, 100, 84)
  );
  const [trajectoryData, setTrajectoryData] = useState<TrajectoryPoint[]>(() =>
    generateTrajectoryDataset({
      logs: MOCK_TC_P5_01_LOGS,
      baselineFBS: 160,
      targetFBS: 100,
      horizonDays: 84,
    })
  );
  const [benchmarkActive, setBenchmarkActive] = useState<boolean>(true);

  // Sync state and compute analytics on change
  useEffect(() => {
    const newSummary = generateTelemetrySummary(logs, baselineFBS, targetFBS, horizonDays);
    const newPoints = generateTrajectoryDataset({
      logs,
      baselineFBS,
      targetFBS,
      horizonDays,
    });
    setSummary(newSummary);
    setTrajectoryData(newPoints);
  }, [logs, horizonDays, baselineFBS, targetFBS]);

  // Load from localStorage if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("glucovision_glucose_logs");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLogs(parsed);
            setBenchmarkActive(false);
          }
        } catch {
          // keep initial mock
        }
      }
    }
  }, []);

  const handleSaveLog = async (newLog: GlucoseLog) => {
    const updated = [newLog, ...logs];
    setLogs(updated);
    setBenchmarkActive(false);

    if (typeof window !== "undefined") {
      localStorage.setItem("glucovision_glucose_logs", JSON.stringify(updated));
    }

    // Attempt server sync
    try {
      await fetch("/api/telemetry/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLog),
      });
    } catch {
      // non-blocking
    }
  };

  const handleLoadBenchmark = () => {
    setLogs(MOCK_TC_P5_01_LOGS);
    setHorizonDays(84);
    setTargetFBS(100);
    setBenchmarkActive(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("glucovision_glucose_logs", JSON.stringify(MOCK_TC_P5_01_LOGS));
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-3 sm:p-6 pb-24">
      {/* Container restricted to mobile/tablet optimal width */}
      <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl flex flex-col">
        {/* Navigation Header */}
        <header className="p-4 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Phase 5: Telemetry Analytics
            </span>
          </div>
          <Link
            href="/menusafe"
            className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
          >
            MenuSafe
          </Link>
        </header>

        {/* Hero Section */}
        <div className="p-4 sm:p-5 border-b border-slate-800/60 bg-gradient-to-br from-emerald-950/30 via-slate-900 to-purple-950/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <ChartIcon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-slate-100 leading-tight">
                  Blood Glucose Telemetry
                </h1>
                <p className="text-[11px] text-slate-400">
                  Actual Logs vs. 84-Day AI Target Trajectory
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-xs font-bold hover:brightness-110 shadow-lg shadow-emerald-500/20 flex items-center space-x-1 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Reading</span>
            </button>
          </div>

          {/* Horizon Window Tabs */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Time Horizon:
            </span>
            <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800 space-x-1">
              {[
                { days: 7, label: "7 Days" },
                { days: 14, label: "14 Days" },
                { days: 30, label: "30 Days" },
                { days: 84, label: "84 Days" },
              ].map((h) => (
                <button
                  key={h.days}
                  type="button"
                  onClick={() => setHorizonDays(h.days)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                    horizonDays === h.days
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Benchmark Banner & Reset Button */}
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs">
              <FileCheck2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-semibold text-slate-200">TC-P5-01 Benchmark Dataset</span>
                <p className="text-[10px] text-slate-400">
                  {benchmarkActive ? "Active: 7 verified clinical test readings" : "Custom user logs active"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLoadBenchmark}
              className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all flex items-center space-x-1 active:scale-95"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Load TC-P5-01 Data</span>
            </button>
          </div>

          {/* Real-time KPI Stats Cards */}
          <TelemetryStatsCards summary={summary} />

          {/* Recharts Dual-Trajectory Chart (TC-P5-02) */}
          <GlucoseChart data={trajectoryData} height={280} />

          {/* Recent Log History */}
          <div className="space-y-2 pt-1 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200 px-1">
              <span>Logged Readings History ({logs.length})</span>
              <span className="text-[10px] text-slate-400 font-normal">
                Chronological Progression
              </span>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {logs.map((log) => {
                const isInRange = log.glucose_value >= 70 && log.glucose_value <= 140;

                return (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isInRange
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {log.glucose_value}
                      </div>

                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-semibold text-slate-200">
                            Day {log.day_offset}: {log.glucose_value} mg/dL
                          </span>
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                            {log.context.replace("_", " ")}
                          </span>
                        </div>
                        {log.linked_meal_title && (
                          <div className="text-[10px] text-teal-400 flex items-center space-x-1 mt-0.5">
                            <Utensils className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate max-w-[200px]">{log.linked_meal_title}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          isInRange
                            ? "bg-emerald-950/80 text-emerald-400 border-emerald-800"
                            : "bg-amber-950/80 text-amber-400 border-amber-800"
                        }`}
                      >
                        {isInRange ? "In Range" : "Elevated"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Forward Action to Phase 6 */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <Link
              href="/deficits"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-slate-950 text-xs font-bold flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-md shadow-emerald-600/30"
            >
              <span>Analyze Nutritional Gaps & Deficits (Phase 6)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center space-x-2 transition-all active:scale-95"
            >
              <span>Back to System Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="p-3.5 border-t border-slate-800/60 bg-slate-950/70 flex items-center justify-between text-xs text-slate-500">
          <Link href="/deficits" className="hover:text-emerald-400 font-medium">
            Bazaar Gap Engine
          </Link>
          <span className="text-emerald-400 font-medium">Phases 0-6 Operational</span>
        </footer>
      </div>

      {/* Quick Log Modal */}
      <QuickLogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveLog}
        currentDayOffset={logs.length}
      />
    </main>
  );
}
