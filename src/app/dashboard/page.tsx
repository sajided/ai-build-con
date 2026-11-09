"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Droplet,
  ScanLine,
  Utensils,
  ChefHat,
  Salad,
  Plus,
  ArrowRight,
  MessageCircleQuestion,
  UserRound,
  Sparkles,
  Mic,
} from "lucide-react";
import type { GlucoseLog } from "@/lib/validations/telemetry";
import type { OnboardingFormData } from "@/lib/validations/onboarding";
import { calculateTimeInRange } from "@/utils/telemetry";
import { CONTEXT_LABELS_BN, LEVEL_LABELS_BN, classifyGlucose, greetingBn, toBanglaDigits } from "@/lib/assistant/bangla";
import ProgressRing from "@/components/app/ProgressRing";
import SugarInsights from "@/components/dashboard/SugarInsights";

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (Number.isNaN(mins)) return "";
  if (mins < 1) return "এইমাত্র";
  if (mins < 60) return `${toBanglaDigits(mins)} মিনিট আগে`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${toBanglaDigits(hrs)} ঘণ্টা আগে`;
  const days = Math.round(hrs / 24);
  return `${toBanglaDigits(days)} দিন আগে`;
}

/** A pastel tile whose whole surface links somewhere, with an optional round "+" action. */
function Tile({
  href,
  label,
  icon: Icon,
  className,
  fabHref,
  fabLabel,
  fabClass,
  children,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  className: string;
  fabHref?: string;
  fabLabel?: string;
  fabClass?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`tile flex flex-col ${className}`}>
      <Link href={href} aria-label={label} className="absolute inset-0 rounded-[28px] active:bg-black/5" />
      <span className="chip pointer-events-none relative self-start text-base">
        <Icon className="h-5 w-5" />
        {label}
      </span>
      <div className="pointer-events-none relative mt-3 flex-1">{children}</div>
      {fabHref && (
        <Link href={fabHref} aria-label={fabLabel} className={`fab relative z-10 h-12 w-12 self-end ${fabClass}`}>
          <Plus className="h-5 w-5" strokeWidth={2.5} />
        </Link>
      )}
    </div>
  );
}

const FOOD_ROWS = [
  { href: "/scanner", label: "লাইভ স্ক্যান", icon: ScanLine },
  { href: "/menusafe", label: "রেস্তোরাঁর মেনু", icon: Utensils },
  { href: "/recipes", label: "রান্না", icon: ChefHat },
];

export default function DashboardPage() {
  const [profile, setProfile] = useState<Partial<OnboardingFormData> | null>(null);
  const [logs, setLogs] = useState<GlucoseLog[]>([]);
  const [loaded, setLoaded] = useState(false);
  // Date depends on the viewer's locale/timezone, so compute it client-side only
  const [today, setToday] = useState<string | null>(null);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    setGreeting(greetingBn(new Date().getHours()));
    setToday(new Date().toLocaleDateString("bn-BD", { day: "numeric", month: "long" }));
    try {
      const p = localStorage.getItem("glucovision_profile");
      if (p) setProfile(JSON.parse(p));
      const l = localStorage.getItem("glucovision_glucose_logs");
      if (l) setLogs(JSON.parse(l));
    } catch {
      // Ignore corrupt local data; the home screen falls back to empty states
    }
    setLoaded(true);
  }, []);

  const firstName = profile?.fullName?.split(" ")[0];
  const sorted = [...logs].sort((a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime());
  const latest = sorted[0];
  const tir = Math.round(calculateTimeInRange(sorted.slice(0, 14).map((l) => l.glucose_value)));

  return (
    <main lang="bn" className="px-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-4">
      {/* Greeting */}
      <header className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-semibold text-ink-soft">{greeting}{firstName ? `, ${firstName}` : ""}</p>
          <h1 className="text-2xl font-bold text-ink">
            আজ{today ? `, ${today}` : ""}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            lang="bn"
            className="flex h-12 items-center gap-1.5 rounded-full bg-ink px-4 text-base font-bold text-white active:bg-black"
          >
            <Mic className="h-5 w-5" />
            সহজ মোড
          </Link>
          <Link
            href="/onboarding"
            aria-label="আমার তথ্য"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-ink shadow-soft active:bg-canvas"
          >
            {firstName ? (
              <span className="text-base font-extrabold">{firstName[0].toUpperCase()}</span>
            ) : (
              <UserRound className="h-5 w-5" />
            )}
          </Link>
        </div>
      </header>

      {/* Graphs: trend, time in range, time of day, medicines */}
      <SugarInsights />

      {/* Bento grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Left column */}
        <div className="flex flex-col gap-3">
          <Tile
            href="/telemetry"
            label="সুগার"
            icon={Droplet}
            className="min-h-[208px] bg-pastel-blue text-pastel-blue-ink"
            fabHref="/telemetry?log=1"
            fabLabel="সুগার লিখুন"
            fabClass="bg-pastel-blue-strong"
          >
            {latest ? (
              <>
                <p className="text-4xl font-extrabold leading-none text-pastel-blue-ink">
                  {toBanglaDigits(latest.glucose_value <= 35 ? latest.glucose_value : Number((latest.glucose_value / 18).toFixed(1)))}
                </p>
                <p className="mt-1 text-base font-bold">
                  mmol/L · {LEVEL_LABELS_BN[classifyGlucose(latest.glucose_value)]}
                </p>
                <p className="mt-1 text-base font-medium">
                  {CONTEXT_LABELS_BN[latest.context] ?? latest.context} · {timeAgo(latest.measured_at)}
                </p>
              </>
            ) : (
              <p className="text-base font-semibold leading-snug">এখনো কোনো সুগার রাখা হয়নি। + চেপে লিখুন।</p>
            )}
          </Tile>

          <Tile
            href="/deficits"
            label="পুষ্টি"
            icon={Salad}
            className="min-h-[176px] bg-pastel-peach text-pastel-peach-ink"
            fabHref="/deficits"
            fabLabel="কোন পুষ্টি কম, দেখুন"
            fabClass="bg-pastel-peach-strong"
          >
            <p className="text-base font-semibold leading-snug">এই সপ্তাহে খাবারে কী কম পড়ছে, দেখুন</p>
          </Tile>

          <Tile
            href="/safety"
            label="প্রশ্ন করুন"
            icon={MessageCircleQuestion}
            className="min-h-[150px] bg-pastel-coral text-pastel-coral-ink"
          >
            <p className="text-base font-semibold leading-snug">খাবার ও রোজকার অভ্যাস নিয়ে প্রশ্ন</p>
            <ArrowRight className="mt-3 h-5 w-5" />
          </Tile>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-3">
          {/* Food actions: one tall tile with a row per action, like meal slots */}
          <div className="tile flex min-h-[352px] flex-col justify-between bg-pastel-lime text-pastel-lime-ink">
            {FOOD_ROWS.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="flex flex-1 flex-col justify-between py-1 active:opacity-70">
                <span className="chip self-start text-base">
                  <Icon className="h-5 w-5" />
                  {label}
                </span>
                <span className="fab mt-2 h-12 w-12 self-end bg-pastel-lime-strong">
                  <Plus className="h-5 w-5" strokeWidth={2.5} />
                </span>
              </Link>
            ))}
          </div>

          {loaded && !profile ? (
            <Tile
              href="/onboarding"
              label="আমার তথ্য"
              icon={Sparkles}
              className="min-h-[182px] bg-pastel-lilac text-pastel-lilac-ink"
              fabHref="/onboarding"
              fabLabel="আপনার তথ্য দিন"
              fabClass="bg-pastel-lilac-strong"
            >
              <p className="text-base font-semibold leading-snug">আপনার তথ্য দিন, তাহলে পরামর্শ আপনার মতো হবে</p>
            </Tile>
          ) : (
            <Tile
              href="/telemetry"
              label="লক্ষ্যের মধ্যে"
              icon={LineChartIcon}
              className="min-h-[182px] bg-pastel-lilac text-pastel-lilac-ink"
            >
              {latest ? (
                <div className="flex items-center gap-3">
                  <ProgressRing value={tir} color="#9F88EA" size={64} stroke={8} label={`${toBanglaDigits(tir)}%`} />
                  <p className="text-base font-semibold leading-snug">সাম্প্রতিক সুগার লক্ষ্যের মধ্যে ছিল</p>
                </div>
              ) : (
                <p className="text-base font-semibold leading-snug">সুগার কতবার লক্ষ্যের মধ্যে থাকে, এখানে দেখাবে</p>
              )}
            </Tile>
          )}
        </div>
      </div>

      <p className="mt-6 px-2 text-center text-base leading-relaxed text-ink-muted">
        যত্ন শুধু খাবার নিয়ে সাধারণ পরামর্শ দেয়। এটা ডাক্তারের পরামর্শের বদলে নয়।
      </p>
    </main>
  );
}

function LineChartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4a8 8 0 0 1 8 8" strokeWidth={3} />
    </svg>
  );
}
