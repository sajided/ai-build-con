"use client";

/** The scripted screens shown inside the phone/app frame during the judges' simulation. */

import React from "react";
import {
  AlertTriangle,
  Camera,
  Check,
  CircleAlert,
  Clock,
  Droplet,
  FileText,
  Flame,
  Loader2,
  MessageCircle,
  Mic,
  Phone,
  Pill,
  Plus,
  ScanLine,
  ShieldCheck,
  ShoppingBag,
  Volume2,
  X,
} from "lucide-react";
import ConfirmReadingSheet from "@/components/elder/ConfirmReadingSheet";
import HelpScreen from "@/components/elder/HelpScreen";
import ReminderCard from "@/components/care/ReminderCard";
import CareReport from "@/components/care/CareReport";
import { readingFeedbackBn, toBanglaDigits } from "@/lib/assistant/bangla";
import { alertMessageBn, type CareSnapshot } from "@/lib/care/report";
import { NutrientProgressMeter } from "@/components/deficits/NutrientProgressMeter";
import { BazaarStapleCard } from "@/components/deficits/BazaarStapleCard";
import { BazaarCartDrawer } from "@/components/deficits/BazaarCartDrawer";
import { calculateFiberDeficit, evaluateNutrientMetrics, getPrioritizedRecommendations } from "@/lib/nutrition/deficiency-engine";
import {
  BAZAAR_CART,
  DEMO_RECIPE,
  FOOD_REPLY,
  MENU_DISHES,
  METFORMIN,
  NUTRITION_WEEK,
  PATIENT,
  RECIPE_INGREDIENTS,
  SON,
  SON_PHONE,
  VOICE_TEXT,
  bazaarListText,
  type DemoDish,
  type ScreenId,
} from "./script";

/** Keyframes used by the scan line and the step progress bar */
export const DEMO_KEYFRAMES = `@keyframes demo-scan { 0%,100% { transform: translateY(0) } 50% { transform: translateY(330px) } }
@keyframes demo-progress { from { width: 0 } to { width: 100% } }`;

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

function Viewfinder({ kind, scanning }: { kind: "meter" | "food" | "menu"; scanning: boolean }) {
  return (
    <div className="relative flex h-full flex-col bg-black text-white">
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {kind === "menu" ? (
          <div lang="bn" className="w-60 rotate-[-3deg] rounded-lg bg-[#FBF6EA] p-5 text-[#3B2A1A] shadow-2xl">
            <p className="text-center text-lg font-bold tracking-wide">ঢাকা কিচেন</p>
            <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest opacity-60">Menu</p>
            {[
              ["কাচ্চি বিরিয়ানি", "৪২০"],
              ["মধু-চিকেন", "৩৮০"],
              ["সবজি খিচুড়ি", "২২০"],
              ["তন্দুরি মাছ", "৪৫০"],
              ["ফিরনি", "১২০"],
            ].map(([dish, price]) => (
              <p key={dish} className="flex items-baseline justify-between gap-2 border-b border-dotted border-[#3B2A1A]/30 py-1.5 text-base font-semibold">
                <span>{dish}</span>
                <span className="text-sm">৳{price}</span>
              </p>
            ))}
          </div>
        ) : kind === "meter" ? (
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
        <p className="text-xl font-bold">{scanning ? "দেখছি… একটু অপেক্ষা করুন" : kind === "meter" ? "মিটারের ছবি তুলুন" : kind === "menu" ? "মেনুর ছবি তুলুন" : "খাবারের দিকে ধরুন"}</p>
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
        <div lang="bn" className="animate-in fade-in ml-auto max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-sm bg-[#DCF8C6] p-3 text-lg leading-relaxed text-ink shadow-sm">
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

// ---------- Restaurant menu (MenuSafe) ----------

const RISK = {
  red: { label: "এড়িয়ে চলুন", group: "এড়িয়ে চলুন", icon: AlertTriangle, badge: "bg-risk-danger text-risk-dangerInk" },
  yellow: { label: "অল্প খান", group: "অল্প খান", icon: CircleAlert, badge: "bg-risk-caution text-risk-cautionInk" },
  green: { label: "ভালো", group: "ভালো", icon: ShieldCheck, badge: "bg-risk-safe text-risk-safeInk" },
} as const;

function DishCard({ dish }: { dish: DemoDish }) {
  const r = RISK[dish.risk];
  const Icon = r.icon;
  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <span className={`icon-badge ${r.badge}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold leading-snug text-ink">{dish.name}</p>
          <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-sm font-bold ${r.badge}`}>{r.label}</span>
        </div>
      </div>
      {dish.traps.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {dish.traps.map((t) => (
            <span key={t} className="rounded-full bg-canvas px-2.5 py-1 text-sm font-semibold text-ink-soft">
              ⚠ {t}
            </span>
          ))}
        </div>
      )}
      <p className="mt-2 text-base leading-relaxed text-ink-soft">{dish.why}</p>
      {dish.swap && <p className="mt-1 text-base font-semibold text-ink">বদলে নিন: {dish.swap}</p>}
    </div>
  );
}

function MenuResults() {
  const groups = (["red", "yellow", "green"] as const).map((risk) => ({ risk, dishes: MENU_DISHES.filter((d) => d.risk === risk) }));
  return (
    <div lang="bn" className="space-y-4 px-4 pb-8 pt-8">
      <div>
        <h1 className="text-2xl font-bold text-ink">রেস্তোরাঁর মেনু</h1>
        <div className="card mt-3 p-4">
          <p className="text-sm font-bold text-ink-muted">সারসংক্ষেপ</p>
          <p className="mt-1 text-base font-semibold text-ink">বাংলা রেস্তোরাঁ · ভাত ও ভাজা খাবার বেশি। গ্রিল করা মাছ বা সবজি বেছে নিন।</p>
        </div>
      </div>
      {groups.map(({ risk, dishes }) => {
        const Icon = RISK[risk].icon;
        return (
          <section key={risk} className="space-y-2">
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
              <Icon className="h-5 w-5" />
              {RISK[risk].group} ({toBanglaDigits(dishes.length)})
            </h2>
            {dishes.map((d) => (
              <DishCard key={d.name} dish={d} />
            ))}
          </section>
        );
      })}
    </div>
  );
}

function WaiterSheet() {
  const dish = MENU_DISHES[0];
  return (
    <>
      <MenuResults />
      <div className="fixed inset-0 z-50 flex items-end bg-black/30">
        <div className="animate-in slide-in-from-bottom w-full rounded-t-[32px] bg-white px-5 pb-6 pt-3">
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-line" />
          <p lang="bn" className="text-center text-lg font-bold text-ink-muted">
            ওয়েটারকে এটা দেখান
          </p>
          <p lang="bn" className="mt-1 text-center text-base font-semibold text-ink-soft">
            {dish.name}
          </p>
          <p className="mt-4 text-2xl font-extrabold leading-snug text-ink">“{dish.waiter}”</p>
          <p className="mt-4 text-base italic text-ink-soft">I&apos;m diabetic — thank you for helping me order safely!</p>
          <span lang="bn" className="btn-secondary mt-5 h-14 text-lg">
            বন্ধ করুন
          </span>
        </div>
      </div>
    </>
  );
}

// ---------- Nutrition (পুষ্টি) and bazaar list ----------

function NutritionHeader({ count }: { count: number }) {
  return (
    <header className="flex items-start justify-between gap-3">
      <div>
        <h1 className="text-3xl font-bold text-ink">পুষ্টি</h1>
        <p className="text-base font-semibold text-ink-muted">গত ৭ দিন</p>
      </div>
      <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white text-ink shadow-soft">
        <ShoppingBag className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-pastel-coral-strong px-1 text-sm font-bold text-white">
            {toBanglaDigits(count)}
          </span>
        )}
      </span>
    </header>
  );
}

