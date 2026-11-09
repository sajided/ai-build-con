"use client";

import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import PhoneScreen, { DEMO_KEYFRAMES } from "./PhoneScreen";
import DemoPanel from "./DemoPanel";
import { useDemoPlayer } from "./useDemoPlayer";

interface AppSimulationProps {
  /** Classes of the real app's frame, so the simulation plays in exactly the same spot */
  frameClassName: string;
  onExit: () => void;
}

/**
 * The judges' simulation played inside the real app's frame, with captions and controls beside it.
 * Mounted only while the simulation runs, so it starts fresh each time and stops all audio on exit.
 */
export default function AppSimulation({ frameClassName, onExit }: AppSimulationProps) {
  // Started by a click, which is the gesture the browser needs before it will play audio
  const player = useDemoPlayer(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onExit();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onExit]);

  const back = (
    <button type="button" onClick={onExit} className="chip-toggle h-10 text-sm">
      <ArrowLeft className="h-4 w-4" />
      Back to the real app
    </button>
  );

  return (
    <div className="lg:flex lg:items-start lg:justify-center lg:gap-10 lg:px-6">
      <style>{DEMO_KEYFRAMES}</style>
      <div className={`${frameClassName} lg:mx-0 lg:w-full lg:shrink-0`}>
        {/* translateZ makes this the containing block, so the app's full-screen sheets stay inside the frame */}
        <div
          ref={player.screenRef}
          className="relative h-dvh overflow-y-auto overflow-x-hidden [transform:translateZ(0)] [scrollbar-width:none] sm:h-[calc(100dvh-3rem)]"
        >
          <PhoneScreen key={player.stepKey} screen={player.step.screen} report={player.report} />
        </div>
      </div>
      <aside className="mx-auto max-w-md px-4 py-6 lg:sticky lg:top-6 lg:mx-0 lg:max-w-xl lg:flex-1 lg:px-0">
        <DemoPanel
          player={player}
          showProgress
          headerAction={back}
          finishAction={
            <button type="button" onClick={onExit} className="btn-primary h-14 text-lg">
              Try the real app
            </button>
          }
        />
      </aside>
    </div>
  );
}
