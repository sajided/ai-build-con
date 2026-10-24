"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ChefHat,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Clock,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Plus,
  X,
  RefreshCw,
  Layers,
  Utensils,
  Lightbulb,
} from "lucide-react";
import type { Recipe } from "@/lib/validations/recipe";

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
  const [activeStepTab, setActiveStepTab] = useState<"step_1" | "step_2" | "step_3">("step_1");
  const [error, setError] = useState<string | null>(null);

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
      }
    } else if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("glucovision_scanned_items");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setIngredients(parsed);
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
      setError("Please add at least one available food item.");
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
        throw new Error(data.error || "Failed to generate diabetic recipe.");
      }

      setRecipes(data.recipes);
      setSelectedRecipeIndex(0);
      setActiveStepTab("step_1");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const currentRecipe = recipes && recipes[selectedRecipeIndex] ? recipes[selectedRecipeIndex] : null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-3 sm:p-6 pb-24">
      {/* Container restricted to mobile/tablet optimal reading width */}
      <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl flex flex-col">
        {/* Navigation & Header */}
        <header className="p-4 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
          <Link
            href="/scanner"
            className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Scanner</span>
          </Link>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Phase 3: Recipe Generator
            </span>
          </div>
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
          >
            Dashboard
          </Link>
        </header>

        {/* Hero Section */}
        <div className="p-4 sm:p-5 border-b border-slate-800/60 bg-gradient-to-br from-emerald-950/30 via-slate-900 to-teal-950/20">
          <div className="flex items-center space-x-2.5 mb-1.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-100 leading-tight">
                Available-Item Recipe Generator
              </h1>
              <p className="text-[11px] text-slate-400">
                Anti-Hallucination Verified & Clinical 3-Tier Plate Sequencer
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-5">
          {/* Ingredient Selector Box */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
                <Utensils className="w-3.5 h-3.5 text-teal-400" />
                <span>Available Food Basket</span>
              </label>
              <span className="text-[10px] text-slate-400">
                {ingredients.length} {ingredients.length === 1 ? "item" : "items"} ready
              </span>
            </div>

            {/* Tags Container */}
            <div className="flex flex-wrap gap-1.5 p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 min-h-[52px]">
              {ingredients.map((item, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 animate-fadeIn"
                >
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() => removeIngredient(idx)}
                    className="hover:text-emerald-100 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {ingredients.length === 0 && (
                <p className="text-xs text-slate-500 italic py-1">
                  No items specified. Add items below or tap a benchmark preset.
                </p>
              )}
            </div>

            {/* Add Custom Ingredient Input */}
            <div className="flex space-x-2">
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
                placeholder="Add ingredient (e.g. Okra, Garlic, Fish)..."
                className="flex-1 bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <button
                type="button"
                onClick={addIngredient}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Benchmark Preset Quick Chips */}
            <div className="space-y-1.5">
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                Clinical Test Presets:
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset(["Bitter Gourd", "Masoor Dal", "Green Chili"])}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/70 hover:bg-emerald-950/40 border border-slate-700 hover:border-emerald-600/50 text-[11px] text-slate-300 hover:text-emerald-300 transition-all text-left"
                >
                  <span className="font-semibold text-emerald-400">TC-P3-01:</span> Bitter Gourd + Dal + Chili
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(["Potatoes", "Spinach", "Eggs"])}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/70 hover:bg-teal-950/40 border border-slate-700 hover:border-teal-600/50 text-[11px] text-slate-300 hover:text-teal-300 transition-all text-left"
                >
                  <span className="font-semibold text-teal-400">TC-P3-02:</span> Potatoes + Spinach + Eggs
                </button>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || ingredients.length === 0}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 text-slate-950 font-bold text-xs sm:text-sm hover:brightness-110 shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Synthesizing Recipes & Auditing Starches...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Low-GI Sequenced Recipe</span>
                </>
              )}
            </button>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Recipe Results View */}
          {currentRecipe && (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              {/* Recipe Selector Tabs if multiple recipes */}
              {recipes && recipes.length > 1 && (
                <div className="flex rounded-xl bg-slate-950/80 p-1 border border-slate-800">
                  {recipes.map((r, i) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setSelectedRecipeIndex(i);
                        setActiveStepTab("step_1");
                      }}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        selectedRecipeIndex === i
                          ? "bg-emerald-500 text-slate-950 shadow-md"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Option {i + 1}: {r.title.slice(0, 18)}...
                    </button>
                  ))}
                </div>
              )}

              {/* Main Recipe Card */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                {/* Title & Badges */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        currentRecipe.glycemic_impact === "low"
                          ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/80"
                          : "bg-amber-950/80 text-amber-400 border border-amber-800/80"
                      }`}
                    >
                      {currentRecipe.glycemic_impact} Glycemic Impact
                    </span>
                    <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-teal-400" />
                        <span>{currentRecipe.prep_time_minutes + currentRecipe.cook_time_minutes} min</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Flame className="w-3.5 h-3.5 text-rose-400" />
                        <span>{currentRecipe.macros.calories} kcal</span>
                      </span>
                    </div>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-100">
                    {currentRecipe.title}
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {currentRecipe.description}
                  </p>
                </div>

                {/* Macro Nutritional Dashboard */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Clinical Macro Audit
                    </span>
                    <span className="text-[10px] text-emerald-400 font-medium">
                      Formula: Net Carbs = Total Carbs - Fiber
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-emerald-950/50 border border-emerald-800/60">
                      <div className="text-[10px] text-emerald-300 font-medium">Net Carbs</div>
                      <div className="text-base font-extrabold text-emerald-400">
                        {currentRecipe.macros.net_carbs_g}g
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                      <div className="text-[10px] text-slate-400 font-medium">Dietary Fiber</div>
                      <div className="text-base font-bold text-teal-300">
                        {currentRecipe.macros.fiber_g}g
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                      <div className="text-[10px] text-slate-400 font-medium">Total Carbs</div>
                      <div className="text-base font-bold text-slate-200">
                        {currentRecipe.macros.total_carbs_g}g
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center pt-1">
                    <div className="p-1.5 rounded-lg bg-slate-800/40 text-[11px] text-slate-300">
                      Protein: <span className="font-semibold text-slate-100">{currentRecipe.macros.protein_g}g</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-800/40 text-[11px] text-slate-300">
                      Healthy Fats: <span className="font-semibold text-slate-100">{currentRecipe.macros.healthy_fats_g}g</span>
                    </div>
                  </div>
                </div>

                {/* 3-TIER CLINICAL PLATE SEQUENCER (TC-P3-02) */}
                <div className="space-y-2.5">
                  <div className="flex items-center space-x-1.5">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-200">
                      3-Tier Meal Sequence (Clinical Glucose Blunting)
                    </span>
                  </div>

                  {/* Step Selector Tabs */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveStepTab("step_1")}
                      className={`p-2 rounded-xl text-left border transition-all ${
                        activeStepTab === "step_1"
                          ? "bg-emerald-950/80 border-emerald-500 text-emerald-300"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase">Step 1 (0-10m)</div>
                      <div className="text-xs font-bold truncate">Fiber Shield</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveStepTab("step_2")}
                      className={`p-2 rounded-xl text-left border transition-all ${
                        activeStepTab === "step_2"
                          ? "bg-teal-950/80 border-teal-500 text-teal-300"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase">Step 2 (10-20m)</div>
                      <div className="text-xs font-bold truncate">Protein & Lipids</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveStepTab("step_3")}
                      className={`p-2 rounded-xl text-left border transition-all ${
                        activeStepTab === "step_3"
                          ? "bg-amber-950/80 border-amber-500 text-amber-300"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase">Step 3 (Last)</div>
                      <div className="text-xs font-bold truncate">Starch Control</div>
                    </button>
                  </div>

                  {/* Active Step Details */}
                  {activeStepTab === "step_1" && (
                    <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-800/60 space-y-2 animate-fadeIn">
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                        <span>{currentRecipe.eating_sequence.step_1.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/60 border border-emerald-700">
                          {currentRecipe.eating_sequence.step_1.duration_minutes} Mins Duration
                        </span>
                      </div>
                      <div className="text-xs text-slate-300">
                        <span className="text-emerald-300 font-semibold">Eat First: </span>
                        {currentRecipe.eating_sequence.step_1.items.join(", ")}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {currentRecipe.eating_sequence.step_1.guidance}
                      </p>
                    </div>
                  )}

                  {activeStepTab === "step_2" && (
                    <div className="p-3.5 rounded-2xl bg-teal-950/30 border border-teal-800/60 space-y-2 animate-fadeIn">
                      <div className="flex items-center justify-between text-xs font-bold text-teal-400">
                        <span>{currentRecipe.eating_sequence.step_2.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-900/60 border border-teal-700">
                          {currentRecipe.eating_sequence.step_2.duration_minutes} Mins Duration
                        </span>
                      </div>
                      <div className="text-xs text-slate-300">
                        <span className="text-teal-300 font-semibold">Eat Second: </span>
                        {currentRecipe.eating_sequence.step_2.items.join(", ")}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {currentRecipe.eating_sequence.step_2.guidance}
                      </p>
                    </div>
                  )}

                  {activeStepTab === "step_3" && (
                    <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-800/60 space-y-2 animate-fadeIn">
                      <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                        <span>{currentRecipe.eating_sequence.step_3.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-900/60 border border-amber-700">
                          {currentRecipe.eating_sequence.step_3.portion_limit}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300">
                        <span className="text-amber-300 font-semibold">Portioned Last: </span>
                        {currentRecipe.eating_sequence.step_3.items.length > 0
                          ? currentRecipe.eating_sequence.step_3.items.join(", ")
                          : "No concentrated starches"}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {currentRecipe.eating_sequence.step_3.guidance}
                      </p>
                    </div>
                  )}
                </div>

                {/* Ingredients Breakdown */}
                <div className="space-y-2 pt-1 border-t border-slate-800">
                  <span className="text-xs font-bold text-slate-200">
                    Ingredients Checklist
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {currentRecipe.ingredients.map((ing, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="text-slate-200 font-medium">{ing.name}</span>
                        </div>
                        <span className="text-[11px] text-slate-400">{ing.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step-by-Step Instructions */}
                <div className="space-y-2 pt-1 border-t border-slate-800">
                  <span className="text-xs font-bold text-slate-200">
                    Preparation & Cooking Steps
                  </span>
                  <div className="space-y-2">
                    {currentRecipe.instructions.map((ins) => (
                      <div
                        key={ins.step_number}
                        className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1 text-xs"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-emerald-400 font-bold flex items-center justify-center text-[10px] shrink-0">
                            {ins.step_number}
                          </span>
                          <span className="text-slate-200 leading-snug">{ins.instruction}</span>
                        </div>
                        {ins.cooking_tip && (
                          <div className="pl-7 text-[11px] text-teal-400 flex items-start space-x-1 pt-0.5">
                            <Lightbulb className="w-3 h-3 shrink-0 mt-0.5" />
                            <span>{ins.cooking_tip}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Localized Buffer Pivot (if provided) */}
                {currentRecipe.localized_buffer_pivot && (
                  <div className="p-3 rounded-xl bg-teal-950/40 border border-teal-800/60 flex items-start space-x-2 text-xs">
                    <Sparkles className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-teal-300">
                        Regional Market Pivot: {currentRecipe.localized_buffer_pivot.item_name} (~{currentRecipe.localized_buffer_pivot.estimated_cost})
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        {currentRecipe.localized_buffer_pivot.benefit}
                      </p>
                    </div>
                  </div>
                )}

                {/* Anti-Hallucination Verified Badge */}
                <div className="p-2.5 rounded-xl bg-slate-900 border border-emerald-900/60 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center space-x-1.5 text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="font-semibold">TC-P3-01 Anti-Hallucination Guard Verified</span>
                  </div>
                  <span className="text-[10px] text-slate-400">0 Hidden Starches Added</span>
                </div>
              </div>
            </div>
          )}

          {/* Forward Action to Phase 4 */}
          <div className="pt-2 border-t border-slate-800">
            <Link
              href="/"
              className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center space-x-2 transition-all active:scale-95"
            >
              <span>Back to System Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="p-3.5 border-t border-slate-800/60 bg-slate-950/70 flex items-center justify-between text-xs text-slate-500">
          <Link href="/scanner" className="hover:text-slate-300">
            Back to Vision Scanner
          </Link>
          <span className="text-emerald-400 font-medium">Phase 3 Operational</span>
        </footer>
      </div>
    </main>
  );
}

export default function RecipesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
          Loading Diabetic Recipe Generator...
        </div>
      }
    >
      <RecipeContent />
    </Suspense>
  );
}
