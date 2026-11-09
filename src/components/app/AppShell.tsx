"use client";

import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import { PlayCircle } from "lucide-react";
import BottomNav from "./BottomNav";
import AppSimulation from "@/components/demo/AppSimulation";

// Full-screen flows that should not show the tab bar
const NO_NAV_ROUTES = ["/onboarding", "/~offline", "/scanner", "/live", "/reminders", "/report", "/care"];

const APP_FRAME =
  "relative mx-auto min-h-dvh max-w-md bg-canvas print:m-0 print:max-w-none print:rounded-none print:shadow-none sm:my-6 sm:min-h-[calc(100dvh-3rem)] sm:rounded-[40px] sm:shadow-float sm:overflow-hidden";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [simulating, setSimulating] = useState(false);
  const exitSimulation = useCallback(() => setSimulating(false), []);

  // The standalone judges' demo draws its own phone frame and needs the full desktop width
  if (pathname.startsWith("/demo")) return <>{children}</>;
  if (simulating) return <AppSimulation frameClassName={APP_FRAME} onExit={exitSimulation} />;

  // "/" is the simple Bangla voice home, which has its own large controls
  const showNav = pathname !== "/" && !NO_NAV_ROUTES.some((r) => pathname.startsWith(r));
  // The caregiver view is opened by family from a shared link, not by judges
  const showSimulationButton = !pathname.startsWith("/care");

  return (
    <>
      <div className={APP_FRAME}>
        <div className={showNav ? "pb-[calc(6.5rem+env(safe-area-inset-bottom))]" : ""}>{children}</div>
        {showNav && <BottomNav />}
      </div>

      {/* Outside the app frame, on screens wide enough to have an "outside" (laptops at a judging table) */}
      {showSimulationButton && (
        <div className="fixed left-[calc(50%+14rem+2rem)] top-6 z-30 hidden w-60 print:hidden lg:block">
          <button
            type="button"
            onClick={() => setSimulating(true)}
            className="card flex w-full items-center gap-3 p-4 text-left transition-transform active:scale-[0.98]"
          >
            <PlayCircle className="h-10 w-10 shrink-0 text-pastel-lime-strong" />
            <span>
              <span className="block text-base font-bold text-ink">Watch the simulation</span>
              <span className="block text-sm font-semibold text-ink-muted">3½ min · for judges · English captions</span>
            </span>
          </button>
        </div>
      )}
    </>
  );
}
