"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { prefetchSpeech, registerSpeechClip, speak, stopSpeaking } from "@/lib/assistant/client";
import { buildSnapshot } from "@/lib/care/report";
import { DEMO_SPOKEN_LINES, METFORMIN, PATIENT_EN, SCENES, demoHistory } from "./script";

/**
 * Playback state for the judges' simulation: current scene/step, auto-play that waits for each
 * spoken line to finish, voice on/off, and ← → / Space keyboard control.
 * Nothing runs (no audio, no TTS requests) until `started` is true.
 */
export function useDemoPlayer(started: boolean) {
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
  const isFirst = scene === 0 && beat === 0;
  const stepKey = `${scene}-${beat}`;

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

  const toggleSound = useCallback(() => {
    stopSpeaking();
    setSound((s) => !s);
  }, []);

  // Pre-recorded clips (public/demo-voice) play instantly; any line without one is fetched from live TTS
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
  }, [stepKey]);

  // Keyboard: ← → to step, Space to pause
  useEffect(() => {
    if (!started) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, next, prev]);

  useEffect(() => () => stopSpeaking(), []);

  return {
    scene,
    beat,
    current,
    step,
    stepKey,
    isFirst,
    isLast,
    playing,
    setPlaying,
    sound,
    setSound,
    toggleSound,
    go,
    next,
    prev,
    report,
    screenRef,
  };
}

export type DemoPlayer = ReturnType<typeof useDemoPlayer>;
