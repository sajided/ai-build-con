"use client";

/**
 * Guided simulation for hackathon judges.
 * Plays scripted scenes on a phone mock-up with fake data — no mic, camera, login or API key needed —
 * while an English panel explains what the patient sees and what Jotno does under the hood.
 * The phone renders the app's real components (confirm sheet, help screen, reminder card, doctor report).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Droplet,
  FileText,
  Loader2,
  MessageCircle,
  Mic,
  Pause,
  Phone,
  Pill,
  Play,
  RotateCcw,
  ScanLine,
  Volume2,
  VolumeX,
} from "lucide-react";
import ConfirmReadingSheet from "@/components/elder/ConfirmReadingSheet";
import HelpScreen from "@/components/elder/HelpScreen";
import ReminderCard from "@/components/care/ReminderCard";
import CareReport from "@/components/care/CareReport";
import { readingFeedbackBn, toBanglaDigits } from "@/lib/assistant/bangla";
import { prefetchSpeech, registerSpeechClip, speak, stopSpeaking } from "@/lib/assistant/client";
import { alertMessageBn, buildSnapshot } from "@/lib/care/report";

import {
  DEMO_SPOKEN_LINES,
  FOOD_REPLY,
  METFORMIN,
  PATIENT,
  PATIENT_EN,
  SCENES,
  SON,
  SON_PHONE,
  VOICE_TEXT,
  demoHistory,
  type ScreenId,
} from "./script";

// ---------- Phone screens ----------

function DemoHome({
  state = "idle",
  last,
  reply,
  verdict,
  children,
}: {
  state?: "idle" | "recording" | "thinking";
  last?: { value: number; label: string; level: string; className: string };
  reply?: string;
  verdict?: { label: string; className: string };
  children?: React.ReactNode;
}) {
  return (
    <div lang="bn" className="flex min-h-full flex-col px-5 pt-8 pb-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-ink-soft">শুভ সকাল,</p>
          <h1 className="text-3xl font-bold text-ink">{PATIENT}</h1>
        </div>
        <div className="flex gap-2">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-ink shadow-soft">
            <Volume2 className="h-5 w-5" />
          </span>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-pastel-lime-strong text-white shadow-soft">
            <Phone className="h-5 w-5" />
          </span>
        </div>
      </header>

      {children}

      <section className="card mt-4 flex items-center gap-3 p-4">
        <div className="icon-badge h-12 w-12 bg-pastel-blue text-pastel-blue-ink">
          <Droplet className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink-muted">শেষ সুগার · {last?.label ?? "গতকাল রাত ৯:১০"}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <span className="text-3xl font-bold text-ink">{toBanglaDigits(last?.value ?? 7.2)}</span>
            <span className="text-base font-bold text-ink-muted">mmol/L</span>
            <span className={`rounded-full px-3 py-0.5 text-sm font-bold ${last?.className ?? "bg-risk-safe text-risk-safeInk"}`}>
              {last?.level ?? "ভালো"}
            </span>
          </div>
        </div>
      </section>

      <section className="flex flex-1 flex-col items-center justify-center py-5">
        <div
          className={`relative flex h-32 w-32 items-center justify-center rounded-full text-white shadow-float transition-colors ${
            state === "recording" ? "bg-pastel-coral-strong scale-95" : "bg-ink"
          }`}
        >
          {state === "recording" && <span className="absolute inset-0 animate-ping rounded-full bg-pastel-coral-strong/40" />}
          {state === "thinking" ? <Loader2 className="h-12 w-12 animate-spin" /> : <Mic className="relative h-14 w-14" />}
        </div>
        <p className="mt-3 text-center text-xl font-bold text-ink">
          {state === "recording" ? "শুনছি… বলা শেষ হলে ছেড়ে দিন" : state === "thinking" ? "একটু অপেক্ষা করুন…" : "চেপে ধরে কথা বলুন"}
        </p>
        {state === "recording" && (
          <div className="animate-in fade-in mt-3 rounded-2xl rounded-br-sm bg-pastel-coral px-4 py-2 text-lg font-semibold text-pastel-coral-ink">
            “{VOICE_TEXT}”
          </div>
        )}
        {reply && (
          <div className="card animate-in fade-in mt-4 w-full p-4">
            {verdict && <span className={`mb-2 inline-block rounded-full px-3 py-1 text-base font-bold ${verdict.className}`}>{verdict.label}</span>}
            <p className="text-lg font-semibold leading-relaxed text-ink">{reply}</p>
          </div>
        )}
      </section>

      {!reply && (
        <section className="grid grid-cols-2 gap-2.5">
          {[
            { icon: Camera, label: "মিটারের ছবি", tile: "bg-pastel-blue text-pastel-blue-ink", fab: "bg-pastel-blue-strong" },
            { icon: ScanLine, label: "খাবার স্ক্যান", tile: "bg-pastel-lime text-pastel-lime-ink", fab: "bg-pastel-lime-strong" },
            { icon: Pill, label: "ওষুধ", tile: "bg-pastel-lilac text-pastel-lilac-ink", fab: "bg-pastel-lilac-strong" },
            { icon: FileText, label: "রিপোর্ট", tile: "bg-pastel-peach text-pastel-peach-ink", fab: "bg-pastel-peach-strong" },
          ].map(({ icon: Icon, label, tile, fab }) => (
            <div key={label} className={`tile flex min-h-[96px] flex-col items-center justify-center gap-2 text-center ${tile}`}>
              <span className={`fab h-11 w-11 ${fab}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-lg font-bold">{label}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function Viewfinder({ kind, scanning }: { kind: "meter" | "food"; scanning: boolean }) {
  return (
    <div className="relative flex h-full flex-col bg-black text-white">
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {kind === "meter" ? (
          <div className="flex h-72 w-44 flex-col items-center rounded-[36px] bg-gradient-to-b from-slate-300 to-slate-500 p-4 shadow-2xl">
            <p className="text-xs font-bold tracking-widest text-slate-700">GLUCO METER</p>
            <div className="mt-3 flex h-28 w-full flex-col items-end justify-center rounded-xl bg-[#B9C7A5] px-3 font-mono text-slate-900 shadow-inner">
              <span className="text-6xl font-bold leading-none tracking-tighter">3.4</span>
              <span className="text-sm font-bold">mmol/L</span>
            </div>
            <div className="mt-6 flex gap-3">
              <span className="h-8 w-8 rounded-full bg-slate-700" />
              <span className="h-8 w-8 rounded-full bg-slate-700" />
            </div>
          </div>
        ) : (
          <div className="relative flex h-72 w-72 items-center justify-center rounded-full bg-gradient-to-br from-white to-slate-200 shadow-2xl">
            <div className="absolute inset-5 rounded-full border-4 border-slate-100" />
            <span className="absolute left-12 top-16 text-7xl" aria-hidden>🍚</span>
            <span className="absolute right-10 top-20 text-6xl" aria-hidden>🐟</span>
            <span className="absolute bottom-12 left-16 text-5xl" aria-hidden>🥣</span>
            <span className="absolute bottom-14 right-16 text-5xl" aria-hidden>🥬</span>
          </div>
        )}
        {/* Corner guides */}
        <div className="pointer-events-none absolute inset-10 rounded-3xl border-2 border-white/40" />
        {scanning && (
          <div className="pointer-events-none absolute inset-x-10 top-10 h-1 animate-[demo-scan_1.6s_ease-in-out_infinite] rounded-full bg-pastel-lime shadow-[0_0_24px_6px_rgba(225,236,178,0.7)]" />
        )}
      </div>
      <div lang="bn" className="flex flex-col items-center gap-3 bg-black px-5 pb-8 pt-4">
        <p className="text-xl font-bold">{scanning ? "দেখছি… একটু অপেক্ষা করুন" : kind === "meter" ? "মিটারের ছবি তুলুন" : "খাবারের দিকে ধরুন"}</p>
        <span className={`flex h-20 w-20 items-center justify-center rounded-full border-4 border-white ${scanning ? "bg-white/30" : "bg-white"}`}>
          {scanning ? <Loader2 className="h-8 w-8 animate-spin" /> : <Camera className="h-8 w-8 text-ink" />}
        </span>
      </div>
    </div>
  );
}