function NutritionMeters() {
  const metrics = evaluateNutrientMetrics(NUTRITION_WEEK.fiber, NUTRITION_WEEK.magnesium, NUTRITION_WEEK.protein, NUTRITION_WEEK.carbs);
  return (
    <div lang="bn" className="space-y-4 px-4 pb-8 pt-8">
      <NutritionHeader count={0} />
      <h2 className="text-xl font-bold text-ink">আপনি কতটা খাচ্ছেন</h2>
      <NutrientProgressMeter metrics={metrics} />
    </div>
  );
}

function NutritionStaples({ added }: { added?: boolean }) {
  const staples = getPrioritizedRecommendations(calculateFiberDeficit(NUTRITION_WEEK.fiber, 30)).slice(0, 2);
  return (
    <div lang="bn" className="space-y-4 px-4 pb-8 pt-8">
      <NutritionHeader count={added ? 1 : 0} />
      <section className="tile bg-pastel-peach p-5 text-pastel-peach-ink">
        <h2 className="text-lg font-bold">এর মানে কী</h2>
        <p className="mt-1 text-base font-semibold leading-relaxed">
          গত ৭ দিনে রোজ ১৬ গ্রাম আঁশ কম খেয়েছেন। ঢেঁড়শ, তিসি আর ইসবগুল খেলে খাওয়ার পরে সুগার কম বাড়বে।
        </p>
      </section>
      <div>
        <h2 className="text-xl font-bold text-ink">এই খাবারগুলো খান</h2>
        <p className="text-base text-ink-muted">দেশি খাবার, সুগার ধীরে বাড়ায়, আঁশের ঘাটতি পূরণ করে</p>
      </div>
      {staples.map((item) => (
        <BazaarStapleCard key={item.id} item={item} onAddToCart={() => {}} />
      ))}
    </div>
  );
}

function BazaarCart() {
  const count = BAZAAR_CART.reduce((a, c) => a + c.quantity, 0);
  const total = BAZAAR_CART.reduce((a, c) => a + c.item.pricePerUnit * c.quantity, 0);
  const noop = () => {};
  return (
    // The drawer caps itself at 85% of the browser window; inside the phone frame, cap it to the frame instead
    <div className="[&_[data-testid=bazaar-cart-drawer]>div:last-child]:max-h-[88%]">
      <NutritionStaples added />
      <BazaarCartDrawer
        isOpen
        onClose={noop}
        cart={BAZAAR_CART}
        totalItemCount={count}
        estimatedTotalCost={total}
        onUpdateQuantity={noop}
        onRemoveItem={noop}
        onClearCart={noop}
        getExportText={() => bazaarListText(BAZAAR_CART)}
      />
    </div>
  );
}

