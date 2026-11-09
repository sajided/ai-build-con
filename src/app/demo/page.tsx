"use client";

/**
 * Standalone guided simulation for hackathon judges (shareable link).
 * The same simulation also runs inside the real app's frame from the "Watch the simulation"
 * button next to it (see AppSimulation).
 */

import React, { useState } from "react";
import Link from "next/link";
import { Droplet, Play } from "lucide-react";
import PhoneScreen, { DEMO_KEYFRAMES } from "@/components/demo/PhoneScreen";
import DemoPanel from "@/components/demo/DemoPanel";
import { useDemoPlayer } from "@/components/demo/useDemoPlayer";
import { PATIENT_EN } from "@/components/demo/script";

export default function DemoPage() {
  const [started, setStarted] = useState(false);
  const player = useDemoPlayer(started);

  return (
    <div className="min-h-dvh bg-backdrop text-ink">
      <style>{DEMO_KEYFRAMES}</style>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-5 lg:flex-row lg:items-start lg:gap-10 lg:py-10">
        {/* Fixed width so the phone doesn't resize with whatever screen it is showing */}
        <div className="flex shrink-0 justify-center lg:sticky lg:top-10 lg:w-[380px]">
          <div className="relative h-[min(780px,78dvh)] w-full max-w-[380px] rounded-[52px] bg-ink p-[10px] shadow-float">
            <div
              ref={player.screenRef}
              className="relative h-full w-full overflow-y-auto overflow-x-hidden rounded-[42px] bg-canvas [transform:translateZ(0)] [scrollbar-width:none]"
            >
              <PhoneScreen key={player.stepKey} screen={player.step.screen} report={player.report} />
            </div>
            <div className="pointer-events-none absolute left-1/2 top-[18px] h-6 w-24 -translate-x-1/2 rounded-full bg-ink" />
          </div>
        </div>

        <DemoPanel
          player={player}
          showProgress={started}
          headerAction={
            <Link href="/" className="chip-toggle h-10 text-sm">
              Open the real app →
            </Link>
          }
          finishAction={
            <Link href="/" className="btn-primary h-14 text-lg">
              Try the real app
            </Link>
          }
        />
      </div>

      {/* Start overlay: also gives the browser the user gesture it needs before playing audio */}
      {!started && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-md p-7 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-pastel-lime-strong text-white">
              <Droplet className="h-8 w-8" />
            </span>
            <h1 className="mt-4 text-3xl font-bold">Jotno in 3½ minutes</h1>
            <p className="mt-2 text-lg text-ink-soft">
              A diabetes companion for elderly Bangla speakers. Follow a week in the life of {PATIENT_EN}, 68.
            </p>
            <p className="mt-2 text-sm font-semibold text-ink-muted">Simulated — no mic, camera or login needed. Bangla voice plays with English subtitles.</p>
            <button type="button" onClick={() => setStarted(true)} className="btn-primary mt-6 h-14 text-lg">
              <Play className="h-5 w-5" />
              Start the demo
            </button>
            <button
              type="button"
              onClick={() => {
                player.setSound(false);
                setStarted(true);
              }}
              className="mt-2 h-12 w-full text-base font-semibold text-ink-soft underline underline-offset-4"
            >
              Start without sound
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
