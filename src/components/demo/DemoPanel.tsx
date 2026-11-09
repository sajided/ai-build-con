"use client";

import React from "react";
import { Check, ChevronLeft, ChevronRight, Droplet, Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { SCENES } from "./script";
import type { DemoPlayer } from "./useDemoPlayer";

interface DemoPanelProps {
  player: DemoPlayer;
  /** Header action, e.g. "Back to the real app" */
  headerAction: React.ReactNode;
  /** Primary button on the final summary step */
  finishAction: React.ReactNode;
  showProgress: boolean;
}

/** English captions, translations, "how it works" notes and playback controls for judges. */
export default function DemoPanel({ player, headerAction, finishAction, showProgress }: DemoPanelProps) {
  const { scene, beat, current, step, stepKey, isFirst, isLast, playing, setPlaying, sound, toggleSound, go, next, prev } = player;

  return (
    <section className="flex min-w-0 flex-1 flex-col gap-5 text-ink">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-pastel-lime-strong text-white">
            <Droplet className="h-5 w-5" />
          </span>
          <div>
            <p className="text-lg font-bold leading-tight">Jotno · যত্ন</p>
            <p className="text-sm font-semibold text-ink-muted">Simulation · fake data, nothing is recorded</p>
          </div>
        </div>
        {headerAction}
      </header>

      <nav aria-label="Demo chapters" className="flex flex-wrap gap-2">
        {SCENES.map((s, i) => (
          <button
            key={s.kicker}
            type="button"
            onClick={() => go(i)}
            aria-current={i === scene ? "step" : undefined}
            className={`rounded-full px-3 py-1.5 text-sm font-bold transition-colors ${
              i === scene ? "bg-ink text-white" : i < scene ? "bg-white text-ink" : "bg-white/60 text-ink-muted"
            }`}
          >
            {i + 1}. {s.kicker.replace(/^Feature \d · /, "")}
          </button>
        ))}
      </nav>

      <article className="card p-6">
        <p className="text-sm font-bold uppercase tracking-wide text-ink-muted">{current.kicker}</p>
        <h2 className="mt-1 text-3xl font-bold leading-tight">{current.title}</h2>

        <div className="mt-5 rounded-2xl bg-canvas p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">
            Step {beat + 1} of {current.beats.length}
          </p>
          <p key={stepKey} className="animate-in fade-in mt-1 text-xl font-semibold leading-snug">
            {step.caption}
          </p>
          {step.speech && (
            <div
              className={`animate-in fade-in mt-3 rounded-2xl p-4 ${
                step.speech.who === "patient" ? "bg-pastel-coral text-pastel-coral-ink" : "bg-pastel-blue text-pastel-blue-ink"
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-wide opacity-80">
                {step.speech.who === "patient" ? "Rahima says" : "Jotno says (spoken aloud)"}
              </p>
              <p lang="bn" className="mt-1 text-lg font-semibold">
                {step.speech.bn}
              </p>
              <p className="mt-1 text-base italic opacity-90">“{step.speech.en}”</p>
            </div>
          )}
          {showProgress && playing && !isLast && (
            <div className="mt-4 h-1 overflow-hidden rounded-full bg-line">
              <div key={stepKey} className="h-full bg-ink" style={{ animation: `demo-progress ${step.ms}ms linear forwards` }} />
            </div>
          )}
        </div>

        <h3 className="mt-6 text-sm font-bold uppercase tracking-wide text-ink-muted">{isLast ? "What we built" : "How it works"}</h3>
        <ul className="mt-2 space-y-2">
          {current.how.map((h) => (
            <li key={h} className="flex gap-2 text-base leading-relaxed text-ink-soft">
              <Check className="mt-1 h-4 w-4 shrink-0 text-pastel-lime-strong" strokeWidth={3} />
              <span>{h}</span>
            </li>
          ))}
        </ul>

        {isLast && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {finishAction}
            <button type="button" onClick={() => go(0)} className="btn-secondary h-14 text-lg">
              <RotateCcw className="h-5 w-5" />
              Watch again
            </button>
          </div>
        )}
      </article>

      <div className="sticky bottom-3 z-10 flex items-center justify-between gap-2 rounded-full bg-white p-2 shadow-float lg:static">
        <button type="button" onClick={prev} disabled={isFirst} aria-label="Previous step" className="flex h-12 w-12 items-center justify-center rounded-full active:bg-canvas disabled:opacity-30">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          disabled={isLast}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-ink px-5 text-base font-bold text-white disabled:opacity-30"
        >
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          {playing ? "Pause" : "Auto-play"}
        </button>
        <button
          type="button"
          onClick={toggleSound}
          aria-label={sound ? "Mute voice" : "Turn voice on"}
          className="flex h-12 w-12 items-center justify-center rounded-full active:bg-canvas"
        >
          {sound ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        </button>
        <button type="button" onClick={next} disabled={isLast} aria-label="Next step" className="flex h-12 w-12 items-center justify-center rounded-full active:bg-canvas disabled:opacity-30">
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
      <p className="hidden text-center text-sm font-semibold text-ink-muted lg:block">Keyboard: ← → step · Space pause/play</p>
    </section>
  );
}