// ---------- Recipes (রান্না) ----------

function RecipeInput({ thinking }: { thinking: boolean }) {
  return (
    <div lang="bn" className="space-y-4 px-4 pb-8 pt-8">
      <div>
        <h1 className="text-3xl font-bold text-ink">রান্না</h1>
        <p className="text-base font-semibold text-ink-muted">ঘরে যা আছে, তা দিয়ে কম-GI রান্না</p>
      </div>
      <section className="card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">আপনার উপকরণ</h2>
          <span className="text-base font-semibold text-ink-muted">{toBanglaDigits(RECIPE_INGREDIENTS.length)} টি</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {RECIPE_INGREDIENTS.map((name) => (
            <span key={name} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-base font-semibold text-ink">
              {name}
              <X className="h-4 w-4 text-ink-muted" />
            </span>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="input flex items-center text-ink-muted">উপকরণ লিখুন, যেমন: ঢেঁড়স</span>
          <span className="fab h-12 w-12 bg-pastel-lime-strong">
            <Plus className="h-5 w-5" />
          </span>
        </div>
      </section>
      <span className="btn-primary h-14 text-lg">
        {thinking ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            একটু অপেক্ষা করুন…
          </>
        ) : (
          "রান্না বানান"
        )}
      </span>
    </div>
  );
}

function RecipeResult({ focusSequence }: { focusSequence: boolean }) {
  const r = DEMO_RECIPE;
  const card = (
    <section className="card p-5">
      <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
        <span className="rounded-full bg-risk-safe px-3 py-1 text-risk-safeInk">GI কম</span>
        <span className="inline-flex items-center gap-1 text-ink-muted">
          <Clock className="h-4 w-4" />
          {toBanglaDigits(r.minutes)} মিনিট
        </span>
        <span className="inline-flex items-center gap-1 text-ink-muted">
          <Flame className="h-4 w-4" />
          {toBanglaDigits(r.calories)} ক্যালরি
        </span>
      </div>
      <h2 className="mt-2 text-2xl font-bold leading-snug text-ink">{r.title}</h2>
      <p className="mt-1 text-base text-ink-soft">{r.description}</p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {r.macros.map((m) => (
          <div key={m.label} className={`rounded-3xl p-3 ${m.tone}`}>
            <p className="text-sm font-semibold">{m.label}</p>
            <p className="mt-1 text-xl font-bold">{toBanglaDigits(m.grams)}</p>
            <p className="text-sm font-semibold">গ্রাম</p>
          </div>
        ))}
      </div>
    </section>
  );
  const sequence = (
    <section className="card p-5">
      <h2 className="text-xl font-bold text-ink">এই ক্রমে খান</h2>
      <p className="mt-0.5 text-base text-ink-muted">ভাত-রুটির আগে শাকসবজি আর প্রোটিন খেলে সুগার হঠাৎ বাড়ে না।</p>
      <ol className="mt-3 space-y-2">
        {r.sequence.map((step, i) => (
          <li key={step.title} className={`flex items-start gap-3 rounded-2xl p-3 ${step.tone}`}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/70 text-base font-bold">{toBanglaDigits(i + 1)}</span>
            <div>
              <p className="text-base font-bold">{step.title}</p>
              <p className="text-base font-semibold">{step.items}</p>
              <p className="text-sm opacity-80">{step.note}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
  return (
    <div lang="bn" className="space-y-4 px-4 pb-8 pt-8">
      <h1 className="text-3xl font-bold text-ink">রান্না</h1>
      {focusSequence ? (
        <>
          {sequence}
          {card}
        </>
      ) : (
        <>
          {card}
          {sequence}
        </>
      )}
    </div>
  );
}

export default function PhoneScreen({ screen, report }: { screen: ScreenId; report: CareSnapshot }) {
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
    case "menu-camera":
      return <Viewfinder kind="menu" scanning={false} />;
    case "menu-reading":
      return <Viewfinder kind="menu" scanning />;
    case "menu-results":
      return <MenuResults />;
    case "menu-waiter":
      return <WaiterSheet />;
    case "nutrition-meters":
      return <NutritionMeters />;
    case "nutrition-staples":
      return <NutritionStaples />;
    case "bazaar-cart":
      return <BazaarCart />;
    case "bazaar-share":
      return <MessagePreview app="whatsapp" title={SON} text={bazaarListText(BAZAAR_CART)} />;
    case "recipe-ingredients":
      return <RecipeInput thinking={false} />;
    case "recipe-thinking":
      return <RecipeInput thinking />;
    case "recipe-result":
      return <RecipeResult focusSequence={false} />;
    case "recipe-sequence":
      return <RecipeResult focusSequence />;
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
