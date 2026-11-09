"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Plus, RefreshCw, Utensils, Salad, Droplet } from "lucide-react";
import PageHeader from "@/components/app/PageHeader";
import GlucoseChart from "@/components/telemetry/GlucoseChart";
import TelemetryStatsCards from "@/components/telemetry/TelemetryStatsCards";
import QuickLogModal from "@/components/telemetry/QuickLogModal";
import type { GlucoseLog, TelemetrySummary, TrajectoryPoint } from "@/lib/validations/telemetry";
import {
  MOCK_TC_P5_01_LOGS,
  generateTelemetrySummary,
  generateTrajectoryDataset,
} from "@/utils/telemetry";
import { CONTEXT_LABELS_BN, LEVEL_LABELS_BN, classifyGlucose, toBanglaDigits } from "@/lib/assistant/bangla";

const CONTEXT_LABELS: Record<string, string> = CONTEXT_LABELS_BN;

const LEVEL_STYLES = {
  low: "bg-risk-danger text-risk-dangerInk",
  good: "bg-risk-safe text-risk-safeInk",
  slightly_high: "bg-risk-caution text-risk-cautionInk",
  high: "bg-risk-danger text-risk-dangerInk",
  very_high: "bg-risk-danger text-risk-dangerInk",
};

export default function TelemetryPage() {
  const router = useRouter();
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

  // Home screen links to /telemetry?log=1 to open the log sheet directly
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("log") === "1") {
      setIsModalOpen(true);
      router.replace("/telemetry");
    }
  }, [router]);

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
    <div lang="bn">
      <PageHeader
        title="সুগার"
        subtitle="আপনার সুগার আর লক্ষ্যের পথ"
        actions={
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            aria-label="সুগার লিখুন"
            className="fab h-12 w-12 bg-pastel-blue-strong"
          >
            <Plus className="h-6 w-6" strokeWidth={2.5} />
          </button>
        }
      />

      <main lang="bn" className="px-4 py-5 space-y-5">
        {/* Horizon selector */}
        <div className="flex justify-center gap-2" role="group" aria-label="কত দিনের হিসাব দেখবেন">
          {[
            { days: 7, label: "১ সপ্তাহ" },
            { days: 14, label: "২ সপ্তাহ" },
            { days: 30, label: "১ মাস" },
            { days: 84, label: "৩ মাস" },
          ].map((h) => (
            <button
              key={h.days}
              type="button"
              onClick={() => setHorizonDays(h.days)}
              aria-pressed={horizonDays === h.days}
              className="chip-toggle h-12 min-w-[72px] flex-1 justify-center px-2 text-base"
            >
              {h.label}
            </button>
          ))}
        </div>

        {/* Sample data notice */}
        {benchmarkActive ? (
          <div className="card p-4 text-base font-medium text-ink-soft">
            এগুলো নমুনা মাপ। নিজের সুগার লিখলে আপনার মাপ দেখাবে।
          </div>
        ) : (
          <button
            type="button"
            onClick={handleLoadBenchmark}
            className="flex h-12 items-center gap-2 rounded-full px-1 text-base font-bold text-ink-soft active:text-ink"
          >
            <RefreshCw className="h-5 w-5" />
            নমুনা মাপ দেখুন
          </button>
        )}

        <TelemetryStatsCards summary={summary} />

        <GlucoseChart data={trajectoryData} height={260} />

        {/* Reading history */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-ink">সব মাপ ({toBanglaDigits(logs.length)}টি)</h2>
          <ul className="space-y-2.5">
            {logs.map((log) => {
              const level = classifyGlucose(log.glucose_value);
              const mmolVal = log.glucose_value <= 35 ? log.glucose_value : Number((log.glucose_value / 18).toFixed(1));

              return (
                <li key={log.id} className="card flex items-center gap-3 p-4">
                  <div className="icon-badge bg-pastel-blue text-pastel-blue-ink">
                    <Droplet className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xl font-bold text-ink">
                      {toBanglaDigits(mmolVal)} <span className="text-base font-semibold text-ink-muted">mmol/L</span>
                    </p>
                    <p className="text-base font-medium text-ink-muted">
                      {CONTEXT_LABELS[log.context] ?? log.context} · দিন {toBanglaDigits(log.day_offset)}
                    </p>
                    {log.linked_meal_title && (
                      <p className="mt-0.5 flex items-center gap-1.5 text-base text-ink-soft">
                        <Utensils className="h-5 w-5 shrink-0" />
                        <span className="truncate">{log.linked_meal_title}</span>
                      </p>
                    )}
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-base font-bold ${LEVEL_STYLES[level]}`}>
                    {LEVEL_LABELS_BN[level]}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <Link
          href="/deficits"
          className="card flex min-h-[64px] items-center gap-3 p-4 active:bg-canvas"
        >
          <div className="icon-badge bg-pastel-lime text-pastel-lime-ink">
            <Salad className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-lg font-bold text-ink">পুষ্টিতে কী কম আছে দেখুন</p>
            <p className="text-base font-medium text-ink-muted">কোন খাবার সুগার ঠিক রাখতে সাহায্য করবে</p>
          </div>
          <ChevronRight className="h-5 w-5 text-ink-muted" />
        </Link>
      </main>

      <QuickLogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveLog}
        currentDayOffset={logs.length}
      />
    </div>
  );
}