function MessagePreview({ app, title, text, link }: { app: "sms" | "whatsapp"; title: string; text: string; link?: string }) {
  return (
    <div className="flex h-full flex-col bg-[#ECE5DD]">
      <div className={`flex items-center gap-3 px-4 pb-3 pt-8 text-white ${app === "whatsapp" ? "bg-[#075E54]" : "bg-ink"}`}>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
          <MessageCircle className="h-5 w-5" />
        </span>
        <div>
          <p className="text-lg font-bold" lang="bn">{title}</p>
          <p className="text-xs opacity-80">{app === "whatsapp" ? "WhatsApp" : "SMS"} · {SON_PHONE}</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-end gap-2 p-4">
        <div lang="bn" className="animate-in fade-in ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-[#DCF8C6] p-3 text-lg leading-relaxed text-ink shadow-sm">
          {text}
          {link && <span className="mt-1 block break-all text-base text-[#1F3D72] underline">{link}</span>}
          <span className="mt-1 flex items-center justify-end gap-1 text-xs text-ink-muted">
            এখন <Check className="h-3 w-3" />
            <Check className="-ml-2 h-3 w-3" />
          </span>
        </div>
      </div>
    </div>
  );
}

function PhoneScreen({ screen, report }: { screen: ScreenId; report: ReturnType<typeof buildSnapshot> }) {
  const noop = () => {};
  const voiceLast = { value: 9.5, label: "এইমাত্র", level: "একটু বেশি", className: "bg-risk-caution text-risk-cautionInk" };
  const lowLast = { value: 3.4, label: "আজ সকাল ৭:১০", level: "কম", className: "bg-risk-danger text-risk-dangerInk" };

  switch (screen) {
    case "home":
      return <DemoHome />;
    case "home-recording":
      return <DemoHome state="recording" />;
    case "home-thinking":
      return <DemoHome state="thinking" />;
    case "confirm-voice":
      return (
        <>
          <DemoHome />
          <ConfirmReadingSheet value={9.5} context="post_meal" onContextChange={noop} onConfirm={noop} onReject={noop} />
        </>
      );
    case "home-reply-voice":
      return <DemoHome last={voiceLast} reply={readingFeedbackBn(9.5)} />;
    case "meter-camera":
      return <Viewfinder kind="meter" scanning={false} />;
    case "meter-reading":
      return <Viewfinder kind="meter" scanning />;
    case "confirm-meter":
      return (
        <>
          <Viewfinder kind="meter" scanning={false} />
          <ConfirmReadingSheet value={3.4} context="fasting" onContextChange={noop} onConfirm={noop} onReject={noop} />
        </>
      );
    case "help-low":
      return (
        <div className="[&_.min-h-dvh]:min-h-full">
          <HelpScreen
            kind="low"
            message={readingFeedbackBn(3.4)}
            contactName={SON}
            contactPhone={SON_PHONE}
            alertText={alertMessageBn(PATIENT, 3.4, toBanglaDigits(3.4))}
            onReplay={noop}
            onClose={noop}
          />
        </div>
      );
    case "family-sms":
      return <MessagePreview app="sms" title={SON} text={alertMessageBn(PATIENT, 3.4, toBanglaDigits(3.4))} />;
    case "food-camera":
      return <Viewfinder kind="food" scanning={false} />;
    case "food-reading":
      return <Viewfinder kind="food" scanning />;
    case "food-verdict":
      return (
        <DemoHome
          last={lowLast}
          reply={FOOD_REPLY}
          verdict={{ label: "অল্প খান", className: "bg-risk-caution text-risk-cautionInk" }}
        />
      );
    case "reminder":
      return (
        <DemoHome last={lowLast}>
          <ReminderCard due={{ reminder: METFORMIN, date: "", time: "14:00" }} onDone={noop} onLater={noop} onSpeak={noop} />
        </DemoHome>
      );
    case "reminder-done":
      return (
        <DemoHome last={lowLast}>
          <section lang="bn" className="tile animate-in fade-in mt-5 flex items-center gap-3 bg-risk-safe p-5 text-risk-safeInk">
            <span className="icon-badge h-14 w-14 bg-white/70">
              <Check className="h-8 w-8" strokeWidth={3} />
            </span>
            <p className="text-2xl font-bold">মেটফরমিন খেয়েছেন ✓</p>
          </section>
        </DemoHome>
      );
    case "report":
      return (
        <div lang="bn" className="px-4 pb-8 pt-8">
          <h1 className="mb-4 text-2xl font-bold text-ink">ডাক্তারের রিপোর্ট</h1>
          <CareReport snapshot={report} />
        </div>
      );
    case "report-share":
      return (
        <MessagePreview
          app="whatsapp"
          title={SON}
          text={`${PATIENT} সুগারের রিপোর্ট (১৪ দিন):`}
          link="jotno.app/care#eyJ2IjoxLCJuIjoi…"
        />
      );
    case "outro":
      return (
        <div lang="bn" className="flex h-full flex-col items-center justify-center bg-pastel-lime px-8 text-center text-pastel-lime-ink">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/70">
            <Droplet className="h-12 w-12" />
          </div>
          <h1 className="mt-6 text-5xl font-bold">যত্ন</h1>
          <p className="mt-2 text-xl font-semibold">Jotno · “care”</p>
          <p className="mt-6 text-xl font-semibold leading-relaxed">কথা বলুন, ছবি তুলুন — বাকিটা যত্ন দেখবে।</p>
          <p className="mt-1 text-base opacity-80">Speak, take a photo — Jotno takes care of the rest.</p>
        </div>
      );
  }
}

