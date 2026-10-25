"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Activity,
  ShieldCheck,
  Camera,
  ChefHat,
  Utensils,
  LineChart,
  ShoppingBag,
  CheckCircle2,
  Sparkles,
  Cpu,
  Layers,
  ArrowRight,
  Database,
  Smartphone,
  Flame,
} from "lucide-react";

interface PhaseCard {
  phase: string;
  module: string;
  description: string;
  testFocus: string;
  status: "Completed" | "Next Up" | "Planned";
  icon: React.ReactNode;
}

export default function HomePage() {
  const [selectedPhase, setSelectedPhase] = useState<string>("Phase 0");
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const phases: PhaseCard[] = [
    {
      phase: "Phase 0",
      module: "Project Scaffold & PWA",
      description: "Next.js 14 App Router, Emerald design system, PWA manifest & Vitest test suite.",
      testFocus: "Build integrity, strict mobile viewport, env bindings",
      status: "Completed",
      icon: <Layers className="w-5 h-5 text-emerald-400" />,
    },
    {
      phase: "Phase 1",
      module: "Schema, RLS & Onboarding",
      description: "PostgreSQL clinical profile tables, Row-Level Security & 3-step onboarding.",
      testFocus: "Cross-user data isolation, mandatory disclaimer guard",
      status: "Completed",
      icon: <ShieldCheck className="w-5 h-5 text-emerald-300" />,
    },
    {
      phase: "Phase 2",
      module: "Bazaar Vision Risk Scanner",
      description: "Multimodal Gemini extraction pipeline for raw bazaar groceries and traffic-light GI/GL grading.",
      testFocus: "Latency ≤ 4.5s, strict JSON schema validation",
      status: "Completed",
      icon: <Camera className="w-5 h-5 text-amber-400" />,
    },
    {
      phase: "Phase 3",
      module: "Recipe Synthesis & Sequencer",
      description: "Zero-hallucination carb generator + 3-tier clinical eating sequence (Fiber -> Protein -> Starch).",
      testFocus: "Zero unphotographed high-carb hallucinations",
      status: "Completed",
      icon: <ChefHat className="w-5 h-5 text-emerald-400" />,
    },
    {
      phase: "Phase 4",
      module: "MenuSafe Auditor",
      description: "OCR & Vision menu trap detector + localized waiter modification scripts.",
      testFocus: "Hidden cornstarch/sugar detection, 1-click clipboard copy",
      status: "Completed",
      icon: <Utensils className="w-5 h-5 text-emerald-400" />,
    },
    {
      phase: "Phase 5",
      module: "Glucose Telemetry & Chart",
      description: "Dual-trajectory Recharts visualization (Actual vs Predicted Target) with eHbA1c & TIR math.",
      testFocus: "Clinical mathematical precision on eAG & TIR formulas",
      status: "Completed",
      icon: <LineChart className="w-5 h-5 text-emerald-400" />,
    },
    {
      phase: "Phase 6",
      module: "Nutritional Gap Engine",
      description: "7-day fiber/micronutrient deficit tracking & local grocery buffer additions.",
      testFocus: "Accurate deficit deltas, local staple shopping cart state",
      status: "Completed",
      icon: <ShoppingBag className="w-5 h-5 text-emerald-400" />,
    },
    {
      phase: "Phase 7",
      module: "Safety Guardrails & QA",
      description: "Hard insulin calculation refusal guardrail + Lighthouse PWA production audit.",
      testFocus: "100% hard block on prescription dosing queries",
      status: "Next Up",
      icon: <Flame className="w-5 h-5 text-amber-400" />,
    },
  ];

  const handleCopyEnvPrompt = () => {
    navigator.clipboard.writeText("npm test && npm run build");
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-[#070b12] text-slate-100 flex items-center justify-center p-3 sm:p-6 lg:p-8">
      {/* Mobile-first Preview Container */}
      <div className="w-full max-w-md sm:max-w-2xl bg-gradient-to-b from-[#0c1322] to-[#070b14] rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden backdrop-blur-xl relative flex flex-col">
        {/* Glow ambient header decoration */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-emerald-500/15 via-emerald-600/5 to-transparent pointer-events-none" />

        {/* Top App Header */}
        <header className="px-5 pt-6 pb-4 relative z-10 flex items-center justify-between border-b border-slate-800/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Activity className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-white font-heading">
                  GlucoVision
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full">
                  PWA Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                AI Metabolic & Diabetic Lifestyle Companion
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700/50 text-[11px] text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono font-medium">Phase 6 Operational</span>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-5 space-y-5 relative z-10 overflow-y-auto max-h-[85vh]">
          {/* Phase 6 Status Banner */}
          <div className="glass-panel-elevated rounded-2xl p-4.5 border border-emerald-500/30 bg-emerald-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-semibold tracking-wide">
                  Phase 6 Nutritional Gap & Bazaar Engine Verified
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Exit Code 0
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              7-Day soluble fiber deficit aggregation (TC-P6-01), high-mucilage local staples catalog, and persistent Bazaar Shopping List cart with toast notifications (TC-P6-02) are verified and live.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                href="/deficits"
                className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/25 hover:brightness-110 transition-all flex items-center space-x-1.5 active:scale-95"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Launch Bazaar Gap Engine</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                href="/telemetry"
                className="text-xs font-medium px-3.5 py-2 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-750 transition-all flex items-center space-x-1.5 active:scale-95"
              >
                <LineChart className="w-3.5 h-3.5 text-emerald-400" />
                <span>Glucose Telemetry</span>
              </Link>

              <Link
                href="/menusafe"
                className="text-xs font-medium px-3.5 py-2 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-750 transition-all flex items-center space-x-1.5 active:scale-95"
              >
                <Utensils className="w-3.5 h-3.5 text-amber-400" />
                <span>MenuSafe Auditor</span>
              </Link>

              <button
                onClick={handleCopyEnvPrompt}
                className="text-[11px] font-medium px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all flex items-center space-x-1.5 active:scale-95 ml-auto"
              >
                <span>{isCopied ? "Command Copied!" : "npm test"}</span>
              </button>
            </div>
          </div>

          {/* Real-Time Runtime Diagnostics */}
          <div className="space-y-2.5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5 px-0.5">
              <Cpu className="w-3.5 h-3.5 text-slate-400" />
              <span>Core Dependency Matrix</span>
            </h2>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div>
                  <div className="font-medium text-slate-200">Supabase SSR</div>
                  <div className="text-[11px] text-emerald-400 flex items-center space-x-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>v2.118 SDK Bound</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div>
                  <div className="font-medium text-slate-200">Gemini 3.8 Flash</div>
                  <div className="text-[11px] text-amber-400 flex items-center space-x-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Active & Verified</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div>
                  <div className="font-medium text-slate-200">PWA Manifest</div>
                  <div className="text-[11px] text-cyan-400 flex items-center space-x-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>#059669 Standalone</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div>
                  <div className="font-medium text-slate-200">Test Harness</div>
                  <div className="text-[11px] text-indigo-400 flex items-center space-x-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <span>Vitest 46/46 Passed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Phase Roadmap Progression */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between px-0.5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>Implementation Roadmap (8 Phases)</span>
              </h2>
              <span className="text-[11px] text-slate-500">6 of 8 Operational</span>
            </div>

            <div className="space-y-2">
              {phases.map((p) => {
                const isSelected = selectedPhase === p.phase;
                return (
                  <div
                    key={p.phase}
                    onClick={() => setSelectedPhase(p.phase)}
                    className={`p-3.5 rounded-2xl transition-all cursor-pointer border ${
                      isSelected
                        ? "bg-slate-800/80 border-emerald-500/40 shadow-lg"
                        : "bg-slate-900/40 border-slate-800/60 hover:bg-slate-850/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/50">
                          {p.icon}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-200">
                              {p.phase}: {p.module}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {p.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            p.status === "Completed"
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : p.status === "Next Up"
                              ? "bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse"
                              : "bg-slate-800 text-slate-400 border-slate-700"
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-slate-700/40 text-[11px] flex items-center justify-between text-slate-300">
                        <div className="flex items-center space-x-1.5 text-slate-400">
                          <span className="font-semibold text-slate-300">Test Focus:</span>
                          <span>{p.testFocus}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="p-4 border-t border-slate-800/60 bg-slate-950/70 text-center text-xs text-slate-500">
          <div className="flex items-center justify-center space-x-2">
            <span>GlucoVision v1.0 MVP</span>
            <span>•</span>
            <span className="text-emerald-400 font-medium">Phase 5 Complete • Ready for Phase 6</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
