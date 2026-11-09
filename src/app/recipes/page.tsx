"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Sparkles,
  Clock,
  Flame,
  AlertTriangle,
  Plus,
  X,
  RefreshCw,
  Lightbulb,
  ScanLine,
} from "lucide-react";
import PageHeader from "@/components/app/PageHeader";
import type { Recipe } from "@/lib/validations/recipe";
import { toBanglaDigits } from "@/lib/assistant/bangla";

const PAGE_TITLE = "রান্না";
const PAGE_SUBTITLE = "ঘরে যা আছে, তা দিয়ে কম-GI রান্না";

const PRESETS = [
  { label: "করলা, ডাল ও কাঁচা মরিচ", items: ["Bitter Gourd", "Masoor Dal", "Green Chili"] },
  { label: "আলু, পালং শাক ও ডিম", items: ["Potatoes", "Spinach", "Eggs"] },
];

function RecipeContent() {
  const searchParams = useSearchParams();
  const [ingredients, setIngredients] = useState<string[]>([
    "Bitter Gourd",
    "Masoor Dal",
    "Green Chili",
  ]);
  const [newIngredient, setNewIngredient] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [selectedRecipeIndex, setSelectedRecipeIndex] = useState<number>(0);
  // Plate order is now shown as a numbered list; the tab state is kept for compatibility
  const [, setActiveStepTab] = useState<"step_1" | "step_2" | "step_3">("step_1");
  const [error, setError] = useState<string | null>(null);
  const [fromScan, setFromScan] = useState<boolean>(false);

  // Initialize from URL search parameters or session storage if available
  useEffect(() => {
    const queryItems = searchParams.get("items");
    if (queryItems) {
      const parsed = queryItems
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (parsed.length > 0) {
        setIngredients(parsed);
        setFromScan(true);
      }
    } else if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("glucovision_scanned_items");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setIngredients(parsed);
            setFromScan(true);
          }
        } catch {
          // Keep default
        }
      }
    }
  }, [searchParams]);

  const addIngredient = () => {
    const trimmed = newIngredient.trim();
    if (trimmed && !ingredients.some((i) => i.toLowerCase() === trimmed.toLowerCase())) {
      setIngredients((prev) => [...prev, trimmed]);
      setNewIngredient("");
    }
  };

  const removeIngredient = (indexToRemove: number) => {
    setIngredients((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const applyPreset = (preset: string[]) => {
    setIngredients(preset);
    setRecipes(null);
    setError(null);
  };

  const handleGenerate = async () => {
    if (ingredients.length === 0) {
      setError("অন্তত একটি খাবারের উপকরণ যোগ করুন।");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/recipes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: ingredients }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      }

      setRecipes(data.recipes);
      setSelectedRecipeIndex(0);
      setActiveStepTab("step_1");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setIsGenerating(false);
    }
  };

  const currentRecipe = recipes && recipes[selectedRecipeIndex] ? recipes[selectedRecipeIndex] : null;

  const plateSteps = currentRecipe
    ? [
        {
          ...currentRecipe.eating_sequence.step_1,
          heading: "প্রথমে: আঁশ (শাকসবজি)",
          meta: `${toBanglaDigits(currentRecipe.eating_sequence.step_1.duration_minutes)} মিনিট`,
          tint: "bg-pastel-lime text-pastel-lime-ink",
        },
        {
          ...currentRecipe.eating_sequence.step_2,
          heading: "তারপর: প্রোটিন ও চর্বি",
          meta: `${toBanglaDigits(currentRecipe.eating_sequence.step_2.duration_minutes)} মিনিট`,
          tint: "bg-pastel-blue text-pastel-blue-ink",
        },
        {
          ...currentRecipe.eating_sequence.step_3,
          heading: "শেষে: ভাত-রুটি (শর্করা)",
          meta: currentRecipe.eating_sequence.step_3.portion_limit,
          tint: "bg-pastel-peach text-pastel-peach-ink",
        },
      ]
    : [];

  return (
    <>
      <PageHeader title={PAGE_TITLE} subtitle={PAGE_SUBTITLE} />

      <main lang="bn" className="px-4 py-5 space-y-5">
        {/* Nudge to scan when ingredients didn't come from a scan */}
        {!fromScan && !currentRecipe && (
          <div className="tile flex min-h-[132px] flex-col bg-pastel-lime text-pastel-lime-ink">
            <Link href="/scanner" aria-label="আগে বাজার স্ক্যান করুন" className="absolute inset-0 rounded-[28px] active:bg-black/5" />
            <span className="chip pointer-events-none relative self-start text-base">
              <ScanLine className="h-5 w-5" />
              আগে বাজার স্ক্যান করুন
            </span>
            <div className="pointer-events-none relative mt-3 flex flex-1 items-end justify-between gap-3">
              <p className="text-base font-semibold leading-snug">যা কিনেছেন, ঠিক তা দিয়েই রান্না বানিয়ে দেব।</p>
              <span className="fab bg-pastel-lime-strong">
                <Plus className="h-5 w-5" strokeWidth={2.5} />
              </span>
            </div>
          </div>
        )}

        {/* Ingredient Selector */}
        <section className="card space-y-4 p-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-bold text-ink">আপনার উপকরণ</h2>
            <span className="text-base font-semibold text-ink-muted">
              {toBanglaDigits(ingredients.length)}টি
            </span>
          </div>

          <div className="flex min-h-12 flex-wrap gap-2">
            {ingredients.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex h-12 items-center gap-1 rounded-full border border-line bg-white pl-4 pr-1 text-base font-semibold text-ink shadow-sm"
              >
                <span>{item}</span>
                <button
                  type="button"
                  onClick={() => removeIngredient(idx)}
                  aria-label={`${item} বাদ দিন`}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-ink-muted active:bg-canvas"
                >
                  <X className="h-5 w-5" />
                </button>
              </span>
            ))}
            {ingredients.length === 0 && (
              <p className="py-2 text-base text-ink-muted">এখনো কোনো উপকরণ নেই। নিচে যোগ করুন।</p>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newIngredient}
              onChange={(e) => setNewIngredient(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addIngredient();
                }
              }}
              enterKeyHint="done"
              placeholder="উপকরণ লিখুন, যেমন: ঢেঁড়স"
              className="input min-w-0 flex-1"
            />
            <button
              type="button"
              onClick={addIngredient}
              aria-label="উপকরণ যোগ করুন"
              className="fab h-12 w-12 bg-pastel-lime-strong"
            >
              <Plus className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>

          <div className="space-y-2">
            <p className="section-title text-base">অথবা নমুনা দেখুন</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => {
                const active = p.items.join() === ingredients.join();
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => applyPreset(p.items)}
                    aria-pressed={active}
                    className="chip-toggle h-12 text-base"
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || ingredients.length === 0}
          className="btn-primary h-14"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-5 w-5 animate-spin" />
              একটু অপেক্ষা করুন…
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              {currentRecipe ? "নতুন রান্না বানান" : "রান্না বানান"}
            </>
          )}
        </button>

        {error && (
          <div className="flex items-start gap-2 rounded-2xl bg-risk-danger p-4 text-base font-semibold text-risk-dangerInk">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Recipe Results */}
        {currentRecipe && (
          <div className="space-y-5 pt-1">
            {recipes && recipes.length > 1 && (
              <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
                {recipes.map((r, i) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setSelectedRecipeIndex(i);
                      setActiveStepTab("step_1");
                    }}
                    aria-pressed={selectedRecipeIndex === i}
                    className="chip-toggle h-12 shrink-0 text-base"
                  >
                    {r.title}
                  </button>
                ))}
              </div>
            )}

            {/* Title */}
            <section className="card space-y-2 p-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-base font-semibold text-ink-muted">
                <span
                  className={`rounded-full px-3 py-1 text-base font-bold ${
                    currentRecipe.glycemic_impact === "low"
                      ? "bg-risk-safe text-risk-safeInk"
                      : "bg-risk-caution text-risk-cautionInk"
                  }`}
                >
                  GI {currentRecipe.glycemic_impact === "low" ? "কম" : "মাঝারি"}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-5 w-5" />
                  {toBanglaDigits(currentRecipe.prep_time_minutes + currentRecipe.cook_time_minutes)} মিনিট
                </span>
                <span className="flex items-center gap-1">
                  <Flame className="h-5 w-5" />
                  {toBanglaDigits(currentRecipe.macros.calories)} ক্যালরি
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-ink">{currentRecipe.title}</h2>
              <p className="text-base leading-relaxed text-ink-soft">{currentRecipe.description}</p>
            </section>

            {/* Macros */}
            <section className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: "আসল শর্করা", value: currentRecipe.macros.net_carbs_g, tint: "bg-pastel-peach text-pastel-peach-ink" },
                { label: "আঁশ", value: currentRecipe.macros.fiber_g, tint: "bg-pastel-lime text-pastel-lime-ink" },
                { label: "প্রোটিন", value: currentRecipe.macros.protein_g, tint: "bg-pastel-blue text-pastel-blue-ink" },
                { label: "মোট শর্করা", value: currentRecipe.macros.total_carbs_g, tint: "bg-pastel-coral text-pastel-coral-ink" },
                { label: "ভালো চর্বি", value: currentRecipe.macros.healthy_fats_g, tint: "bg-pastel-lilac text-pastel-lilac-ink" },
              ].map((m) => (
                <div key={m.label} className={`rounded-3xl p-3 ${m.tint}`}>
                  <p className="text-xl font-extrabold">{toBanglaDigits(m.value)} গ্রাম</p>
                  <p className="text-sm font-bold opacity-80">{m.label}</p>
                </div>
              ))}
            </section>

            {/* Plate order: fiber -> protein -> starch */}
            <section className="space-y-3">
              <div>
                <h3 className="text-lg font-bold text-ink">এই ক্রমে খান</h3>
                <p className="text-base text-ink-muted">ভাত-রুটির আগে শাকসবজি আর প্রোটিন খেলে সুগার হঠাৎ বাড়ে না।</p>
              </div>
              <ol className="space-y-2.5">
                {plateSteps.map((s, i) => (
                  <li key={s.heading} className="card flex gap-3 p-4">
                    <span className={`icon-badge text-lg font-extrabold ${s.tint}`}>{toBanglaDigits(i + 1)}</span>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-lg font-bold text-ink">{s.heading}</p>
                        <span className="shrink-0 text-sm font-semibold text-ink-muted">{s.meta}</span>
                      </div>
                      <p className="text-base font-semibold text-ink-soft">
                        {s.items.length > 0 ? s.items.join(", ") : "ভারী শর্করা নেই"}
                      </p>
                      <p className="text-base leading-relaxed text-ink-muted">{s.guidance}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {/* Ingredients */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-ink">উপকরণ</h3>
              <ul className="card divide-y divide-line overflow-hidden">
                {currentRecipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 px-4 py-3 text-base">
                    <span className="font-semibold text-ink">{ing.name}</span>
                    <span className="text-base font-medium text-ink-muted">{ing.quantity}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Method */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-ink">রান্নার নিয়ম</h3>
              <ol className="card space-y-4 p-4">
                {currentRecipe.instructions.map((ins) => (
                  <li key={ins.step_number} className="flex gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-base font-bold text-white">
                      {toBanglaDigits(ins.step_number)}
                    </span>
                    <div className="space-y-1.5">
                      <p className="text-base leading-relaxed text-ink">{ins.instruction}</p>
                      {ins.cooking_tip && (
                        <p className="flex items-start gap-1.5 rounded-2xl bg-pastel-peach/50 p-3 text-base font-medium text-pastel-peach-ink">
                          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0" />
                          <span>{ins.cooking_tip}</span>
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {currentRecipe.localized_buffer_pivot && (
              <section className="tile flex items-start gap-3 bg-pastel-lilac text-pastel-lilac-ink">
                <span className="icon-badge bg-white/70">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-bold">
                    পরামর্শ: {currentRecipe.localized_buffer_pivot.item_name} যোগ করুন (~
                    {currentRecipe.localized_buffer_pivot.estimated_cost?.includes("$")
                      ? `৳${Math.round(parseFloat(currentRecipe.localized_buffer_pivot.estimated_cost.replace(/[^0-9.]/g, '') || "0.5") * 120)} / ${currentRecipe.localized_buffer_pivot.estimated_cost}`
                      : currentRecipe.localized_buffer_pivot.estimated_cost})
                  </p>
                  <p className="mt-0.5 text-base font-medium opacity-80">{currentRecipe.localized_buffer_pivot.benefit}</p>
                </div>
              </section>
            )}

            <p className="text-center text-base text-ink-muted">শুধু আপনার দেওয়া উপকরণ দিয়েই বানানো, বাড়তি কোনো শর্করা যোগ করা হয়নি।</p>
          </div>
        )}
      </main>
    </>
  );
}

export default function RecipesPage() {
  return (
    <Suspense
      fallback={
        <>
          <PageHeader title={PAGE_TITLE} subtitle={PAGE_SUBTITLE} />
          <div lang="bn" className="px-4 py-10 text-center text-base text-ink-muted">একটু অপেক্ষা করুন…</div>
        </>
      }
    >
      <RecipeContent />
    </Suspense>
  );
}