// ---------- Page ----------

export default function DemoPage() {
  const [started, setStarted] = useState(false);
  const [scene, setScene] = useState(0);
  const [beat, setBeat] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [sound, setSound] = useState(true);
  const report = useMemo(() => {
    const now = new Date();
    const { logs, doses } = demoHistory(now);
    return buildSnapshot(PATIENT_EN, logs, [METFORMIN], doses, 14, now);
  }, []);
  const screenRef = useRef<HTMLDivElement>(null);

  const current = SCENES[scene];
  const step = current.beats[beat];
  const isLast = scene === SCENES.length - 1;

  const go = useCallback((s: number, b = 0) => {
    stopSpeaking();
    setScene(Math.max(0, Math.min(SCENES.length - 1, s)));
    setBeat(b);
  }, []);

  const next = useCallback(() => {
    if (beat < SCENES[scene].beats.length - 1) setBeat(beat + 1);
    else if (scene < SCENES.length - 1) go(scene + 1);
  }, [beat, scene, go]);

  const prev = useCallback(() => {
    if (beat > 0) setBeat(beat - 1);
    else if (scene > 0) go(scene - 1, SCENES[scene - 1].beats.length - 1);
  }, [beat, scene, go]);

  // Load the pre-recorded voice clips (public/demo-voice), and fetch any missing line from live TTS
  // while the judge is still on the start screen, so every line plays instantly in the same voice.
  useEffect(() => {
    let cancelled = false;
    fetch("/demo-voice/manifest.json")
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}))
      .then(async (manifest: Record<string, string>) => {
        const missing: string[] = [];
        for (const line of DEMO_SPOKEN_LINES) {
          if (manifest[line]) registerSpeechClip(line, `/demo-voice/${manifest[line]}`);
          else missing.push(line);
        }
        for (const line of missing) {
          if (cancelled) return;
          await prefetchSpeech(line);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-advance once the step's minimum time has passed AND its voice line has finished,
  // so a sentence is never cut off. Both flags are tagged with the step they belong to.
  const stepKey = `${scene}-${beat}`;
  const [timeUpFor, setTimeUpFor] = useState<string | null>(null);
  const [voiceDoneFor, setVoiceDoneFor] = useState<string | null>(null);

  useEffect(() => {
    if (!started || !playing || isLast) return;
    const t = setTimeout(() => setTimeUpFor(stepKey), step.ms);
    return () => clearTimeout(t);
  }, [started, playing, isLast, step, stepKey]);

  // Speak only Jotno's own lines; the patient's words are shown as subtitles
  // (the same voice reading both made it sound like the app was talking to itself).
  useEffect(() => {
    if (!started) return;
    stopSpeaking();
    const line = step.speech?.who === "app" ? step.speech.bn : null;
    if (!sound || !line) {
      setVoiceDoneFor(stepKey);
      return;
    }
    let active = true;
    const done = () => active && setVoiceDoneFor(stepKey);
    // A short breath after the sentence before moving on
    speak(line, { onEnd: () => setTimeout(done, 700) }).then((ok) => !ok && done());
    // Never let a stuck voice freeze the demo
    const guard = setTimeout(done, 30000);
    return () => {
      active = false;
      clearTimeout(guard);
    };
  }, [started, sound, step, stepKey]);

  useEffect(() => {
    if (playing && !isLast && timeUpFor === stepKey && voiceDoneFor === stepKey) next();
  }, [playing, isLast, timeUpFor, voiceDoneFor, stepKey, next]);

  // Each new screen starts scrolled to the top
  useEffect(() => {
    if (screenRef.current) screenRef.current.scrollTop = 0;
  }, [scene, beat]);

  // Keyboard: ← → to step, space to pause
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!started) return;
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      } else return;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, next, prev]);

  useEffect(() => () => stopSpeaking(), []);

  return (
    <div className="min-h-dvh bg-backdrop text-ink">
      <style>{`@keyframes demo-scan { 0%,100% { transform: translateY(0) } 50% { transform: translateY(330px) } }
        @keyframes demo-progress { from { width: 0 } to { width: 100% } }`}</style>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-5 lg:flex-row lg:items-start lg:gap-10 lg:py-10">
        {/* Phone */}
        <div className="flex shrink-0 justify-center lg:sticky lg:top-10">
          <div className="relative h-[min(780px,78dvh)] w-full max-w-[380px] rounded-[52px] bg-ink p-[10px] shadow-float">
            <div
              ref={screenRef}
              className="relative h-full w-full overflow-y-auto overflow-x-hidden rounded-[42px] bg-canvas [transform:translateZ(0)] [scrollbar-width:none]"
            >
              <PhoneScreen key={`${scene}-${beat}`} screen={step.screen} report={report} />
            </div>
            <div className="pointer-events-none absolute left-1/2 top-[18px] h-6 w-24 -translate-x-1/2 rounded-full bg-ink" />
          </div>
        </div>

        {/* Story panel */}
        <section className="flex min-w-0 flex-1 flex-col gap-5">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-pastel-lime-strong text-white">
                <Droplet className="h-5 w-5" />
              </span>
              <div>
                <p className="text-lg font-bold leading-tight">Jotno · যত্ন</p>
                <p className="text-sm font-semibold text-ink-muted">Guided demo · simulated data, nothing is recorded</p>
              </div>
            </div>
            <Link href="/" className="chip-toggle h-10 text-sm">
              Open the real app →
            </Link>
          </header>

          {/* Scene chips */}
          <nav aria-label="Demo chapters" className="flex flex-wrap gap-2">
            {SCENES.map((s, i) => (
              <button
                key={s.kicker}
                type="button"
                onClick={() => {
                  setStarted(true);
                  go(i);
                }}
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
              <p key={`${scene}-${beat}`} className="animate-in fade-in mt-1 text-xl font-semibold leading-snug">
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
              {started && playing && !isLast && (
                <div className="mt-4 h-1 overflow-hidden rounded-full bg-line">
                  <div key={`${scene}-${beat}`} className="h-full bg-ink" style={{ animation: `demo-progress ${step.ms}ms linear forwards` }} />
                </div>
              )}
            </div>

            <h3 className="mt-6 text-sm font-bold uppercase tracking-wide text-ink-muted">
              {isLast ? "What we built" : "How it works"}
            </h3>
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
                <Link href="/" className="btn-primary h-14 text-lg">
                  Try the real app
                </Link>
                <button type="button" onClick={() => go(0)} className="btn-secondary h-14 text-lg">
                  <RotateCcw className="h-5 w-5" />
                  Watch again
                </button>
              </div>
            )}
          </article>

          {/* Controls */}
          <div className="sticky bottom-3 z-10 flex items-center justify-between gap-2 rounded-full bg-white p-2 shadow-float lg:static">
            <button type="button" onClick={prev} disabled={scene === 0 && beat === 0} aria-label="Previous step" className="flex h-12 w-12 items-center justify-center rounded-full active:bg-canvas disabled:opacity-30">
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
              onClick={() => {
                setSound((s) => !s);
                stopSpeaking();
              }}
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
      </div>

      {/* Start overlay: also gives the browser the user gesture it needs before playing audio */}
      {!started && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-md p-7 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-pastel-lime-strong text-white">
              <Droplet className="h-8 w-8" />
            </span>
            <h1 className="mt-4 text-3xl font-bold">Jotno in 2 minutes</h1>
            <p className="mt-2 text-lg text-ink-soft">
              A diabetes companion for elderly Bangla speakers. Follow one day in the life of {PATIENT_EN}, 68.
            </p>
            <p className="mt-2 text-sm font-semibold text-ink-muted">Simulated — no mic, camera or login needed. Bangla voice plays with English subtitles.</p>
            <button type="button" onClick={() => setStarted(true)} className="btn-primary mt-6 h-14 text-lg">
              <Play className="h-5 w-5" />
              Start the demo
            </button>
            <button
              type="button"
              onClick={() => {
                setSound(false);
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
